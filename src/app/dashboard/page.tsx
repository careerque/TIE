"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, User, ClipboardList } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import InteractiveDashboardLoader from "@/components/InteractiveDashboardLoader";
import { supabasedb } from "@/lib/supabaseClient";
import { CookieUtils } from "@/lib/cookieUtils";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoggedIn, profile, loading } = useAuthContext();
  const [userName, setUserName] = useState<string>("User");
  const [takeTestHovered, setTakeTestHovered] = useState(false);
  const [viewProfileHovered, setViewProfileHovered] = useState(false);

  // Tenant Slugs
  const [companySlug, setCompanySlug] = useState<string>("");
  const [teamSlug, setTeamSlug] = useState<string>("");

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }

      if (profile?.first_name) {
        setUserName(profile.first_name);
      } else if (profile?.email) {
        const namePart = profile.email.split("@")[0];
        const formatted = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        setUserName(formatted);
      }

      // Fetch slugs for semantic routing (cached in cookies for instant loading)
      const fetchSlugs = async () => {
        if (!profile) return;
        
        const cachedComp = CookieUtils.get(`company-slug-${profile.company_id}`);
        const cachedTm = profile.team_id ? CookieUtils.get(`team-slug-${profile.team_id}`) : null;

        if (cachedComp) setCompanySlug(cachedComp);
        if (cachedTm) setTeamSlug(cachedTm);

        if (cachedComp && (cachedTm || !profile.team_id)) {
          return; // Skip queries if fully cached
        }

        const compPromise = profile.company_id && !cachedComp
          ? supabasedb.from("companies").select("slug").eq("id", profile.company_id).maybeSingle()
          : Promise.resolve({ data: null });

        const tmPromise = profile.team_id && !cachedTm
          ? supabasedb.from("teams").select("slug").eq("id", profile.team_id).maybeSingle()
          : Promise.resolve({ data: null });

        try {
          const [compRes, tmRes] = await Promise.all([compPromise, tmPromise]);
          if (compRes.data) {
            setCompanySlug(compRes.data.slug);
            CookieUtils.set(`company-slug-${profile.company_id}`, compRes.data.slug);
          }
          if (tmRes.data) {
            setTeamSlug(tmRes.data.slug);
            CookieUtils.set(`team-slug-${profile.team_id}`, tmRes.data.slug);
          }
        } catch (err) {
          console.error("Failed to fetch dashboard slugs in parallel:", err);
        }
      };

      fetchSlugs();
    }
  }, [isLoggedIn, profile, loading, router]);

  if (loading) {
    return (
      <InteractiveDashboardLoader 
        title="Workspace Dashboard" 
        subtitle="User Navigation Hub" 
      />
    );
  }

  if (!isLoggedIn) {
    return null; // Redirecting in useEffect
  }

  const activeCompanySlug = companySlug || "none";
  const activeTeamSlug = teamSlug || "none";

  return (
    <main className="tie-container">
      {/* ── Background decoration ── */}
      <div className="tie-dot-grid" aria-hidden />
      
      {/* Ambient gradient blobs */}
      <div className="tie-glow-blob-1" aria-hidden />
      <div className="tie-glow-blob-2" aria-hidden />

      {/* ── Main Centered Card ── */}
      <div className="tie-card">
        {/* Top border accent line */}
        <div className="tie-card-top-bar" />

        {/* 1. Header & Greeting Area */}
        <div className="tie-header">
          <div className="tie-badge">
            <Sparkles size={11} style={{ marginRight: "2px" }} />
            User Dashboard
          </div>
          <h1 className="tie-title">
            Welcome back, {userName}!
          </h1>
          <p className="tie-desc">
            Access your talent insights portal. Choose an option below to evaluate your professional work styles or manage your profile analytics.
          </p>
        </div>

        {/* 2. Action Area Buttons */}
        <div className="dashboard-action-block flex flex-col gap-3">
          
          {/* Role-based control panel shortcuts */}
          {profile?.role === "super_admin" && (
            <Link
              href="/super-admin"
              className="tie-btn-primary"
              style={{ background: "#243B53" }}
            >
              <Sparkles size={18} />
              <span>Go to Super Admin Panel</span>
              <ArrowRight size={16} className="dashboard-btn-icon-right" />
            </Link>
          )}

          {profile?.role === "hr_admin" && (
            <Link
              href={`/${activeCompanySlug}/hr_admin`}
              className="tie-btn-primary"
              style={{ background: "#5BA4A4" }}
            >
              <Sparkles size={18} />
              <span>Go to HR Admin Portal</span>
              <ArrowRight size={16} className="dashboard-btn-icon-right" />
            </Link>
          )}

          {profile?.role === "manager" && (
            <Link
              href={`/${activeCompanySlug}/${activeTeamSlug}/manager`}
              className="tie-btn-primary"
              style={{ background: "#A3B18A" }}
            >
              <Sparkles size={18} />
              <span>Go to Manager Dashboard</span>
              <ArrowRight size={16} className="dashboard-btn-icon-right" />
            </Link>
          )}

          {/* Button: Assessment / Self-Assessment */}
          {profile?.role === "user" ? (
            <Link
              href={`/${activeCompanySlug}/${activeTeamSlug}/user`}
              onMouseEnter={() => setTakeTestHovered(true)}
              onMouseLeave={() => setTakeTestHovered(false)}
              className="tie-btn-primary"
            >
              <ClipboardList size={18} />
              <span>Workspace & Assessment</span>
              <ArrowRight 
                size={16} 
                className="dashboard-btn-icon-right"
              />
            </Link>
          ) : (profile?.role === "manager" || profile?.role === "hr_admin") ? (
            <Link
              href="/welcome"
              onMouseEnter={() => setTakeTestHovered(true)}
              onMouseLeave={() => setTakeTestHovered(false)}
              className="tie-btn-secondary"
              style={{ borderColor: "#6366F1", color: "#4F46E5", borderRadius: "6px", background: "#F5F3FF" }}
            >
              <ClipboardList size={18} style={{ color: "#4F46E5" }} />
              <span>Take Self-Assessment (Optional)</span>
              <ArrowRight 
                size={16} 
                className="dashboard-btn-icon-right"
                style={{ color: "#4F46E5" }}
              />
            </Link>
          ) : null}

          {/* Button 2: View Profile Info */}
          <Link
            href="/profile"
            onMouseEnter={() => setViewProfileHovered(true)}
            onMouseLeave={() => setViewProfileHovered(false)}
            className="tie-btn-secondary"
          >
            <User size={18} style={{ color: "#243B53" }} />
            <span>View Profile Info</span>
            <ArrowRight 
              size={16} 
              className="dashboard-btn-icon-right"
              style={{ color: "#243B53" }}
            />
          </Link>
          
        </div>
      </div>
    </main>
  );
}
