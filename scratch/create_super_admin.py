import os
import argparse
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

def main():
    # Load environment variables from .env.local in the project root
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
    load_dotenv(env_path)

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not loaded from .env.local")
        sys.exit(1)

    # Initialize Supabase client with admin bypass (Service Role Key)
    supabase: Client = create_client(supabase_url, supabase_key)

    # Parse arguments
    parser = argparse.ArgumentParser(description="Create a new Super Admin in the TIE database.")
    parser.add_argument("--email", help="Email of the new Super Admin")
    parser.add_argument("--password", help="Temporary password for the new Super Admin")
    parser.add_argument("--first-name", default="Super", help="First name (default: Super)")
    parser.add_argument("--last-name", default="Admin", help="Last name (default: Admin)")
    
    args = parser.parse_args()

    email = args.email
    password = args.password
    first_name = args.first_name
    last_name = args.last_name

    # Interactive prompt if arguments are missing
    if not email:
        email = input("Enter email for the new Super Admin: ").strip()
    if not password:
        password = input("Enter temporary password (min 6 characters): ").strip()

    if not email or not password:
        print("ERROR: Email and password are required.")
        sys.exit(1)

    if len(password) < 6:
        print("ERROR: Password must be at least 6 characters.")
        sys.exit(1)

    print(f"\nCreating Auth user in Supabase for '{email}'...")
    try:
        # Create user via Auth Admin API
        auth_user = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })
        
        user_id = auth_user.user.id
        print(f"SUCCESS: Auth user created with UID: {user_id}")

        print("Creating profile record in public.profiles table...")
        profile_res = supabase.table("profiles").insert({
            "id": user_id,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "role": "super_admin",
            "designation": "Super Administrator"
        }).execute()
        
        print("SUCCESS: Profile record inserted!")
        print("\n==================================================")
        print("SUPER ADMIN CREATED SUCCESSFULLY!")
        print("==================================================")
        print(f"Email: {email}")
        print(f"Temp Password: {password}")
        print("\nHow to reset the password:")
        print("1. Direct the new Super Admin to log in using the temporary password.")
        print("2. Once logged in, they will have full access to the Super Admin dashboard.")
        print("3. Alternatively, they can navigate to `/forgot-password` on the website to trigger a password reset link to their email, allowing them to choose a new password directly.")
        print("==================================================")

    except Exception as e:
        print(f"\nERROR: Failed to create super admin: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
