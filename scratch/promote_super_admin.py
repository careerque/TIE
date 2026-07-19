import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Resolve env file path relative to this script
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
# Use Service Role Key to bypass RLS and perform admin updates
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

def promote_user(email: str):
    email = email.strip().lower()
    if not email:
        print("Error: Email address cannot be empty.")
        return

    print(f"Searching for profile with email: {email}...")
    try:
        # Check if user exists
        res = supabase.table("profiles").select("id, first_name, last_name, role").eq("email", email).execute()
        if not res.data:
            print(f"No profile found for email '{email}'.")
            print("Make sure you have registered this user through the website first.")
            return

        user_profile = res.data[0]
        user_id = user_profile["id"]
        current_role = user_profile.get("role", "user")
        name = f"{user_profile.get('first_name', '')} {user_profile.get('last_name', '')}".strip() or "Unnamed User"

        print(f"Found user: {name} (ID: {user_id})")
        print(f"Current role: {current_role}")

        if current_role == "super_admin":
            print(f"User {email} is already a super_admin.")
            return

        # Perform the update
        print(f"Updating role to 'super_admin'...")
        update_res = supabase.table("profiles").update({"role": "super_admin"}).eq("id", user_id).execute()

        if update_res.data:
            print(f"SUCCESS: {email} has been promoted to 'super_admin'!")
        else:
            print("Failed to update profile role.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        email_arg = sys.argv[1]
        promote_user(email_arg)
    else:
        print("TIE Super Admin Promotion Tool")
        print("===============================")
        email_input = input("Enter the email address of the registered user to promote: ")
        promote_user(email_input)
