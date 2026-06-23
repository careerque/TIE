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
        You are an AI processing engine for the Talent Intelligence Engine (TIE).  
        Your task is to generate a highly personalized, practical Employee Report using the provided scoring metrics and the matching Profile Content Library reference data as your source of truth.
        
        CRITICAL COMPLIANCE RULES:
        - Use simple, clear English. Speak directly to the employee using "you" and "your".
        - Focus on workplace behavior, communication, collaboration, adaptability, support preferences, and growth recommendations.
        - Tone: positive, practical, supportive, constructive, and easy to understand.
        - Absolute Prohibition on Psychological/Personality Labels:
          - Avoid ALL HR jargon, psychological terminology, or diagnostic labels (e.g., personality types).
          - Do NOT label or rank the employee. TIE is a workplace preference insight tool, NOT a personality assessment, psychological test, intelligence test, or leadership diagnostic.
          - NEVER use negative or judgmental words like: weak, weakness, poor performer, resistant, defensive, lazy, dependent, disengaged.
          - Use growth-oriented and supportive phrasing: "You tend to...", "You often perform best when...", "You may benefit from...", "You prefer...", "A helpful growth area is...".
        """

        user_prompt = f"""
        Generate a detailed 14-part narrative report for an employee.
        
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

        OUTPUT FORMAT:
        The output MUST follow this exact 14-part markdown structural format. Use exactly the numbered headings below. Provide 2-3 sentences or bullet points of highly tailored, practical content for each section:

        # 1. Dominant Workplace Pattern
        Provide a positive, clear summary of their work style based on their combination profile {profile_combination} ({library_data["tagline"]}) and core value. Do not use personality labels.
        
        # 2. What TIE Observed
        Describe their primary workplace behavior and preferences using the library description as reference.
        
        # 3. Workplace Value
        Explain the core value and specific strengths they bring to a team environment.
        
        # 4. Workplace Implications
        Detail how their combination profile affects their daily work style, pacing, and approach.
        
        # 5. Thrive Conditions
        Describe the ideal work and collaboration settings where they feel most aligned and productive (incorporating S3/S4 dominant styles if relevant).
        
        # 6. Challenge Conditions
        Outline work scenarios that can test their adaptability or pacing (S1 adaptability dominant style: {s1_dom}).
        
        # 7. Watch-outs
        Mention common operational situations that might cause friction for them (referencing the library frustrations). Frame these constructively.
        
        # 8. How Others May Experience You
        Provide advice on how peers might perceive their communication and collaboration style, and how to maintain alignment.
        
        # 9. What Your Manager Should Know
        Summarize their primary support preferences and how they approach accountability (S2 responsibility dominant style: {s2_dom}).
        
        # 10. Manager Support Suggestions
        Give actionable, practical recommendations for how their manager can support them, keep them aligned, and respect their work style.
        
        # 11. Growth Suggestions
        Suggest 2-3 specific, actionable growth guidelines to help them stretch and develop their versatility.
        
        # 12. Why TIE Reached This Conclusion
        Explain in simple terms how the 24-question work preference questionnaire highlights these patterns based on scoring primary ({primary}) and secondary ({secondary}) focus.
        
        # 13. What TIE Measures
        State clearly that TIE measures subjective workplace environment preferences, communication styles, collaboration styles, and task pacing.
        
        # 14. What TIE Does Not Measure
        Explicitly state that TIE does NOT measure personality, intelligence, psychological health, clinical traits, technical capability, or leadership performance.
        """

        # Corrected method instantiation typo: changed models to client SDK syntax config
        response = ai_client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
            )
        )
        ai_narrative = response.text

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