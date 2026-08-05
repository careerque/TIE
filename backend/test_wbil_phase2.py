import os
import sys
import uuid
import time
from typing import Dict, Any

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from supabase import create_client, Client

from wbil_models import IncompleteDataException, EmployeeReportJSON
from wbil_helpers import buildRuntimeDataObject
from wbil_report_service import generate_employee_report

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

def run_phase2_verification_suite():
    print("=====================================================")
    print("Starting WBIL Phase 2 Verification & Acceptance Suite")
    print("=====================================================")

    # ---------------------------------------------------------------
    # TEST 1: Completeness Guardrail Test (Invalid / Incomplete Payload)
    # ---------------------------------------------------------------
    print("\n1. Testing Completeness Guardrail (IncompleteDataException)...")
    fake_user_id = str(uuid.uuid4())
    try:
        generate_employee_report(fake_user_id)
        assert False, "FAILED: Expected IncompleteDataException was not raised!"
    except IncompleteDataException as exc:
        print(f"   SUCCESS: Guardrail triggered cleanly: '{exc}'")

    # ---------------------------------------------------------------
    # SETUP FOR TEST 2-5: Ensure a test user with 24 complete responses exists
    # ---------------------------------------------------------------
    print("\n2. Setting up test profile with 24 completed assessment responses...")
    test_user_email = f"test_phase2_{uuid.uuid4().hex[:6]}@example.com"
    test_user_id = str(uuid.uuid4())

    # Create dummy profile
    supabase.table("profiles").insert({
        "id": test_user_id,
        "email": test_user_email,
        "first_name": "TestPhase2",
        "last_name": "User",
        "designation": "Staff Engineer",
        "experience_years": 5
    }).execute()
    print(f"   Created test profile with ID: {test_user_id}")

    # Seed 24 user_responses
    responses_to_insert = [
        {
            "user_id": test_user_id,
            "question_id": q_id,
            "selected_option_index": (q_id % 4) # Cycle through options 0, 1, 2, 3
        }
        for q_id in range(1, 25)
    ]
    supabase.table("user_responses").insert(responses_to_insert).execute()
    print("   Seeded 24 assessment answers in 'user_responses'.")

    try:
        # ---------------------------------------------------------------
        # TEST 2: Report Generation Execution
        # ---------------------------------------------------------------
        print("\n3. Testing Employee Report Generation with Gemini API...")
        result = generate_employee_report(test_user_id, force_regenerate=True)
        assert result is not None, "FAILED: Returned None result"
        assert result.get("status") == "SUCCESS", f"FAILED: Unexpected status {result.get('status')}"
        assert result.get("report_id") is not None, "FAILED: Missing report_id in response"
        
        report_data = result.get("data", {})
        print(f"   SUCCESS: Report generated successfully. Report ID: {result['report_id']}")

        # ---------------------------------------------------------------
        # TEST 3: Schema Validation Test (All 8 Core Sections Present)
        # ---------------------------------------------------------------
        print("\n4. Testing Schema Validation against Pydantic EmployeeReportJSON...")
        validated_model = EmployeeReportJSON(**report_data)
        assert validated_model is not None, "FAILED: Pydantic schema validation failed"

        required_keys = [
            "executive_summary",
            "behaviour_profile",
            "workplace_value",
            "performance_enablers",
            "performance_risks",
            "manager_guide",
            "development_priorities",
            "metadata"
        ]
        for key in required_keys:
            assert key in report_data and report_data[key], f"FAILED: Missing key '{key}' in report JSON"
        print("   SUCCESS: All 8 required report sections present and validated.")

        # ---------------------------------------------------------------
        # TEST 4: Development Priority Count Test (Exactly 3)
        # ---------------------------------------------------------------
        print("\n5. Testing Development Priority Count (exactly 3 objects)...")
        dev_priorities = report_data.get("development_priorities", [])
        print(f"   Count of development_priorities: {len(dev_priorities)}")
        assert len(dev_priorities) == 3, f"FAILED: Expected exactly 3 development priorities, got {len(dev_priorities)}"
        for idx, prio in enumerate(dev_priorities, start=1):
            assert "behaviour_id" in prio and prio["behaviour_id"], f"Missing behaviour_id in priority #{idx}"
            assert "title" in prio and prio["title"], f"Missing title in priority #{idx}"
        print("   SUCCESS: Section 7 contains exactly 3 valid priority objects.")

        # ---------------------------------------------------------------
        # TEST 5: Storage Verification Test (Status = 'COMPLETED')
        # ---------------------------------------------------------------
        print("\n6. Testing Database Persistence & Idempotency...")
        db_query = supabase.table("employee_reports").select("*").eq("assessment_id", test_user_id).execute()
        assert db_query.data and len(db_query.data) > 0, "FAILED: Record not found in 'employee_reports' table"
        
        db_record = db_query.data[0]
        assert db_record.get("status") == "COMPLETED", f"FAILED: Status mismatch: {db_record.get('status')}"
        print(f"   SUCCESS: Verified record in 'employee_reports' with status='COMPLETED'.")

        # Test Idempotency Cache Hit
        t0 = time.time()
        cached_result = generate_employee_report(test_user_id, force_regenerate=False)
        t_duration = time.time() - t0
        assert cached_result.get("status") == "SUCCESS", "FAILED: Cache hit failed"
        print(f"   SUCCESS: Idempotency cache hit returned stored report in {t_duration:.3f}s.")

    finally:
        # Cleanup test records
        print("\n7. Cleaning up test records...")
        try:
            supabase.table("employee_reports").delete().eq("assessment_id", test_user_id).execute()
            supabase.table("user_responses").delete().eq("user_id", test_user_id).execute()
            supabase.table("profiles").delete().eq("id", test_user_id).execute()
            print("   Cleaned up test user data successfully.")
        except Exception as err:
            print(f"   Notice during cleanup: {err}")

    print("\n=====================================================")
    print("ALL PHASE 2 ACCEPTANCE CHECKS PASSED SUCCESSFULLY!")
    print("=====================================================")

if __name__ == "__main__":
    run_phase2_verification_suite()
