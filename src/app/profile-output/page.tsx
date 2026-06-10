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
  Loader2,
  AlertCircle,
  Shield,
  HelpCircle,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";

interface ScoringMetrics {
  raw_scores: Record<string, number>;
  primary_pattern: string;
  secondary_pattern: string;
  combination_profile: string;
  primary_strength_pct: number;
  secondary_strength_pct: number;
  flags: string[];
}

interface ManagerSignals {
  s1_adaptability_dominant: string;
  s2_execution_dominant: string;
  s3_support_dominant: string;
  s4_engagement_dominant: string;
}

interface AnalysisResult {
  success: boolean;
  scoring_metrics: ScoringMetrics;
  manager_signals: ManagerSignals;
  report_markdown: string;
}

const TAGLINES: Record<string, string> = {
  "Structured Collaborator": "Process-Oriented & Team-Centric Professional",
  "Steady Executor": "Methodical, Reliable & Result-Driven Builder",
  "Independent Problem Solver": "Autonomous, Analytical & Adaptive Explorer",
  "Adaptive Team Contributor": "Collaborative, Flexible & Initiative-Driven Contributor",
  "Supportive Team Stabilizer": "Empathetic, Stable & Trust-Building Anchor",
  "Practical Adapter": "Pragmatic, Flexible & Experiential Learner",
  "Flexible Adapter": "Highly Versatile & Context-Aware Contributor"
};

const SUMMARIES: Record<string, string> = {
  "Structured Collaborator": "You thrive in structured team environments with clear processes. You balance organization with active cooperation to drive projects forward.",
  "Steady Executor": "You deliver consistent, high-quality results by sticking to proven processes and maintaining a stable pace. You are a reliable anchor for execution.",
  "Independent Problem Solver": "You excel at solving complex challenges autonomously. You value independence and learn best by experimenting and digging deep into problems.",
  "Adaptive Team Contributor": "You easily adjust to new team dynamics and shifting requirements. You bring energy to collaborative spaces and learn quickly by doing.",
  "Supportive Team Stabilizer": "You focus on team harmony, steady pacing, and creating psychological safety. You support others and build trust in relationships.",
  "Practical Adapter": "You tackle changing circumstances with pragmatism. You learn through hands-on experience and keep team objectives grounded.",
  "Flexible Adapter": "You bring a balanced mix of adaptability and execution, adjusting your style to fit the specific needs of your team and current tasks."
};

function getFrictionArea(primaryPattern: string): string {
  switch (primaryPattern) {
    case "SCP":
      return "May experience friction when guidelines are undefined, processes are missing, or goals shift rapidly without documentation.";
    case "FIE":
      return "May feel restricted by micromanagement, highly structured protocols, or limited autonomy in problem solving.";
    case "CCD":
      return "May feel isolated or disengaged in solo tasks without team interaction or during conflicts with no clear consensus.";
    case "SPO":
      return "May experience stress when faced with sudden shifts in workflow, rapid context switching, or intense pacing.";
    default:
      return "May experience friction when balancing personal pace with rapid team changes or navigating communication gaps.";
  }
}

function getGrowthAreas(primaryPattern: string, secondaryPattern: string): string[] {
  const list: string[] = [];
  if (primaryPattern === "SCP" || secondaryPattern === "SCP") {
    list.push("Practice decision-making under uncertainty without waiting for complete info");
    list.push("Build tolerance for flexible, un-documented experiments");
  }
  if (primaryPattern === "FIE" || secondaryPattern === "FIE") {
    list.push("Proactively share knowledge and updates before team check-ins");
    list.push("Align independent tasks with overall group architecture");
  }
  if (primaryPattern === "CCD" || secondaryPattern === "CCD") {
    list.push("Strengthen independent decision confidence and solo execution");
    list.push("Establish personal focus blocks to avoid meeting fatigue");
  }
  if (primaryPattern === "SPO" || secondaryPattern === "SPO") {
    list.push("Build comfort with iterative releases and rapid prototyping");
    list.push("Take active leadership roles during team transitions");
  }
  
  if (list.length < 3) {
    list.push("Improve cross-functional communication clarity");
  }
  if (list.length < 3) {
    list.push("Engage in peer-reviews to align problem-solving styles");
  }
  return list.slice(0, 3);
}

function getManagerSupport(signals: any): string[] {
  if (!signals) return ["Provide context behind decisions", "Offer periodic feedback check-ins", "Encourage gradual ownership expansion"];
  const list: string[] = [];

  if (signals.s1_adaptability_dominant === "SCP") {
    list.push("Provide context behind decisions and clear transition maps.");
  } else if (signals.s1_adaptability_dominant === "FIE") {
    list.push("Provide clear goal alignment but allow space to discover execution routes.");
  } else if (signals.s1_adaptability_dominant === "CCD") {
    list.push("Ensure regular communicative check-ins to support transitions.");
  } else if (signals.s1_adaptability_dominant === "SPO") {
    list.push("Offer predictability and gradual transition pacing.");
  }

  if (signals.s2_execution_dominant === "SCP") {
    list.push("Specify exact scope, deliverables, and quality standards.");
  } else if (signals.s2_execution_dominant === "FIE") {
    list.push("Grant execution details autonomy while maintaining high-level alignment.");
  } else if (signals.s2_execution_dominant === "CCD") {
    list.push("Encourage collaborative pairing or cross-functional reviews.");
  } else if (signals.s2_execution_dominant === "SPO") {
    list.push("Provide stable workloads and respect focus timelines.");
  }

  if (list.length < 3) {
    list.push("Offer periodic feedback check-ins to align expectations.");
  }
  return list.slice(0, 3);
}

interface ParsedSection {
  title: string;
  content: string;
}

function parseMarkdown(md: string): ParsedSection[] {
  if (!md) return [];
  const sections: ParsedSection[] = [];
  const parts = md.split(/(?=^#\s+\d+\.\s+)/m);
  
  parts.forEach((part) => {
    const lines = part.trim().split("\n");
    if (lines.length > 0) {
      let title = lines[0].replace(/^#\s+\d+\.\s+/, "").trim();
      if (lines[0].startsWith("#")) {
        title = lines[0].replace(/^#+\s+/, "").trim();
      }
      const content = lines.slice(1).join("\n").trim();
      if (title || content) {
        sections.push({ title, content });
      }
    }
  });

  return sections;
}

function formatInlineMarkdown(text: string): string {
  let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
  formatted = formatted.replace(/`(.*?)`/g, "<code style='background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.85em;'>$1</code>");
  return formatted;
}

function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} style={{ paddingLeft: "1.25rem", margin: "0.5rem 0", listStyleType: "disc", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ fontSize: "0.85rem", color: "#627D98", lineHeight: 1.5, textAlign: "left" }} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.substring(2));
    } else {
      flushList(String(index));
      if (trimmed) {
        if (trimmed.startsWith("###")) {
          elements.push(
            <h4 key={index} style={{ fontSize: "0.9rem", fontWeight: 800, color: "#243B53", marginTop: "1rem", marginBottom: "0.5rem", textAlign: "left" }} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed.replace(/^###\s+/, "")) }} />
          );
        } else if (trimmed.startsWith("##")) {
          elements.push(
            <h3 key={index} style={{ fontSize: "1rem", fontWeight: 800, color: "#243B53", marginTop: "1.25rem", marginBottom: "0.75rem", textAlign: "left" }} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed.replace(/^##\s+/, "")) }} />
          );
        } else {
          elements.push(
            <p key={index} style={{ marginBottom: "0.75rem", fontSize: "0.85rem", color: "#627D98", lineHeight: 1.5, textAlign: "left" }} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
          );
        }
      }
    }
  });

  flushList("final");

  return <div>{elements}</div>;
}

export default function ProfileOutputPage() {
  const router = useRouter();
  const { isLoggedIn, profile, user, loading: authLoading } = useAuthContext();
  const [showInsights, setShowInsights] = useState(false);
  
  // API loading states
  const [apiLoading, setApiLoading] = useState(true);
  const [apiData, setApiData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Button reveal hover/loading states
  const [revealLoading, setRevealLoading] = useState(false);
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
      if (!isLoggedIn || !user) {
        router.push("/login");
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
        router.push("/profile?incomplete=true");
        return;
      }

      // Fetch dynamic analysis result from the python REST API
      const fetchAIAnalysis = async () => {
        try {
          setApiLoading(true);
          setError(null);
          
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const response = await fetch(`${apiBaseUrl}/api/assessment/analyze`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: user.id }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.detail || "Failed to process assessment metrics.");
          }

          setApiData(result);
        } catch (err: any) {
          console.error("Analysis Fetch Error:", err);
          setError(err.message || "An unexpected error occurred while compiling your report.");
        } finally {
          setApiLoading(false);
        }
      };

      fetchAIAnalysis();
    }
  }, [profile, isLoggedIn, user, authLoading, router]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [showInsights]);

  const handleRevealInsights = () => {
    setRevealLoading(true);
    setTimeout(() => {
      setRevealLoading(false);
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

  if (authLoading || apiLoading) {
    return (
      <div className="tie-container">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ alignItems: "center", justifyContent: "center", minHeight: "300px", textAlign: "center" }}>
          <div className="tie-card-top-bar" />
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: "#5BA4A4", marginBottom: "1.5rem" }} />
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "#243B53" }}>
            Analyzing your work style traits...
          </span>
          <p style={{ fontSize: "0.85rem", color: "#627D98", marginTop: "0.5rem" }}>
            Our Talent Intelligence Engine is compiling your report.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tie-container">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ alignItems: "center", textAlign: "center", maxWidth: "480px" }}>
          <div className="tie-card-top-bar" style={{ background: "#c0392b" }} />
          <div style={{ background: "rgba(220,53,69,0.06)", padding: "16px", borderRadius: "20px", marginBottom: "1.5rem" }}>
            <AlertCircle className="h-10 w-10" style={{ color: "#c0392b" }} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#243B53", marginBottom: "1rem" }}>
            Analysis Failed
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#627D98", lineHeight: 1.6, marginBottom: "2rem" }}>
            {error}
          </p>
          <button
            onClick={() => router.push("/welcome")}
            className="tie-btn-primary"
            style={{ background: "#5BA4A4", border: "none" }}
          >
            Return to Assessment
          </button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Redirecting in useEffect
  }

  // Dynamic mapped profiles based on API result
  const combinationProfile = apiData?.scoring_metrics?.combination_profile || "Flexible Adapter";
  const tagline = TAGLINES[combinationProfile] || "Balanced & Context-Aware Work Style";
  const summary = SUMMARIES[combinationProfile] || "You adapt your style dynamically to align with changing requirements and team environments.";

  const rawScores = apiData?.scoring_metrics?.raw_scores || { SCP: 0, FIE: 0, CCD: 0, SPO: 0 };
  const getPercentage = (score: number) => Math.round((score / 24) * 100);

  const dimensions = [
    {
      title: "Structured Clarity (SCP)",
      score: getPercentage(rawScores.SCP),
      icon: <BookOpen className="h-5 w-5" style={{ color: "#243B53" }} />,
      color: "#243B53",
      details: "Process & Guidelines",
      description: "Measures your value for structured workflows, documentation, clear expectations, and process integrity.",
    },
    {
      title: "Focused Independence (FIE)",
      score: getPercentage(rawScores.FIE),
      icon: <Zap className="h-5 w-5" style={{ color: "#A3B18A" }} />,
      color: "#A3B18A",
      details: "Autonomy & Execution",
      description: "Measures your drive for self-directed problem solving, hands-on experimentation, and execution freedom.",
    },
    {
      title: "Cooperative Collaboration (CCD)",
      score: getPercentage(rawScores.CCD),
      icon: <Users className="h-5 w-5" style={{ color: "#5BA4A4" }} />,
      color: "#5BA4A4",
      details: "Team Alignment",
      description: "Measures your preference for collective brainstorming, consensus building, and cross-functional team synergy.",
    },
    {
      title: "Stable Pace Orientation (SPO)",
      score: getPercentage(rawScores.SPO),
      icon: <TrendingUp className="h-5 w-5" style={{ color: "#E07A5F" }} />,
      color: "#E07A5F",
      details: "Predictable Pacing",
      description: "Measures your comfort with consistent workflows, sustainable project pacing, and supportive dynamics.",
    }
  ];

  const parsedSections = parseMarkdown(apiData?.report_markdown || "");
  const currentFrictionArea = getFrictionArea(apiData?.scoring_metrics?.primary_pattern || "");
  const currentGrowthAreas = getGrowthAreas(apiData?.scoring_metrics?.primary_pattern || "", apiData?.scoring_metrics?.secondary_pattern || "");
  const currentManagerSupport = getManagerSupport(apiData?.manager_signals);

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
              disabled={revealLoading}
              onMouseEnter={() => setHoveredButton(true)}
              onMouseLeave={() => setHoveredButton(false)}
              className="tie-btn-primary"
            >
              {revealLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
              <h1 className="profile-output-title">
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
                <h2 className="profile-output-archetype-title">
                  {combinationProfile}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#A3B18A", fontStyle: "italic", marginBottom: "1rem", fontWeight: 500, textAlign: "left" }}>
                  {tagline}
                </p>
                <p style={{ fontSize: "0.875rem", color: "#b0bec8", lineHeight: 1.6, margin: 0, textAlign: "left" }}>
                  {summary}
                </p>
              </div>

              <div className="profile-output-archetype-badge">
                <span className="profile-output-archetype-badge-val">
                  {apiData?.scoring_metrics?.primary_strength_pct}%
                </span>
                <span className="profile-output-archetype-badge-label">
                  Primary Strength
                </span>
              </div>
            </div>

            {/* Dimensions Grid */}
            <div className="profile-output-dimensions-grid">
              {dimensions.map((dim) => (
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

                {/* Snapshots from API data or Gemini parsed content */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#8fa3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem", textAlign: "left" }}>
                      Workforce Style Snapshot
                    </h4>
                    <p style={{ fontSize: "0.875rem", color: "#627D98", lineHeight: 1.5, margin: 0, textAlign: "left" }}>
                      {parsedSections.find(s => s.title.toLowerCase().includes("snapshot"))?.content?.split("\n")[0] || 
                       "A " + combinationProfile.toLowerCase() + " worker style with primary reliance on structured execution and supportive team dynamics."}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#8fa3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem", textAlign: "left" }}>
                      Growth & Adaptability Style
                    </h4>
                    <p style={{ fontSize: "0.875rem", color: "#627D98", lineHeight: 1.5, margin: 0, textAlign: "left" }}>
                      {parsedSections.find(s => s.title.toLowerCase().includes("change"))?.content?.split("\n")[0] || 
                       "Prefers guided execution and responds well when transition parameters are documented."}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#8fa3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem", textAlign: "left" }}>
                      Collaboration Style
                    </h4>
                    <p style={{ fontSize: "0.875rem", color: "#627D98", lineHeight: 1.5, margin: 0, textAlign: "left" }}>
                      {parsedSections.find(s => s.title.toLowerCase().includes("others"))?.content?.split("\n")[0] || 
                       "Values team alignment, clear ownership boundaries, and empathetic cross-functional feedback."}
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
                      {currentFrictionArea}
                    </p>
                  </div>

                  {/* Growth Areas */}
                  <div>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#243B53", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem", textAlign: "left" }}>
                      Suggested Growth Areas
                    </h4>
                    <ul className="profile-output-bullet-list">
                      {currentGrowthAreas.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Manager Support */}
                  <div style={{ borderTop: "1px solid #f0f4f8", paddingTop: "1rem" }}>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#5BA4A4", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem", textAlign: "left" }}>
                      Recommended Manager Support
                    </h4>
                    <ul className="profile-output-bullet-list">
                      {currentManagerSupport.map((support, idx) => (
                        <li key={idx}>{support}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            </div>

            {/* AI Narrative Analysis Section (Gemini output divided into beautiful cards) */}
            <div className="profile-output-suggestions-container">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
                <Sparkles className="h-5 w-5" style={{ color: "#5BA4A4" }} />
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#243B53", margin: 0, textAlign: "left" }}>
                  Detailed Workforce Personality Report
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                {parsedSections.map((section, idx) => {
                  let sectionIcon = <Sparkles className="h-4 w-4" style={{ color: "#5BA4A4" }} />;
                  if (section.title.toLowerCase().includes("snapshot")) sectionIcon = <Brain className="h-4 w-4" style={{ color: "#5BA4A4" }} />;
                  else if (section.title.toLowerCase().includes("best work")) sectionIcon = <Zap className="h-4 w-4" style={{ color: "#A3B18A" }} />;
                  else if (section.title.toLowerCase().includes("change")) sectionIcon = <RefreshCw className="h-4 w-4" style={{ color: "#5BA4A4" }} />;
                  else if (section.title.toLowerCase().includes("responsibility")) sectionIcon = <Shield className="h-4 w-4" style={{ color: "#243B53" }} />;
                  else if (section.title.toLowerCase().includes("others")) sectionIcon = <Users className="h-4 w-4" style={{ color: "#5BA4A4" }} />;
                  else if (section.title.toLowerCase().includes("frustrate")) sectionIcon = <AlertCircle className="h-4 w-4" style={{ color: "#c0392b" }} />;
                  else if (section.title.toLowerCase().includes("growth")) sectionIcon = <TrendingUp className="h-4 w-4" style={{ color: "#A3B18A" }} />;
                  else if (section.title.toLowerCase().includes("reflection")) sectionIcon = <HelpCircle className="h-4 w-4" style={{ color: "#E07A5F" }} />;

                  return (
                    <div key={idx} className="profile-output-sug-item" style={{ borderBottom: idx === parsedSections.length - 1 ? "none" : "1px solid #f0f4f8", paddingBottom: "1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <div style={{ background: "rgba(91,164,164,0.06)", padding: "6px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {sectionIcon}
                        </div>
                        <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#243B53", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, textAlign: "left" }}>
                          {section.title}
                        </h4>
                      </div>
                      <div style={{ paddingLeft: "0.5rem" }}>
                        <MarkdownRenderer content={section.content} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="profile-output-footer-actions">
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
                    <Loader2 size={14} className="animate-spin" />
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
            height: "auto", // auto height to allow content fit
            minHeight: "1123px",
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
                  {combinationProfile}
                </h3>
                <p style={{ fontSize: "11px", color: "#A3B18A", fontStyle: "italic", margin: 0, fontWeight: 500 }}>
                  {tagline}
                </p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", padding: "10px 16px", borderRadius: "12px", textAlign: "center" }}>
                <span style={{ display: "block", fontSize: "20px", fontWeight: 800, color: "#5BA4A4", lineHeight: 1 }}>
                  {apiData?.scoring_metrics?.primary_strength_pct}%
                </span>
                <span style={{ display: "block", fontSize: "7px", color: "#b0bec8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>
                  Strength
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Insights Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px", boxSizing: "border-box" }}>
            {/* Workforce Style Snapshot */}
            <div style={{ borderLeft: "4px solid #5BA4A4", paddingLeft: "14px", textAlign: "left" }}>
              <h4 style={{ fontSize: "11px", fontWeight: 800, color: "#243B53", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                Workforce Style Snapshot
              </h4>
              <p style={{ fontSize: "11px", color: "#627D98", lineHeight: 1.5, margin: 0 }}>
                {parsedSections.find(s => s.title.toLowerCase().includes("snapshot"))?.content?.split("\n")[0] || 
                 "A " + combinationProfile.toLowerCase() + " worker style with reliance on structured execution and supportive team dynamics."}
              </p>
            </div>

            {/* Growth & Adaptability Style */}
            <div style={{ borderLeft: "4px solid #243B53", paddingLeft: "14px", textAlign: "left" }}>
              <h4 style={{ fontSize: "11px", fontWeight: 800, color: "#243B53", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                Growth & Adaptability Style
              </h4>
              <p style={{ fontSize: "11px", color: "#627D98", lineHeight: 1.5, margin: 0 }}>
                {parsedSections.find(s => s.title.toLowerCase().includes("change"))?.content?.split("\n")[0] || 
                 "Prefers guided execution and responds well when transition parameters are documented."}
              </p>
            </div>

            {/* Collaboration Style */}
            <div style={{ borderLeft: "4px solid #A3B18A", paddingLeft: "14px", textAlign: "left" }}>
              <h4 style={{ fontSize: "11px", fontWeight: 800, color: "#243B53", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                Collaboration Style
              </h4>
              <p style={{ fontSize: "11px", color: "#627D98", lineHeight: 1.5, margin: 0 }}>
                {parsedSections.find(s => s.title.toLowerCase().includes("others"))?.content?.split("\n")[0] || 
                 "Values team alignment, clear ownership boundaries, and empathetic cross-functional feedback."}
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
                  {currentFrictionArea}
                </p>
              </div>

              {/* Suggested Growth Areas */}
              <div style={{ background: "#FDFDFD", border: "1px solid rgba(36, 59, 83, 0.06)", borderRadius: "12px", padding: "12px 16px", textAlign: "left" }}>
                <h4 style={{ fontSize: "10px", fontWeight: 800, color: "#243B53", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  Suggested Growth Areas
                </h4>
                <ul style={{ paddingLeft: "14px", margin: 0, fontSize: "10.5px", color: "#627D98", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {currentGrowthAreas.map((area, idx) => (
                    <li key={idx}>{area}</li>
                  ))}
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
                  {currentManagerSupport.map((support, idx) => (
                    <li key={idx}>{support}</li>
                  ))}
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
