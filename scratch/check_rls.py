import os
from dotenv import load_dotenv
from supabase import create_client

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(supabase_url, supabase_key)

try:
    # Query pg_policies
    query = """
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'profiles';
    """
    res = supabase.rpc("run_sql", {"sql": query}).execute()
    print("Policies:", res.data)
except Exception as e:
    # If run_sql RPC doesn't exist, we can try querying using raw SQL or just list policies via another way
    print("Error querying policies directly:", e)
    # Let's try executing raw SQL via postgres if we can, or we can just test select/update with anon key
