import os
import sys
import uuid
from typing import Dict, Any

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from supabase import create_client, Client

from wbil_models import ActionPlanJSON
from wbil_helpers import matchWBILBehaviour, getWBILBehaviourById
from wbil_report_service import generate_employee_report
from wbil_action_plan_service import generate_action_plan

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

def run_phase3_verification_suite():
    print("=====================================================")
    print("Starting WBIL Phase 3 Verification & Acceptance Suite")
    print("=====================================================")

    # ---------------------------------------------------------------
    # SETUP: Create test profile, seed responses, and generate report
    # ---------------------------------------------------------------
    print("\n1. Setting up test profile, answers, and employee report...")
    test_user_email = f"test_phase3_{uuid.uuid4().hex[:6]}@example.com"
    test_user_id = str(uuid.uuid4())

    supabase.table("profiles").insert({
        "id": test_user_id,
        "email": test_user_email,
        "first_name": "TestPhase3",
        "last_name": "ManagerLead",
        "designation": "Engineering Lead",
        "experience_years": 7
    }).execute()

    responses = [
        {"user_id": test_user_id, "question_id": q_id, "selected_option_index": (q_id % 4)}
        for q_id in range(1, 25)
    ]
    supabase.table("user_responses").insert(responses).execute()

    # Generate employee report for test user
    report_res = generate_employee_report(test_user_id, force_regenerate=True)
    report_id = report_res["report_id"]
    print(f"   Generated Employee Report ID: {report_id}")

    try:
        # ---------------------------------------------------------------
        # TEST 1: Behavior Selection & Matching Engine Test
        # ---------------------------------------------------------------
        print("\n2. Testing matchWBILBehaviour() single behavior selection...")
        matched_b_id = matchWBILBehaviour(
            development_priorities_or_report_id=report_id,
            manager_priority="Employee needs to improve proactive blocker communication and milestone accountability",
            workplace_context="Leading a critical Q3 product launch with tight deadlines"
        )
        assert matched_b_id is not None, "FAILED: matchWBILBehaviour returned None"
        print(f"   Matched single WBIL behavior ID: '{matched_b_id}'")

        # Retrieve single behavior record to ensure no library dump
        wbil_module = getWBILBehaviourById(matched_b_id)
        assert wbil_module.get("behaviour_id") == matched_b_id, "FAILED: Retrieved module ID mismatch"
        print(f"   SUCCESS: Single WBIL record '{wbil_module['behaviour_name']}' retrieved cleanly.")

        # ---------------------------------------------------------------
        # TEST 2: Action Plan Generation & Gemini API Execution
        # ---------------------------------------------------------------
        print("\n3. Testing 30-Day Action Plan Generation with Gemini API...")
        action_plan_res = generate_action_plan(
            report_id=report_id,
            manager_priority="Proactive milestone delivery & stakeholder communication",
            workplace_context="Sprint execution for enterprise multi-tenant release"
        )
        assert action_plan_res is not None, "FAILED: Returned None"
        assert action_plan_res.get("status") == "SUCCESS", f"FAILED: Status was {action_plan_res.get('status')}"
        action_plan_id = action_plan_res.get("action_plan_id")
        plan_data = action_plan_res.get("data", {})
        print(f"   SUCCESS: Generated Action Plan ID: {action_plan_id}")

        # ---------------------------------------------------------------
        # TEST 3: Schema Validation against Pydantic ActionPlanJSON
        # ---------------------------------------------------------------
        print("\n4. Testing Action Plan Schema Validation against ActionPlanJSON...")
        validated_plan = ActionPlanJSON(**plan_data)
        assert validated_plan is not None, "FAILED: Pydantic validation failed"

        # Check weekly breakdown keys
        weekly = plan_data.get("weekly_breakdown", {})
        for w in ["week_1", "week_2", "week_3", "week_4"]:
            assert w in weekly and isinstance(weekly[w], list) and len(weekly[w]) > 0, f"FAILED: Missing or empty {w}"

        # Check commitments & reviews
        assert "employee_commitments" in plan_data and len(plan_data["employee_commitments"]) > 0, "Missing employee commitments"
        assert "manager_commitments" in plan_data and len(plan_data["manager_commitments"]) > 0, "Missing manager commitments"
        assert "day_15_review" in plan_data and len(plan_data["day_15_review"]) > 0, "Missing day_15_review"
        assert "day_30_review" in plan_data and len(plan_data["day_30_review"]) > 0, "Missing day_30_review"

        print("   SUCCESS: All schema requirements (weeks 1-4, commitments, reviews) validated.")

        # ---------------------------------------------------------------
        # TEST 4: Database Persistence Test
        # ---------------------------------------------------------------
        print("\n5. Testing Database Persistence in 'action_plans' table...")
        db_query = supabase.table("action_plans").select("*").eq("report_id", report_id).execute()
        assert db_query.data and len(db_query.data) > 0, "FAILED: Record not found in action_plans table"
        
        saved_plan = db_query.data[0]
        assert saved_plan.get("status") == "ACTIVE", f"FAILED: Status mismatch: {saved_plan.get('status')}"
        assert saved_plan.get("selected_behaviour_id") == matched_b_id, f"FAILED: Behaviour ID mismatch: {saved_plan.get('selected_behaviour_id')}"
        print(f"   SUCCESS: Verified record saved in 'action_plans' table with status='ACTIVE'.")

    finally:
        # Cleanup test records
        print("\n6. Cleaning up test records...")
        try:
            supabase.table("action_plans").delete().eq("report_id", report_id).execute()
            supabase.table("employee_reports").delete().eq("assessment_id", test_user_id).execute()
            supabase.table("user_responses").delete().eq("user_id", test_user_id).execute()
            supabase.table("profiles").delete().eq("id", test_user_id).execute()
            print("   Cleaned up test data successfully.")
        except Exception as err:
            print(f"   Notice during cleanup: {err}")

    print("\n=====================================================")
    print("ALL PHASE 3 ACCEPTANCE CHECKS PASSED SUCCESSFULLY!")
    print("=====================================================")

if __name__ == "__main__":
    run_phase3_verification_suite()
