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
      className={`animate-fade-up ${delay}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)"
          : "#ffffff",
        border: hovered
          ? `1.5px solid ${accent}40`
          : "1.5px solid rgba(36,59,83,0.09)",
        borderRadius: "18px",
        padding: "2rem 1.75rem",
        boxShadow: hovered
          ? `0 20px 60px rgba(36,59,83,0.10), 0 4px 16px ${accent}18`
          : "0 2px 12px rgba(36,59,83,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
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
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: `${accent}14`,
          marginBottom: "1.25rem",
          color: accent,
          transition: "transform 0.3s",
          transform: hovered ? "scale(1.08)" : "scale(1)",
        }}
      >
        {icon}
      </div>

      {/* tag */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: accent,
          background: `${accent}12`,
          borderRadius: "99px",
          padding: "3px 10px",
          marginBottom: "0.75rem",
        }}
      >
        {tag}
      </div>

      <h3
        style={{
          fontSize: "1.05rem",
          fontWeight: 700,
          color: "#243B53",
          marginBottom: "0.5rem",
          letterSpacing: "-0.02em",
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: "0.875rem",
          color: "#627D98",
          lineHeight: 1.65,
          fontWeight: 400,
        }}
      >
        {description}
      </p>
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    };
    checkAuth();
    window.addEventListener("auth-change", checkAuth);

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => {
      observer.disconnect();
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

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
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#1F2933",
        overflowX: "hidden",
        background: "#F4F7FA",
      }}
    >
      {/* ── HERO SECTION ─────────────────────────────────── */}
      <section
        className="bg-mesh"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
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

        {/* Global Navbar handles site navigation */}

        {/* ── HERO CONTENT ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "3rem 1.5rem 4rem",
            maxWidth: "860px",
            margin: "0 auto",
            width: "100%",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* eyebrow badge */}
          <div
            className="animate-fade-up"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.80)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(36,59,83,0.10)",
              borderRadius: "99px",
              padding: "6px 16px 6px 10px",
              marginBottom: "2rem",
              boxShadow: "0 2px 12px rgba(36,59,83,0.06)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#A3B18A",
                flexShrink: 0,
                boxShadow: "0 0 0 3px rgba(163,177,138,0.25)",
              }}
            />
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#243B53",
                letterSpacing: "0.02em",
              }}
            >
              Talent Intelligence Engine — Now in Early Access
            </span>
          </div>

          {/* main heading */}
          <h1
            className="animate-fade-up delay-100"
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4rem)",
              fontWeight: 800,
              color: "#243B53",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              marginBottom: "1.5rem",
              maxWidth: "760px",
            }}
          >
            Understand Your Workforce{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #5BA4A4 0%, #243B53 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Beyond Performance
            </span>
          </h1>

          {/* subheading */}
          <p
            className="animate-fade-up delay-200"
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.175rem)",
              color: "#627D98",
              lineHeight: 1.7,
              maxWidth: "580px",
              marginBottom: "2.75rem",
              fontWeight: 400,
            }}
          >
            TIE surfaces how your people collaborate, adapt, and grow — giving
            leaders the depth to build teams that thrive, not just perform.
          </p>

          {/* CTA buttons */}
          <div
            className="animate-fade-up delay-300"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {isLoggedIn ? (
              <Link
                href="/assessment"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0.875rem 2rem",
                  background: "#5BA4A4",
                  color: "#ffffff",
                  borderRadius: "12px",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(91,164,164,0.38)",
                  transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#4a9393";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 28px rgba(91,164,164,0.46)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#5BA4A4";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(91,164,164,0.38)";
                }}
              >
                Take Assessment
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                href="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0.875rem 2rem",
                  background: "#5BA4A4",
                  color: "#ffffff",
                  borderRadius: "12px",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(91,164,164,0.38)",
                  transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#4a9393";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 28px rgba(91,164,164,0.46)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#5BA4A4";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(91,164,164,0.38)";
                }}
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
            )}

            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.875rem 1.75rem",
                background: "rgba(255,255,255,0.70)",
                backdropFilter: "blur(8px)",
                color: "#243B53",
                border: "1.5px solid rgba(36,59,83,0.15)",
                borderRadius: "12px",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
                paddingBlock : "1 rem"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "rgba(36,59,83,0.25)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(36,59,83,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.70)";
                e.currentTarget.style.borderColor = "rgba(36,59,83,0.15)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Learn More
              <ChevronDown size={15} />
            </button>
          </div>

         {/*
          <div
            ref={statsRef}
            className="animate-fade-up delay-400"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "2.5rem",
              marginTop: "3.5rem",
              padding: "1.5rem 2.5rem",
              background: "rgba(255,255,255,0.65)",
              backdropFilter: "blur(12px)",
              borderRadius: "16px",
              border: "1px solid rgba(36,59,83,0.08)",
              boxShadow: "0 4px 24px rgba(36,59,83,0.06)",
              flexWrap: "wrap",
              rowGap: "1.25rem",
            }}
          >
            <StatPill label="Teams Analysed" value={2400} suffix="+" start={statsVisible} />
            <div style={{ width: "1px", height: "36px", background: "rgba(36,59,83,0.09)" }} />
            <StatPill label="Insights Generated" value={98} suffix="k+" start={statsVisible} />
            <div style={{ width: "1px", height: "36px", background: "rgba(36,59,83,0.09)" }} />
            <StatPill label="Accuracy Rate" value={94} suffix="%" start={statsVisible} />
          </div>*/}
        </div>

        {/* scroll hint */}
        <div
          aria-hidden
          className="animate-fade-in delay-500"
          style={{
            position: "absolute",
            top: "44rem",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            opacity: 0.45,
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#627D98", letterSpacing: "0.08em", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: "1px", height: "28px", background: "linear-gradient(to bottom, #627D98, transparent)" }} />
        </div>
      </section>

      {/* ── FEATURE CARDS SECTION ────────────────────────── */}
      <section
        style={{
          background: "#ffffff",
          padding: "5rem 1.5rem 6rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* subtle top border gradient */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(91,164,164,0.35), rgba(163,177,138,0.35), transparent)",
          }}
        />

        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* section label */}
          <div
            className="animate-fade-up delay-100"
            style={{ textAlign: "center", marginBottom: "1rem" }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#5BA4A4",
              }}
            >
              Core Intelligence
            </span>
          </div>

          <h2
            className="animate-fade-up delay-200"
            style={{
              textAlign: "center",
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 800,
              color: "#243B53",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              marginBottom: "0.875rem",
            }}
          >
            Built for depth, not dashboards
          </h2>
          <p
            className="animate-fade-up delay-200"
            style={{
              textAlign: "center",
              fontSize: "1rem",
              color: "#627D98",
              maxWidth: "480px",
              margin: "0 auto 3.5rem",
              lineHeight: 1.65,
            }}
          >
            Three lenses that give you a complete, human picture of how your
            workforce actually works.
          </p>

          {/* cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — TIMELINE STRIP ────────────────── */}
      <section
        className="bg-mesh"
        style={{
          padding: "5rem 1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {[
              { step: "01", title: "Connect", body: "Integrate existing tools — calendar, comms, project boards. No new workflows, no surveillance.", color: "#5BA4A4" },
              { step: "02", title: "Analyse", body: "TIE's AI models surface patterns in collaboration, energy, and contribution — ethically.", color: "#243B53" },
              { step: "03", title: "Understand", body: "Leaders receive clear, contextual intelligence — not scores. Human stories, not metrics.", color: "#A3B18A" },
              { step: "04", title: "Act", body: "Take targeted actions with confidence — better support, smarter structure, right timing.", color: "#5BA4A4" },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`animate-fade-up delay-${(i + 1) * 100}`}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "1.75rem 1.5rem",
                  border: "1px solid rgba(36,59,83,0.08)",
                  boxShadow: "0 2px 12px rgba(36,59,83,0.05)",
                  position: "relative",
                  overflow: "hidden",
                }}
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

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section
        style={{
          background: "#ffffff",
          padding: "5rem 1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(36,59,83,0.12), transparent)",
          }}
        />

        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            textAlign: "center",
            background: "linear-gradient(145deg, #243B53 0%, #1a2d40 100%)",
            borderRadius: "24px",
            padding: "3.5rem 2.5rem",
            boxShadow: "0 20px 60px rgba(36,59,83,0.20), 0 4px 16px rgba(36,59,83,0.12)",
            position: "relative",
            overflow: "hidden",
          }}
        >
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
              <>
                <Link
                  href="/assessment"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "0.875rem 2rem",
                    background: "#5BA4A4",
                    color: "#ffffff",
                    borderRadius: "12px",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 4px 20px rgba(91,164,164,0.40)",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#4a9393";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#5BA4A4";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.13)";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.80)";
                  }}
                >
                  View Insights
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "0.875rem 2rem",
                    background: "#5BA4A4",
                    color: "#ffffff",
                    borderRadius: "12px",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 4px 20px rgba(91,164,164,0.40)",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#4a9393";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#5BA4A4";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.13)";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.80)";
                  }}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Global Footer handles brand info */}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </main>
  );
}