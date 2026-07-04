import os
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from google import genai
from google.genai import types
from dotenv import load_dotenv
from supabase import create_client, Client # 🆕 Import Supabase Client
from profile_content_library import PROFILE_CONTENT_LIBRARY
from llm_manager import LLMManager

# Load environment variables from .env.local in the project root
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

# Initialize multi-provider LLM Manager
llm_manager = LLMManager()

app = FastAPI(
    title="TIE Assessment Engine",
    description="Backend service for scoring and AI integration",
    version="1.0.0"
)

cors_origins = [
    origin.strip() 
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Initialize Database Connection Client Server-Side
supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")

service_role = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if service_role:
    print("STATUS: Supabase Service Role Key is LOADED. RLS will be bypassed successfully.")
else:
    print("STATUS: WARNING - Supabase Service Role Key is MISSING. Falling back to Anon Key. RLS will block queries!")

supabase_key = (
    service_role or 
    os.getenv("SUPABASE_ANON_KEY") or 
    os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)
supabase: Client = create_client(supabase_url, supabase_key)
gemini_api=os.getenv("GEMINI_API_KEY")

ai_client = genai.Client(api_key=gemini_api)

#  Professional Input Payload: Only accept the secure user ID reference string
class AssessmentAnalysisRequest(BaseModel):
    user_id: str

# --- CONSTANTS FROM IMPLEMENTATION DOC ---
COMBINATION_PROFILES = {
    ("SCP", "CCD"): "Structured Collaborator",
    ("SCP", "SPO"): "Steady Executor",
    ("SCP", "FIE"): "Independent Problem Solver",
    ("CCD", "FIE"): "Adaptive Team Contributor",
    ("CCD", "SPO"): "Supportive Team Stabilizer",
    ("FIE", "SPO"): "Practical Adapter",
    ("FIE", "SCP"): "Independent Problem Solver",
    ("SPO", "SCP"): "Steady Executor",
    ("SPO", "CCD"): "Supportive Team Stabilizer",
    ("CCD", "SCP"): "Structured Collaborator",
}

@app.post("/api/assessment/analyze")
async def analyze_assessment(payload: AssessmentAnalysisRequest):
    try:
        #  STEP 1: FETCH DATA DIRECTLY FROM THE DATABASE INTERNAL LAYER
        db_query = supabase.table("user_responses").select("question_id, selected_option_index").eq("user_id", payload.user_id).execute()

        saved_answers = db_query.data

        # Safety Check: Ensure data validation integrity holds up
        if not saved_answers or len(saved_answers) != 24:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Incomplete answers. User has completed {len(saved_answers) if saved_answers else 0} of 24 tasks."
            )

        # Fetch profile data to get metadata for personalization
        profile_data = {}
        try:
            profile_query = supabase.table("profiles").select("*").eq("id", payload.user_id).execute()
            if profile_query.data and len(profile_query.data) > 0:
                profile_data = profile_query.data[0]
        except Exception as e:
            print(f"PROFILE FETCH FAILED (using fallback defaults): {e}")

        # Generate a deterministic hash of the user's answers to detect changes
        sorted_answers = sorted(saved_answers, key=lambda x: x["question_id"])
        current_answers_hash = "".join(str(row["selected_option_index"]) for row in sorted_answers)

        # STEP 2: CHECK CACHE DIRECTLY (Bypasses LLM and calculations for sub-second load times)
        try:
            db_cache_query = supabase.table("saved_reports").select("scoring_metrics, manager_signals, report_markdown").eq("user_id", payload.user_id).execute()
            if db_cache_query.data and len(db_cache_query.data) > 0:
                cached = db_cache_query.data[0]
                cached_metrics = cached.get("scoring_metrics", {})
                cached_hash = cached_metrics.get("answers_hash")
                
                if cached_hash == current_answers_hash:
                    print(f"CACHE HIT: Serving report from cache database for user {payload.user_id}")
                    return {
                        "success": True,
                        "scoring_metrics": cached["scoring_metrics"],
                        "manager_signals": cached["manager_signals"],
                        "report_markdown": cached["report_markdown"]
                    }
                else:
                    print(f"CACHE STALE: User changed options (cached: {cached_hash}, current: {current_answers_hash}). Regenerating...")
        except Exception as e:
            # Table doesn't exist yet or read error: proceed dynamically
            print(f"CACHE MISS/SKIPPED (expected if table not created yet): {e}")

        # Initialize scoring structures
        raw_scores = {"SCP": 0, "FIE": 0, "CCD": 0, "SPO": 0}
        sections = {
            "S1": {"SCP": 0, "FIE": 0, "CCD": 0, "SPO": 0}, 
            "S2": {"SCP": 0, "FIE": 0, "CCD": 0, "SPO": 0}, 
            "S3": {"SCP": 0, "FIE": 0, "CCD": 0, "SPO": 0}, 
            "S4": {"SCP": 0, "FIE": 0, "CCD": 0, "SPO": 0}, 
        }

        # Index to Pattern structural decoder matrix tool
        index_to_pattern = {0: "SCP", 1: "FIE", 2: "CCD", 3: "SPO"}

        # STEP 2: LOOP AND MAP VALUES FETCHED FROM DATABASE
        for row in saved_answers:
            q = row["question_id"]
            idx = row["selected_option_index"]
            pattern = index_to_pattern[idx]

            raw_scores[pattern] += 1
            
            if 1 <= q <= 6:       sections["S1"][pattern] += 1
            elif 7 <= q <= 12:    sections["S2"][pattern] += 1
            elif 13 <= q <= 18:   sections["S3"][pattern] += 1
            elif 19 <= q <= 24:   sections["S4"][pattern] += 1 # 🔧 FIXED: Changed from S3 to S4

        s34_scores = {p: sections["S3"][p] + sections["S4"][p] for p in raw_scores}
        
        pattern_sorted_by_raw = sorted(raw_scores.keys(), key=lambda p: raw_scores[p], reverse=True)
        max_score = raw_scores[pattern_sorted_by_raw[0]]
        
        tied_for_primary = [p for p, score in raw_scores.items() if score == max_score]

        if len(tied_for_primary) > 1:
            primary = max(tied_for_primary, key=lambda p: s34_scores[p])  
        else:
            primary = tied_for_primary[0]

        remaining_patterns = [p for p in raw_scores.keys() if p != primary]
        patterns_sorted_by_remaining = sorted(remaining_patterns, key=lambda p: raw_scores[p], reverse=True)
        second_score = raw_scores[patterns_sorted_by_remaining[0]]
        
        tied_for_secondary = [p for p in remaining_patterns if raw_scores[p] == second_score]  
        
        if len(tied_for_secondary) > 1:
            secondary = max(tied_for_secondary, key=lambda p: s34_scores[p])  
            if len(set(s34_scores[p] for p in tied_for_secondary)) == 1 and "SPO" in tied_for_secondary:
                secondary = "SPO" 
        else:
            secondary = tied_for_secondary[0] 

        profile_combination = COMBINATION_PROFILES.get((primary, secondary), "Flexible Adapter")  

        primary_strength = int((raw_scores[primary] / 24) * 100) 
        secondary_strength = int((raw_scores[secondary] / 24) * 100)  
        
        s1_dom = max(sections["S1"], key=sections["S1"].get)  
        s2_dom = max(sections["S2"], key=sections["S2"].get)  
        s3_dom = max(sections["S3"], key=sections["S3"].get)  
        s4_dom = max(sections["S4"], key=sections["S4"].get)  

        flags = []  
        if raw_scores["SCP"] >= 14: flags.append("High Clarity Need")  
        if raw_scores["FIE"] >= 14: flags.append("High Autonomy Need")  
        if raw_scores["CCD"] >= 14: flags.append("High Social Need")  
        if raw_scores["SPO"] >= 14: flags.append("High Stability Need")  
        if all(score <= 9 for score in raw_scores.values()): flags.append("Balanced Profile")  

        # Retrieve Profile Content Library reference data
        library_data = PROFILE_CONTENT_LIBRARY.get(profile_combination, PROFILE_CONTENT_LIBRARY["Flexible Adapter"])

        # STEP 3: INVOKE GEMINI API FOR GENERATION  
        # Step 1 payload information
        employee_name = f"{profile_data.get('first_name', '')} {profile_data.get('last_name', '')}".strip() or "Employee"
        designation_str = profile_data.get("designation") or "Not Specified"
        experience_str = str(profile_data.get("experiense_years")) if profile_data.get("experiense_years") is not None else "Not Specified"
        
        designation_lower = designation_str.lower()
        is_manager_words = ["manager", "lead", "head", "director", "chief", "vp", "president", "supervisor", "officer", "exec"]
        is_mgr = any(word in designation_lower for word in is_manager_words)
        management_status = "Manager / Leader" if is_mgr else "Individual Contributor"
        
        dept = "Not Specified"
        if any(w in designation_lower for w in ["hr", "human resources", "people", "talent"]):
            dept = "Human Resources"
        elif any(w in designation_lower for w in ["engineer", "developer", "programmer", "tech", "software", "architect", "data"]):
            dept = "Technology & Engineering"
        elif any(w in designation_lower for w in ["pharmacist", "doctor", "clinical", "therapist", "medical", "nurse"]):
            dept = "Healthcare & Medical"
        elif any(w in designation_lower for w in ["finance", "accountant", "account", "audit", "billing"]):
            dept = "Finance & Accounting"
        elif any(w in designation_lower for w in ["sales", "marketing", "business development", "growth"]):
            dept = "Sales & Marketing"
        elif any(w in designation_lower for w in ["support", "customer", "operations", "consultant"]):
            dept = "Operations & Support"
        
        pattern_full_names = {
            "SCP": "Structure & Clarity Preference (SCP)",
            "FIE": "Focus & Independence Preference (FIE)",
            "CCD": "Collaboration & Connection Preference (CCD)",
            "SPO": "Stability & Process Preference (SPO)"
        }
        
        primary_full = pattern_full_names.get(primary, primary)
        secondary_full = pattern_full_names.get(secondary, secondary)
        
        behavior_behaviors = {
            "SCP": "Prefers defined expectations, detailed requirements, and structured processes before starting tasks.",
            "FIE": "Favors high autonomy, self-directed execution, and solving problems independently.",
            "CCD": "Values team connection, open communication, group alignment, and collaborative settings.",
            "SPO": "Prefers stable workflows, consistent processes, and predictable day-to-day operations."
        }
        
        avoid_behaviors = {
            "SCP": "Avoids executing tasks under vague directions, undocumented changes, or highly ambiguous goals.",
            "FIE": "Avoids working in highly micromanaged or dependency-heavy settings that limit personal initiative.",
            "CCD": "Avoids working in complete isolation without peer check-ins or team feedback loops.",
            "SPO": "Avoids highly volatile, constantly changing workflows without clear process guidelines."
        }
        
        most_repeated = behavior_behaviors.get(primary, "Active preference for " + primary)
        weakest_pattern = min(raw_scores.keys(), key=lambda p: raw_scores[p])
        least_shown = avoid_behaviors.get(weakest_pattern, "Less preference for " + weakest_pattern)
        
        if raw_scores[primary] >= 12:
            consistent_desc = f"Demonstrated highly consistent preferences across different scenarios, heavily prioritizing the {primary} style."
        else:
            consistent_desc = "Balanced preference distribution, showing adaptability across tasks."
            
        score_diff = raw_scores[primary] - raw_scores[secondary]
        if score_diff <= 2:
            mixed_desc = f"Responses show a very close split between {primary} and {secondary}, indicating situational adaptability between these preferences."
        else:
            mixed_desc = f"Clear operational boundary between your dominant {primary} preference and secondary {secondary} style."
            
        if raw_scores[primary] >= 12:
            confidence_level = "High"
        elif raw_scores[primary] >= 8:
            confidence_level = "Medium"
        else:
            confidence_level = "Low"
            
        try:
            questions_query = supabase.table("assessment_questions").select("question_id, question_text, options").execute()
            questions_map = {q["question_id"]: q for q in questions_query.data} if questions_query.data else {}
        except Exception:
            questions_map = {}
            
        responses_list = []
        for ans in sorted_answers:
            qid = ans["question_id"]
            opt_idx = ans["selected_option_index"]
            pat = index_to_pattern.get(opt_idx, "Unknown")
            q_text = "Assessment Question"
            ans_text = "Option Selected"
            if qid in questions_map:
                q_info = questions_map[qid]
                q_text = q_info.get("question_text", q_text)
                opts = q_info.get("options", [])
                if 0 <= opt_idx < len(opts):
                    ans_text = opts[opt_idx]
            responses_list.append(f"- Question {qid}: \"{q_text}\"\n  Employee's Selection: \"{ans_text}\" (Maps to style: {pat})")
            
        responses_payload_str = "\n".join(responses_list)
        
        behaviour_summary = f"""Behaviour Summary:
 • Strongest pattern: {primary_full}
 • Second strongest pattern: {secondary_full}
 • Most repeated behaviour: {most_repeated}
 • Least shown behaviour: {least_shown}
 • Areas where answers were consistent: {consistent_desc}
 • Areas where answers were mixed: {mixed_desc}
 • Confidence level: {confidence_level}"""

        system_instruction = """
        You are a highly seasoned, wise Senior HR Consultant and Executive Coach with over 30 years of organizational development and talent advisory experience.
        Your task is to write a deeply personalized, human-crafted feedback report for an employee based on their TIE work preference scores, behavior summary, actual question responses, and professional background.
        
        CRITICAL COMPLIANCE RULES:
        - Persona & Tone: Speak directly to the employee using "you" and "your". Adopt the voice of an encouraging, warm, highly insightful, and empathetic executive coach. Imagine you are sitting down for a 1-on-1 development conversation.
        - Human-Made Language: The text must feel authentic, professional, and hand-written by a human expert.
        - ABSOLUTE PROHIBITION ON ROBOTIC/AI FRAMING:
          - NEVER start a section or sentence with robotic phrases like: "TIE observed...", "TIE has noticed...", "TIE reached this conclusion...", "Based on our scoring...", "According to the database...", "TIE measures...".
          - Instead, use organic, human-advisory framing: "In your daily work, you show a natural inclination to...", "Your colleagues likely appreciate...", "When managing priorities, you lean towards...", "To thrive in your role, you benefit from...", "Your strength lies in...".
        - Flowing Prose: Write in natural, cohesive paragraphs (2-3 sentences per section). Do not use dry, copy-pasted lists or bullets unless explicitly requested.
        - High-Quality Synthesis: Translate scoring patterns into cohesive, thoughtful counseling paragraphs.
        - Focus on workplace behavior, communication, collaboration, adaptability, support preferences, and growth recommendations.
        - Do not generate personality descriptions. Generate workplace insights.
        - The report should help managers understand employees before problems become visible.
        - Absolute Prohibition on Psychological/Personality Labels:
          - Avoid ALL HR jargon, psychological terminology, or diagnostic labels (e.g., personality types).
          - Do NOT label or rank the employee. TIE is a workplace preference insight tool, NOT a personality assessment, psychological test, intelligence test, or leadership diagnostic.
          - NEVER use negative or judgmental words like: weak, weakness, poor performer, resistant, defensive, lazy, dependent, disengaged.
          - Use growth-oriented and supportive phrasing: "You tend to...", "You often perform best when...", "You may benefit from...", "You prefer...", "A helpful growth area is...".
        """
        
        user_prompt = f"""
        You are a Senior HR Consultant with 30+ years of experience giving professional feedback to an employee.
        Generate a detailed 18-part feedback report for this employee.
        
        PERSONALIZATION & CONTEXT RULES (CRITICAL):
        1. Do not write only based on the profile title. Use the employee’s actual responses, score distribution, role, department and experience to make the report feel personal.
        2. For every major section, mention at least one response-based observation. Avoid generic statements that can apply to everyone.
           Instead of generic text like "You are a Structured Collaborator.", make it sound like: "Across several responses, you preferred clarity before execution and shared visibility during teamwork. This suggests you may work best when expectations, ownership and communication are clear."
        3. If the employee shows a strong primary pattern but also has a meaningful secondary pattern, explain the nuance.
           Example: "Your responses show a clear preference for structure. However, some responses also show that you can work independently when the task is clear."
        4. Use the employee’s role and department to make examples relevant. Do not use business examples for healthcare, education or support roles unless relevant.
        5. Below any pattern strength or percentage scores presented in Section 16 ("Why TIE Reached This Conclusion"), write this exact explanation: 
           "This percentage reflects how consistently this pattern appeared across your responses. It is not a performance score, capability score or rating."
           Ensure this exact sentence appears verbatim.

        EMPLOYEE METADATA & DATA PAYLOAD:
        - Employee Name: {employee_name}
        - Role / Designation: {designation_str}
        - Department / Function: {dept}
        - Experience: {experience_str} years
        - Leadership Level: {management_status}
        
        {behaviour_summary}
        
        SCORING METRICS INPUT:
        - Primary Pattern: {primary} ({primary_strength}% strength)
        - Secondary Pattern: {secondary} ({secondary_strength}% strength)
        - Overall Combination Profile: {profile_combination}
        - Raw Scores: {raw_scores}
        - Section Dominant Styles:
          - S1 (Adaptability): {s1_dom}
          - S2 (Responsibility): {s2_dom}
          - S3 (Collaboration): {s3_dom}
          - S4 (Engagement): {s4_dom}
          
        ACTUAL QUESTION RESPONSES:
        {responses_payload_str}
        
        PROFILE CONTENT LIBRARY REFERENCE CONTEXT (Source of Truth):
        - Tagline: {library_data["tagline"]}
        - Description: {library_data["description"]}
        - Core Value: {library_data["core_value"]}
        - Strengths: {", ".join(library_data["strengths"])}
        - Communication Style: {library_data["communication_style"]}
        - Collaboration Setting: {library_data["collaboration_setting"]}
        - Change Handling: {library_data["change_handling"]}
        - Responsibility Approach: {library_data["responsibility_approach"]}
        - Frustrations: {", ".join(library_data["frustrations"])}
        - Manager Guidance: {library_data["manager_guidance"]}
        - Growth Recommendations: {", ".join(library_data["growth_recommendations"])}
        - Support Needs: {", ".join(library_data["support_needs"])}
        - Potential Growth Blocks: {", ".join(library_data["potential_growth_blocks"])}
        - Early Risk Indicators: {", ".join(library_data["early_risk_indicators"])}
        - Workplace Impact: {", ".join(library_data["workplace_impact"])}
        
        OUTPUT FORMAT:
        The output MUST follow this exact 18-part markdown structural format. Use exactly the numbered headings below. Provide 2-3 sentences of highly tailored, practical content for each section:

        # 1. Dominant Workplace Pattern
        Provide a warm opening summarizing the employee's work pattern, addressing them contextually as a {designation_str} with {experience_str} years of experience. Highlight their primary profile archetype: {profile_combination}.
        
        # 2. What TIE Observed
        Incorporate specific choices from their actual question responses below to describe their day-to-day work style and pacing. Avoid generic statements.
        
        # 3. Workplace Value
        Explain the unique value they bring to their {dept} department, linking their TIE strengths (e.g. {", ".join(library_data["strengths"])}) directly to their role.
        
        # 4. Workplace Implications
        Explain how their combination profile affects their daily work. If they have a secondary pattern ({secondary}), explain the nuance of combining it with {primary} (e.g., "Your responses show a clear preference for structure. However, some responses also show that you can work independently when the task is clear.").
        
        # 5. Support Needs
        Identify the environment, resources, and communication conditions they need to perform best, referencing their specific question answers about what they seek in a team or workspace.
        
        # 6. Potential Growth Blocks
        Identify personal barriers, mindsets, or habits that might slow them down, referencing their chosen question responses regarding challenge or frustration.
        
        # 7. Early Risk Indicators
        Describe early warning signs (e.g. withdrawal or frustration) relevant to a {designation_str} in their {dept} department.
        
        # 8. Business Implications
        Describe the organizational impact of keeping their support needs met versus unmet in their specific role context.
        
        # 9. Thrive Conditions
        Describe the ideal work and collaboration settings they prefer, utilizing their S3 ({s3_dom}) and S4 ({s4_dom}) dominant styles and responses.
        
        # 10. Challenge Conditions
        Outline scenarios that test their adaptability or pacing, referencing their S1 ({s1_dom}) dominant style and question answers.
        
        # 11. Watch-outs
        Mention operational friction points (e.g., from frustrations like {", ".join(library_data["frustrations"])}) and constructive advice, referencing specific response choices.
        
        # 12. How Others May Experience You
        Explain how peers in a similar role or {dept} department might experience their collaboration and communication style.
        
        # 13. What Your Manager Should Know
        Detail how their manager should approach accountability and support, referencing their S2 ({s2_dom}) responsibility approach.
        
        # 14. Manager Support Suggestions
        Provide actionable, role-relevant actions the manager can take to support a {designation_str} with {experience_str} years of experience.
        
        # 15. Growth Suggestions
        Suggest 2-3 specific growth steps targeting their secondary style ({secondary}) and versatility, referencing their actual question responses.
        
        # 16. Why TIE Reached This Conclusion
        Explain the scoring of primary ({primary}: {primary_strength}%) and secondary ({secondary}: {secondary_strength}%) patterns. Below the percentages, you MUST write this exact statement:
        "This percentage reflects how consistently this pattern appeared across your responses. It is not a performance score, capability score or rating."
        
        # 17. What TIE Measures
        State clearly that TIE measures subjective workplace environment preferences, communication styles, collaboration styles, and task pacing.
        
        # 18. What TIE Does Not Measure
        Explicitly state that TIE does NOT measure personality, intelligence, psychological health, clinical traits, technical capability, or leadership performance.
        """

        # STEP 3: GENERATE REPORT VIA LLM MANAGER (with multi-provider failover)
        try:
            ai_narrative, model_used = llm_manager.generate_report(system_instruction, user_prompt)
            print(f"Successfully generated report using: {model_used}")
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to generate report from any LLM provider. (Details: {str(e)})"
            )

        # STEP 4: SAVE NEWLY GENERATED REPORT TO CACHE DATABASE
        scoring_metrics_data = {
            "raw_scores": raw_scores,
            "primary_pattern": primary,
            "secondary_pattern": secondary,
            "combination_profile": profile_combination,
            "primary_strength_pct": primary_strength,
            "secondary_strength_pct": secondary_strength,
            "flags": flags,
            "answers_hash": current_answers_hash
        }
        
        manager_signals_data = {
            "s1_adaptability_dominant": s1_dom,
            "s2_execution_dominant": s2_dom,
            "s3_support_dominant": s3_dom,
            "s4_engagement_dominant": s4_dom
        }

        try:
            supabase.table("saved_reports").upsert({
                "user_id": payload.user_id,
                "report_markdown": ai_narrative,
                "scoring_metrics": scoring_metrics_data,
                "manager_signals": manager_signals_data
            }).execute()
            print(f"CACHE SAVE: Successfully cached report for user {payload.user_id}")
        except Exception as e:
            print(f"CACHE SAVE FAILED (expected if SQL script not run yet): {e}")

        return {
            "success": True,
            "scoring_metrics": scoring_metrics_data,
            "manager_signals": manager_signals_data,
            "report_markdown": ai_narrative
        }

    except HTTPException as he:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=he.status_code, content={"detail": he.detail})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": str(e)})