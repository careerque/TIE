"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { supabasedb } from "@/lib/supabaseClient";
import { CookieUtils } from "@/lib/cookieUtils";

export interface TenantMetadata {
  companyName: string;
  companySlug: string;
  teamName: string;
  teamSlug: string;
  managerName: string;
  userName: string;
  userDesignation: string;
  userEmployeeId: string;
  userRole: string;
  isTenantValid: boolean;
}

const DEFAULT_ALLOWED_ROLES = ["user", "manager", "hr_admin", "super_admin"];

export function useTenantGuard(allowedRoles: string[] = DEFAULT_ALLOWED_ROLES) {
  const router = useRouter();
  const params = useParams();
  const routeCompanySlug = (params?.company_slug as string) || "";
  const routeTeamSlug = (params?.team_slug as string) || "";

  const { isLoggedIn, profile, user, loading: authLoading } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [tenantMeta, setTenantMeta] = useState<TenantMetadata>({
    companyName: "",
    companySlug: "",
    teamName: "",
    teamSlug: "",
    managerName: "",
    userName: "",
    userDesignation: "",
    userEmployeeId: "",
    userRole: "",
    isTenantValid: false,
  });
  const [error, setError] = useState<string | null>(null);

  const validateAndFetchTenant = useCallback(async () => {
    if (!user || !profile) return;

    setLoading(true);
    setError(null);

    try {
      // 1. RBAC check
      const userRole = profile.role || "user";
      if (!allowedRoles.includes(userRole) && userRole !== "super_admin") {
        console.warn(`[RBAC Violation] User role '${userRole}' not allowed for route requirements (${allowedRoles.join(", ")})`);
        router.push("/dashboard");
        return;
      }

      // Format User Display Name
      let formattedUserName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
      if (!formattedUserName) {
        formattedUserName = profile.email ? profile.email.split("@")[0] : "User";
      }

      // If user has no company_id assigned (Solo / Individual user)
      if (!profile.company_id) {
        setTenantMeta({
          companyName: "Individual Workspace",
          companySlug: "solo",
          teamName: "General",
          teamSlug: "none",
          managerName: "Self-Managed",
          userName: formattedUserName,
          userDesignation: profile.designation || "Member",
          userEmployeeId: profile.employee_id || "N/A",
          userRole: userRole,
          isTenantValid: true,
        });
        setLoading(false);
        return;
      }

      // 2. Fetch Company details (name & slug)
      let resolvedCompName = "";
      let resolvedCompSlug = "";

      const cachedCompSlug = CookieUtils.get(`company-slug-${profile.company_id}`);
      const cachedCompName = CookieUtils.get(`company-name-${profile.company_id}`);

      if (cachedCompSlug && cachedCompName) {
        resolvedCompSlug = cachedCompSlug;
        resolvedCompName = cachedCompName;
      } else {
        const { data: compData, error: compErr } = await supabasedb
          .from("companies")
          .select("name, slug")
          .eq("id", profile.company_id)
          .single();

        if (compErr || !compData) {
          throw new Error("Unable to resolve company workspace record.");
        }

        resolvedCompSlug = compData.slug;
        resolvedCompName = compData.name;
        CookieUtils.set(`company-slug-${profile.company_id}`, resolvedCompSlug);
        CookieUtils.set(`company-name-${profile.company_id}`, resolvedCompName);
      }

      // 3. Multi-Tenant Cross-Company Access Insulation Guard
      if (routeCompanySlug && routeCompanySlug !== resolvedCompSlug && userRole !== "super_admin") {
        console.warn(`[Tenant Guard Alert] Access denied. User belongs to '${resolvedCompSlug}', attempted to access '${routeCompanySlug}'`);
        
        // Fetch team slug for correct redirection
        let redirectTeamSlug = "none";
        if (profile.team_id) {
          const { data: tmData } = await supabasedb.from("teams").select("slug").eq("id", profile.team_id).single();
          if (tmData?.slug) redirectTeamSlug = tmData.slug;
        }

        const targetRoute = userRole === "hr_admin" 
          ? `/${resolvedCompSlug}/hr_admin`
          : userRole === "manager"
          ? `/${resolvedCompSlug}/${redirectTeamSlug}/manager`
          : `/${resolvedCompSlug}/${redirectTeamSlug}/user`;

        router.replace(targetRoute);
        return;
      }

      // 4. Fetch Team details & Manager name
      let resolvedTeamName = "Corporate Team";
      let resolvedTeamSlug = profile.team_id ? "none" : "none";
      let resolvedManagerName = "Reporting Manager";

      if (profile.team_id) {
        const cachedTeamSlug = CookieUtils.get(`team-slug-${profile.team_id}`);
        const cachedTeamName = CookieUtils.get(`team-name-${profile.team_id}`);

        if (cachedTeamSlug && cachedTeamName) {
          resolvedTeamSlug = cachedTeamSlug;
          resolvedTeamName = cachedTeamName;
        } else {
          const { data: tmData } = await supabasedb
            .from("teams")
            .select("name, slug, manager_id")
            .eq("id", profile.team_id)
            .single();

          if (tmData) {
            resolvedTeamSlug = tmData.slug || "none";
            resolvedTeamName = tmData.name || "Team";
            CookieUtils.set(`team-slug-${profile.team_id}`, resolvedTeamSlug);
            CookieUtils.set(`team-name-${profile.team_id}`, resolvedTeamName);

            // Fetch team manager name if assigned
            if (tmData.manager_id) {
              const { data: mgrProfile } = await supabasedb
                .from("profiles")
                .select("first_name, last_name, email")
                .eq("id", tmData.manager_id)
                .single();

              if (mgrProfile) {
                const mgrName = `${mgrProfile.first_name || ""} ${mgrProfile.last_name || ""}`.trim();
                resolvedManagerName = mgrName || mgrProfile.email?.split("@")[0] || "Team Manager";
              }
            }
          }
        }
      }

      // Fallback manager lookup if direct manager_id is attached to profile
      if (resolvedManagerName === "Reporting Manager" && profile.manager_id) {
        const { data: directMgrProfile } = await supabasedb
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", profile.manager_id)
          .single();

        if (directMgrProfile) {
          const mgrName = `${directMgrProfile.first_name || ""} ${directMgrProfile.last_name || ""}`.trim();
          resolvedManagerName = mgrName || directMgrProfile.email?.split("@")[0] || "Direct Manager";
        }
      }

      setTenantMeta({
        companyName: resolvedCompName,
        companySlug: resolvedCompSlug,
        teamName: resolvedTeamName,
        teamSlug: resolvedTeamSlug,
        managerName: resolvedManagerName,
        userName: formattedUserName,
        userDesignation: profile.designation || "Team Member",
        userEmployeeId: profile.employee_id || "EMP",
        userRole: userRole,
        isTenantValid: true,
      });

    } catch (err: any) {
      console.error("Error in Tenant Security Guard:", err);
      setError(err.message || "Multi-tenant verification failed.");
    } finally {
      setLoading(false);
    }
  }, [
    user?.id, 
    profile?.email, 
    profile?.role, 
    profile?.company_id, 
    profile?.team_id, 
    routeCompanySlug, 
    routeTeamSlug, 
    allowedRoles.join(","), 
    router
  ]);



  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }
      validateAndFetchTenant();
    }
  }, [isLoggedIn, authLoading, validateAndFetchTenant, router]);

  return {
    loading: authLoading || loading,
    tenantMeta,
    error,
    refreshTenant: validateAndFetchTenant,
  };
}
