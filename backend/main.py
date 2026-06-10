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

# Load environment variables from .env.local
load_dotenv(".env.local")

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

        # STEP 3: INVOKE GEMINI API FOR GENERATION  
        system_instruction = """
        You are an AI processing engine for the Talent Intelligence Engine (TIE).  
        Your task is to generate the Employee Report based strictly on the provided scores.  
        
        CRITICAL COMPLIANCE RULES:
        - Use simple English. Speak directly to the employee.  
        - Avoid ALL HR, competency, or psychological terminology.  
        - Do not label or rank the employee.  
        - NEVER use words like: weak, poor, low performer, resistant, dependent, disengaged.  
        - Use phrases like: "You tend to...", "You often perform best when...", "You may benefit from...".  
        - Tone: positive, practical, supportive, and easy to understand.  
        """

        user_prompt = f"""
        Generate an 8-part narrative report for an employee with these psychometric results:  
        - Primary Work Style: {primary} ({primary_strength}% strength)  
        - Secondary Work Style: {secondary} ({secondary_strength}% strength)  
        - Overall Combination Profile Match: {profile_combination}  
        
        The output MUST follow this exact 8-part markdown structural format:  
        
        # 1. Your Work Style Snapshot  
        # 2. What Helps You Do Your Best Work  
        # 3. How You Usually Handle Change (S1 Dominant style was {s1_dom})  
        # 4. How You Approach Responsibility (S2 Dominant style was {s2_dom})  
        # 5. How You Prefer To Work With Others (S3 Dominant style was {s3_dom})  
        # 6. Situations That May Frustrate You  
        # 7. Three Suggestions For Growth  
        # 8. Reflection Questions  
        """

        # Corrected method instantiation typo: changed models to client SDK syntax config
        response = ai_client.models.generate_content(
            model='gemini-1.5-flash',
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