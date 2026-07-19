import os
from dotenv import load_dotenv
from supabase import create_client

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(supabase_url, supabase_key)

try:
    res = supabase.table("saved_reports").select("report_markdown").eq("user_id", "478b03a3-d4c3-416e-ae2f-0283c4c8da78").execute()
    if res.data:
        print("FULL REPORT FOR STRUCTURED COLLABORATOR:")
        print(res.data[0]["report_markdown"])
    else:
        print("No report found for user 478b03a3-d4c3-416e-ae2f-0283c4c8da78")
except Exception as e:
    print("Error querying report:", e)
