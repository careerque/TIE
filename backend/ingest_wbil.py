import os
import sys
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from wbil_data_seed import generate_full_wbil_catalog
from wbil_models import WBILLibraryModel

# Load environment variables from .env.local
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
    os.getenv("SUPABASE_ANON_KEY") or 
    os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

if not supabase_url or not supabase_key:
    print("ERROR: Supabase URL or Service Role Key missing in environment.")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def validate_and_ingest_wbil():
    """Validates all 32 WBIL entries and upserts them into the wbil_library database table."""
    print("=====================================================")
    print("Starting WBIL Ingestion Pipeline (WB-001 to WB-032)")
    print("=====================================================")

    raw_catalog = generate_full_wbil_catalog()
    assert len(raw_catalog) == 32, f"Catalog length mismatch: Expected 32, got {len(raw_catalog)}"

    validated_records = []
    for idx, entry in enumerate(raw_catalog, start=1):
        # 1. Validation for Non-Null requirements
        b_id = entry.get("behaviour_id")
        b_name = entry.get("behaviour_name")
        rec_logic = entry.get("ai_recommendation_logic")
        dev_obj = entry.get("development_objective")

        if not b_id or not b_name or not rec_logic or not dev_obj:
            raise ValueError(
                f"Validation Error at entry #{idx} ({b_id}): missing required non-null fields "
                f"(behaviour_id, behaviour_name, ai_recommendation_logic, or development_objective)."
            )
        
        # 2. Strict Schema Validation with Pydantic
        model = WBILLibraryModel(**entry)
        validated_records.append(model.model_dump(exclude_none=True))

    print(f"SUCCESS: Validation Passed: All {len(validated_records)} behavior records meet non-null and schema constraints.")

    # 3. Ingest / Upsert into Supabase wbil_library table
    print("\nIngesting records into Supabase 'wbil_library' table...")
    
    success_count = 0
    for record in validated_records:
        try:
            res = supabase.table("wbil_library").upsert(
                record,
                on_conflict="behaviour_id"
            ).execute()
            
            if res.data:
                success_count += 1
        except Exception as e:
            print(f"ERROR: Failed to upsert behavior {record.get('behaviour_id')}: {e}")
            raise e

    print(f"\nIngestion Complete! Successfully populated {success_count}/32 WBIL behavior records into 'wbil_library'.")
    return success_count

if __name__ == "__main__":
    validate_and_ingest_wbil()
