from supabase import create_client
import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(supabase_url, supabase_key)

print("Listing all users from auth:")
try:
    users_res = supabase.auth.admin.list_users()
    print("Type of users_res:", type(users_res))
    # In some versions it's a list, in others it's an object with a users list
    users = users_res if isinstance(users_res, list) else getattr(users_res, "users", users_res)
    for u in users:
        # Check if u is a dict or object
        if hasattr(u, "email"):
            print(f"ID: {u.id} | Email: {u.email} | Email Confirmed: {u.email_confirmed_at} | Confirmed: {u.confirmed_at}")
        else:
            print(f"User dict: {u}")
except Exception as e:
    import traceback
    traceback.print_exc()

