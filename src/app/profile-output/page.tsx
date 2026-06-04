"use client";

import { useState, useEffect, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  TrendingUp,
  Users,
  Zap,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ChevronRight,
  BookOpen,
  Download,
  Check,
} from "lucide-react";
import Link from "next/link";

export default function ProfileOutputPage() {
  const [showInsights, setShowInsights] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hover states
  const [hoveredButton, setHoveredButton] = useState(false);
  const [hoveredRetake, setHoveredRetake] = useState(false);
  const [hoveredReturn, setHoveredReturn] = useState(false);
  const [hoveredCardIdx, setHoveredCardIdx] = useState<number | null>(null);
  const [pdfHovered, setPdfHovered] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Profile Fields States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [designation, setDesignation] = useState("");
  const [experience, setExperience] = useState("");

  // Load details from localStorage & scroll to top on load
  useEffect(() => {
    setFirstName(localStorage.getItem("userFirstName") || "Rahul");
    setLastName(localStorage.getItem("userLastName") || "Sharma");
    setEmail(localStorage.getItem("userEmail") || "rahul.sharma@tie.ai");
    setEmployeeId(localStorage.getItem("userEmployeeId") || "TIE-2026");
    try {
      const storedInterests = localStorage.getItem("userInterests");
      setInterests(storedInterests ? JSON.parse(storedInterests) : []);
    } catch (e) {
      setInterests([]);
    }
    setDesignation(localStorage.getItem("userDesignation") || "Software Engineer");
    setExperience(localStorage.getItem("userExperience") || "3");
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [showInsights]);

  const handleRevealInsights = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowInsights(true);
    }, 1200);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;

      const element = document.getElementById("tie-report-pdf-template");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution crisp text rendering
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`TIE_Workforce_Insight_Report_${firstName}_${lastName}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const insightsData = {
    archetype: "Strategic Catalyzer",
    tagline: "High Adaptability & Collaborative Leadership Profile",
    summary:
      "You thrive in dynamic, collaborative environments where priorities evolve. You lead with empathy and clarity, using structured experimentation to guide teams through change.",
    dimensions: [
      {
        title: "Collaboration Insights",
        score: 88,
        icon: <Users className="h-5 w-5" style={{ color: "#5BA4A4" }} />,
        color: "#5BA4A4",
        details: "Synergistic Collaborator",
        description:
          "You naturally establish clear communication channels and seek consensus before execution. You build deep trust within cross-functional teams, acting as a bridge between structured planners and independent developers.",
        suggestions: [
          "Establish structured check-ins rather than ad-hoc updates to respect quiet focus time.",
          "Lead collaborative design sprints to align developers and stakeholders early on.",
          "Mentor junior members on sharing knowledge proactively across team boundaries.",
        ],
      },
      {
        title: "Adaptability Profile",
        score: 92,
        icon: <Zap className="h-5 w-5" style={{ color: "#243B53" }} />,
        color: "#243B53",
        details: "Agile Navigator",
        description:
          "You have a very high capacity to absorb sudden organizational shifts and navigate ambiguous requirements. Instead of feeling overwhelmed, you break down complex issues and form rapid action plans.",
        suggestions: [
          "Volunteer to lead initiative pilots or experimental sprints.",
          "Document change-management blueprints to help team members who prefer stability.",
          "Maintain clear personal priority lists to avoid context-switching fatigue.",
        ],
      },
      {
        title: "Growth Readiness",
        score: 85,
        icon: <TrendingUp className="h-5 w-5" style={{ color: "#A3B18A" }} />,
        color: "#A3B18A",
        details: "Initiative-Driven Learner",
        description:
          "You are highly motivated by opportunities to learn and solve complex problems. You learn best by doing, using structured examples and trial-and-error to master new systems rapidly.",
        suggestions: [
          "Align your development goals with emerging technical stacks in your organization.",
          "Engage in peer-reviews to absorb different problem-solving paradigms.",
          "Ask for stretch assignments in architecture planning or systems engineering.",
        ],
      },
    ],
  };

  // --- Dynamic Inline Styles ---
  const containerStyle: CSSProperties = {
    minHeight: "calc(100vh - 150px)",
    background: "#F4F7FA",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: showInsights ? "flex-start" : "center",
    padding: "4rem 1.5rem",
    fontFamily: "'Inter', system-ui, sans-serif",
    position: "relative",
    boxSizing: "border-box",
  };

  const cardStyle: CSSProperties = {
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 10px 40px rgba(36,59,83,0.06), 0 2px 8px rgba(36,59,83,0.03)",
    border: "1px solid rgba(36,59,83,0.07)",
    width: "100%",
    maxWidth: "540px",
    padding: "3.5rem 3rem",
    boxSizing: "border-box",
    textAlign: "center",
    position: "relative",
    zIndex: 10,
  };

  const dashboardWidth = {
    width: "100%",
    maxWidth: "920px",
    zIndex: 10,
  };

  const badgeStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(91,164,164,0.1)",
    padding: "6px 14px",
    borderRadius: "99px",
    marginBottom: "1rem",
  };

  const revealButtonStyle: CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "1.125rem 2rem",
    borderRadius: "14px",
    border: "none",
    background: hoveredButton ? "#4a9393" : "#5BA4A4",
    color: "#ffffff",
    fontSize: "0.9375rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(91,164,164,0.25)",
    transition: "all 0.2s ease-in-out",
    fontFamily: "inherit",
    outline: "none",
  };

  const archetypeCardStyle: CSSProperties = {
    background: "linear-gradient(135deg, #243B53 0%, #1a2d40 100%)",
    borderRadius: "24px",
    padding: "2.5rem 3rem",
    color: "#ffffff",
    boxShadow: "0 12px 40px rgba(36,59,83,0.15)",
    border: "1px solid rgba(36,59,83,0.2)",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    marginBottom: "2rem",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "2rem",
  };

  const dimensionCardStyle = (idx: number): CSSProperties => {
    const isHovered = hoveredCardIdx === idx;
    return {
      flex: 1,
      minWidth: "260px",
      background: "#ffffff",
      borderRadius: "20px",
      padding: "1.75rem",
      border: "1px solid rgba(36,59,83,0.06)",
      boxShadow: isHovered ? "0 10px 30px rgba(36,59,83,0.08)" : "0 4px 15px rgba(36,59,83,0.03)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      boxSizing: "border-box",
      transition: "all 0.25s ease-in-out",
      transform: isHovered ? "translateY(-3px)" : "translateY(0)",
    };
  };

  const suggestionsContainerStyle: CSSProperties = {
    background: "#ffffff",
    border: "1px solid rgba(36,59,83,0.06)",
    borderRadius: "24px",
    padding: "2.5rem",
    boxShadow: "0 4px 20px rgba(36,59,83,0.03)",
    boxSizing: "border-box",
    marginBottom: "2.5rem",
  };

  const retakeButtonStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "0.875rem 1.75rem",
    background: "rgba(255,255,255,0.8)",
    color: "#243B53",
    border: "1.5px solid rgba(36, 59, 83, 0.15)",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
    boxShadow: hoveredRetake ? "0 4px 12px rgba(36,59,83,0.06)" : "none",
    transform: hoveredRetake ? "translateY(-1px)" : "none",
    textDecoration: "none",
    boxSizing: "border-box",
  };

  const returnButtonStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "0.875rem 2rem",
    background: hoveredReturn ? "#1a2d40" : "#243B53",
    color: "#ffffff",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
    boxShadow: "0 4px 14px rgba(36,59,83,0.15)",
    transform: hoveredReturn ? "translateY(-1px)" : "none",
    textDecoration: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={containerStyle}>
      {/* Background blobs */}
      <div aria-hidden style={{ position: "absolute", top: "-130px", right: "-130px", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,164,164,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", bottom: "-130px", left: "-130px", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle, rgba(163,177,138,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <AnimatePresence mode="wait">
        {!showInsights ? (
          <motion.div
            key="congratulations"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={cardStyle}
          >
            {/* Top Accent glow */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #243B53 0%, #5BA4A4 55%, #A3B18A 100%)" }} />

            {/* Checkmark animation container */}
            <div style={{ position: "relative", marginBottom: "2rem", display: "flex", justifyContent: "center" }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.1, 1] }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                style={{ display: "flex", width: "80px", height: "80px", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(163,177,138,0.1)", border: "2px solid #A3B18A", boxSizing: "border-box" }}
              >
                <CheckCircle className="h-10 w-10 text-[#A3B18A]" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                style={{ position: "absolute", inset: 0, margin: "auto", width: "80px", height: "80px", borderRadius: "50%", border: "1px solid rgba(163,177,138,0.3)", pointerEvents: "none" }}
              />
            </div>

            {/* Content */}
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#243B53", letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
              Congratulations!
            </h1>
            <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#5BA4A4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.5rem" }}>
              You Finished Successfully
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#627D98", lineHeight: 1.6, marginBottom: "2.5rem", padding: "0 10px" }}>
              TIE has mapped your workplace patterns and generated your workforce insight profile.
            </p>

            {/* Action button */}
            <button
              onClick={handleRevealInsights}
              disabled={loading}
              onMouseEnter={() => setHoveredButton(true)}
              onMouseLeave={() => setHoveredButton(false)}
              style={revealButtonStyle}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing Assessment...
                </>
              ) : (
                <>
                  View My Workforce Insights
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={dashboardWidth}
          >
            {/* Header section */}
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div style={badgeStyle}>
                <Sparkles className="h-3.5 w-3.5" style={{ color: "#5BA4A4" }} />
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#5BA4A4", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Assessment Output
                </span>
              </div>
              <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#243B53", letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
                Your Talent Dynamics Insights
              </h1>
              <p style={{ fontSize: "0.9375rem", color: "#627D98", margin: 0 }}>
                A personalized breakdown of your collaboration habits, change adaptability, and growth vectors.
              </p>
            </div>

            {/* Employee Details Profile Card on page */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(36, 59, 83, 0.07)",
                borderRadius: "20px",
                padding: "1.5rem 2rem",
                boxShadow: "0 4px 15px rgba(36,59,83,0.02)",
                marginBottom: "2rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem 2rem",
                boxSizing: "border-box",
                width: "100%",
              }}
            >
              <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#8fa3b8", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>Employee Name</span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#243B53", textAlign: "left" }}>{firstName} {lastName}</span>
              </div>
              <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#8fa3b8", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>Employee ID</span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#243B53", textAlign: "left" }}>{employeeId}</span>
              </div>
              <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#8fa3b8", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>Interests</span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#243B53", textAlign: "left" }}>{interests.join(", ") || "None"}</span>
              </div>
              <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#8fa3b8", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>Designation</span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#243B53", textAlign: "left" }}>{designation}</span>
              </div>
              <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#8fa3b8", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>Experience</span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#243B53", textAlign: "left" }}>{experience} Years</span>
              </div>
              <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#8fa3b8", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>Email Address</span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#243B53", textAlign: "left" }}>{email}</span>
              </div>
            </div>

            {/* Archetype Banner Card */}
            <div style={archetypeCardStyle}>
              {/* Graphic accents */}
              <div style={{ position: "absolute", right: 0, top: 0, height: "100%", width: "40%", background: "radial-gradient(circle, rgba(91,164,164,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

              <div style={{ flex: 1, minWidth: "280px" }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#5BA4A4", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Primary Profile Archetype
                </p>
                <h2 style={{ fontSize: "1.875rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
                  {insightsData.archetype}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#A3B18A", fontStyle: "italic", marginBottom: "1rem", fontWeight: 500 }}>
                  {insightsData.tagline}
                </p>
                <p style={{ fontSize: "0.875rem", color: "#b0bec8", lineHeight: 1.6, margin: 0 }}>
                  {insightsData.summary}
                </p>
              </div>

              <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", padding: "1.5rem 2rem", borderRadius: "16px", textAlign: "center", minWidth: "160px" }}>
                <span style={{ display: "block", fontSize: "2.5rem", fontWeight: 800, color: "#5BA4A4", lineHeight: 1 }}>
                  91%
                </span>
                <span style={{ display: "block", fontSize: "9px", fontWeight: 700, color: "#b0bec8", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.5rem" }}>
                  Overall Compatibility
                </span>
              </div>
            </div>

            {/* Dimensions Grid */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2rem" }}>
              {insightsData.dimensions.map((dim, i) => (
                <div
                  key={dim.title}
                  onMouseEnter={() => setHoveredCardIdx(i)}
                  onMouseLeave={() => setHoveredCardIdx(null)}
                  style={dimensionCardStyle(i)}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ background: `${dim.color}12`, padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {dim.icon}
                        </div>
                        <h3 style={{ fontSize: "0.875rem", fontWeight: 800, color: "#243B53", margin: 0 }}>
                          {dim.title}
                        </h3>
                      </div>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: dim.color }}>
                        {dim.score}%
                      </span>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, border: `1px solid ${dim.color}30`, borderRadius: "99px", padding: "3px 10px", textTransform: "uppercase", color: dim.color, background: `${dim.color}05`, letterSpacing: "0.04em" }}>
                        {dim.details}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.78rem", color: "#627D98", lineHeight: 1.6, margin: 0 }}>
                      {dim.description}
                    </p>
                  </div>

                  {/* Progress Line */}
                  <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #f0f4f8" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 700, color: "#9aa8b6", textTransform: "uppercase", marginBottom: "0.375rem" }}>
                      <span>Dimensional Strength</span>
                      <span>{dim.score}%</span>
                    </div>
                    <div style={{ height: "5px", width: "100%", background: "#F4F7FA", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ width: `${dim.score}%`, height: "100%", background: dim.color, borderRadius: "99px" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Qualitative Snapshot and Friction/Growth Areas */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1.5rem",
                marginBottom: "2.5rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Card 1: Behavioral Dynamics Insights */}
              <div
                style={{
                  flex: "1 1 400px",
                  background: "#ffffff",
                  border: "1px solid rgba(36, 59, 83, 0.07)",
                  borderRadius: "24px",
                  padding: "2.25rem 2.5rem",
                  boxShadow: "0 4px 20px rgba(36,59,83,0.03)",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid #f0f4f8", paddingBottom: "1rem" }}>
                  <Sparkles className="h-5 w-5" style={{ color: "#5BA4A4" }} />
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#243B53", margin: 0, textAlign: "left" }}>
                    Workplace Dynamics Insights
                  </h3>
                </div>

                {/* Snapshots */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#8fa3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem", textAlign: "left" }}>
                      Workforce Style Snapshot
                    </h4>
                    <p style={{ fontSize: "0.875rem", color: "#627D98", lineHeight: 1.5, margin: 0, textAlign: "left" }}>
                      Collaborative and structured contributor who performs best with clarity, trust, and meaningful team interaction.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#8fa3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem", textAlign: "left" }}>
                      Growth & Adaptability Style
                    </h4>
                    <p style={{ fontSize: "0.875rem", color: "#627D98", lineHeight: 1.5, margin: 0, textAlign: "left" }}>
                      Prefers guided adaptation and understands change better when the purpose and expectations are clearly communicated.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#8fa3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem", textAlign: "left" }}>
                      Collaboration Style
                    </h4>
                    <p style={{ fontSize: "0.875rem", color: "#627D98", lineHeight: 1.5, margin: 0, textAlign: "left" }}>
                      Strong preference for collaborative environments, active discussions, and supportive teamwork.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Development & Manager Support Plan */}
              <div
                style={{
                  flex: "1 1 400px",
                  background: "#ffffff",
                  border: "1px solid rgba(36, 59, 83, 0.07)",
                  borderRadius: "24px",
                  padding: "2.25rem 2.5rem",
                  boxShadow: "0 4px 20px rgba(36,59,83,0.03)",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid #f0f4f8", paddingBottom: "1rem" }}>
                  <BookOpen className="h-5 w-5" style={{ color: "#5BA4A4" }} />
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#243B53", margin: 0, textAlign: "left" }}>
                    Development & Support Plan
                  </h3>
                </div>

                {/* Sections */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  
                  {/* Friction Area */}
                  <div style={{ background: "rgba(220, 53, 69, 0.03)", border: "1px solid rgba(220, 53, 69, 0.1)", borderRadius: "14px", padding: "1rem" }}>
                    <h4 style={{ fontSize: "0.72rem", fontWeight: 800, color: "#c0392b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem", textAlign: "left" }}>
                      Potential Workplace Friction Areas
                    </h4>
                    <p style={{ fontSize: "0.85rem", color: "#c0392b", lineHeight: 1.4, margin: 0, textAlign: "left" }}>
                      May experience stress during highly ambiguous transitions or when expectations are unclear.
                    </p>
                  </div>

                  {/* Growth Areas */}
                  <div>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#243B53", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem", textAlign: "left" }}>
                      Suggested Growth Areas
                    </h4>
                    <ul style={{ paddingLeft: "1.25rem", margin: 0, fontSize: "0.85rem", color: "#627D98", display: "flex", flexDirection: "column", gap: "0.375rem", textAlign: "left" }}>
                      <li>Improve independent decision confidence</li>
                      <li>Increase experimentation comfort</li>
                      <li>Build execution speed during uncertainty</li>
                    </ul>
                  </div>

                  {/* Manager Support */}
                  <div style={{ borderTop: "1px solid #f0f4f8", paddingTop: "1rem" }}>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#5BA4A4", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem", textAlign: "left" }}>
                      Recommended Manager Support
                    </h4>
                    <ul style={{ paddingLeft: "1.25rem", margin: 0, fontSize: "0.85rem", color: "#627D98", display: "flex", flexDirection: "column", gap: "0.375rem", textAlign: "left" }}>
                      <li>Provide context behind decisions</li>
                      <li>Offer periodic feedback check-ins</li>
                      <li>Encourage gradual ownership expansion</li>
                    </ul>
                  </div>

                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            <div style={suggestionsContainerStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
                <BookOpen className="h-5 w-5" style={{ color: "#5BA4A4" }} />
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#243B53", margin: 0, textAlign: "left" }}>
                  Dimensional Growth Suggestions
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {insightsData.dimensions.map((dim) => (
                  <div key={dim.title} style={{ paddingBottom: "1.5rem", borderBottom: "1px solid #f0f4f8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                      <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: dim.color }} />
                      <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#243B53", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, textAlign: "left" }}>
                        {dim.title} Suggestions
                      </h4>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingLeft: "0.75rem" }}>
                      {dim.suggestions.map((sug, idx) => (
                        <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "0.8rem", color: "#627D98", lineHeight: 1.5, textAlign: "left" }}>
                          <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "#5BA4A4", marginTop: "1px" }} />
                          <span>{sug}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: "1.25rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              <Link
                href="/welcome"
                onMouseEnter={() => setHoveredRetake(true)}
                onMouseLeave={() => setHoveredRetake(false)}
                style={retakeButtonStyle}
              >
                <RefreshCw size={14} />
                Retake Assessment
              </Link>

              {/* Download PDF Button */}
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                onMouseEnter={() => setPdfHovered(true)}
                onMouseLeave={() => setPdfHovered(false)}
                style={{
                  ...retakeButtonStyle,
                  background: pdfHovered ? "rgba(91,164,164,0.08)" : "rgba(255,255,255,0.8)",
                  color: "#5BA4A4",
                  borderColor: "rgba(91,164,164,0.3)",
                  boxShadow: pdfHovered ? "0 4px 12px rgba(91,164,164,0.06)" : "none",
                  transform: pdfHovered ? "translateY(-1px)" : "none",
                }}
              >
                {isGeneratingPdf ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    Download PDF Report
                  </>
                )}
              </button>

              <Link
                href="/"
                onMouseEnter={() => setHoveredReturn(true)}
                onMouseLeave={() => setHoveredReturn(false)}
                style={returnButtonStyle}
              >
                Return to Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invisible wrapper for html2canvas PDF rendering */}
      <div style={{ position: "absolute", width: "0", height: "0", overflow: "hidden", zIndex: -100 }}>
        <div
          id="tie-report-pdf-template"
          style={{
            width: "794px", // exact A4 pixel width at 96dpi
            height: "1123px", // exact A4 pixel height at 96dpi
            padding: "50px",
            background: "#ffffff",
            fontFamily: "'Inter', -apple-system, sans-serif",
            boxSizing: "border-box",
            color: "#1F2933",
            position: "relative",
          }}
        >
          {/* PDF Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <div
              style={{
                width: "110px",
                height: "50px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                src="/logo.png"
                alt="TIE Logo"
                style={{
                  position: "absolute",
                  top: "-30px",
                  left: "0",
                  width: "110px",
                  height: "110px",
                }}
              />
            </div>
            <div style={{ textAlign: "right" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#243B53", letterSpacing: "0.05em", margin: 0, textTransform: "uppercase" }}>
                Talent Intelligence Engine
              </h2>
              <p style={{ fontSize: "10px", color: "#627D98", margin: "2px 0 0" }}>
                Workforce Style Insights Report
              </p>
            </div>
          </div>

          {/* Teal Divider */}
          <div style={{ height: "4px", width: "100%", background: "#5BA4A4", marginBottom: "20px" }} />

          {/* Title Area */}
          <h1 style={{ fontSize: "18px", fontWeight: 800, color: "#243B53", letterSpacing: "-0.02em", margin: "0 0 16px", textTransform: "uppercase", textAlign: "left" }}>
            Employee Workforce Assessment Profile
          </h1>

          {/* Employee Details flex layout */}
          <div
            style={{
              background: "#F4F7FA",
              border: "1px solid rgba(36, 59, 83, 0.08)",
              borderRadius: "14px",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 0px",
            }}
          >
            <div style={{ display: "flex", width: "50%", fontSize: "12px", boxSizing: "border-box" }}>
              <span style={{ fontWeight: 700, color: "#8fa3b8", width: "115px", textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.03em" }}>Employee Name:</span>
              <span style={{ fontWeight: 700, color: "#243B53" }}>{firstName} {lastName}</span>
            </div>
            <div style={{ display: "flex", width: "50%", fontSize: "12px", boxSizing: "border-box" }}>
              <span style={{ fontWeight: 700, color: "#8fa3b8", width: "115px", textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.03em" }}>Employee ID:</span>
              <span style={{ fontWeight: 700, color: "#243B53" }}>{employeeId}</span>
            </div>
            <div style={{ display: "flex", width: "50%", fontSize: "12px", boxSizing: "border-box" }}>
              <span style={{ fontWeight: 700, color: "#8fa3b8", width: "115px", textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.03em" }}>Interests:</span>
              <span style={{ fontWeight: 700, color: "#243B53" }}>{interests.join(", ") || "None"}</span>
            </div>
            <div style={{ display: "flex", width: "50%", fontSize: "12px", boxSizing: "border-box" }}>
              <span style={{ fontWeight: 700, color: "#8fa3b8", width: "115px", textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.03em" }}>Designation:</span>
              <span style={{ fontWeight: 700, color: "#243B53" }}>{designation}</span>
            </div>
            <div style={{ display: "flex", width: "50%", fontSize: "12px", boxSizing: "border-box" }}>
              <span style={{ fontWeight: 700, color: "#8fa3b8", width: "115px", textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.03em" }}>Experience:</span>
              <span style={{ fontWeight: 700, color: "#243B53" }}>{experience} Years</span>
            </div>
            <div style={{ display: "flex", width: "50%", fontSize: "12px", boxSizing: "border-box" }}>
              <span style={{ fontWeight: 700, color: "#8fa3b8", width: "115px", textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.03em" }}>Email Address:</span>
              <span style={{ fontWeight: 700, color: "#243B53" }}>{email}</span>
            </div>
          </div>

          {/* Archetype Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #243B53 0%, #1a2d40 100%)",
              borderRadius: "16px",
              padding: "20px 24px",
              color: "#ffffff",
              marginBottom: "20px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#5BA4A4", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Primary Profile Archetype
                </span>
                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0", letterSpacing: "-0.01em" }}>
                  {insightsData.archetype}
                </h3>
                <p style={{ fontSize: "11px", color: "#A3B18A", fontStyle: "italic", margin: 0, fontWeight: 500 }}>
                  {insightsData.tagline}
                </p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", padding: "10px 16px", borderRadius: "12px", textAlign: "center" }}>
                <span style={{ display: "block", fontSize: "20px", fontWeight: 800, color: "#5BA4A4", lineHeight: 1 }}>
                  91%
                </span>
                <span style={{ display: "block", fontSize: "7px", color: "#b0bec8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>
                  Compatibility
                </span>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px", boxSizing: "border-box" }}>
            {/* Workforce Style Snapshot */}
            <div style={{ borderLeft: "4px solid #5BA4A4", paddingLeft: "14px", textAlign: "left" }}>
              <h4 style={{ fontSize: "11px", fontWeight: 800, color: "#243B53", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                Workforce Style Snapshot
              </h4>
              <p style={{ fontSize: "11px", color: "#627D98", lineHeight: 1.5, margin: 0 }}>
                Collaborative and structured contributor who performs best with clarity, trust, and meaningful team interaction.
              </p>
            </div>

            {/* Growth & Adaptability Style */}
            <div style={{ borderLeft: "4px solid #243B53", paddingLeft: "14px", textAlign: "left" }}>
              <h4 style={{ fontSize: "11px", fontWeight: 800, color: "#243B53", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                Growth & Adaptability Style
              </h4>
              <p style={{ fontSize: "11px", color: "#627D98", lineHeight: 1.5, margin: 0 }}>
                Prefers guided adaptation and understands change better when the purpose and expectations are clearly communicated.
              </p>
            </div>

            {/* Collaboration Style */}
            <div style={{ borderLeft: "4px solid #A3B18A", paddingLeft: "14px", textAlign: "left" }}>
              <h4 style={{ fontSize: "11px", fontWeight: 800, color: "#243B53", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                Collaboration Style
              </h4>
              <p style={{ fontSize: "11px", color: "#627D98", lineHeight: 1.5, margin: 0 }}>
                Strong preference for collaborative environments, active discussions, and supportive teamwork.
              </p>
            </div>
          </div>

          {/* Friction & Growth Columns */}
          <div style={{ display: "flex", gap: "24px", marginBottom: "25px", boxSizing: "border-box" }}>
            {/* Left Column */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px", boxSizing: "border-box" }}>
              {/* Workplace Friction Areas */}
              <div style={{ background: "rgba(220, 53, 69, 0.03)", border: "1px solid rgba(220, 53, 69, 0.1)", borderRadius: "12px", padding: "12px 16px", textAlign: "left" }}>
                <h4 style={{ fontSize: "10px", fontWeight: 800, color: "#c0392b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
                  Potential Workplace Friction Areas
                </h4>
                <p style={{ fontSize: "10.5px", color: "#c0392b", lineHeight: 1.4, margin: 0 }}>
                  May experience stress during highly ambiguous transitions or when expectations are unclear.
                </p>
              </div>

              {/* Suggested Growth Areas */}
              <div style={{ background: "#FDFDFD", border: "1px solid rgba(36, 59, 83, 0.06)", borderRadius: "12px", padding: "12px 16px", textAlign: "left" }}>
                <h4 style={{ fontSize: "10px", fontWeight: 800, color: "#243B53", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  Suggested Growth Areas
                </h4>
                <ul style={{ paddingLeft: "14px", margin: 0, fontSize: "10.5px", color: "#627D98", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>Improve independent decision confidence</li>
                  <li>Increase experimentation comfort</li>
                  <li>Build execution speed during uncertainty</li>
                </ul>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ flex: 1, boxSizing: "border-box" }}>
              {/* Recommended Manager Support */}
              <div style={{ height: "100%", background: "#F4F9F9", border: "1px solid rgba(91, 164, 164, 0.15)", borderRadius: "12px", padding: "12px 16px", boxSizing: "border-box", textAlign: "left" }}>
                <h4 style={{ fontSize: "10px", fontWeight: 800, color: "#5BA4A4", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  Recommended Manager Support
                </h4>
                <ul style={{ paddingLeft: "14px", margin: 0, fontSize: "10.5px", color: "#627D98", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>Provide context behind decisions</li>
                  <li>Offer periodic feedback check-ins</li>
                  <li>Encourage gradual ownership expansion</li>
                </ul>
              </div>
            </div>
          </div>

          {/* PDF Footer */}
          <div style={{ borderTop: "1px solid rgba(36, 59, 83, 0.08)", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#8fa3b8", fontWeight: 500 }}>
            <span>CONFIDENTIAL REPORT - TALENT INTELLIGENCE ENGINE (TIE)</span>
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


