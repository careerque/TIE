import os
from dotenv import load_dotenv
from supabase import create_client

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(supabase_url, supabase_key)

# Let's try select from assessment_feedback
try:
    res = supabase.table("assessment_feedback").select("*").limit(1).execute()
    print("assessment_feedback rows found:", len(res.data))
    if res.data:
        print("assessment_feedback columns:", res.data[0].keys())
except Exception as e:
    print("Error querying assessment_feedback:", e)

# Let's try select from reflections
try:
    res = supabase.table("reflections").select("*").limit(1).execute()
    print("reflections rows found:", len(res.data))
    if res.data:
        print("reflections columns:", res.data[0].keys())
except Exception as e:
    print("Error querying reflections:", e)
