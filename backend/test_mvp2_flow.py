import os
import uuid
import secrets
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not loaded from .env.local")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)
backend_url = "http://127.0.0.1:8000"

print("=====================================================")
print("Starting TIE MVP 2.0 Enterprise Flow Verification Test")
print("=====================================================")

# Keep track of created IDs for cleanup
company_id = None
team_id = None
hr_invite_token = None
manager_invite_token = None
created_users = []

try:
    # 1. Test HR Admin Invitation & Company Provisioning
    print("\n1. Testing HR Admin Invitation and Company Creation...")
    company_name = f"Test Tenant {uuid.uuid4().hex[:6]}"
    hr_email = f"hr_{uuid.uuid4().hex[:6]}@testcompany.com"
    
    res = requests.post(f"{backend_url}/api/enterprise/invite-hr-admin", json={
        "email": hr_email,
        "company_name": company_name,
        "description": "Enterprise multi-tenant test company"
    })
    assert res.status_code == 200, f"HR Admin invitation failed: {res.text}"
    hr_invite_data = res.json()
    assert hr_invite_data["status"] == "success", "Failed status returned"
    
    # Parse token from link
    invite_url = hr_invite_data["invite_url"]
    hr_invite_token = invite_url.split("token=")[1]
    print(f"   SUCCESS: Generated Token: {hr_invite_token}")
    print(f"            Invite URL: {invite_url}")

    # 2. Test Verification of Invitation Token
    print("\n2. Testing Invitation Verification...")
    res = requests.get(f"{backend_url}/api/enterprise/verify-invite?token={hr_invite_token}")
    assert res.status_code == 200, f"Verification failed: {res.text}"
    verify_data = res.json()
    assert verify_data["email"] == hr_email, "Email mismatch on token verification"
    company_id = verify_data["company_id"]
    print(f"   SUCCESS: Verified Email: {verify_data['email']}, Company: '{verify_data['company_name']}' (ID: {company_id})")

    # 3. Test Account Activation & Auth Provisioning
    print("\n3. Testing Onboarding Activation & Profile Setup...")
    hr_password = secrets.token_urlsafe(12)
    res = requests.post(f"{backend_url}/api/enterprise/accept-and-activate", json={
        "token": hr_invite_token,
        "password": hr_password,
        "first_name": "VerifiedHR",
        "last_name": "Owner",
        "designation": "HR Director",
        "experience_years": 8
    })
    assert res.status_code == 200, f"Accept and activate failed: {res.text}"
    activate_data = res.json()
    hr_uid = supabase.table("profiles").select("id").eq("email", hr_email).single().execute().data["id"]
    created_users.append(hr_uid)
    print(f"   SUCCESS: Auth User Created. UID: {hr_uid}, Redirection Route: {activate_data['redirect_path']}")

    # Verify profile columns
    profile_query = supabase.table("profiles").select("*").eq("id", hr_uid).execute()
    assert len(profile_query.data) > 0, "Profile record not written on acceptance"
    hr_profile = profile_query.data[0]
    assert hr_profile["role"] == "hr_admin", f"Role mismatch: {hr_profile['role']}"
    assert hr_profile["designation"] == "HR Director", f"Designation mismatch: {hr_profile['designation']}"
    print("   SUCCESS: Profiles row columns verified.")

    # 4. Test Manager Invitation & Team Resolution/Provisioning
    print("\n4. Testing Team Resolution and Manager Invitation...")
    mgr_email = f"manager_{uuid.uuid4().hex[:6]}@testcompany.com"
    team_name = "Engineering Beta"
    res = requests.post(f"{backend_url}/api/enterprise/invite-team-member", json={
        "email": mgr_email,
        "first_name": "TestManager",
        "last_name": "Lead",
        "role": "manager",
        "team_name": team_name,
        "hr_user_id": hr_uid
      })
    assert res.status_code == 200, f"Manager invitation failed: {res.text}"
    mgr_invite_data = res.json()
    manager_invite_token = mgr_invite_data["invite_url"].split("token=")[1]
    
    # Query database to retrieve team_id
    invite_row = supabase.table("invitations").select("team_id").eq("token", manager_invite_token).single().execute()
    team_id = invite_row.data["team_id"]
    print(f"   SUCCESS: Resolved Team: '{team_name}', ID: {team_id}")
    print(f"            Manager Invite Token: {manager_invite_token}")

    # 5. Test Manager Account Activation
    print("\n5. Testing Manager Account Activation...")
    mgr_password = secrets.token_urlsafe(12)
    res = requests.post(f"{backend_url}/api/enterprise/accept-and-activate", json={
        "token": manager_invite_token,
        "password": mgr_password,
        "first_name": "ActiveManager",
        "last_name": "Lead",
        "designation": "Engineering Manager",
        "experience_years": 12
    })
    assert res.status_code == 200, f"Manager acceptance failed: {res.text}"
    mgr_uid = supabase.table("profiles").select("id").eq("email", mgr_email).single().execute().data["id"]
    created_users.append(mgr_uid)
    print(f"   SUCCESS: Manager Auth User Created. UID: {mgr_uid}")

    # Verify that the manager is now assigned as team manager
    team_check = supabase.table("teams").select("manager_id").eq("id", team_id).execute()
    assert team_check.data[0]["manager_id"] == mgr_uid, "Team manager_id not linked to manager UID"
    print("   SUCCESS: Team manager link successfully established in database")

    # 6. Test RLS/Company Segregation Security Policy
    print("\n6. Testing RLS / JWT Segregation Security Check...")
    # Use invalid JWT token - should return 401 Unauthorized
    res = requests.get(
        f"{backend_url}/api/enterprise/assessment/report/{mgr_uid}",
        headers={"Authorization": "Bearer invalid_jwt_token_payload_abc123"}
    )
    assert res.status_code == 401, f"Security Breach: Allowed query with invalid token: {res.status_code}"
    print("   SUCCESS: Security blocked query with invalid token (401 Unauthorized).")

    print("\n=====================================================")
    print("ALL TESTS PASSED SUCCESSFULLY! MVP 2.0 FLOW IS SOLID")
    print("=====================================================")

except AssertionError as ae:
    print(f"\n[ERROR] TEST FAILED: {ae}")
except Exception as e:
    print(f"\n[ERROR] UNEXPECTED ERROR: {e}")

finally:
    # Cleanup Database to prevent junk data
    print("\nCleaning up test data from Database...")
    if company_id:
        try:
            supabase.table("companies").delete().eq("id", company_id).execute()
            print("   Deleted test company, cascading deleted all invitations and teams.")
        except Exception as e:
            print(f"   Failed to clean up company: {e}")
            
    for uid in created_users:
        try:
            # Delete profiles row
            supabase.table("profiles").delete().eq("id", uid).execute()
            
            # Delete auth user via Admin API
            supabase.auth.admin.delete_user(uid)
            print(f"   Deleted Auth user & profile context for UID: {uid}")
        except Exception as e:
            pass
    print("Cleanup complete.")
