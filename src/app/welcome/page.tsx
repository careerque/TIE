"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Clock, ArrowRight, Sparkles, Check } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { fetchAssessmentStructure } from "@/services/assessmentService";
import { supabasedb } from "@/lib/supabaseClient";
import { CookieUtils } from "@/lib/cookieUtils";

export default function AssessmentWelcomePage() {
  const router = useRouter();
  const { isLoggedIn, profile, loading } = useAuthContext();
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [ctaHovered, setCtaHovered] = useState(false);
  const [startUrl, setStartUrl] = useState<string>("/assessment?started=true");

  useEffect(() => {
    if (!loading) {
      // Check authentication
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }

      if (profile?.company_id) {
        const fetchSlugs = async () => {
          const cachedComp = CookieUtils.get(`company-slug-${profile.company_id}`);
          const cachedTm = profile.team_id ? CookieUtils.get(`team-slug-${profile.team_id}`) : null;

          let resolvedComp = cachedComp || "none";
          let resolvedTm = cachedTm || "none";

          if (!cachedComp || (profile.team_id && !cachedTm)) {
            try {
              const compPromise = profile.company_id
                ? supabasedb.from("companies").select("slug").eq("id", profile.company_id).maybeSingle()
                : Promise.resolve({ data: null });

              const tmPromise = profile.team_id
                ? supabasedb.from("teams").select("slug").eq("id", profile.team_id).maybeSingle()
                : Promise.resolve({ data: null });

              const [compRes, tmRes] = await Promise.all([compPromise, tmPromise]);
              if (compRes.data?.slug) {
                resolvedComp = compRes.data.slug;
                CookieUtils.set(`company-slug-${profile.company_id}`, resolvedComp);
              }
              if (tmRes.data?.slug) {
                resolvedTm = tmRes.data.slug;
                CookieUtils.set(`team-slug-${profile.team_id}`, resolvedTm);
              }
            } catch (err) {
              console.error("Failed to fetch redirect slugs:", err);
            }
          }

          setStartUrl(`/${resolvedComp}/${resolvedTm}/user?started=true`);
        };
        fetchSlugs();
      } else {
        setStartUrl("/assessment?started=true");
      }

      // Fetch dynamic question count
      const fetchQuestions = async () => {
        try {
          const res = await fetchAssessmentStructure();
          if (res.success && Array.isArray(res.data)) {
            setQuestionCount(res.data.length);
          }
        } catch (err) {
          console.error("Failed to load questions count:", err);
        }
      };
      fetchQuestions();
    }
  }, [isLoggedIn, profile, loading, router]);

  const totalQuestions = questionCount || 24;
  const estimatedMins = totalQuestions * 1; // 1 min per question

  if (loading) {
    return (
      <div className="tie-container">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <div className="tie-card-top-bar" />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#627D98" }}>
            Loading Details...
          </span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Redirecting in useEffect
  }

  return (
    <main className="tie-container">
      {/* ── Background decoration ── */}
      <div className="tie-dot-grid" aria-hidden />
      
      {/* Ambient gradient blobs */}
      <div className="tie-glow-blob-1" aria-hidden />
      <div className="tie-glow-blob-2" aria-hidden />

      {/* ── Main Centered Intro Card ── */}
      <div className="tie-card">
        {/* Top border accent line */}
        <div className="tie-card-top-bar" />

        {/* 1. Header Area with Generous Spacing */}
        <div className="tie-header">
          <div className="tie-badge">
            <Sparkles size={11} style={{ marginRight: "2px" }} />
            Talent Assessment
          </div>
          
          <h1 className="tie-title">
            Workforce Insight Assessment
          </h1>
          
          <p className="tie-desc">
            Evaluate your professional work styles, collaboration preferences, and adaptive strengths. This evaluation generates a personalized talent index report.
          </p>
        </div>

        {/* 2. Horizontal Information strip - Clean 2-column layout */}
        <div className="welcome-stats-strip">
          <div className="welcome-stats-col-left">
            <ClipboardList size={20} style={{ color: "#5BA4A4" }} />
            <span className="welcome-stats-label">Questions</span>
            <span className="welcome-stats-value">
              {totalQuestions} Items
            </span>
          </div>
          
          <div className="welcome-stats-col-right">
            <Clock size={20} style={{ color: "#5BA4A4" }} />
            <span className="welcome-stats-label">Duration</span>
            <span className="welcome-stats-value">
              ~{estimatedMins} Mins
            </span>
          </div>
        </div>

        {/* 3. Expected Outcomes List - Clean Open Layout */}
        <div className="welcome-outcomes-block">
          <h3 className="welcome-outcomes-title">
            What You will receive:
          </h3>
          <ul className="welcome-list">
            {[
              "Real-time evaluation profile mapping core team roles",
              "Detailed communication and collaboration preference index",
              "Actionable leadership feedback and professional alignment insights"
            ].map((item, idx) => (
              <li key={idx} className="welcome-list-item">
                <div className="welcome-check-circle">
                  <Check size={11} strokeWidth={3.5} />
                </div>
                <span style={{ flex: 1, textAlign: "left" }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Action Area with Direct Navigation */}
        <div className="dashboard-action-block">
          <Link
            href={startUrl}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            className="tie-btn-primary"
          >
            <span>Start Assessment</span>
            <ArrowRight 
              size={16} 
              className="dashboard-btn-icon-right"
            />
          </Link>
        </div>
      </div>
    </main>
  );
}