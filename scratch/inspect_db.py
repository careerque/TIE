import os
from dotenv import load_dotenv
from supabase import create_client

workspace_env = r"c:\Users\kjsan\OneDrive\Documents\TIE Project\TIE\.env.local"
load_dotenv(workspace_env)

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(supabase_url, supabase_key)

# Let's run a query to get tables
try:
    res = supabase.rpc("get_tables").execute()
    print("Tables list via RPC:", res.data)
except Exception as e:
    print("RPC failed, trying raw query on information_schema:")
    try:
        # Let's run select * from information_schema.tables
        res = supabase.table("profiles").select("id").limit(1).execute()
        print("Profiles table exists")
        
        # Test other tables
        for t in ["companies", "teams", "invitations", "assessment_questions", "user_responses", "saved_reports", "assessment_feedback", "reflections", "self_reflections"]:
            try:
                supabase.table(t).select("*").limit(1).execute()
                print(f"Table '{t}' EXISTS.")
            except Exception as ex:
                print(f"Table '{t}' DOES NOT exist or error: {str(ex)}")
    except Exception as ex2:
        print("Query failed:", ex2)
