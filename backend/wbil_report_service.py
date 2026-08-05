import os
import json
import time
import re
from datetime import datetime
from typing import Dict, Any, Optional

from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai
from google.genai import types

from wbil_models import IncompleteDataException, EmployeeReportJSON
from wbil_helpers import buildRuntimeDataObject
from wbil_prompts import assemble_prompt_stack

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

def clean_raw_json_output(raw_text: str) -> str:
    """Strips markdown codeblock wrappers (```json ... ```) to extract pure JSON."""
    if not raw_text:
        return ""
    text = raw_text.strip()
    # Pattern to strip leading ```json or ``` and trailing ```
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()

def generate_employee_report(assessment_id: str, force_regenerate: bool = False) -> Dict[str, Any]:
    """
    Generates or retrieves a TIE Employee Report for the specified assessment_id.
    
    Workflow:
    1. Call buildRuntimeDataObject(assessment_id) for validation.
    2. Check idempotency in employee_reports (if force_regenerate=False).
    3. Assemble 4-tier prompt stack and invoke Gemini API with low temperature.
    4. Parse, clean, and validate JSON response with retry logic.
    5. Save to database with status 'COMPLETED' and return result.
    """
    if not assessment_id:
        raise IncompleteDataException("assessment_id cannot be empty.")

    # STEP 1: Payload Retrieval & Completeness Validation
    # If incomplete, buildRuntimeDataObject raises IncompleteDataException
    runtime_data = buildRuntimeDataObject(assessment_id)
    employee_id = runtime_data.get("employee_id")

    # STEP 2: Idempotency Check
    if not force_regenerate:
        try:
            cached_res = supabase.table("employee_reports").select("*").eq("assessment_id", assessment_id).execute()
            if cached_res.data and len(cached_res.data) > 0:
                cached_report = cached_res.data[0]
                if cached_report.get("status") == "COMPLETED" and cached_report.get("report_json"):
                    print(f"IDEMPOTENCY HIT: Serving cached report for assessment_id '{assessment_id}'")
                    return {
                        "status": "SUCCESS",
                        "report_id": cached_report["id"],
                        "data": cached_report["report_json"]
                    }
        except Exception as e:
            print(f"Idempotency check lookup notice: {e}")

    # STEP 3: Gemini Payload Assembly & Call with Retries
    prompt_payload = assemble_prompt_stack(runtime_data)
    system_instruction = prompt_payload["system_instruction"]
    user_prompt = prompt_payload["contents"]

    model_name = "gemini-2.5-flash"  # Standard high-performance low-latency model
    max_retries = 2
    parsed_json = None
    last_error = None

    if not ai_client:
        raise RuntimeError("GEMINI_API_KEY is not configured in backend environment.")

    for attempt in range(1, max_retries + 2):
        print(f"Gemini API Call Attempt #{attempt} for assessment '{assessment_id}'...")
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
            
            # STEP 4: Parse & Validate against Pydantic Schema
            raw_dict = json.loads(cleaned_text)
            
            # Validate with Pydantic model
            report_model = EmployeeReportJSON(**raw_dict)
            parsed_json = report_model.model_dump()

            # Extra assertion for Section 7 development priorities count
            dev_prio = parsed_json.get("development_priorities", [])
            if len(dev_prio) != 3:
                raise ValueError(f"Schema violation: development_priorities array length must be exactly 3, got {len(dev_prio)}")

            # Ensure metadata timestamps are set
            if "metadata" not in parsed_json or not isinstance(parsed_json["metadata"], dict):
                parsed_json["metadata"] = {}
            parsed_json["metadata"]["generated_at"] = datetime.utcnow().isoformat() + "Z"
            parsed_json["metadata"]["prompt_version"] = "v1.0"
            parsed_json["metadata"]["engine_version"] = "v1.0"

            print(f"SUCCESS: Validated Gemini report output on attempt #{attempt}.")
            break

        except Exception as e:
            last_error = str(e)
            print(f"WARNING: Attempt #{attempt} failed JSON validation / API call: {e}")
            if attempt <= max_retries:
                time.sleep(1.5 * attempt) # Exponential backoff delay

    if not parsed_json:
        # Save FAILED record to DB for tracking
        try:
            supabase.table("employee_reports").upsert({
                "assessment_id": assessment_id,
                "employee_id": employee_id,
                "report_version": "v1.0",
                "report_json": {"error": last_error},
                "status": "FAILED"
            }, on_conflict="assessment_id").execute()
        except Exception:
            pass

        raise RuntimeError(f"Failed to generate valid Employee Report after {max_retries + 1} attempts. Error: {last_error}")

    # STEP 5: Database Persistence & Response
    upsert_payload = {
        "assessment_id": assessment_id,
        "employee_id": employee_id,
        "report_version": "v1.0",
        "report_json": parsed_json,
        "status": "COMPLETED"
    }

    db_res = supabase.table("employee_reports").upsert(
        upsert_payload,
        on_conflict="assessment_id"
    ).execute()

    report_id = None
    if db_res.data and len(db_res.data) > 0:
        report_id = db_res.data[0].get("id")

    return {
        "status": "SUCCESS",
        "report_id": report_id,
        "data": parsed_json
    }
