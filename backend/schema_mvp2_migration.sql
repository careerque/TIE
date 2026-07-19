-- ====================================================================
-- TIE MVP 2.0 Database Schema Migration (Multi-Tenant & RLS)
-- ====================================================================

-- Clean up historical tables and types to avoid casting conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.get_reporting_hierarchy CASCADE;
DROP TABLE IF EXISTS public.assessment_feedback CASCADE;
DROP TABLE IF EXISTS public.user_responses CASCADE;
DROP TABLE IF EXISTS public.saved_reports CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TYPE IF EXISTS public.enterprise_role CASCADE;

-- 1. Create Core Role Enumeration
CREATE TYPE public.enterprise_role AS ENUM ('super_admin', 'hr_admin', 'manager', 'user');

-- 2. Create Companies Table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL path parameter (e.g., 'antigravity')
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create Teams Table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL, -- URL path parameter (e.g., 'engineering')
    manager_id UUID,    -- Populated down-stream on profile creation
    parent_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_company_team_slug UNIQUE (company_id, slug)
);

-- 4. Reconstruct Profiles Table with Full Spatial Hierarchy
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY, -- Maps directly to auth.users.id
    email TEXT UNIQUE NOT NULL,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    employee_id TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    role public.enterprise_role DEFAULT 'user'::public.enterprise_role NOT NULL,
    designation TEXT,
    experience_years INT DEFAULT 0,
    interests TEXT[] DEFAULT '{}'::TEXT[],
    assessment_seed INT DEFAULT floor(random() * 999999 + 1)::int,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Complete circular dependency reference safety constraints
ALTER TABLE public.teams ADD CONSTRAINT fk_teams_manager FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Create Invitations Table (Passwordless Invitation Store)
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role public.enterprise_role NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE, -- Nullable for HR admins
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    accepted_at TIMESTAMPTZ,
    CONSTRAINT unique_company_email_invite UNIQUE (company_id, email, status)
);

-- 6. Rebuild Assessment & Analytics Stores
CREATE TABLE public.assessment_questions (
    question_id INT PRIMARY KEY,
    question_text TEXT NOT NULL,
    options TEXT[] NOT NULL
);

CREATE TABLE public.user_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question_id INT REFERENCES public.assessment_questions(question_id) ON DELETE CASCADE NOT NULL,
    selected_option_index INT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_q_ans UNIQUE (user_id, question_id)
);

-- Rebuild public.saved_reports with hierarchical lookup support
CREATE TABLE public.saved_reports (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE, -- Nullable for high-level hires
    report_markdown TEXT NOT NULL,       -- Stored polished analysis wording
    scoring_metrics JSONB NOT NULL,       -- Exact raw percentage scores
    manager_signals JSONB NOT NULL,       -- Target psychometric feedback variables
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Performance & Traversal Index Optimization
CREATE INDEX idx_profiles_hierarchy ON public.profiles(company_id, team_id, manager_id);
CREATE INDEX idx_invitations_lookup ON public.invitations(token, status);
CREATE INDEX idx_responses_search ON public.user_responses(user_id);
CREATE INDEX idx_saved_reports_lookup ON public.saved_reports(company_id, team_id);

-- ====================================================================
-- Enable Row-Level Security (RLS) on all tables
-- ====================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- Helper Functions to Bypass RLS Recursion on Profiles
-- ====================================================================

-- Helper function to get current user's role without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS public.enterprise_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper function to get current user's company_id without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.get_auth_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper function to get current user's team_id without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.get_auth_user_team_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper function to get any user's company_id without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.get_user_company_id(target_uid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = target_uid;
$$;

-- Helper function to get any user's team_id without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.get_user_team_id(target_uid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.profiles WHERE id = target_uid;
$$;

-- ====================================================================
-- Row Level Security (RLS) Policies
-- ====================================================================

-- ── 1. Policies for public.companies ──
CREATE POLICY select_company ON public.companies 
    FOR SELECT TO authenticated 
    USING (
        id = public.get_auth_user_company_id()
        OR public.get_auth_user_role() = 'super_admin'::public.enterprise_role
    );

CREATE POLICY manage_companies ON public.companies 
    FOR ALL TO authenticated 
    USING (public.get_auth_user_role() = 'super_admin'::public.enterprise_role);

-- ── 2. Policies for public.teams ──
CREATE POLICY select_teams ON public.teams 
    FOR SELECT TO authenticated 
    USING (
        company_id = public.get_auth_user_company_id()
        OR public.get_auth_user_role() = 'super_admin'::public.enterprise_role
    );

CREATE POLICY manage_teams ON public.teams 
    FOR ALL TO authenticated 
    USING (
        (public.get_auth_user_role() = 'hr_admin'::public.enterprise_role AND company_id = public.get_auth_user_company_id())
        OR public.get_auth_user_role() = 'super_admin'::public.enterprise_role
    );

-- ── 3. Policies for public.profiles ──
CREATE POLICY super_admin_all ON public.profiles FOR ALL TO authenticated 
    USING (public.get_auth_user_role() = 'super_admin'::public.enterprise_role);

CREATE POLICY hr_admin_company_view ON public.profiles FOR SELECT TO authenticated
    USING (
        company_id = public.get_auth_user_company_id() 
        AND public.get_auth_user_role() = 'hr_admin'::public.enterprise_role
    );

CREATE POLICY manager_team_view ON public.profiles FOR SELECT TO authenticated
    USING (
        team_id = public.get_auth_user_team_id() 
        AND public.get_auth_user_role() = 'manager'::public.enterprise_role
    );

CREATE POLICY user_profile_self ON public.profiles FOR ALL TO authenticated
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── 4. Policies for public.invitations ──
CREATE POLICY select_invitations ON public.invitations 
    FOR SELECT TO authenticated 
    USING (
        company_id = public.get_auth_user_company_id()
        OR public.get_auth_user_role() = 'super_admin'::public.enterprise_role
    );

CREATE POLICY manage_invitations ON public.invitations 
    FOR ALL TO authenticated 
    USING (
        (public.get_auth_user_role() = 'hr_admin'::public.enterprise_role AND company_id = public.get_auth_user_company_id())
        OR public.get_auth_user_role() = 'super_admin'::public.enterprise_role
    );

-- Allow public verification of invitation token (unauthenticated users accepting invites)
CREATE POLICY public_verify_token ON public.invitations 
    FOR SELECT TO anon, authenticated
    USING (status = 'pending');

-- ── 5. Policies for public.assessment_questions (everyone can read)
CREATE POLICY read_questions ON public.assessment_questions
    FOR SELECT TO anon, authenticated
    USING (true);

-- ── 6. Policies for public.user_responses ──
CREATE POLICY user_responses_self ON public.user_responses FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY manager_responses_view ON public.user_responses FOR SELECT TO authenticated
    USING (
        public.get_user_team_id(user_id) = public.get_auth_user_team_id()
        AND public.get_auth_user_role() = 'manager'::public.enterprise_role
    );

CREATE POLICY hr_admin_responses_view ON public.user_responses FOR SELECT TO authenticated
    USING (
        public.get_user_company_id(user_id) = public.get_auth_user_company_id()
        AND public.get_auth_user_role() = 'hr_admin'::public.enterprise_role
    );

-- ── 7. Policies for public.saved_reports ──

-- Employee Access Rule: Users read only their own row
CREATE POLICY "Employees can view own report" ON public.saved_reports
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Team Lead (TL) Access Rule: Managers view reports matching their team_id
CREATE POLICY "Managers can view team reports" ON public.saved_reports
    FOR SELECT TO authenticated
    USING (
        team_id = public.get_auth_user_team_id()
        AND public.get_auth_user_role() = 'manager'::public.enterprise_role
    );

-- HR Admin Access Rule: Admins view all reports matching their company_id
CREATE POLICY "HR Admins can view all company reports" ON public.saved_reports
    FOR SELECT TO authenticated
    USING (
        company_id = public.get_auth_user_company_id()
        AND public.get_auth_user_role() = 'hr_admin'::public.enterprise_role
    );

-- Allow backend service role / system write access to save reports
CREATE POLICY "System can manage all reports" ON public.saved_reports
    FOR ALL TO service_role
    USING (true);

-- ====================================================================
-- Helper Function: Recursive Reporting Hierarchy (Updated for MVP 2.0 Profiles)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_reporting_hierarchy(mgr_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    designation TEXT,
    experience_years INTEGER,
    role public.enterprise_role,
    company_id UUID,
    team_id UUID,
    manager_id UUID,
    has_completed_assessment BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE reporting_hierarchy AS (
        -- Anchor member: Direct reports
        SELECT 
            p.id, p.first_name, p.last_name, p.email, p.designation, p.experience_years, p.role, p.company_id, p.team_id, p.manager_id
        FROM public.profiles p
        WHERE p.manager_id = mgr_id
        
        UNION ALL
        
        -- Recursive member: Indirect reports
        SELECT 
            p.id, p.first_name, p.last_name, p.email, p.designation, p.experience_years, p.role, p.company_id, p.team_id, p.manager_id
        FROM public.profiles p
        JOIN reporting_hierarchy rh ON p.manager_id = rh.id
    )
    SELECT 
        rh.id, rh.first_name, rh.last_name, rh.email, rh.designation, rh.experience_years, rh.role, rh.company_id, rh.team_id, rh.manager_id,
        EXISTS (
            SELECT 1 FROM public.user_responses ur 
            WHERE ur.user_id = rh.id 
            GROUP BY ur.user_id 
            HAVING COUNT(ur.question_id) = 24
        ) AS has_completed_assessment
    FROM reporting_hierarchy rh;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
