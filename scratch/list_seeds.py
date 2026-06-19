import os
from dotenv import load_dotenv
from supabase import create_client

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(supabase_url, supabase_key)

try:
    res = supabase.table("profiles").select("id, email, assessment_seed").execute()
    for row in res.data:
        print(f"User: {row.get('email')} | ID: {row.get('id')} | Seed: {row.get('assessment_seed')}")
except Exception as e:
    print("Error querying profiles:", e)
