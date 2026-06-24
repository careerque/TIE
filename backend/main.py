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

# Load environment variables from .env.local in the project root
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

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
        system_instruction = """
        You are a highly seasoned, wise Senior HR Consultant and Executive Coach with over 30 years of organizational development and talent advisory experience.
        Your task is to write a deeply personalized, human-crafted feedback report for an employee based on their TIE work preference scores and the TIE Profile Content Library reference data.
        
        CRITICAL COMPLIANCE RULES:
        - Persona & Tone: Speak directly to the employee using "you" and "your". Adopt the voice of an encouraging, warm, highly insightful, and empathetic executive coach. Imagine you are sitting down for a 1-on-1 development conversation.
        - Human-Made Language: The text must feel authentic, professional, and hand-written by a human expert.
        - ABSOLUTE PROHIBITION ON ROBOTIC/AI FRAMING:
          - NEVER start a section or sentence with robotic phrases like: "TIE observed...", "TIE has noticed...", "TIE reached this conclusion...", "Based on our scoring...", "According to the database...", "TIE measures...".
          - Instead, use organic, human-advisory framing: "In your daily work, you show a natural inclination to...", "Your colleagues likely appreciate...", "When managing priorities, you lean towards...", "To thrive in your role, you benefit from...", "Your strength lies in...".
        - Flowing Prose: Write in natural, cohesive paragraphs (2-3 sentences per section). Do not use dry, copy-pasted lists or bullets unless explicitly requested.
        - High-Quality Synthesis: Synthesize the library guidelines into customized advice. Do not copy-paste library bullet points verbatim. Translate them into cohesive, thoughtful counseling paragraphs.
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
        
        INTERPRET THE PROFILE:
        Interpret the scoring metrics and reference data below to generate workplace insights.
        - Do not repeat the same insight across multiple sections.
        - Each section must have a unique purpose.
        - Write in natural, flowing human prose (2-3 sentences per section). Do not write raw lists or templates. Make it sound like it was hand-written by a professional advisor.
        - Do not include the serial number or section number inside the content text (e.g., do not write "1." or "Section 1" in the text).
        
        SCORING METRICS INPUT:
        - Primary Pattern: {primary} ({primary_strength}% strength)
        - Secondary Pattern: {secondary} ({secondary_strength}% strength)
        - Overall Combination Profile: {profile_combination}
        - Section Dominant Styles:
          - S1 (Adaptability): {s1_dom}
          - S2 (Responsibility): {s2_dom}
          - S3 (Collaboration): {s3_dom}
          - S4 (Engagement): {s4_dom}
          
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
        - Business Implications: {", ".join(library_data["business_implications"])}

        OUTPUT FORMAT:
        The output MUST follow this exact 18-part markdown structural format. Use exactly the numbered headings below. Provide 2-3 sentences of highly tailored, practical content for each section:

        # 1. Dominant Workplace Pattern
        Summarize your overall work pattern based on your combination profile {profile_combination} ({library_data["tagline"]}) and core value. Frame this as a warm, professional opening statement.
        
        # 2. What TIE Observed
        Explain your daily workplace behaviors, work style preferences, and how you approach tasks using the library description. Write this as a direct, human observation.
        - Purpose: Workplace behaviour.
        
        # 3. Workplace Value
        Detail the unique contribution you bring to your team, emphasizing the value of your TIE strengths.
        - Purpose: Contribution.
        
        # 4. Workplace Implications
        Detail how your combination profile affects your daily work style, pacing, and approach.
        - Purpose: Impact.
        
        # 5. Support Needs
        Identify the specific resources, environment conditions, or communication types required for you to perform your best.
        - Purpose: Conditions required.
        
        # 6. Potential Growth Blocks
        Explain potential barriers, mindsets, or habits that might slow down your growth or professional development.
        - Purpose: Barriers.
        
        # 7. Early Risk Indicators
        Describe warning signs (e.g., changes in participation, engagement, or attitude) that a manager should look out for.
        - Purpose: Warning signs.
        
        # 8. Business Implications
        Summarize the organizational impact of keeping these support needs met versus leaving them unmet.
        - Purpose: Organizational impact.
        
        # 9. Thrive Conditions
        Describe the ideal work and collaboration settings where you feel most aligned and productive (incorporating S3/S4 dominant styles if relevant).
        
        # 10. Challenge Conditions
        Outline work scenarios that can test your adaptability or pacing (S1 adaptability dominant style: {s1_dom}).
        
        # 11. Watch-outs
        Mention common operational situations that might cause friction for you (referencing the library frustrations). Frame these constructively.
        
        # 12. How Others May Experience You
        Provide advice on how peers might perceive your communication and collaboration style, and how to maintain alignment.
        
        # 13. What Your Manager Should Know
        Summarize your primary support preferences and how you approach accountability (S2 responsibility dominant style: {s2_dom}).
        
        # 14. Manager Support Suggestions
        Give actionable, practical recommendations for how your manager can support you, keep you aligned, and respect your work style.
        - Purpose: Actions.
        
        # 15. Growth Suggestions
        Suggest 2-3 specific, actionable growth guidelines to help you stretch and develop your versatility.
        
        # 16. Why TIE Reached This Conclusion
        Explain in simple terms how the 24-question work preference questionnaire highlights these patterns based on scoring primary ({primary}) and secondary ({secondary}) focus.
        
        # 17. What TIE Measures
        State clearly that TIE measures subjective workplace environment preferences, communication styles, collaboration styles, and task pacing.
        
        # 18. What TIE Does Not Measure
        Explicitly state that TIE does NOT measure personality, intelligence, psychological health, clinical traits, technical capability, or leadership performance.
        """

        # Try generation with fallback models and retries to handle transient 503 spikes
        models_to_try = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        last_exception = None
        ai_narrative = ""
        
        import time
        
        for model_name in models_to_try:
            success = False
            for attempt in range(3):
                try:
                    print(f"Generating content using {model_name} (Attempt {attempt + 1})...")
                    response = ai_client.models.generate_content(
                        model=model_name,
                        contents=user_prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            temperature=0.3,
                        )
                    )
                    ai_narrative = response.text
                    if ai_narrative:
                        success = True
                        break
                except Exception as e:
                    print(f"Error on {model_name} attempt {attempt + 1}: {e}")
                    last_exception = e
                    time.sleep(1 + attempt)  # Incremental backoff (1s, 2s)
            if success:
                break
        
        if not ai_narrative:
            raise HTTPException(
                status_code=503,
                detail=f"The report generation service is currently experiencing high demand. Please try again in a few moments. (Details: {str(last_exception)})"
            )

        return {
            "success": True,
            "scoring_metrics": {
                "raw_scores": raw_scores,
                "primary_pattern": primary,
                "secondary_pattern": secondary,
                "combination_profile": profile_combination,
                "primary_strength_pct": primary_strength,
                "secondary_strength_pct": secondary_strength,
                "flags": flags  
            },
            "manager_signals": {
                "s1_adaptability_dominant": s1_dom,
                "s2_execution_dominant": s2_dom,
                "s3_support_dominant": s3_dom,
                "s4_engagement_dominant": s4_dom
            },
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