-- ====================================================================
-- WBIL & Employee Reports Phase 1 Database Schema Migration (Type Safe)
-- ====================================================================

-- 1. Create wbil_library Table
CREATE TABLE IF NOT EXISTS public.wbil_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    behaviour_id TEXT UNIQUE NOT NULL,
    behaviour_name TEXT NOT NULL,
    category TEXT NOT NULL,
    version TEXT DEFAULT '1.0' NOT NULL,
    definition TEXT NOT NULL,
    purpose TEXT NOT NULL,
    why_it_matters JSONB NOT NULL DEFAULT '{}'::jsonb,
    observable_behaviours JSONB NOT NULL DEFAULT '[]'::jsonb,
    indicators_of_strength JSONB NOT NULL DEFAULT '[]'::jsonb,
    development_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
    behaviour_in_action JSONB NOT NULL DEFAULT '[]'::jsonb,
    role_variations JSONB NOT NULL DEFAULT '{}'::jsonb,
    business_impact JSONB NOT NULL DEFAULT '{}'::jsonb,
    development_objective TEXT NOT NULL,
    development_journey JSONB NOT NULL DEFAULT '{}'::jsonb,
    employee_activities JSONB NOT NULL DEFAULT '[]'::jsonb,
    manager_coaching_guide JSONB NOT NULL DEFAULT '[]'::jsonb,
    progress_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_of_improvement JSONB NOT NULL DEFAULT '[]'::jsonb,
    reflection_questions JSONB NOT NULL DEFAULT '{}'::jsonb,
    common_coaching_mistakes JSONB NOT NULL DEFAULT '[]'::jsonb,
    mastery_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_recommendation_logic JSONB NOT NULL DEFAULT '{}'::jsonb,
    lifecycle_applicability JSONB NOT NULL DEFAULT '[]'::jsonb,
    behaviour_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wbil_library_behaviour_id ON public.wbil_library(behaviour_id);
CREATE INDEX IF NOT EXISTS idx_wbil_library_category ON public.wbil_library(category);

-- 2. Create employee_reports Table
CREATE TABLE IF NOT EXISTS public.employee_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID UNIQUE NOT NULL,
    employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    report_version TEXT DEFAULT 'v1.0' NOT NULL,
    report_json JSONB NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_reports_assessment_id ON public.employee_reports(assessment_id);
CREATE INDEX IF NOT EXISTS idx_employee_reports_employee_id ON public.employee_reports(employee_id);

-- 3. Create action_plans Table
CREATE TABLE IF NOT EXISTS public.action_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.employee_reports(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    selected_behaviour_id TEXT REFERENCES public.wbil_library(behaviour_id) ON DELETE RESTRICT NOT NULL,
    manager_priority TEXT,
    workplace_context TEXT,
    action_plan_json JSONB NOT NULL,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_action_plans_report_id ON public.action_plans(report_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_employee_id ON public.action_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_behaviour_id ON public.action_plans(selected_behaviour_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.wbil_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;

-- 5. Security Policies with Explicit ::text Casts on All Comparisons
DROP POLICY IF EXISTS select_wbil_library ON public.wbil_library;
CREATE POLICY select_wbil_library ON public.wbil_library 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS manage_wbil_library ON public.wbil_library;
CREATE POLICY manage_wbil_library ON public.wbil_library 
    FOR ALL TO authenticated 
    USING (public.get_auth_user_role()::text = 'super_admin');

DROP POLICY IF EXISTS select_employee_reports ON public.employee_reports;
CREATE POLICY select_employee_reports ON public.employee_reports 
    FOR SELECT TO authenticated 
    USING (
        employee_id::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id::text = employee_id::text 
            AND p.manager_id::text = auth.uid()::text
        )
        OR (
            public.get_auth_user_role()::text IN ('hr_admin', 'super_admin') 
            AND public.get_user_company_id(employee_id)::text = public.get_auth_user_company_id()::text
        )
    );

DROP POLICY IF EXISTS manage_employee_reports ON public.employee_reports;
CREATE POLICY manage_employee_reports ON public.employee_reports 
    FOR ALL TO authenticated 
    USING (public.get_auth_user_role()::text = 'super_admin');

DROP POLICY IF EXISTS select_action_plans ON public.action_plans;
CREATE POLICY select_action_plans ON public.action_plans 
    FOR SELECT TO authenticated 
    USING (
        employee_id::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id::text = employee_id::text 
            AND p.manager_id::text = auth.uid()::text
        )
        OR (
            public.get_auth_user_role()::text IN ('hr_admin', 'super_admin') 
            AND public.get_user_company_id(employee_id)::text = public.get_auth_user_company_id()::text
        )
    );

DROP POLICY IF EXISTS manage_action_plans ON public.action_plans;
CREATE POLICY manage_action_plans ON public.action_plans 
    FOR ALL TO authenticated 
    USING (
        employee_id::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id::text = employee_id::text 
            AND p.manager_id::text = auth.uid()::text
        )
        OR public.get_auth_user_role()::text = 'super_admin'
    );
