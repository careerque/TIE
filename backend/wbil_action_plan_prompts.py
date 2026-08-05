import json
from typing import Dict, Any, Optional

# ====================================================================
# LAYER 1: ACTION PLAN SYSTEM PROMPT
# ====================================================================
ACTION_PLAN_SYSTEM_PROMPT = """
You are a Senior Executive Coach and Performance Consultant specializing in workplace behavior transformation and 30-day performance acceleration.

STRICT COACHING & ACTIONABILITY RULES:
1. Tone: Practical, highly supportive, specific, and laser-focused on actionable workplace behaviors.
2. Actionability Standard:
   - NEVER use vague or generic advice (e.g., avoid "communicate better", "be more proactive", "work harder", "think positive").
   - ALWAYS provide concrete, observable workplace actions with clear cadences (e.g., "schedule a weekly 15-minute alignment check-in with cross-functional leads", "create a shared priority board updated every Monday by 10 AM").
3. 30-Day Transition Structure:
   - Divide the 30-day plan into 4 distinct, progressive weekly phases:
     * Week 1: Awareness & Baseline Setup (Initial alignment, tools setup, self-observation)
     * Week 2: Guided Practice & First Application (Executing initial targeted habits with manager feedback)
     * Week 3: Workplace Integration & Consistency (Applying behaviors in live projects and team interactions)
     * Week 4: Reinforcement & Review (Evaluating results, embedding habits, and setting long-term cadence)
"""

# ====================================================================
# LAYER 4: ACTION PLAN SCHEMA & FORMATTING PROMPT
# ====================================================================
ACTION_PLAN_SCHEMA_PROMPT = """
ACTION PLAN OUTPUT SPECIFICATION & STRICT JSON SCHEMA:

You MUST output ONLY a valid JSON object matching the exact schema below. Do not include markdown codeblocks (```json), commentary, or external text.

REQUIRED JSON SCHEMA:

{
  "selected_behaviour": {
    "id": "<WBIL ID, e.g., WB-001>",
    "name": "<WBIL Behaviour Name, e.g., Accountability>"
  },
  "reason_for_selection": "<Concise explanation of why this behavior was selected based on employee report and manager context>",
  "outcome_30_day": "<Specific, measurable 30-day performance outcome goal>",
  "employee_commitments": [
    "<Concrete action commitment 1 for the employee>",
    "<Concrete action commitment 2 for the employee>",
    "<Concrete action commitment 3 for the employee>"
  ],
  "manager_commitments": [
    "<Concrete support/coaching commitment 1 for the manager>",
    "<Concrete support/coaching commitment 2 for the manager>"
  ],
  "weekly_breakdown": {
    "week_1": [
      "<Week 1 Action Step 1>",
      "<Week 1 Action Step 2>"
    ],
    "week_2": [
      "<Week 2 Action Step 1>",
      "<Week 2 Action Step 2>"
    ],
    "week_3": [
      "<Week 3 Action Step 1>",
      "<Week 3 Action Step 2>"
    ],
    "week_4": [
      "<Week 4 Action Step 1>",
      "<Week 4 Action Step 2>"
    ]
  },
  "success_measures": [
    "<Observable success indicator 1>",
    "<Observable success indicator 2>",
    "<Observable success indicator 3>"
  ],
  "day_15_review": [
    "<Mid-point review question 1 for Manager & Employee sync>",
    "<Mid-point review question 2 for Manager & Employee sync>"
  ],
  "day_30_review": [
    "<Final 30-day review question 1 for Manager & Employee sync>",
    "<Final 30-day review question 2 for Manager & Employee sync>"
  ]
}

CRITICAL CONSTRAINTS:
1. `weekly_breakdown` MUST contain valid arrays for `week_1`, `week_2`, `week_3`, and `week_4`.
2. All strings must be clean, professional business English with specific workplace actions.
"""

def assemble_action_plan_prompt_stack(
    wbil_module: Dict[str, Any],
    report_data: Dict[str, Any],
    manager_priority: Optional[str] = None,
    workplace_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Assembles Layers 1 through 4 of the Action Plan prompt stack for Gemini API call.
    """
    wbil_json_str = json.dumps(wbil_module, indent=2)
    report_summary_str = json.dumps({
        "executive_summary": report_data.get("executive_summary", {}),
        "behaviour_profile": report_data.get("behaviour_profile", {}),
        "development_priorities": report_data.get("development_priorities", [])
    }, indent=2)

    user_content_prompt = f"""
LAYER 2: SELECTED WBIL BEHAVIOR MODULE CONTEXT:
{wbil_json_str}

LAYER 3: EMPLOYEE REPORT & MANAGER CONTEXT:
EMPLOYEE REPORT SUMMARY:
{report_summary_str}

MANAGER PRIORITY INPUT:
{manager_priority or 'Standard Performance Acceleration'}

WORKPLACE CONTEXT INPUT:
{workplace_context or 'Targeted workplace development assignment'}

{ACTION_PLAN_SCHEMA_PROMPT}

Generate the final 30-Day Action Plan structured JSON now.
"""

    return {
        "system_instruction": ACTION_PLAN_SYSTEM_PROMPT,
        "contents": user_content_prompt
    }
