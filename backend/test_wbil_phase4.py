import os
import sys
import uuid
from typing import Dict, Any

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from supabase import create_client, Client

from wbil_models import EmployeeReportJSON, ActionPlanJSON
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

def run_phase4_verification_suite():
    print("=====================================================")
    print("Starting WBIL Phase 4 Verification & Acceptance Suite")
    print("=====================================================")

    # ---------------------------------------------------------------
    # SETUP: Create test profile, seed responses, and generate report
    # ---------------------------------------------------------------
    print("\n1. Setting up test profile and answers for Phase 4 UI Integration...")
    test_user_email = f"test_phase4_{uuid.uuid4().hex[:6]}@example.com"
    test_user_id = str(uuid.uuid4())

    supabase.table("profiles").insert({
        "id": test_user_id,
        "email": test_user_email,
        "first_name": "TestPhase4",
        "last_name": "Director",
        "designation": "Director of Product",
        "experience_years": 10
    }).execute()

    responses = [
        {"user_id": test_user_id, "question_id": q_id, "selected_option_index": (q_id % 4)}
        for q_id in range(1, 25)
    ]
    supabase.table("user_responses").insert(responses).execute()

    # Generate employee report for test user
    report_res = generate_employee_report(test_user_id, force_regenerate=True)
    report_id = report_res["report_id"]
    report_data = report_res["data"]
    print(f"   Generated Employee Report ID: {report_id}")

    try:
        # ---------------------------------------------------------------
        # TEST 1: Report Rendering Structure Test
        # ---------------------------------------------------------------
        print("\n2. Testing Employee Report JSON Structure & 8 Core Sections...")
        validated_report = EmployeeReportJSON(**report_data)
        assert validated_report is not None, "FAILED: EmployeeReportJSON Pydantic validation failed"
        
        sections = [
            "executive_summary", "behaviour_profile", "workplace_value",
            "performance_enablers", "performance_risks", "manager_guide",
            "development_priorities", "metadata"
        ]
        for s in sections:
            assert s in report_data and report_data[s], f"FAILED: Missing report section '{s}'"
        print("   SUCCESS: All 8 core sections present and verified.")

        # ---------------------------------------------------------------
        # TEST 2: Section 7 Priority Count Test (Exactly 3)
        # ---------------------------------------------------------------
        print("\n3. Testing Section 7 Development Priority Count (Exactly 3)...")
        priorities = report_data.get("development_priorities", [])
        assert len(priorities) == 3, f"FAILED: Expected 3 priorities, got {len(priorities)}"
        for idx, prio in enumerate(priorities, start=1):
            assert prio.get("behaviour_id"), f"Missing behaviour_id in priority #{idx}"
            assert prio.get("title"), f"Missing title in priority #{idx}"
        print("   SUCCESS: Section 7 contains exactly 3 distinct priority cards.")

        # ---------------------------------------------------------------
        # TEST 3: Action Plan Generation & UI State Transition Payload
        # ---------------------------------------------------------------
        print("\n4. Testing Action Plan Builder Modal Integration Flow...")
        action_plan_res = generate_action_plan(
            report_id=report_id,
            manager_priority="Enhance strategic milestone ownership",
            workplace_context="Leading enterprise multi-tenant Q3 delivery sprint"
        )
        assert action_plan_res.get("status") == "SUCCESS", "FAILED: Action plan generation failed"
        plan_data = action_plan_res.get("data", {})
        
        validated_plan = ActionPlanJSON(**plan_data)
        assert validated_plan is not None, "FAILED: ActionPlanJSON Pydantic validation failed"
        print("   SUCCESS: Action Plan generated and validated cleanly.")

        # ---------------------------------------------------------------
        # TEST 4: 4-Week Journey & Commitments Payload Test
        # ---------------------------------------------------------------
        print("\n5. Testing 4-Week Journey Timeline & Commitments Payload...")
        weekly = plan_data.get("weekly_breakdown", {})
        for w in ["week_1", "week_2", "week_3", "week_4"]:
            assert w in weekly and len(weekly[w]) > 0, f"Missing or empty {w} in action plan"
        
        assert len(plan_data.get("employee_commitments", [])) > 0, "Missing employee commitments"
        assert len(plan_data.get("manager_commitments", [])) > 0, "Missing manager commitments"
        print("   SUCCESS: 4-Week timeline, employee commitments, and manager commitments verified.")

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
    print("ALL PHASE 4 ACCEPTANCE CHECKS PASSED SUCCESSFULLY!")
    print("=====================================================")

if __name__ == "__main__":
    run_phase4_verification_suite()
