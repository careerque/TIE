"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";

export default function ProfileOutputPage() {
  const router = useRouter();
  const { isLoggedIn, profile, loading: authLoading } = useAuthContext();
  const [showInsights, setShowInsights] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hover states
  const [hoveredButton, setHoveredButton] = useState(false);
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

  useEffect(() => {
    if (!authLoading) {
      // Check authentication status
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }

      // Check if assessment has been completed
      const assessmentDone = localStorage.getItem("assessmentCompleted") === "true";
      if (!assessmentDone) {
        router.push("/welcome");
        return;
      }

      if (profile) {
        const fName = profile.first_name;
        const lName = profile.last_name;
        const emailAddr = profile.email;
        const empId = profile.employee_id;
        const storedInterests = profile.interests;
        const desig = profile.designation;
        const exp = profile.experiense_years;

        const hasInterests = Array.isArray(storedInterests) && storedInterests.length > 0;

        if (
          !fName || !fName.trim() ||
          !lName || !lName.trim() ||
          !emailAddr || !emailAddr.trim() ||
          !empId || !empId.trim() ||
          !hasInterests ||
          !desig || !desig.trim() ||
          (exp === undefined || exp === null || String(exp).trim() === "")
        ) {
          router.push("/profile?incomplete=true");
          return;
        }

        setFirstName(fName || "");
        setLastName(lName || "");
        setEmail(emailAddr || "");
        setEmployeeId(empId || "");
        setInterests(storedInterests || []);
        setDesignation(desig || "");
        setExperience(exp !== null && exp !== undefined ? String(exp) : "");
      } else {
        // If profile doesn't exist, redirect to complete it
        router.push("/profile?incomplete=true");
      }
    }
  }, [profile, isLoggedIn, authLoading, router]);

  useEffect(() => {
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
          "Maintain personal priority lists to avoid context-switching fatigue.",
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

  if (authLoading) {
    return (
      <div className="tie-container">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <div className="tie-card-top-bar" />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#627D98" }}>
            Loading Profile Output...
          </span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Redirecting in useEffect
  }

  return (
    <div className="tie-container profile-output-container" style={{ justifyContent: showInsights ? "flex-start" : "center" }}>
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
            className="tie-card"
            style={{ textAlign: "center" }}
          >
            {/* Top Accent glow */}
            <div className="tie-card-top-bar" />

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
            <h1 className="tie-title" style={{ fontSize: "2rem", marginBottom: "0.5rem", textAlign: "center" }}>
              Congratulations!
            </h1>
            <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#5BA4A4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.5rem" }}>
              You Finished Successfully
            </h2>
            <p className="tie-desc" style={{ marginBottom: "2.5rem", padding: "0 10px", textAlign: "center" }}>
              TIE has mapped your workplace patterns and generated your workforce insight profile.
            </p>

            {/* Action button */}
            <button
              onClick={handleRevealInsights}
              disabled={loading}
              onMouseEnter={() => setHoveredButton(true)}
              onMouseLeave={() => setHoveredButton(false)}
              className="tie-btn-primary"
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
            className="profile-output-dashboard"
          >
            {/* Header section */}
            <div className="profile-output-header">
              <div className="tie-badge">
                <Sparkles className="h-3.5 w-3.5" style={{ color: "#5BA4A4", marginRight: "2px" }} />
                <span>Assessment Output</span>
              </div>
              <h1 className="tie-title" style={{ fontSize: "2.25rem", marginBottom: "0.5rem", textAlign: "center" }}>
                Your Talent Dynamics Insights
              </h1>
              <p className="tie-desc" style={{ textAlign: "center" }}>
                A personalized breakdown of your collaboration habits, change adaptability, and growth vectors.
              </p>
            </div>

            {/* Employee Details Profile Card on page */}
            <div className="profile-output-details-card">
              <div className="profile-output-detail-col">
                <span className="profile-output-detail-label">Employee Name</span>
                <span className="profile-output-detail-value">{firstName} {lastName}</span>
              </div>
              <div className="profile-output-detail-col">
                <span className="profile-output-detail-label">Employee ID</span>
                <span className="profile-output-detail-value">{employeeId}</span>
              </div>
              <div className="profile-output-detail-col">
                <span className="profile-output-detail-label">Interests</span>
                <span className="profile-output-detail-value">{interests.join(", ") || "None"}</span>
              </div>
              <div className="profile-output-detail-col">
                <span className="profile-output-detail-label">Designation</span>
                <span className="profile-output-detail-value">{designation}</span>
              </div>
              <div className="profile-output-detail-col">
                <span className="profile-output-detail-label">Experience</span>
                <span className="profile-output-detail-value">{experience} Years</span>
              </div>
              <div className="profile-output-detail-col">
                <span className="profile-output-detail-label">Email Address</span>
                <span className="profile-output-detail-value">{email}</span>
              </div>
            </div>

            {/* Archetype Banner Card */}
            <div className="profile-output-archetype-card">
              {/* Graphic accents */}
              <div className="profile-output-archetype-accent-glow" />

              <div style={{ flex: 1, minWidth: "280px" }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#5BA4A4", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem", textAlign: "left" }}>
                  Primary Profile Archetype
                </p>
                <h2 className="tie-title" style={{ fontSize: "1.875rem", color: "#ffffff", marginBottom: "0.25rem" }}>
                  {insightsData.archetype}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#A3B18A", fontStyle: "italic", marginBottom: "1rem", fontWeight: 500, textAlign: "left" }}>
                  {insightsData.tagline}
                </p>
                <p style={{ fontSize: "0.875rem", color: "#b0bec8", lineHeight: 1.6, margin: 0, textAlign: "left" }}>
                  {insightsData.summary}
                </p>
              </div>

              <div className="profile-output-archetype-badge">
                <span className="profile-output-archetype-badge-val">
                  91%
                </span>
                <span className="profile-output-archetype-badge-label">
                  Overall Compatibility
                </span>
              </div>
            </div>

            {/* Dimensions Grid */}
            <div className="profile-output-dimensions-grid">
              {insightsData.dimensions.map((dim) => (
                <div
                  key={dim.title}
                  className="profile-output-dimension-card"
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

                    <div style={{ marginBottom: "1rem", textAlign: "left" }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, border: `1px solid ${dim.color}30`, borderRadius: "99px", padding: "3px 10px", textTransform: "uppercase", color: dim.color, background: `${dim.color}05`, letterSpacing: "0.04em" }}>
                        {dim.details}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.78rem", color: "#627D98", lineHeight: 1.6, margin: 0, textAlign: "left" }}>
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
            <div className="profile-output-split-row">
              {/* Card 1: Behavioral Dynamics Insights */}
              <div className="profile-output-split-card">
                <div className="profile-output-card-header">
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
              <div className="profile-output-split-card">
                <div className="profile-output-card-header">
                  <BookOpen className="h-5 w-5" style={{ color: "#5BA4A4" }} />
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#243B53", margin: 0, textAlign: "left" }}>
                    Development & Support Plan
                  </h3>
                </div>

                {/* Sections */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  
                  {/* Friction Area */}
                  <div className="profile-output-friction-block">
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
                    <ul className="profile-output-bullet-list">
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
                    <ul className="profile-output-bullet-list">
                      <li>Provide context behind decisions</li>
                      <li>Offer periodic feedback check-ins</li>
                      <li>Encourage gradual ownership expansion</li>
                    </ul>
                  </div>

                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="profile-output-suggestions-container">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
                <BookOpen className="h-5 w-5" style={{ color: "#5BA4A4" }} />
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#243B53", margin: 0, textAlign: "left" }}>
                  Dimensional Growth Suggestions
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {insightsData.dimensions.map((dim) => (
                  <div key={dim.title} className="profile-output-sug-item">
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
                className="profile-output-btn-retake"
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
                className="profile-output-btn-pdf"
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
                className="profile-output-btn-return"
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
                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0", letterSpacing: "-0.01em", color: "#ffffff" }}>
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
