"use client";

import { useEffect, useState, CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Clock, ArrowRight, Sparkles, Check } from "lucide-react";

export default function AssessmentWelcomePage() {
  const router = useRouter();
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [ctaHovered, setCtaHovered] = useState(false);

  useEffect(() => {
    // Check authentication
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // Fetch dynamic question count
    const fetchQuestions = async () => {
      try {
        const res = await fetch("/questions.json");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setQuestionCount(data.length);
          }
        }
      } catch (err) {
        console.error("Failed to load questions count:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [router]);

  const totalQuestions = questionCount || 10;
  const estimatedMins = totalQuestions * 1; // 1 min per question

  // --- Premium Inline Styles ---
  const containerStyle: CSSProperties = {
    minHeight: "calc(100vh - 120px)",
    background: "#F4F7FA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3.5rem 1.5rem",
    fontFamily: "'Inter', -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  };

  const dotGridStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: "radial-gradient(circle, rgba(36, 59, 83, 0.05) 1px, transparent 1px)",
    backgroundSize: "22px 22px",
    pointerEvents: "none",
    opacity: 0.8,
  };

  const cardStyle: CSSProperties = {
    position: "relative",
    background: "#ffffff",
    border: "1px solid rgba(36, 59, 83, 0.08)",
    boxShadow: "0 20px 50px rgba(36, 59, 83, 0.04), 0 4px 12px rgba(36, 59, 83, 0.01)",
    borderRadius: "28px",
    maxWidth: "680px",
    width: "100%",
    padding: "3.5rem 3rem",
    display: "flex",
    flexDirection: "column",
    gap: "2.5rem",
    boxSizing: "border-box",
    zIndex: 10,
  };

  const topBarStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "6px",
    background: "linear-gradient(90deg, #5BA4A4 0%, #243B53 100%)",
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.125rem",
    textAlign: "left",
    alignItems: "flex-start",
  };

  const badgeStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(91, 164, 164, 0.08)",
    color: "#5BA4A4",
    padding: "5px 12px",
    borderRadius: "99px",
    fontSize: "0.6875rem",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    border: "1px solid rgba(91, 164, 164, 0.15)",
  };

  const titleStyle: CSSProperties = {
    fontSize: "1.875rem",
    fontWeight: 800,
    color: "#243B53",
    letterSpacing: "-0.02em",
    lineHeight: 1.25,
    margin: 0,
  };

  const descriptionStyle: CSSProperties = {
    fontSize: "0.9375rem",
    color: "#627D98",
    lineHeight: 1.6,
    margin: 0,
  };

  const statsStripStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "#F4F7FA",
    border: "1px solid rgba(36, 59, 83, 0.05)",
    borderRadius: "18px",
    padding: "1.5rem 1rem",
    boxSizing: "border-box",
    textAlign: "center",
  };

  const statsColLeftStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    borderRight: "1px solid rgba(36, 59, 83, 0.1)",
  };

  const statsColRightStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
  };

  const statsLabelStyle: CSSProperties = {
    fontSize: "0.6875rem",
    fontWeight: 700,
    color: "#8fa3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const statsValueStyle: CSSProperties = {
    fontSize: "1rem",
    fontWeight: 800,
    color: "#243B53",
  };

  const outcomesBlockStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.125rem",
    boxSizing: "border-box",
  };

  const outcomesTitleStyle: CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: 800,
    color: "#243B53",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: 0,
    textAlign: "left",
  };

  const listStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: 0,
    margin: 0,
    listStyleType: "none",
  };

  const listItemStyle: CSSProperties = {
    display: "flex",
    gap: "0.875rem",
    alignItems: "flex-start",
    fontSize: "0.875rem",
    color: "#1F2933",
    lineHeight: 1.55,
  };

  const checkCircleStyle: CSSProperties = {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "rgba(163, 177, 138, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#A3B18A",
    flexShrink: 0,
    marginTop: "2px",
  };

  const actionBlockStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    boxSizing: "border-box",
  };

  const ctaButtonStyle: CSSProperties = {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "1.125rem 2rem",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "0.9375rem",
    borderRadius: "12px",
    transition: "all 0.25s ease-in-out",
    cursor: "pointer",
    textDecoration: "none",
    border: "none",
    background: ctaHovered ? "#4a9393" : "#5BA4A4",
    transform: ctaHovered ? "translateY(-1.5px)" : "translateY(0)",
    boxShadow: ctaHovered ? "0 6px 18px rgba(91, 164, 164, 0.38)" : "0 4px 14px rgba(91, 164, 164, 0.25)",
  };

  return (
    <main style={containerStyle}>
      {/* ── Background decoration ── */}
      <div style={dotGridStyle} aria-hidden />
      
      {/* Ambient gradient blobs */}
      <div 
        aria-hidden 
        style={{
          position: "absolute",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          pointerEvents: "none",
          top: "-160px",
          right: "-160px",
          background: "radial-gradient(circle, rgba(91,164,164,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
          opacity: 0.6
        }}
      />
      <div 
        aria-hidden 
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          pointerEvents: "none",
          bottom: "-120px",
          left: "-120px",
          background: "radial-gradient(circle, rgba(36,59,83,0.1) 0%, transparent 70%)",
          filter: "blur(45px)",
          opacity: 0.5
        }}
      />

      {/* ── Main Centered Intro Card ── */}
      <div style={cardStyle}>
        {/* Top border accent line */}
        <div style={topBarStyle} />

        {/* 1. Header Area with Generous Spacing */}
        <div style={headerStyle}>
          <div style={badgeStyle}>
            <Sparkles size={11} style={{ marginRight: "2px" }} />
            Talent Assessment
          </div>
          
          <h1 style={titleStyle}>
            Workforce Insight Assessment
          </h1>
          
          <p style={descriptionStyle}>
            Evaluate your professional work styles, collaboration preferences, and adaptive strengths. This evaluation generates a personalized talent index report.
          </p>
        </div>

        {/* 2. Horizontal Information strip - Clean 2-column layout */}
        <div style={statsStripStyle}>
          <div style={statsColLeftStyle}>
            <ClipboardList size={20} style={{ color: "#5BA4A4" }} />
            <span style={statsLabelStyle}>Questions</span>
            <span style={statsValueStyle}>
              {loading ? "..." : `${totalQuestions} Items`}
            </span>
          </div>
          
          <div style={statsColRightStyle}>
            <Clock size={20} style={{ color: "#5BA4A4" }} />
            <span style={statsLabelStyle}>Duration</span>
            <span style={statsValueStyle}>
              {loading ? "..." : `~${estimatedMins} Mins`}
            </span>
          </div>
        </div>

        {/* 3. Expected Outcomes List - Clean Open Layout */}
        <div style={outcomesBlockStyle}>
          <h3 style={outcomesTitleStyle}>
            What You will receive:
          </h3>
          <ul style={listStyle}>
            {[
              "Real-time evaluation profile mapping core team roles",
              "Detailed communication and collaboration preference index",
              "Actionable leadership feedback and professional alignment insights"
            ].map((item, idx) => (
              <li key={idx} style={listItemStyle}>
                <div style={checkCircleStyle}>
                  <Check size={11} strokeWidth={3.5} />
                </div>
                <span style={{ flex: 1, textAlign: "left" }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Action Area with Direct Navigation */}
        <div style={actionBlockStyle}>
          <Link
            href="/assessment"
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            style={ctaButtonStyle}
          >
            <span>Start Assessment</span>
            <ArrowRight 
              size={16} 
              style={{
                transition: "transform 0.2s",
                transform: ctaHovered ? "translateX(3px)" : "translateX(0)"
              }}
            />
          </Link>
        </div>
      </div>
    </main>
  );
}