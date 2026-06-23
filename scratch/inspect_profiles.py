import os
from dotenv import load_dotenv
from supabase import create_client

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("Supabase credentials not found in env.")
    exit(1)

supabase = create_client(supabase_url, supabase_key)

try:
    res = supabase.table("profiles").select("*").execute()
    print("Profiles count:", len(res.data))
    for profile in res.data:
        print(f"Profile: {profile.get('first_name')} {profile.get('last_name')} ({profile.get('email')})")
        for k, v in profile.items():
            print(f"  {k}: {v}")
except Exception as e:
    print("Error querying profiles:", e)
