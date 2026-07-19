import os
from dotenv import load_dotenv
from supabase import create_client

workspace_env = r"c:\Users\kjsan\OneDrive\Documents\TIE Project\TIE\.env.local"
load_dotenv(workspace_env)

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")

print("supabase_url:", supabase_url)
print("supabase_key length:", len(supabase_key) if supabase_key else "None")

# Test standard user supabase client setup
try:
    client = create_client(supabase_url, supabase_key)
    print("Standard client created successfully!")
    # Test setting auth token
    client.postgrest.auth("fake_token")
    print("postgrest.auth('fake_token') set successfully!")
except Exception as e:
    print("Error:", e)
