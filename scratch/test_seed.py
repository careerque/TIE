import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

print("URL:", supabase_url)
print("Has key:", supabase_key is not None)

supabase = create_client(supabase_url, supabase_key)

try:
    res = supabase.table("profiles").select("*").limit(1).execute()
    print("Columns:", res.data[0].keys() if res.data else "No rows found")
    print("Sample row:", res.data[0] if res.data else "No rows found")
except Exception as e:
    print("Error querying profiles:", e)
