-- ====================================================================
-- TIE MVP 2.0 Database Schema Migration
-- ====================================================================

-- 1. Create Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    manager_id UUID, -- References profiles(id)
    parent_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL, 
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 3. Update Profiles Table (supporting Company, Team, Manager & Roles)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('super_admin', 'hr_admin', 'manager', 'user'));

ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS experience_years INTEGER, -- Fixed spelling typo
    ADD COLUMN IF NOT EXISTS designation TEXT,
    ADD COLUMN IF NOT EXISTS employee_id TEXT,
    ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}'::TEXT[];

-- Complete circular foreign keys after profiles is altered
ALTER TABLE public.teams 
    ADD CONSTRAINT fk_teams_manager FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Create Invitations Table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('hr_admin', 'manager', 'user')) NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- who they should report to
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    accepted_at TIMESTAMPTZ
);

-- Enable RLS on Invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- Performance Optimization Indexes
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON public.profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_teams_company_id ON public.teams(company_id);

-- ====================================================================
-- Helper Functions to Bypass RLS Recursion on Profiles
-- ====================================================================

-- Helper function to get current user's role without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT
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

-- ====================================================================
-- Row Level Security (RLS) Policies
-- ====================================================================

-- ── Policies for public.companies ──
DROP POLICY IF EXISTS select_company ON public.companies;
CREATE POLICY select_company ON public.companies 
    FOR SELECT TO authenticated 
    USING (
        id = public.get_auth_user_company_id()
        OR public.get_auth_user_role() = 'super_admin'
    );

DROP POLICY IF EXISTS manage_companies ON public.companies;
CREATE POLICY manage_companies ON public.companies 
    FOR ALL TO authenticated 
    USING (public.get_auth_user_role() = 'super_admin');

-- ── Policies for public.teams ──
DROP POLICY IF EXISTS select_teams ON public.teams;
CREATE POLICY select_teams ON public.teams 
    FOR SELECT TO authenticated 
    USING (
        company_id = public.get_auth_user_company_id()
        OR public.get_auth_user_role() = 'super_admin'
    );

DROP POLICY IF EXISTS manage_teams ON public.teams;
CREATE POLICY manage_teams ON public.teams 
    FOR ALL TO authenticated 
    USING (
        (public.get_auth_user_role() = 'hr_admin' AND company_id = public.get_auth_user_company_id())
        OR public.get_auth_user_role() = 'super_admin'
    );

-- ── Policies for public.invitations ──
DROP POLICY IF EXISTS select_invitations ON public.invitations;
CREATE POLICY select_invitations ON public.invitations 
    FOR SELECT TO authenticated 
    USING (
        company_id = public.get_auth_user_company_id()
        OR public.get_auth_user_role() = 'super_admin'
    );

DROP POLICY IF EXISTS manage_invitations ON public.invitations;
CREATE POLICY manage_invitations ON public.invitations 
    FOR ALL TO authenticated 
    USING (
        (public.get_auth_user_role() = 'hr_admin' AND company_id = public.get_auth_user_company_id())
        OR public.get_auth_user_role() = 'super_admin'
    );

-- Allow public verification of invitation token (unauthenticated users accepting invites)
DROP POLICY IF EXISTS public_verify_token ON public.invitations;
CREATE POLICY public_verify_token ON public.invitations 
    FOR SELECT TO anon, authenticated
    USING (status = 'pending');

-- ====================================================================
-- Helper Function: Recursive Reporting Hierarchy
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_reporting_hierarchy(mgr_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    employee_id TEXT,
    designation TEXT,
    experience_years INTEGER,
    role TEXT,
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
            p.id, p.first_name, p.last_name, p.email, p.employee_id, p.designation, p.experience_years, p.role, p.company_id, p.team_id, p.manager_id
        FROM public.profiles p
        WHERE p.manager_id = mgr_id
        
        UNION ALL
        
        -- Recursive member: Indirect reports
        SELECT 
            p.id, p.first_name, p.last_name, p.email, p.employee_id, p.designation, p.experience_years, p.role, p.company_id, p.team_id, p.manager_id
        FROM public.profiles p
        JOIN reporting_hierarchy rh ON p.manager_id = rh.id
    )
    SELECT 
        rh.id, rh.first_name, rh.last_name, rh.email, rh.employee_id, rh.designation, rh.experience_years, rh.role, rh.company_id, rh.team_id, rh.manager_id,
        EXISTS (
            SELECT 1 FROM public.user_responses ur 
            WHERE ur.user_id = rh.id 
            GROUP BY ur.user_id 
            HAVING COUNT(ur.question_id) = 24
        ) AS has_completed_assessment
    FROM reporting_hierarchy rh;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
