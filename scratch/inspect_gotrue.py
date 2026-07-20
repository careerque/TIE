import inspect
from supabase import create_client
import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

try:
    from supabase_auth import AdminUserAttributes
    import typing
    print("AdminUserAttributes type hints:")
    print(typing.get_type_hints(AdminUserAttributes))
except Exception as e:
    print("Error getting AdminUserAttributes hints:", e)


