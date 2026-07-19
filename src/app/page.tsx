"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, CSSProperties } from "react";
import {
  Users,
  Zap,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";


/* ─── Animated counter hook ─────────────────────────────── */
function useCounter(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);

  return value;
}

/* ─── Floating particle ──────────────────────────────────── */
function Particle({ style }: { style: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        borderRadius: "50%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

/* ─── Feature card ───────────────────────────────────────── */
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
  delay: string;
  accent: string;
}

function FeatureCard({ icon, title, description, tag, delay, accent }: FeatureCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`home-feature-card ${delay}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)"
          : "#ffffff",
        border: hovered
          ? `1.5px solid ${accent}40`
          : "1.5px solid rgba(36,59,83,0.09)",
        boxShadow: hovered
          ? `0 20px 60px rgba(36,59,83,0.10), 0 4px 16px ${accent}18`
          : "0 2px 12px rgba(36,59,83,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      {/* card top glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      />

      {/* icon */}
      <div
        className="home-feature-card-icon"
        style={{
          background: `${accent}14`,
          color: accent,
          transform: hovered ? "scale(1.08)" : "scale(1)",
        }}
      >
        {icon}
      </div>

      {/* tag */}
      <div
        className="home-feature-card-tag"
        style={{
          color: accent,
          background: `${accent}12`,
        }}
      >
        {tag}
      </div>

      <h3 className="home-feature-card-title">{title}</h3>
      <p className="home-feature-card-desc">{description}</p>
    </div>
  );
}

/* ─── Stat pill ──────────────────────────────────────────── */
function StatPill({
  label,
  value,
  suffix = "",
  start,
}: {
  label: string;
  value: number;
  suffix?: string;
  start: boolean;
}) {
  const count = useCounter(value, 2000, start);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
      }}
    >
      <span
        style={{
          fontSize: "1.6rem",
          fontWeight: 800,
          color: "#243B53",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
        {suffix}
      </span>
      <span
        style={{
          fontSize: "0.75rem",
          color: "#8fa3b8",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function WelcomePage() {
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, profile } = useAuthContext();

  const getDashboardLink = () => {
    if (!profile) return "/dashboard";
    if (profile.role === "super_admin") return "/super-admin";
    if (profile.role === "hr_admin") return "/hr-admin";
    if (profile.role === "manager") return "/manager";
    return "/dashboard";
  };


  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  //Code to upload new questions.
  /*
  useEffect(() => {
    // Run this once locally to populate your tables
    import("@/lib/seedQuestions").then(({ seedDatabaseQuestions }) => {
      console.log("Hello gj");
      seedDatabaseQuestions();
    });
  }, []);

  ?*/

  const features = [
    {
      icon: <Users size={22} />,
      title: "Collaboration Insights",
      description:
        "Uncover how teams naturally communicate, form bonds, and build trust — beyond org charts and reporting lines.",
      tag: "Patterns",
      accent: "#5BA4A4",
      delay: "delay-200",
    },
    {
      icon: <Zap size={22} />,
      title: "Adaptability Signals",
      description:
        "Detect how individuals and teams navigate ambiguity, absorb change, and stay effective under pressure.",
      tag: "Resilience",
      accent: "#243B53",
      delay: "delay-300",
    },
    {
      icon: <TrendingUp size={22} />,
      title: "Growth Readiness",
      description:
        "Surface the quiet indicators of potential — curiosity, initiative, and the capacity to evolve before it's obvious.",
      tag: "Potential",
      accent: "#A3B18A",
      delay: "delay-400",
    },
  ];

  return (
    <main className="home-container">
      {/* ── HERO SECTION ─────────────────────────────────── */}
      <section className="home-hero bg-mesh">
        {/* dot grid */}
        <div className="dot-grid" aria-hidden />

        {/* Glow blobs */}
        <Particle
          style={{
            width: "600px",
            height: "600px",
            top: "-200px",
            right: "-200px",
            background:
              "radial-gradient(circle, rgba(91,164,164,0.12) 0%, transparent 65%)",
            filter: "blur(40px)",
          }}
        />
        <Particle
          style={{
            width: "500px",
            height: "500px",
            bottom: "-150px",
            left: "-150px",
            background:
              "radial-gradient(circle, rgba(36,59,83,0.09) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <Particle
          style={{
            width: "300px",
            height: "300px",
            top: "40%",
            left: "60%",
            background:
              "radial-gradient(circle, rgba(163,177,138,0.10) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        {/* ── HERO CONTENT ── */}
        <div className="home-hero-content">
          {/* eyebrow badge */}
          <div className="home-eyebrow animate-fade-up">
            <span className="home-eyebrow-dot" />
            <span className="home-eyebrow-text">
              Talent Intelligence Engine — Now in Early Access
            </span>
          </div>

          {/* main heading */}
          <h1 className="home-h1 animate-fade-up delay-100">
            Workforce Intelligence{" "}
            <span className="home-h1-gradient">
              For High-Performing Teams
            </span>
          </h1>

          {/* subheading */}
          <p className="home-subheading animate-fade-up delay-200">
            TIE is a workforce intelligence platform that maps how your people naturally work, collaborate, adapt, and grow — giving leaders and HR teams the actionable depth to align talent and build workplaces that thrive.
          </p>

          {/* CTA buttons */}
          <div className="home-cta-group animate-fade-up delay-300">
            {isLoggedIn ? (
              profile?.role && profile.role !== "user" ? (
                <Link href={getDashboardLink()} className="home-btn-primary">
                  View Dashboard
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <Link href="/welcome" className="home-btn-primary">
                  Take Assessment
                  <ArrowRight size={16} />
                </Link>
              )
            ) : (
              <Link href="/register" className="home-btn-primary">
                Get Started
                <ArrowRight size={16} />
              </Link>
            )}

            <Link href="/#why-tie" className="home-btn-secondary">
              Learn More
              <ChevronDown size={15} />
            </Link>
          </div>
        </div>

        {/* scroll hint */}
        <div className="home-scroll-hint animate-fade-in delay-500">
          <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#627D98", letterSpacing: "0.08em", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: "1px", height: "28px", background: "linear-gradient(to bottom, #627D98, transparent)" }} />
        </div>
      </section>

      {/* ── WHY TIE SECTION ─────────────────────────────── */}
      <section id="why-tie" className="home-info-section bg-mesh" style={{ scrollMarginTop: "70px" }}>
        <div className="home-features-section-border" aria-hidden />
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", padding: "5rem 1.5rem" }}>
          <span className="home-section-tag">Why TIE</span>
          <h2 className="home-section-title" style={{ marginTop: "0.5rem" }}>
            Workforce Intelligence, Not Personality Testing
          </h2>
          <p className="home-section-desc" style={{ maxWidth: "720px", fontSize: "1.1rem", lineHeight: 1.7, color: "#243B53", fontWeight: 500, margin: "1.5rem auto 0" }}>
            TIE (Talent Intelligence Engine) helps organizations identify hidden operational patterns related to work style, collaboration, adaptability, support needs, and growth readiness. By providing evidence-based insights at the employee, team, department, and business levels, TIE helps managers support employees more effectively without intrusive monitoring.
          </p>
        </div>
      </section>

      {/* ── PRODUCT SECTION ──────────────────────────────── */}
      <section id="product" className="home-features-section" style={{ background: "#ffffff", scrollMarginTop: "70px" }}>
        <div className="home-features-section-border" aria-hidden />
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="home-section-header">
            <span className="home-section-tag">Product Lenses</span>
          </div>
          <h2 className="home-section-title">Integrated Insights for Every Layer</h2>
          <p className="home-section-desc">
            Explore TIE's specialized workforce intelligence dashboards designed for employees, team managers, and organizational leaders.
          </p>
          
          <div className="home-features-grid">
            {/* Card 1: Employee Dynamics */}
            <div className="home-feature-card">
              <div className="home-feature-card-icon" style={{ background: "rgba(91,164,164,0.12)", color: "#5BA4A4" }}>
                <Users size={22} />
              </div>
              <span className="home-feature-card-tag" style={{ color: "#5BA4A4", background: "rgba(91,164,164,0.1)" }}>Employees</span>
              <h3 className="home-feature-card-title">Workplace Style Insights</h3>
              <ul className="profile-output-bullet-list" style={{ paddingLeft: "1.25rem", margin: "1rem 0 0", color: "#627D98", fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem", textAlign: "left" }}>
                <li>24-question work preference mapper</li>
                <li>Primary and secondary pattern identification</li>
                <li>Richer, 14-section personalized reports</li>
              </ul>
            </div>

            {/* Card 2: Manager Support */}
            <div className="home-feature-card">
              <div className="home-feature-card-icon" style={{ background: "rgba(36,59,83,0.12)", color: "#243B53" }}>
                <Zap size={22} />
              </div>
              <span className="home-feature-card-tag" style={{ color: "#243B53", background: "rgba(36,59,83,0.1)" }}>Managers</span>
              <h3 className="home-feature-card-title">Team Alignment Guides</h3>
              <ul className="profile-output-bullet-list" style={{ paddingLeft: "1.25rem", margin: "1rem 0 0", color: "#627D98", fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem", textAlign: "left" }}>
                <li>Cooperation and support mapping</li>
                <li>Suggested manager communication actions</li>
                <li>Team change adaptability trends</li>
              </ul>
            </div>

            {/* Card 3: Enterprise Analytics */}
            <div className="home-feature-card">
              <div className="home-feature-card-icon" style={{ background: "rgba(163,177,138,0.12)", color: "#A3B18A" }}>
                <TrendingUp size={22} />
              </div>
              <span className="home-feature-card-tag" style={{ color: "#A3B18A", background: "rgba(163,177,138,0.1)" }}>HR & Leaders</span>
              <h3 className="home-feature-card-title">Workforce Dashboards</h3>
              <ul className="profile-output-bullet-list" style={{ paddingLeft: "1.25rem", margin: "1rem 0 0", color: "#627D98", fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem", textAlign: "left" }}>
                <li>Department-level trend reports</li>
                <li>Cross-functional communication friction mapping</li>
                <li>Strategic organizational resilience signals</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — TIMELINE STRIP ────────────────── */}
      <section className="home-timeline-section bg-mesh">
        <Particle
          style={{
            width: "400px",
            height: "400px",
            top: "0",
            right: "-100px",
            background: "radial-gradient(circle, rgba(163,177,138,0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#A3B18A",
              }}
            >
              How TIE Works
            </span>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
                fontWeight: 800,
                color: "#243B53",
                letterSpacing: "-0.03em",
                marginTop: "0.5rem",
                lineHeight: 1.2,
              }}
            >
              Intelligence without intrusion
            </h2>
          </div>

          <div className="home-timeline-grid">
            {[
              { step: "01", title: "Assess", body: "Employees take a brief, 24-question work style preference mapper. No surveillance, no intrusive monitoring.", color: "#5BA4A4" },
              { step: "02", title: "Map", body: "TIE's scoring engine identifies the employee's primary and secondary operational patterns.", color: "#243B53" },
              { step: "03", title: "Analyze", body: "Gemini combines patterns with our Profile Content Library to generate a highly personalized, practical report.", color: "#A3B18A" },
              { step: "04", title: "Align", body: "Managers, HR, and executives use contextual dashboards to support teams and optimize workflows.", color: "#5BA4A4" },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`home-timeline-card animate-fade-up delay-${(i + 1) * 100}`}
              >
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: item.color,
                    opacity: 0.6,
                  }}
                />
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    color: item.color,
                    display: "block",
                    marginBottom: "0.6rem",
                  }}
                >
                  {item.step}
                </span>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#243B53",
                    marginBottom: "0.5rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.845rem",
                    color: "#627D98",
                    lineHeight: 1.6,
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ──────────────────────────────── */}
      <section id="pricing" className="home-features-section" style={{ background: "#ffffff", borderTop: "1px solid rgba(36,59,83,0.06)", scrollMarginTop: "70px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "4rem 1.5rem" }}>
          <span className="home-section-tag">Pricing</span>
          <h2 className="home-section-title" style={{ marginTop: "0.5rem" }}>Coming Soon</h2>
          <div className="home-pricing-card" style={{ background: "rgba(91,164,164,0.05)", border: "1px dashed #5BA4A4", borderRadius: "18px", padding: "2rem 1.5rem", marginTop: "1.5rem" }}>
            <p style={{ margin: 0, fontSize: "1rem", color: "#243B53", fontWeight: 600 }}>
              We will finalize pricing after the MVP and pilot.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section className="home-cta-section">
        <div className="home-cta-section-border" aria-hidden />

        <div className="home-cta-banner">
          {/* inner glow */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(91,164,164,0.20) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              bottom: "-60px",
              left: "-60px",
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(163,177,138,0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            className="animate-fade-up"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(91,164,164,0.15)",
              border: "1px solid rgba(91,164,164,0.25)",
              borderRadius: "99px",
              padding: "5px 14px",
              marginBottom: "1.5rem",
            }}
          >
            <Sparkles size={12} color="#5BA4A4" />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#5BA4A4", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Early Access Open
            </span>
          </div>

          <h2
            className="animate-fade-up delay-100"
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
              marginBottom: "1rem",
            }}
          >
            Ready to see your workforce differently?
          </h2>
          <p
            className="animate-fade-up delay-200"
            style={{
              fontSize: "1rem",
              color: "rgba(255,255,255,0.62)",
              marginBottom: "2.25rem",
              lineHeight: 1.65,
              maxWidth: "460px",
              margin: "0 auto 2.25rem",
            }}
          >
            Join forward-thinking teams using TIE to build workplaces where people
            are understood — and help them thrive.
          </p>

          <div
            className="animate-fade-up delay-300"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}
          >
            {isLoggedIn ? (
              profile?.role && profile.role !== "user" ? (
                <Link href={getDashboardLink()} className="home-btn-primary">
                  View Dashboard
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link href="/welcome" className="home-btn-primary">
                    Take Assessment
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/profile-output"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0.875rem 1.75rem",
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.80)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      borderRadius: "12px",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.2s",
                      fontFamily: "inherit",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    View Insights
                  </Link>
                </>
              )
            ) : (
              <>
                <Link href="/register" className="home-btn-primary">
                  Get Started Free
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "0.875rem 1.75rem",
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.80)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: "12px",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </main>
  );
}