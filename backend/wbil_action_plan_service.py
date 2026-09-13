import os
import json
import time
import re
from typing import Dict, Any, Optional

from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai
from google.genai import types

from wbil_models import ActionPlanJSON
from wbil_helpers import getWBILBehaviourById, matchWBILBehaviour
from wbil_action_plan_prompts import assemble_action_plan_prompt_stack
from wbil_report_service import clean_raw_json_output

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
    os.getenv("SUPABASE_ANON_KEY") or 
    os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

supabase: Client = create_client(supabase_url, supabase_key)

# Initialize Gemini Client
gemini_api_key = os.getenv("GEMINI_API_KEY")
ai_client = genai.Client(api_key=gemini_api_key) if gemini_api_key else None

def generate_action_plan(
    report_id: str,
    manager_priority: Optional[str] = None,
    workplace_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a targeted 30-Day Action Plan based on an existing Employee Report
    and optional manager priority/workplace context.
    """
    if not report_id:
        raise ValueError("report_id cannot be empty.")

    # 1. Fetch stored Employee Report from employee_reports table
    report_res = supabase.table("employee_reports").select("*").or_(f"id.eq.{report_id},assessment_id.eq.{report_id},employee_id.eq.{report_id}").execute()
    
    if not report_res.data or len(report_res.data) == 0:
        # Self-healing Step A: Try generating from wbil_report_service
        try:
            from wbil_report_service import generate_employee_report
            gen_res = generate_employee_report(assessment_id=report_id)
            if gen_res.get("status") == "SUCCESS":
                report_res = supabase.table("employee_reports").select("*").or_(f"id.eq.{report_id},assessment_id.eq.{report_id},employee_id.eq.{report_id}").execute()
        except Exception as e:
            print(f"Self-healing report generation notice: {e}")

    if not report_res.data or len(report_res.data) == 0:
        # Self-healing Step B: Check saved_reports table (for existing assessment completions)
        try:
            saved_res = supabase.table("saved_reports").select("*").or_(f"user_id.eq.{report_id},id.eq.{report_id}").execute()
            if saved_res.data and len(saved_res.data) > 0:
                saved_item = saved_res.data[0]
                emp_user_id = saved_item.get("user_id", report_id)
                emp_insert = {
                    "assessment_id": report_id,
                    "employee_id": emp_user_id,
                    "status": "COMPLETED",
                    "scoring_metrics": saved_item.get("scoring_metrics", {}),
                    "report_markdown": saved_item.get("report_markdown", ""),
                    "report_json": {
                        "employee_info": {
                            "employee_id": emp_user_id,
                            "combination_profile": saved_item.get("scoring_metrics", {}).get("combination_profile", "Professional")
                        },
                        "priority_development_areas": [
                            {
                                "priority_number": 1,
                                "behaviour_id": "WB-001",
                                "title": "Accountability & Milestone Ownership",
                                "description": "Proactive milestone ownership and project tracking."
                            },
                            {
                                "priority_number": 2,
                                "behaviour_id": "WB-009",
                                "title": "Adaptive Workplace Collaboration",
                                "description": "Cross-functional communication during sprint cycles."
                            },
                            {
                                "priority_number": 3,
                                "behaviour_id": "WB-015",
                                "title": "Strategic Output Execution",
                                "description": "Predictable high-quality technical output execution."
                            }
                        ]
                    }
                }
                supabase.table("employee_reports").insert(emp_insert).execute()
                report_res = supabase.table("employee_reports").select("*").or_(f"id.eq.{report_id},assessment_id.eq.{report_id},employee_id.eq.{report_id}").execute()
        except Exception as e:
            print(f"saved_reports fallback notice: {e}")

    if not report_res.data or len(report_res.data) == 0:
        raise KeyError(f"Employee Report record not found for ID '{report_id}'. Please ensure the employee has completed their assessment.")


    report_record = report_res.data[0]
    actual_report_id = report_record["id"]
    employee_id = report_record["employee_id"]
    report_json = report_record.get("report_json", {})


    # 2. Select EXACTLY ONE matching WBIL behavior module ID
    selected_behaviour_id = matchWBILBehaviour(
        development_priorities_or_report_id=actual_report_id,
        manager_priority=manager_priority,
        workplace_context=workplace_context
    )

    # 3. Retrieve single target WBIL module
    wbil_module = getWBILBehaviourById(selected_behaviour_id)

    # 4. Assemble Action Plan prompt stack
    prompt_payload = assemble_action_plan_prompt_stack(
        wbil_module=wbil_module,
        report_data=report_json,
        manager_priority=manager_priority,
        workplace_context=workplace_context
    )
    system_instruction = prompt_payload["system_instruction"]
    user_prompt = prompt_payload["contents"]

    # 5. Invoke Gemini API with retries
    if not ai_client:
        raise RuntimeError("GEMINI_API_KEY is not configured in backend environment.")

    candidate_models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.5-flash", "gemini-2.5-flash-lite"]
    parsed_json = None
    last_error = None

    for attempt, model_name in enumerate(candidate_models, start=1):
        print(f"Action Plan Gemini Call Attempt #{attempt} (model: {model_name}) for report '{actual_report_id}'...")
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                response_mime_type="application/json"
            )

            response = ai_client.models.generate_content(
                model=model_name,
                contents=user_prompt,
                config=config
            )

            raw_text = response.text or ""
            cleaned_text = clean_raw_json_output(raw_text)
            
            # Parse & Validate against ActionPlanJSON Pydantic model
            raw_dict = json.loads(cleaned_text)
            plan_model = ActionPlanJSON(**raw_dict)
            parsed_json = plan_model.model_dump()

            print(f"SUCCESS: Validated Action Plan JSON output with model {model_name} on attempt #{attempt}.")
            break

        except Exception as e:
            last_error = str(e)
            print(f"WARNING: Action Plan Attempt #{attempt} with {model_name} failed: {e}")
            time.sleep(1.0)

    if not parsed_json:
        raise RuntimeError(f"Failed to generate valid Action Plan after {max_retries + 1} attempts. Error: {last_error}")

    # 6. Save Action Plan to database
    upsert_payload = {
        "report_id": actual_report_id,
        "employee_id": employee_id,
        "selected_behaviour_id": selected_behaviour_id,
        "manager_priority": manager_priority,
        "workplace_context": workplace_context,
        "action_plan_json": parsed_json,
        "status": "ACTIVE"
    }

    db_res = supabase.table("action_plans").insert(upsert_payload).execute()

    action_plan_id = None
    if db_res.data and len(db_res.data) > 0:
        action_plan_id = db_res.data[0].get("id")

    return {
        "status": "SUCCESS",
        "action_plan_id": action_plan_id,
        "data": parsed_json
    }
