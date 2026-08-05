import os
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from wbil_models import IncompleteDataException, WBILLibraryModel

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
    os.getenv("SUPABASE_ANON_KEY") or 
    os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

supabase: Client = create_client(supabase_url, supabase_key)

def buildRuntimeDataObject(assessment_id: str) -> Dict[str, Any]:
    """
    Fetches employee profile data and calculated assessment outputs.
    Validates completeness of payload. Raises IncompleteDataException if any parameter is missing.
    """
    if not assessment_id:
        raise IncompleteDataException("Assessment ID (user_id) cannot be empty.")

    # 1. Fetch Profile and Hierarchy Data
    try:
        profile_res = supabase.table("profiles").select("*").eq("id", assessment_id).execute()
    except Exception as e:
        raise IncompleteDataException(f"Failed to query profiles table for ID '{assessment_id}': {e}")

    if not profile_res.data or len(profile_res.data) == 0:
        raise IncompleteDataException(f"Employee profile record not found for assessment ID: {assessment_id}")

    profile = profile_res.data[0]
    
    first_name = profile.get("first_name", "") or ""
    last_name = profile.get("last_name", "") or ""
    name = f"{first_name} {last_name}".strip() or profile.get("email", "Unknown Employee")
    designation = profile.get("designation")
    experience = profile.get("experience_years")

    company_name = "Organization"
    if profile.get("company_id"):
        try:
            comp_res = supabase.table("companies").select("name").eq("id", profile["company_id"]).execute()
            if comp_res.data and len(comp_res.data) > 0:
                company_name = comp_res.data[0].get("name", "Organization")
        except Exception:
            pass

    department = "Department"
    if profile.get("team_id"):
        try:
            team_res = supabase.table("teams").select("name").eq("id", profile["team_id"]).execute()
            if team_res.data and len(team_res.data) > 0:
                department = team_res.data[0].get("name", "Department")
        except Exception:
            pass

    # 2. Fetch Assessment Scoring Outputs
    # First check saved_reports cache
    report_res = supabase.table("saved_reports").select("*").eq("user_id", assessment_id).execute()
    
    scoring_metrics = None
    manager_signals = None

    if report_res.data and len(report_res.data) > 0:
        saved = report_res.data[0]
        scoring_metrics = saved.get("scoring_metrics")
        manager_signals = saved.get("manager_signals")

    # If not in saved_reports, calculate from user_responses
    if not scoring_metrics:
        resp_res = supabase.table("user_responses").select("question_id, selected_option_index").eq("user_id", assessment_id).execute()
        answers = resp_res.data

        if not answers or len(answers) != 24:
            raise IncompleteDataException(
                f"Incomplete assessment payload: Found {len(answers) if answers else 0}/24 answered questions."
            )

        # Standard pattern matrix calculation without altering existing scoring logic
        raw_scores = {"SCP": 0, "FIE": 0, "CCD": 0, "SPO": 0}
        sections = {
            "S1": {"SCP": 0, "FIE": 0, "CCD": 0, "SPO": 0}, 
            "S2": {"SCP": 0, "FIE": 0, "CCD": 0, "SPO": 0}, 
            "S3": {"SCP": 0, "FIE": 0, "CCD": 0, "SPO": 0}, 
            "S4": {"SCP": 0, "FIE": 0, "CCD": 0, "SPO": 0}, 
        }
        index_to_pattern = {0: "SCP", 1: "FIE", 2: "CCD", 3: "SPO"}

        for row in answers:
            q = row["question_id"]
            idx = row["selected_option_index"]
            pattern = index_to_pattern[idx]
            raw_scores[pattern] += 1
            if 1 <= q <= 6:       sections["S1"][pattern] += 1
            elif 7 <= q <= 12:    sections["S2"][pattern] += 1
            elif 13 <= q <= 18:   sections["S3"][pattern] += 1
            elif 19 <= q <= 24:   sections["S4"][pattern] += 1

        s34_scores = {p: sections["S3"][p] + sections["S4"][p] for p in raw_scores}
        pattern_sorted = sorted(raw_scores.keys(), key=lambda p: raw_scores[p], reverse=True)
        max_score = raw_scores[pattern_sorted[0]]
        tied_primary = [p for p, score in raw_scores.items() if score == max_score]
        primary = max(tied_primary, key=lambda p: s34_scores[p]) if len(tied_primary) > 1 else tied_primary[0]

        rem = [p for p in raw_scores.keys() if p != primary]
        rem_sorted = sorted(rem, key=lambda p: raw_scores[p], reverse=True)
        second_score = raw_scores[rem_sorted[0]]
        tied_sec = [p for p in rem if raw_scores[p] == second_score]
        secondary = max(tied_sec, key=lambda p: s34_scores[p]) if len(tied_sec) > 1 else tied_sec[0]

        comb_profiles = {
            ("SCP", "CCD"): "Structured Collaborator",
            ("SCP", "SPO"): "Steady Executor",
            ("SCP", "FIE"): "Independent Problem Solver",
            ("CCD", "FIE"): "Adaptive Team Contributor",
            ("CCD", "SPO"): "Supportive Team Stabilizer",
            ("FIE", "SPO"): "Practical Adapter",
            ("FIE", "SCP"): "Independent Problem Solver",
            ("SPO", "SCP"): "Steady Executor",
            ("SPO", "CCD"): "Supportive Team Stabilizer",
            ("CCD", "SCP"): "Structured Collaborator",
        }
        pattern_combination = comb_profiles.get((primary, secondary), f"{primary} / {secondary} Professional")

        scoring_metrics = {
            "section_scores": sections,
            "scp": raw_scores["SCP"],
            "ccd": raw_scores["CCD"],
            "fie": raw_scores["FIE"],
            "spo": raw_scores["SPO"],
            "pattern_combination": pattern_combination,
            "primary_pattern": primary,
            "secondary_pattern": secondary
        }

    # Strict Validation of required fields
    required_keys = ["scp", "ccd", "fie", "spo", "pattern_combination", "section_scores"]
    for key in required_keys:
        if key not in scoring_metrics or scoring_metrics[key] is None:
            raise IncompleteDataException(f"Missing required metric parameter: '{key}'")

    runtime_data = {
        "assessment_id": assessment_id,
        "employee_id": profile["id"],
        "employee_profile": {
            "name": name,
            "designation": designation or "Professional",
            "department": department,
            "experience": experience if experience is not None else 0,
            "organisation": company_name
        },
        "assessment_outputs": {
            "section_scores": scoring_metrics["section_scores"],
            "scp": scoring_metrics["scp"],
            "ccd": scoring_metrics["ccd"],
            "fie": scoring_metrics["fie"],
            "spo": scoring_metrics["spo"],
            "pattern_combination": scoring_metrics["pattern_combination"],
            "behavioural_indicators": manager_signals or {
                "primary_pattern": scoring_metrics.get("primary_pattern", "SCP"),
                "secondary_pattern": scoring_metrics.get("secondary_pattern", "CCD")
            }
        }
    }

    return runtime_data

def getWBILBehaviourById(behaviour_id: str) -> Dict[str, Any]:
    """
    Retrieves the single structured WBIL record by ID (e.g. 'WB-001').
    Ensures only the specifically requested record is returned.
    """
    if not behaviour_id:
        raise ValueError("behaviour_id parameter is required.")

    res = supabase.table("wbil_library").select("*").eq("behaviour_id", behaviour_id.strip()).execute()
    if not res.data or len(res.data) == 0:
        raise KeyError(f"WBIL behavior record with ID '{behaviour_id}' not found.")

    record = res.data[0]
    return record

def matchWBILBehaviour(
    development_priorities_or_report_id: Any, 
    manager_priority: Optional[str] = None, 
    workplace_context: Optional[str] = None
) -> str:
    """
    Scans the ai_recommendation_logic triggers of stored WBIL entries against 
    the report's development_priorities and manager context.
    Selects EXACTLY ONE primary behaviour_id (e.g., 'WB-001').
    """
    dev_priorities: List[Dict[str, Any]] = []

    # If first parameter is a report_id (UUID string)
    if isinstance(development_priorities_or_report_id, str):
        report_id = development_priorities_or_report_id.strip()
        try:
            # Query employee_reports by id or assessment_id
            res = supabase.table("employee_reports").select("report_json").or_(f"id.eq.{report_id},assessment_id.eq.{report_id}").execute()
            if res.data and len(res.data) > 0:
                report_json = res.data[0].get("report_json", {})
                dev_priorities = report_json.get("development_priorities", [])
        except Exception as e:
            print(f"Notice: report_id lookup in matchWBILBehaviour: {e}")
    elif isinstance(development_priorities_or_report_id, list):
        dev_priorities = development_priorities_or_report_id

    # 1. Direct match if first priority contains explicit valid behaviour_id
    if dev_priorities and len(dev_priorities) > 0:
        for priority in dev_priorities:
            if isinstance(priority, dict) and priority.get("behaviour_id"):
                target_id = priority["behaviour_id"].strip()
                try:
                    getWBILBehaviourById(target_id)
                    return target_id
                except KeyError:
                    pass

    # 2. Fetch all entries from DB to scan recommendation logic triggers against text context
    res = supabase.table("wbil_library").select("behaviour_id, behaviour_name, ai_recommendation_logic").execute()
    all_behaviours = res.data or []

    search_text = f"{manager_priority or ''} {workplace_context or ''}".lower()
    for priority in dev_priorities:
        if isinstance(priority, dict):
            search_text += f" {priority.get('title', '')} {priority.get('description', '')} {priority.get('rationale', '')}".lower()

    best_match_id = "WB-001"  # Default baseline fallback
    highest_score = -1

    for item in all_behaviours:
        b_id = item["behaviour_id"]
        b_name = item["behaviour_name"].lower()
        rec_logic = item.get("ai_recommendation_logic", {})
        triggers = [t.lower() for t in rec_logic.get("priority_triggers", [])]

        score = 0
        if b_name in search_text:
            score += 10
        
        for trigger in triggers:
            clean_trig = trigger.replace("_", " ").replace("gap", "").strip()
            if clean_trig and clean_trig in search_text:
                score += 5

        if score > highest_score:
            highest_score = score
            best_match_id = b_id

    return best_match_id

