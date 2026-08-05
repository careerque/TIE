import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class IncompleteDataException(Exception):
    """Exception raised when an assessment payload or profile lacks required fields."""
    pass

# ====================================================================
# WBIL Library Pydantic Models
# ====================================================================

class MasteryLevel(BaseModel):
    level: int = Field(..., ge=1, le=5)
    title: str
    description: str

class BehaviourInAction(BaseModel):
    scenario_title: str
    strong_behaviour_points: List[str]
    needs_development_points: List[str]

class LifecycleApplicability(BaseModel):
    talent_process: str
    contribution: str

class WhyItMatters(BaseModel):
    employee: str
    manager: str
    team: str
    organisation: str

class RoleVariations(BaseModel):
    individual_contributor: str
    team_leader: str
    manager: str
    senior_leader: str

class BusinessImpact(BaseModel):
    employee_impact: str
    manager_impact: str
    team_impact: str
    organisation_impact: str

class DevelopmentJourney(BaseModel):
    stage_1_awareness: str
    stage_2_guided_practice: str
    stage_3_workplace_application: str
    stage_4_reinforcement: str

class ReflectionQuestions(BaseModel):
    employee_reflection: List[str]
    manager_reflection: List[str]

class AIRecommendationLogic(BaseModel):
    priority_triggers: List[str]
    exclusion_criteria: List[str]

class WBILLibraryModel(BaseModel):
    id: Optional[str] = None
    behaviour_id: str  # e.g., "WB-001"
    behaviour_name: str  # e.g., "Accountability"
    category: str
    version: str = "1.0"
    definition: str
    purpose: str
    why_it_matters: WhyItMatters
    observable_behaviours: List[str]
    indicators_of_strength: List[str]
    development_indicators: List[str]
    behaviour_in_action: List[BehaviourInAction]
    role_variations: RoleVariations
    business_impact: BusinessImpact
    development_objective: str
    development_journey: DevelopmentJourney
    employee_activities: List[str]
    manager_coaching_guide: List[str]
    progress_indicators: List[str]
    evidence_of_improvement: List[str]
    reflection_questions: ReflectionQuestions
    common_coaching_mistakes: List[str]
    mastery_levels: List[MasteryLevel]
    ai_recommendation_logic: AIRecommendationLogic
    lifecycle_applicability: List[LifecycleApplicability]
    behaviour_summary: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# ====================================================================
# Employee Reports Pydantic Models
# ====================================================================

class ExecutiveSummary(BaseModel):
    overview: str
    key_strengths_summary: str
    growth_areas_summary: str

class BehaviourProfile(BaseModel):
    primary_pattern: str
    secondary_pattern: str
    pattern_description: str
    core_values: List[str]

class WorkplaceValue(BaseModel):
    team_impact: str
    organizational_alignment: str

class PerformanceEnablers(BaseModel):
    enablers: List[str]

class PerformanceRisks(BaseModel):
    risks: List[str]

class ManagerGuide(BaseModel):
    coaching_tips: List[str]
    communication_strategies: List[str]

class DevelopmentPriority(BaseModel):
    priority_number: int = Field(..., ge=1, le=3)
    behaviour_id: str
    title: str
    description: str
    rationale: str

class ReportMetadata(BaseModel):
    prompt_version: str = "v1.0"
    engine_version: str = "v1.0"
    generated_at: str

class EmployeeReportJSON(BaseModel):
    executive_summary: Dict[str, Any]
    behaviour_profile: Dict[str, Any]
    workplace_value: Dict[str, Any]
    performance_enablers: Dict[str, Any]
    performance_risks: Dict[str, Any]
    manager_guide: Dict[str, Any]
    development_priorities: List[Dict[str, Any]] = Field(..., min_length=3, max_length=3)
    metadata: Dict[str, Any]

class EmployeeReportModel(BaseModel):
    id: Optional[str] = None
    assessment_id: str
    employee_id: str
    report_version: str = "v1.0"
    report_json: EmployeeReportJSON
    status: str = "PENDING"
    created_at: Optional[datetime] = None

# ====================================================================
# Action Plans Pydantic Models
# ====================================================================

class WeeklyBreakdown(BaseModel):
    week_1: List[str]
    week_2: List[str]
    week_3: List[str]
    week_4: List[str]

class ActionPlanSelectedBehaviour(BaseModel):
    id: str
    name: str

class ActionPlanJSON(BaseModel):
    selected_behaviour: ActionPlanSelectedBehaviour
    reason_for_selection: str
    outcome_30_day: str
    employee_commitments: List[str]
    manager_commitments: List[str]
    weekly_breakdown: WeeklyBreakdown
    success_measures: List[str]
    day_15_review: List[str]
    day_30_review: List[str]

class ActionPlanModel(BaseModel):
    id: Optional[str] = None
    report_id: str
    employee_id: str
    selected_behaviour_id: str
    manager_priority: Optional[str] = None
    workplace_context: Optional[str] = None
    action_plan_json: ActionPlanJSON
    status: str = "DRAFT"
    created_at: Optional[datetime] = None
