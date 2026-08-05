export interface MasteryLevel {
  level: number;
  title: string;
  description: string;
}

export interface BehaviourInAction {
  scenario_title: string;
  strong_behaviour_points: string[];
  needs_development_points: string[];
}

export interface LifecycleApplicability {
  talent_process: string;
  contribution: string;
}

export interface WhyItMatters {
  employee: string;
  manager: string;
  team: string;
  organisation: string;
}

export interface RoleVariations {
  individual_contributor: string;
  team_leader: string;
  manager: string;
  senior_leader: string;
}

export interface BusinessImpact {
  employee_impact: string;
  manager_impact: string;
  team_impact: string;
  organisation_impact: string;
}

export interface DevelopmentJourney {
  stage_1_awareness: string;
  stage_2_guided_practice: string;
  stage_3_workplace_application: string;
  stage_4_reinforcement: string;
}

export interface ReflectionQuestions {
  employee_reflection: string[];
  manager_reflection: string[];
}

export interface AIRecommendationLogic {
  priority_triggers: string[];
  exclusion_criteria: string[];
}

export interface WBILBehaviour {
  id?: string;
  behaviour_id: string; // e.g. "WB-001"
  behaviour_name: string;
  category: string;
  version: string;
  definition: string;
  purpose: string;
  why_it_matters: WhyItMatters;
  observable_behaviours: string[];
  indicators_of_strength: string[];
  development_indicators: string[];
  behaviour_in_action: BehaviourInAction[];
  role_variations: RoleVariations;
  business_impact: BusinessImpact;
  development_objective: string;
  development_journey: DevelopmentJourney;
  employee_activities: string[];
  manager_coaching_guide: string[];
  progress_indicators: string[];
  evidence_of_improvement: string[];
  reflection_questions: ReflectionQuestions;
  common_coaching_mistakes: string[];
  mastery_levels: MasteryLevel[];
  ai_recommendation_logic: AIRecommendationLogic;
  lifecycle_applicability: LifecycleApplicability[];
  behaviour_summary?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DevelopmentPriority {
  priority_number: number;
  behaviour_id: string;
  title: string;
  description: string;
  rationale: string;
}

export interface EmployeeReportJSON {
  executive_summary: {
    overview: string;
    key_strengths_summary: string;
    growth_areas_summary: string;
  };
  behaviour_profile: {
    primary_pattern: string;
    secondary_pattern: string;
    pattern_description: string;
    core_values: string[];
  };
  workplace_value: {
    team_impact: string;
    organizational_alignment: string;
  };
  performance_enablers: {
    enablers: string[];
  };
  performance_risks: {
    risks: string[];
  };
  manager_guide: {
    coaching_tips: string[];
    communication_strategies: string[];
  };
  development_priorities: DevelopmentPriority[];
  metadata: {
    prompt_version: string;
    engine_version: string;
    generated_at: string;
  };
}

export interface EmployeeReport {
  id?: string;
  assessment_id: string;
  employee_id: string;
  report_version: string;
  report_json: EmployeeReportJSON;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at?: string;
}

export interface WeeklyBreakdown {
  week_1: string[];
  week_2: string[];
  week_3: string[];
  week_4: string[];
}

export interface ActionPlanJSON {
  selected_behaviour: {
    id: string;
    name: string;
  };
  reason_for_selection: string;
  outcome_30_day: string;
  employee_commitments: string[];
  manager_commitments: string[];
  weekly_breakdown: WeeklyBreakdown;
  success_measures: string[];
  day_15_review: string[];
  day_30_review: string[];
}

export interface ActionPlan {
  id?: string;
  report_id: string;
  employee_id: string;
  selected_behaviour_id: string;
  manager_priority?: string;
  workplace_context?: string;
  action_plan_json: ActionPlanJSON;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  created_at?: string;
}
