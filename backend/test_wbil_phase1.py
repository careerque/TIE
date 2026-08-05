import os
import sys
import uuid

# Set stdout encoding for Windows standard output safety
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from supabase import create_client, Client
from wbil_helpers import buildRuntimeDataObject, getWBILBehaviourById, matchWBILBehaviour
from wbil_models import IncompleteDataException

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

def run_phase1_verification_suite():
    print("=====================================================")
    print("Starting WBIL Phase 1 Verification & Acceptance Suite")
    print("=====================================================")

    # ---------------------------------------------------------------
    # CHECK 1: Verify wbil_library populated with all 32 records
    # ---------------------------------------------------------------
    print("\n1. Verifying 'wbil_library' population (WB-001 through WB-032)...")
    res = supabase.table("wbil_library").select("behaviour_id, behaviour_name, category, development_objective").execute()
    records = res.data or []
    print(f"   Fetched {len(records)} records from 'wbil_library'.")
    assert len(records) >= 32, f"FAILED: Expected at least 32 records, found {len(records)}"

    b_ids = [r["behaviour_id"] for r in records]
    for i in range(1, 33):
        expected_id = f"WB-{i:03d}"
        assert expected_id in b_ids, f"FAILED: Missing expected behavior ID '{expected_id}'"
    print("   SUCCESS: All 32 behaviors (WB-001 to WB-032) present in database.")

    # ---------------------------------------------------------------
    # CHECK 2: Query getWBILBehaviourById("WB-001")
    # ---------------------------------------------------------------
    print("\n2. Testing getWBILBehaviourById('WB-001')...")
    wb1 = getWBILBehaviourById("WB-001")
    assert wb1 is not None, "FAILED: Returned None for WB-001"
    assert wb1.get("behaviour_id") == "WB-001", f"FAILED: Unexpected ID {wb1.get('behaviour_id')}"
    
    # Verify exact required sections exist
    required_sections = [
        "observable_behaviours",
        "employee_activities",
        "manager_coaching_guide",
        "ai_recommendation_logic",
        "mastery_levels",
        "development_journey"
    ]
    for sec in required_sections:
        assert sec in wb1 and wb1[sec], f"FAILED: Missing or empty section '{sec}' in WB-001"
    
    print(f"   SUCCESS: Retreived WB-001 '{wb1['behaviour_name']}' with all required detailed sections.")

    # ---------------------------------------------------------------
    # CHECK 3: buildRuntimeDataObject() Validation Exception
    # ---------------------------------------------------------------
    print("\n3. Testing buildRuntimeDataObject() validation error handling...")
    
    # Test 3.1: Non-existent / Incomplete user ID
    fake_id = str(uuid.uuid4())
    try:
        buildRuntimeDataObject(fake_id)
        assert False, "FAILED: Should have raised IncompleteDataException for missing user profile"
    except IncompleteDataException as e:
        print(f"   SUCCESS: Caught expected IncompleteDataException for invalid ID: '{e}'")

    # Test 3.2: Valid user profile fetch with incomplete responses
    profiles_res = supabase.table("profiles").select("id").limit(1).execute()
    if profiles_res.data and len(profiles_res.data) > 0:
        valid_uid = profiles_res.data[0]["id"]
        try:
            runtime_obj = buildRuntimeDataObject(valid_uid)
            assert "employee_profile" in runtime_obj, "Missing employee_profile in output"
            assert "assessment_outputs" in runtime_obj, "Missing assessment_outputs in output"
            print(f"   SUCCESS: buildRuntimeDataObject('{valid_uid}') built valid payload successfully.")
        except IncompleteDataException as e:
            print(f"   SUCCESS: Handled incomplete payload gracefully: '{e}'")

    # ---------------------------------------------------------------
    # CHECK 4: Match WBIL Behaviour Trigger Logic
    # ---------------------------------------------------------------
    print("\n4. Testing matchWBILBehaviour() trigger matching...")
    match_id = matchWBILBehaviour(
        development_priorities=[{"behaviour_id": "WB-001", "title": "Accountability"}],
        manager_priority="Need employee to own missed deadlines",
        workplace_context="Project milestone delay"
    )
    assert match_id == "WB-001", f"FAILED: Expected WB-001, got {match_id}"
    print(f"   SUCCESS: Matched target behavior ID '{match_id}' successfully.")

    print("\n=====================================================")
    print("ALL PHASE 1 ACCEPTANCE CHECKS PASSED SUCCESSFULLY!")
    print("=====================================================")

if __name__ == "__main__":
    run_phase1_verification_suite()
