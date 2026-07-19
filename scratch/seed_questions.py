import os
import sys
import ast
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

def seed_questions():
    ts_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "questions.ts")
    with open(ts_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract the array string between [ and ]
    start_idx = content.find("[")
    end_idx = content.rfind("]") + 1
    array_string = content[start_idx:end_idx]

    try:
        # ast.literal_eval can parse python list of dicts safely and robustly
        questions = ast.literal_eval(array_string)
    except Exception as e:
        print(f"Failed to parse questions array using ast.literal_eval: {e}")
        sys.exit(1)

    print(f"Parsed {len(questions)} questions from public/questions.ts")

    formatted_data = []
    for q in questions:
        formatted_data.append({
            "question_id": q["id"],
            "question_text": q["question"],
            "options": q["options"]
        })

    print("Uploading questions to 'assessment_questions' table in Supabase...")
    try:
        # Perform upsert using supabase client
        res = supabase.table("assessment_questions").upsert(formatted_data).execute()
        if res.data:
            print(f"SUCCESS: Successfully upserted {len(res.data)} questions into the database!")
        else:
            print("Failed to seed questions. No data returned from Supabase.")
    except Exception as e:
        print(f"Error executing upsert in Supabase: {e}")
        sys.exit(1)

if __name__ == "__main__":
    seed_questions()
