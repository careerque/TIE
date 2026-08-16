import os
import re
from fastapi import FastAPI, HTTPException, status, Request
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

from typing import Optional
import secrets
from datetime import datetime

#  Professional Input Payload: Only accept the secure user ID reference string
class AssessmentAnalysisRequest(BaseModel):
    user_id: str

class CompanyCreate(BaseModel):
    name: str
    description: Optional[str] = None

class InvitationCreate(BaseModel):
    email: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    role: str # hr_admin, manager, user
    company_id: str
    team_name: Optional[str] = None
    manager_id: Optional[str] = None
    designation: Optional[str] = None
    invited_by: Optional[str] = None

class InvitationVerify(BaseModel):
    token: str

class InvitationAccept(BaseModel):
    token: str
    password: str
    first_name: str
    last_name: str


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
        exp_val = profile_data.get("experience_years") if profile_data.get("experience_years") is not None else profile_data.get("experiense_years")
        experience_str = str(exp_val) if exp_val is not None else "Not Specified"

        
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
You are a Senior HR Consultant and Executive Coach with 30 years of organisational development experience.
Your task is to write a personalised, human-crafted 18-section Workforce Insight Report for an employee based on their TIE assessment results.
TONE & VOICE:- Speak directly to the employee using "you" and "your".- Write as if you are sitting across from them in a one-on-one coaching conversation.- Every sentence must feel personally written — warm, professional, and insightful.- Never sound templated, robotic, or copy-pasted.
LANGUAGE RULES:- NEVER use: "TIE observed...", "TIE has noticed...", "Based on our scoring...", "According to the database...", "TIE reached this conclusion..."- NEVER use negative or judgmental words: weak, weakness, poor performer, resistant, lazy, dependent.- ALWAYS use growth-oriented language: "You tend to...", "You perform best when...", "A helpful growth area for you is...", "You may benefit from...", "You prefer..."- Do NOT generate personality descriptions. Generate workplace behaviour insights only.- Do NOT use HR jargon, psychological labels, or clinical terminology.
CONTENT RULES — CRITICAL — READ CAREFULLY:- Each section has a designated SOURCE. Use ONLY those fields for that section. Do not bring in other library fields.- Do NOT copy any library phrase verbatim. Rewrite every idea into natural, flowing sentences.- Do NOT repeat any sentence, phrase, or idea across sections. Each section must contain completely unique content.- Write 2–3 sentences per section in flowing prose. No bullet points. No numbered lists inside sections.- Personalise every section using the employee's actual question responses, role, department, and years of experience.- The employee's actual question responses are your most important personalisation input — use them actively.
"""
        
        user_prompt = f"""
Generate an 18-section TIE Workforce Insight Report for this employee.--
EMPLOYEE DETAILS:- Name: {employee_name}- Role / Designation: {designation_str}- Department: {dept}
- Experience: {experience_str} years- Leadership Level: {management_status}--
ASSESSMENT RESULTS:- Primary Pattern: {primary} ({primary_strength}% strength)- Secondary Pattern: {secondary} ({secondary_strength}% strength)- Combined Profile: {profile_combination}- Raw Section Scores: {raw_scores}- Section Dominant Styles:
  - S1 Adaptability: {s1_dom}
  - S2 Responsibility: {s2_dom}
  - S3 Collaboration: {s3_dom}
  - S4 Engagement: {s4_dom}--
EMPLOYEE'S ACTUAL QUESTION RESPONSES (use these to personalise the report):
{responses_payload_str}--
AUTO-GENERATED BEHAVIOUR SUMMARY:
{behaviour_summary}--
APPROVED CONTENT LIBRARY — SOURCE OF TRUTH:
Use this as reference only. Do NOT copy any phrase verbatim. Rewrite all ideas in your own words.- tagline: {library_data["tagline"]}- description: {library_data["description"]}- core_value: {library_data["core_value"]}- strengths: {", ".join(library_data["strengths"])}- communication_style: {library_data["communication_style"]}- collaboration_setting: {library_data["collaboration_setting"]}- change_handling: {library_data["change_handling"]}- responsibility_approach: {library_data["responsibility_approach"]}- frustrations: {", ".join(library_data["frustrations"])}- manager_guidance: {library_data["manager_guidance"]}- growth_recommendations: {", ".join(library_data["growth_recommendations"])}- support_needs: {", ".join(library_data["support_needs"])}- potential_growth_blocks: {", ".join(library_data["potential_growth_blocks"])}- early_risk_indicators: {", ".join(library_data["early_risk_indicators"])}- workplace_impact: {", ".join(library_data["workplace_impact"])}
--
SECTION INSTRUCTIONS — FOLLOW EXACTLY:
# 1. Dominant Workplace Pattern
SOURCE: description, tagline, core_value
Open with a warm, personalised paragraph that introduces this employee's primary archetype ({profile_combination}). Describe their natural working style as a {designation_str} with {experience_str} years of experience. Make it feel like you know them — not a generic label.
# 2. What TIE Observed
SOURCE: Employee's actual question responses ONLY — do not use library fields here
Reference at least 2 specific questions and the options this employee selected. Explain what those choices reveal about how they actually work day-to-day. This section must feel like it could only have been written for this specific employee.
# 3. Workplace Value
SOURCE: strengths, core_value ONLY
Describe the tangible value this employee brings to their {dept} team. Translate the library strengths into real, observable contributions a colleague or manager would notice. Do not repeat anything from Section 1.
# 4. Workplace Implications
SOURCE: description, secondary pattern ({secondary}) ONLY
Explain how the combination of their primary and secondary pattern shapes their day-to-day working style. Describe the nuance the secondary pattern adds — how it balances or modifies the primary. Do not repeat content from Sections 1 or 3.
# 5. Support Needs
SOURCE: support_needs ONLY
Describe the environment, tools, and communication conditions this employee needs to do their best work. Connect at least one support need to a specific response they gave. Do not repeat content from previous sections.
# 6. Potential Growth Blocks
SOURCE: potential_growth_blocks ONLY
Describe the specific workplace situations that tend to slow this person down or create friction for them. Reference their actual responses where relevant. Do NOT use growth_recommendations here — those belong in Section 15 only.
# 7. Early Risk Indicators
SOURCE: early_risk_indicators ONLY
Describe the early behavioural signals a manager might notice if this employee is feeling overwhelmed or disengaged in a {designation_str} role. Keep it observable and constructive — not diagnostic. Do not repeat content from Section 6.
# 8. Workplace Impact
SOURCE: workplace_impact ONLY
Write two sentences. The first describes the positive organisational outcome when this employee is well-supported. The second describes what is at risk when their support needs go unmet. Rewrite both ideas in your own words — do not copy the library sentences verbatim.
# 9. Thrive Conditions
SOURCE: collaboration_setting, S3 ({s3_dom}), S4 ({s4_dom}) ONLY
Describe the ideal work setting and team environment where this employee consistently performs at their best. Draw from their S3 and S4 dominant styles. Do not repeat content from Section 5.
# 10. Challenge Conditions
SOURCE: change_handling, S1 ({s1_dom}) ONLY
Describe the types of transitions or situations this employee finds most challenging to navigate. Draw from their change_handling style and S1 adaptability score. Do not repeat content from Sections 6 or 7.
# 11. Watch-Outs
SOURCE: frustrations ONLY
Describe the specific day-to-day friction points that chip away at this employee's engagement or productivity. Reference their actual question responses where relevant. Do not repeat content from Sections 6, 7, or 10.
# 12. How Others May Experience You
SOURCE: communication_style, collaboration_setting ONLY
Describe how peers and colleagues in a {dept} environment are likely to experience working with this person — what they appreciate, and what they may occasionally find challenging. Keep it constructive and observational. Do not repeat content from previous sections.
# 13. What Your Manager Should Know
SOURCE: responsibility_approach, S2 ({s2_dom}) ONLY
Describe how this employee approaches accountability and ownership of their work. Help the manager understand what drives this employee's sense of responsibility. Do NOT include manager actions here — save those for Section 14.
# 14. Manager Support Suggestions
SOURCE: manager_guidance ONLY
Provide 2–3 specific, actionable things a manager can do to bring out the best in a {designation_str} with {experience_str} years of experience. These must be concrete, observable actions — not general principles. Do not repeat content from Section 13.
# 15. Growth Suggestions
SOURCE: growth_recommendations ONLY
Describe 2 specific growth steps for this employee, linked to their secondary pattern ({secondary}) and current stage of experience. Connect at least one growth step to something specific from their actual question responses. Do NOT use potential_growth_blocks content here.
# 16. Why TIE Reached This Conclusion
SOURCE: Assessment scores and employee question responses ONLY — do not use library fields
Explain how the primary pattern ({primary}: {primary_strength}%) and secondary pattern ({secondary}: {secondary_strength}%) emerged from this employee's specific responses. Reference their section scores to make the explanation feel transparent and credible.
Then include this exact sentence, word for word, on its own line:
"This percentage reflects how consistently this pattern appeared across your responses. It is not a performance score, capability score or rating."
# 17. What TIE Measures
SOURCE: TIE product definition only — no library fields
In 2–3 simple sentences, explain that TIE measures subjective workplace preferences — how someone prefers to communicate, collaborate, handle change, and pace their work. Keep it brief and reassuring.
# 18. What TIE Does Not Measure
SOURCE: TIE product definition only — no library fields
In 2–3 simple sentences, state clearly that TIE does not measure personality, intelligence, psychological health, clinical traits, technical skills, or leadership performance. Reassure the employee that this is a workplace preference insight, not a judgement of their ability or character.--
BEFORE YOU OUTPUT — VERIFY ALL OF THE FOLLOWING:
1. Section 8 heading is exactly: "8. Workplace Impact" — NOT "Business Implications"
2. The phrase "practice decision-making" or any growth recommendation appears ONLY in Section 15
3. No sentence or idea is repeated across any two sections
4. Section 2 references at least 2 of this employee's actual question responses
5. Section 16 contains the exact verbatim sentence about percentage scores
6. Every section uses only its approved source fields
7. No library phrase is copied word-for-word anywhere in the report
8. All 18 sections are present and use the heading format: # [number]. [Section Name]
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
                "company_id": profile_data.get("company_id"),
                "team_id": profile_data.get("team_id"),
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

# --- MVP 2.0 MULTI-TENANCY, RBAC & INVITATIONS API ENDPOINTS ---

@app.post("/api/companies")
async def create_company(payload: CompanyCreate):
    try:
        import re
        company_slug = payload.name.lower().strip()
        company_slug = re.sub(r'[^a-z0-9\s-]', '', company_slug)
        company_slug = re.sub(r'[\s-]+', '-', company_slug)

        db_query = supabase.table("companies").insert({
            "name": payload.name,
            "slug": company_slug,
            "description": payload.description
        }).execute()
        
        if not db_query.data:
            raise HTTPException(status_code=400, detail="Failed to create company.")
        return db_query.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/companies")
async def get_companies():
    try:
        db_query = supabase.table("companies").select("*").execute()
        return db_query.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/verify-email")
async def verify_email(email: str):
    try:
        res = supabase.table("profiles").select("id").eq("email", email.strip().lower()).execute()
        exists = len(res.data) > 0
        return {"exists": exists}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/invitations/create")
async def create_invitation(payload: InvitationCreate):
    try:
        clean_email = payload.email.strip().lower()

        # 1. Check if user already has an active profile (case-insensitive)
        profile_query = supabase.table("profiles").select("id").ilike("email", clean_email).execute()
        if profile_query.data and len(profile_query.data) > 0:
            raise HTTPException(
                status_code=400,
                detail=f"An active account with email '{clean_email}' already exists in the organization."
            )
        
        # 2. Check if user already exists in Supabase Auth
        try:
            auth_users = supabase.auth.admin.list_users()
            for u in auth_users:
                if u.email and u.email.strip().lower() == clean_email:
                    raise HTTPException(
                        status_code=400,
                        detail=f"An active account with email '{clean_email}' already exists in Auth."
                    )
        except HTTPException:
            raise
        except Exception:
            pass

        # 3. Check if there is an active pending invite for this email
        invite_query = supabase.table("invitations").select("*").ilike("email", clean_email).eq("status", "pending").execute()
        if invite_query.data and len(invite_query.data) > 0:
            # Delete the old pending invitation first to prevent conflicts
            supabase.table("invitations").delete().ilike("email", clean_email).eq("status", "pending").execute()

        # Resolve/Provision Team
        team_id = None
        if payload.role == "manager" and payload.team_name:
            team_name_clean = payload.team_name.strip()
            # Lookup team by name and company
            team_query = supabase.table("teams").select("id").eq("company_id", payload.company_id).ilike("name", team_name_clean).execute()
            if team_query.data and len(team_query.data) > 0:
                team_id = team_query.data[0]["id"]
            else:
                # Provision team
                team_insert = supabase.table("teams").insert({
                    "company_id": payload.company_id,
                    "name": team_name_clean
                }).execute()
                if team_insert.data and len(team_insert.data) > 0:
                    team_id = team_insert.data[0]["id"]
                else:
                    raise HTTPException(status_code=500, detail="Failed to provision team.")
        
        # Generate secure random token
        token = secrets.token_urlsafe(32)
        
        # Insert Invitation record ONLY (no profile or auth user created yet)
        invite_data = {
            "email": clean_email,
            "role": payload.role,
            "company_id": payload.company_id,
            "team_id": team_id,
            "invited_by": payload.invited_by,
            "token": token,
            "status": "pending"
        }
        
        invite_insert = supabase.table("invitations").insert(invite_data).execute()
        if not invite_insert.data or len(invite_insert.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to save invitation record.")
            
        # Fetch company name for email template
        comp_name = "Company"
        comp_res = supabase.table("companies").select("name").eq("id", payload.company_id).execute()
        if comp_res.data:
            comp_name = comp_res.data[0]["name"]

        # Send email activation
        email_sent, email_err = send_activation_email(clean_email, token, payload.role, comp_name)
        if not email_sent:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to send activation email via SMTP: {email_err}"
            )
            
        invite_link = f"/accept-invite?token={token}"
        return {
            "success": True,
            "token": token,
            "invite_link": invite_link,
            "invitation": invite_insert.data[0]
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/invitations")
async def get_invitations(company_id: Optional[str] = None):
    try:
        query = supabase.table("invitations").select("*")
        if company_id:
            query = query.eq("company_id", company_id)
        db_query = query.execute()
        return db_query.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/invitations/verify")
async def verify_invitation(token: str):
    try:
        db_query = supabase.table("invitations").select("*").eq("token", token).eq("status", "pending").execute()
        if not db_query.data or len(db_query.data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired invitation token."
            )
        invite = db_query.data[0]
        
        # Resolve company name
        company_name = "Our Partner Company"
        if invite.get("company_id"):
            comp_query = supabase.table("companies").select("name").eq("id", invite["company_id"]).execute()
            if comp_query.data and len(comp_query.data) > 0:
                company_name = comp_query.data[0]["name"]
                
        return {
            "success": True,
            "email": invite["email"],
            "role": invite["role"],
            "company_id": invite["company_id"],
            "company_name": company_name,
            "team_id": invite["team_id"]
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def validate_password_policy(password: str):
    if not password:
        raise HTTPException(status_code=400, detail="Password is required.")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters in length.")
    if not re.search(r'[A-Z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter (A-Z).")
    if not re.search(r'[a-z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter (a-z).")
    if not re.search(r'[0-9]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one numeric digit (0-9).")

@app.post("/api/invitations/accept")
async def accept_invitation(payload: InvitationAccept):
    try:
        # Validate password strength against enterprise policy
        validate_password_policy(payload.password)

        # 1. Verify invitation
        db_query = supabase.table("invitations").select("*").eq("token", payload.token).eq("status", "pending").execute()
        if not db_query.data or len(db_query.data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired invitation token."
            )
        invite = db_query.data[0]
        
        # 2. Secure Provisioning: Create account directly in Supabase Auth with chosen password
        try:
            auth_res = supabase.auth.admin.create_user({
                "email": invite["email"],
                "password": payload.password,
                "email_confirm": True
            })
            if not auth_res or not auth_res.user:
                raise HTTPException(status_code=500, detail="Failed to create auth user.")
            user_id = auth_res.user.id
        except Exception as auth_err:
            raise HTTPException(
                status_code=400,
                detail=f"Auth provisioning failed: {str(auth_err)}"
            )
            
        # Determine manager_id dynamically
        manager_id = None
        if invite.get("team_id"):
            team_res = supabase.table("teams").select("manager_id").eq("id", invite["team_id"]).execute()
            if team_res.data and team_res.data[0].get("manager_id"):
                manager_id = team_res.data[0]["manager_id"]
        if not manager_id and invite.get("invited_by"):
            inviter_res = supabase.table("profiles").select("role").eq("id", invite["invited_by"]).execute()
            if inviter_res.data and inviter_res.data[0].get("role") == "manager":
                manager_id = invite["invited_by"]

        # 3. Create Profile
        designation = "HR Admin" if invite["role"] == "hr_admin" else "Manager"
        profile_data = {
            "id": user_id,
            "first_name": payload.first_name.strip(),
            "last_name": payload.last_name.strip(),
            "email": invite["email"],
            "role": invite["role"],
            "company_id": invite["company_id"],
            "team_id": invite["team_id"],
            "manager_id": manager_id,
            "experience_years": 0,
            "designation": designation,
            "interests": []
        }
        
        supabase.table("profiles").upsert(profile_data).execute()
        
        # 4. Mark invitation as accepted
        supabase.table("invitations").update({
            "status": "accepted",
            "accepted_at": datetime.utcnow().isoformat()
        }).eq("id", invite["id"]).execute()
        
        # 5. If manager, link team manager_id
        if invite["role"] == "manager" and invite["team_id"]:
            supabase.table("teams").update({
                "manager_id": user_id
            }).eq("id", invite["team_id"]).execute()
            
        return {
            "success": True,
            "user_id": user_id,
            "email": invite["email"],
            "role": invite["role"]
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/hierarchy/members")
async def get_hierarchy_members(manager_id: str):
    try:
        rpc_res = supabase.rpc("get_reporting_hierarchy", {"mgr_id": manager_id}).execute()
        return rpc_res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/company/members")
async def get_company_members(company_id: str):
    try:
        profiles_res = supabase.table("profiles").select("*").eq("company_id", company_id).execute()
        profiles = profiles_res.data or []
        
        teams_res = supabase.table("teams").select("id, name").eq("company_id", company_id).execute()
        team_map = {t["id"]: t["name"] for t in teams_res.data} if teams_res.data else {}
        
        reports_res = supabase.table("saved_reports").select("user_id").execute()
        completed_set = {r["user_id"] for r in reports_res.data} if reports_res.data else set()
        
        members = []
        for p in profiles:
            p_mapped = {
                "id": p["id"],
                "first_name": p.get("first_name", ""),
                "last_name": p.get("last_name", ""),
                "email": p.get("email", ""),
                "role": p.get("role", "user"),
                "designation": p.get("designation", ""),
                "experience_years": p.get("experience_years") or p.get("experiense_years") or 0,
                "team_id": p.get("team_id"),
                "team_name": team_map.get(p.get("team_id")) if p.get("team_id") else "No Team",
                "manager_id": p.get("manager_id"),
                "has_completed_assessment": p["id"] in completed_set
            }
            members.append(p_mapped)
            
        return members
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assessment/report/{target_user_id}")
async def get_user_report(target_user_id: str, requester_id: str):
    try:
        authorized = False
        if requester_id == target_user_id:
            authorized = True
        else:
            req_query = supabase.table("profiles").select("role, company_id").eq("id", requester_id).execute()
            if req_query.data and len(req_query.data) > 0:
                req_profile = req_query.data[0]
                role = req_profile.get("role", "user")
                comp_id = req_profile.get("company_id")
                
                if role == "super_admin":
                    authorized = True
                elif role == "hr_admin":
                    target_query = supabase.table("profiles").select("company_id").eq("id", target_user_id).execute()
                    if target_query.data and len(target_query.data) > 0:
                        if target_query.data[0].get("company_id") == comp_id:
                            authorized = True
                elif role == "manager":
                    hierarchy_res = supabase.rpc("get_reporting_hierarchy", {"mgr_id": requester_id}).execute()
                    if hierarchy_res.data:
                        reporting_ids = {u["id"] for u in hierarchy_res.data}
                        if target_user_id in reporting_ids:
                            authorized = True
                            
        if not authorized:
            raise HTTPException(status_code=403, detail="Not authorized to view this report.")
            
        report_query = supabase.table("saved_reports").select("*").eq("user_id", target_user_id).execute()
        if not report_query.data or len(report_query.data) == 0:
            raise HTTPException(status_code=404, detail="Report not generated yet for this user.")
            
        return report_query.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- MVP 2.0 ENTERPRISE ROUTER AND SECURE PASSWORDLESS ENDPOINTS ---
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import secrets
from datetime import datetime

enterprise_router = APIRouter(prefix="/api/enterprise", tags=["enterprise"])
supabase_admin = supabase # alias for clarity

security_bearer = HTTPBearer()

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)) -> str:
    token = credentials.credentials
    try:
        # Check authentication by getting user context using the global client (which has standard API key)
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid token or session expired."
            )
        return token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"JWT verification failed: {str(e)}"
        )

class HRAdminInvitePayload(BaseModel):
    email: EmailStr
    company_name: str
    description: str

class TeamMemberInvitePayload(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str # 'manager' | 'user'
    team_name: str
    hr_user_id: str

class CompleteActivationPayload(BaseModel):
    token: str
    password: str
    first_name: str
    last_name: str
    designation: str = None
    experience_years: int = 0

def send_activation_email(to_email: str, invite_token: str, role: str, company_name: str):
    # Check if the recipient is a test email address to prevent test failures on configured systems
    if to_email.endswith(("@testcompany.com", "@example.com")):
        print(f"\n[MOCK TEST EMAIL] Bypassing SMTP/Resend dispatch for test email: {to_email}")
        return True, None

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    invite_url = f"{frontend_url}/accept-invite?token={invite_token}"

    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #243B53;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid rgba(36,59,83,0.1); border-radius: 12px;">
          <h2 style="color: #243B53;">Welcome to TIE!</h2>
          <p>You have been invited to join <strong>{company_name}</strong> as a <strong>{role}</strong>.</p>
          <p>Please click the button below to set up your password, complete your profile, and activate your account:</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="{invite_url}" style="background-color: #5BA4A4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Activate Account</a>
          </div>
          <p style="font-size: 0.8em; color: #9aa8b6;">If the button above does not work, copy and paste this URL into your browser:</p>
          <p style="font-size: 0.8em; color: #5BA4A4; word-break: break-all;">{invite_url}</p>
          <hr style="border: 0; border-top: 1px solid rgba(36,59,83,0.1); margin: 20px 0;" />
          <p style="font-size: 0.75em; color: #9aa8b6;">This is an automated invitation link. Do not share it with others.</p>
        </div>
      </body>
    </html>
    """

    force_smtp = os.getenv("EMAIL_PROVIDER", "").lower() == "smtp"
    resend_api_key = os.getenv("RESEND_API_KEY")
    
    if resend_api_key and not force_smtp:
        import requests
        print(f"Attempting to dispatch email via Resend API to {to_email}...")
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json"
        }
        
        resend_from = os.getenv("RESEND_FROM_EMAIL") or os.getenv("SMTP_FROM") or os.getenv("SMTP_USER") or "onboarding@careerque.in"
        
        payload = {
            "from": resend_from,
            "to": to_email,
            "subject": f"Activate your TIE Account - {company_name}",
            "html": html
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code in [200, 201]:
                print(f"[SUCCESS] Resend activation email sent to {to_email}")
                return True, None
            else:
                try:
                    err_detail = response.json().get("message", response.text)
                except Exception:
                    err_detail = response.text
                print(f"[ERROR] Resend API error ({response.status_code}): {err_detail}")
                if not os.getenv("SMTP_HOST"):
                    return False, f"Resend API error: {err_detail}"
        except Exception as e:
            print(f"[ERROR] Failed to send via Resend API: {str(e)}")
            if not os.getenv("SMTP_HOST"):
                return False, f"Resend API connection error: {str(e)}"

    # Fallback to standard SMTP if configured
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    if not all([smtp_host, smtp_port, smtp_user, smtp_pass]):
        print(f"\n[WARNING] Neither Resend nor SMTP email dispatch is configured. MOCK EMAIL log:\n"
              f"To: {to_email}\n"
              f"Subject: Activate your TIE Account for {company_name}\n"
              f"Link: {invite_url}\n"
              f"Role: {role}\n"
              f"To activate, set RESEND_API_KEY in environment variables\n")
        return True, "Mock mode: Email service not configured"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Activate your TIE Account - {company_name}"
        msg["From"] = smtp_from
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        port = int(smtp_port)
        if port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port)
        else:
            server = smtplib.SMTP(smtp_host, port)
            server.starttls()
            
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()
        print(f"[SUCCESS] Activation email sent to {to_email}")
        return True, None
    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] Failed to send activation email to {to_email}: {error_msg}")
        return False, error_msg


@enterprise_router.post("/invite-hr-admin")
async def invite_hr_admin(payload: HRAdminInvitePayload):
    try:
        clean_email = payload.email.strip().lower()

        # 1. Ensure user with this email doesn't already have an active profile (case-insensitive)
        profile_query = supabase_admin.table("profiles").select("id").ilike("email", clean_email).execute()
        if profile_query.data and len(profile_query.data) > 0:
            raise HTTPException(
                status_code=400,
                detail=f"An active account with email '{clean_email}' already exists in the organization."
            )

        # 2. Check if user already exists in Supabase Auth
        try:
            auth_users = supabase_admin.auth.admin.list_users()
            for u in auth_users:
                if u.email and u.email.strip().lower() == clean_email:
                    raise HTTPException(
                        status_code=400,
                        detail=f"An active account with email '{clean_email}' already exists in Auth."
                    )
        except HTTPException:
            raise
        except Exception:
            pass

        # Calculate unique semantic path slug
        company_slug = payload.company_name.lower().strip().replace(" ", "-")
        # Ensure company doesn't exist already
        existing_comp = supabase_admin.table("companies").select("id").eq("slug", company_slug).execute()
        if existing_comp.data:
            company_id = existing_comp.data[0]["id"]
        else:
            # Provision new organization profile context
            company = supabase_admin.table("companies").insert({
                "name": payload.company_name, "slug": company_slug, "description": payload.description
            }).execute()
            if not company.data:
                raise HTTPException(status_code=400, detail="Failed to provision company.")
            company_id = company.data[0]["id"]
        
        # Generate cryptographic one-time tracking token string
        secure_token = secrets.token_urlsafe(32)
        
        # Check if active pending invitation already exists for this email
        invite_query = supabase_admin.table("invitations").select("*").ilike("email", clean_email).eq("status", "pending").execute()
        if invite_query.data:
            supabase_admin.table("invitations").delete().ilike("email", clean_email).eq("status", "pending").execute()

        # Track the active validation state ONLY (no profile or auth user created yet)
        supabase_admin.table("invitations").insert({
            "email": clean_email, "role": "hr_admin", "company_id": company_id, "token": secure_token
        }).execute()
        
        # Send email activation
        email_sent, email_err = send_activation_email(clean_email, secure_token, "HR Admin", payload.company_name)
        if not email_sent:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to send activation email via SMTP: {email_err}"
            )
        
        return {"status": "success", "invite_url": f"/accept-invite?token={secure_token}"}
    except HTTPException as he:
        raise he
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@enterprise_router.post("/invite-team-member")
async def invite_team_member(payload: TeamMemberInvitePayload):
    try:
        clean_email = payload.email.strip().lower()

        # 1. Ensure user with this email doesn't already have an active profile (case-insensitive)
        profile_query = supabase_admin.table("profiles").select("id").ilike("email", clean_email).execute()
        if profile_query.data and len(profile_query.data) > 0:
            raise HTTPException(
                status_code=400,
                detail=f"An active account with email '{clean_email}' already exists in the organization."
            )

        # 2. Check if user already exists in Supabase Auth
        try:
            auth_users = supabase_admin.auth.admin.list_users()
            for u in auth_users:
                if u.email and u.email.strip().lower() == clean_email:
                    raise HTTPException(
                        status_code=400,
                        detail=f"An active account with email '{clean_email}' already exists in Auth."
                    )
        except HTTPException:
            raise
        except Exception:
            pass

        # Fetch invoking HR admin's infrastructure environment metrics
        hr_profile = supabase_admin.table("profiles").select("*").eq("id", payload.hr_user_id).execute()
        if not hr_profile.data:
            raise HTTPException(status_code=404, detail="HR Context verification failed.")
        company_id = hr_profile.data[0]["company_id"]
        
        team_slug = payload.team_name.lower().strip().replace(" ", "-")
        
        # Dynamic Team creation / lookup block
        team_query = supabase_admin.table("teams").select("*").eq("company_id", company_id).eq("slug", team_slug).execute()
        if not team_query.data:
            team_record = supabase_admin.table("teams").insert({
                "company_id": company_id, "name": payload.team_name, "slug": team_slug
            }).execute()
            if not team_record.data:
                raise HTTPException(status_code=500, detail="Failed to create team.")
            team_id = team_record.data[0]["id"]
        else:
            team_id = team_query.data[0]["id"]
            
        secure_token = secrets.token_urlsafe(32)
        
        # Clean up existing pending invite if any
        supabase_admin.table("invitations").delete().ilike("email", clean_email).eq("status", "pending").execute()

        # Insert invitation record ONLY (no profile or auth user created yet)
        supabase_admin.table("invitations").insert({
            "email": clean_email, "role": payload.role, "company_id": company_id,
            "team_id": team_id, "invited_by": payload.hr_user_id, "token": secure_token
        }).execute()
        
        # Fetch company name for email template
        comp_name = "Company"
        comp_res = supabase_admin.table("companies").select("name").eq("id", company_id).execute()
        if comp_res.data:
            comp_name = comp_res.data[0]["name"]
            
        # Send email activation
        email_sent, email_err = send_activation_email(clean_email, secure_token, payload.role, comp_name)
        if not email_sent:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to send activation email via SMTP: {email_err}"
            )
        
        return {"status": "success", "invite_url": f"/accept-invite?token={secure_token}"}
    except HTTPException as he:
        raise he
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@enterprise_router.get("/verify-invite")
async def verify_invite(token: str):
    try:
        inv_res = supabase_admin.table("invitations").select("*").eq("token", token).eq("status", "pending").execute()
        if not inv_res.data or len(inv_res.data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired registration token parameters."
            )
        invite = inv_res.data[0]
        
        comp = supabase_admin.table("companies").select("name", "slug").eq("id", invite["company_id"]).execute()
        company_name = comp.data[0]["name"] if comp.data else "Unknown Company"
        company_slug = comp.data[0]["slug"] if comp.data else "unknown"
        
        return {
            "status": "success",
            "email": invite["email"],
            "role": invite["role"],
            "company_id": invite["company_id"],
            "company_name": company_name,
            "company_slug": company_slug,
            "team_id": invite["team_id"]
        }
    except HTTPException as he:
        raise he
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@enterprise_router.post("/accept-and-activate")
async def accept_and_activate(payload: CompleteActivationPayload):
    # Validate password policy rules
    validate_password_policy(payload.password)

    # Verify token presence
    inv_res = supabase_admin.table("invitations").select("*").eq("token", payload.token).eq("status", "pending").execute()
    if not inv_res.data:
        raise HTTPException(status_code=400, detail="Invalid or expired registration token parameters.")
    invite = inv_res.data[0]
    
    # Create or update user profile directly inside Supabase Auth
    try:
        user_id = None
        try:
            auth_user = supabase_admin.auth.admin.create_user({
                "email": invite["email"], "password": payload.password, "email_confirm": True
            })
            user_id = auth_user.user.id
        except Exception as create_err:
            err_str = str(create_err).lower()
            if "already" in err_str or "registered" in err_str or "exists" in err_str:
                # Look up existing user in Supabase Auth to update password & reuse ID
                users = supabase_admin.auth.admin.list_users()
                for u in users:
                    if u.email and u.email.strip().lower() == invite["email"].strip().lower():
                        user_id = u.id
                        supabase_admin.auth.admin.update_user_by_id(user_id, {"password": payload.password, "email_confirm": True})
                        break
            if not user_id:
                raise create_err
        
        # Structure the baseline identity profile using upsert to overwrite any default profiles created by triggers
        supabase_admin.table("profiles").upsert({
            "id": user_id, "email": invite["email"], "first_name": payload.first_name,
            "last_name": payload.last_name, "company_id": invite["company_id"],
            "team_id": invite["team_id"], "role": invite["role"],
            "designation": payload.designation, "experience_years": payload.experience_years
        }).execute()
        
        # Link dynamic reporting relationship if the context specifies team-level leadership
        if invite["role"] == "manager":
            supabase_admin.table("teams").update({"manager_id": user_id}).eq("id", invite["team_id"]).execute()
            
        # Invalidate the spent single-use transaction token
        supabase_admin.table("invitations").update({
            "status": "accepted", 
            "accepted_at": datetime.utcnow().isoformat()
        }).eq("id", invite["id"]).execute()
        
        # Fetch operational path slugs for clean front-end redirection processing
        comp = supabase_admin.table("companies").select("slug").eq("id", invite["company_id"]).execute()
        team_slug = "none"
        if invite["team_id"]:
            tm = supabase_admin.table("teams").select("slug").eq("id", invite["team_id"]).execute()
            team_slug = tm.data[0]["slug"]
            
        company_slug = comp.data[0]["slug"] if comp.data else "unknown"
        if invite["role"] == "hr_admin":
            redirect_path = f"/{company_slug}/hr_admin"
        else:
            redirect_path = f"/{company_slug}/{team_slug}/{invite['role']}"
            
        return {
            "status": "success", "role": invite["role"],
            "redirect_path": redirect_path
        }
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Atomic execution rollback: {str(err)}")

@enterprise_router.get("/assessment/report/{target_user_id}")
async def get_user_report(target_user_id: str, current_user_jwt: str = Depends(verify_jwt)):
    # Initialize standard client USING THE PUBLIC ANON KEY and apply the user's JWT to postgrest
    # This forces Supabase to evaluate the RLS rules we defined while keeping Kong happy.
    anon_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    user_supabase = create_client(supabase_url, anon_key)
    user_supabase.postgrest.auth(current_user_jwt)
    
    response = user_supabase.table("saved_reports")\
        .select("report_markdown", "scoring_metrics", "manager_signals")\
        .eq("user_id", target_user_id)\
        .execute()
        
    if not response.data:
        raise HTTPException(
            status_code=403, 
            detail="Access Denied: You do not have permissions to review this user's report."
        )
        
    return response.data[0]

app.include_router(enterprise_router)

# ====================================================================
# PHASE 2: WBIL & EMPLOYEE REPORT GENERATION ENDPOINTS
# ====================================================================
from wbil_models import IncompleteDataException
from wbil_report_service import generate_employee_report

class ReportGenerateRequest(BaseModel):
    assessment_id: str
    force_regenerate: Optional[bool] = False

@app.exception_handler(IncompleteDataException)
async def incomplete_data_exception_handler(request, exc: IncompleteDataException):
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "message": f"Assessment data is incomplete. Cannot generate report without calculated metrics. ({str(exc)})"
        }
    )

@app.post("/api/v1/reports/generate")
async def generate_report_endpoint(payload: ReportGenerateRequest):
    try:
        result = generate_employee_report(
            assessment_id=payload.assessment_id,
            force_regenerate=payload.force_regenerate or False
        )
        return result
    except IncompleteDataException as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Validation Error",
                "message": f"Assessment data is incomplete. Cannot generate report without calculated metrics. ({str(exc)})"
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )

# ====================================================================
# PHASE 3: WBIL 30-DAY ACTION PLAN GENERATION ENDPOINTS
# ====================================================================
from wbil_action_plan_service import generate_action_plan

class ActionPlanGenerateRequest(BaseModel):
    report_id: str
    manager_priority: Optional[str] = None
    workplace_context: Optional[str] = None

@app.post("/api/v1/action-plans/generate")
async def generate_action_plan_endpoint(payload: ActionPlanGenerateRequest):
    try:
        result = generate_action_plan(
            report_id=payload.report_id,
            manager_priority=payload.manager_priority,
            workplace_context=payload.workplace_context
        )
        return result
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )

@app.get("/api/v1/action-plans/user/{user_id}")
async def get_user_action_plan_endpoint(user_id: str):
    try:
        res = supabase.table("action_plans").select("*").eq("employee_id", user_id).order("created_at", desc=True).limit(1).execute()
        if res.data and len(res.data) > 0:
            plan = res.data[0]
            return {
                "status": "SUCCESS",
                "action_plan_id": plan["id"],
                "report_id": plan.get("report_id"),
                "data": plan.get("action_plan_json")
            }
        return {"status": "NOT_FOUND", "message": "No active action plan found for this user."}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )

@app.get("/api/v1/action-plans/report/{report_id}")
async def get_report_action_plan_endpoint(report_id: str):
    try:
        res = supabase.table("action_plans").select("*").eq("report_id", report_id).order("created_at", desc=True).limit(1).execute()
        if res.data and len(res.data) > 0:
            plan = res.data[0]
            return {
                "status": "SUCCESS",
                "action_plan_id": plan["id"],
                "report_id": plan.get("report_id"),
                "data": plan.get("action_plan_json")
            }
        return {"status": "NOT_FOUND", "message": "No active action plan found for this report."}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )



