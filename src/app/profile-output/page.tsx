"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  Brain,
  X,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { updateProfile } from "@/services/auth/ProfileServices";
import { supabasedb } from "@/lib/supabaseClient";
import { CookieUtils } from "@/lib/cookieUtils";
import ReportViewer from "@/components/ReportViewer";

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

export default function ProfileOutputPage() {
  const router = useRouter();
  const { isLoggedIn, profile, user, loading: authLoading, refreshProfile } = useAuthContext();
  
  // API loading states
  const [apiLoading, setApiLoading] = useState(true);
  const [apiData, setApiData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("Analyzing your assessment responses...");
  const [resolvedTargetUserId, setResolvedTargetUserId] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState("");

  useEffect(() => {
    if (apiLoading) {
      const texts = [
        "Analyzing your assessment responses...",
        "Identifying primary behavioral dimensions...",
        "Synthesizing workforce archetype profiles...",
        "Generating dynamic report insights..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [apiLoading]);

  // Profile Fields States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [designation, setDesignation] = useState("");
  const [experience, setExperience] = useState("");

  // Profile Inline Form & Submission States
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [interestInput, setInterestInput] = useState("");
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !employeeId.trim() ||
      !designation.trim() ||
      !experience.trim() ||
      interests.length === 0
    ) {
      setFormValidationError("Please fill out all fields and add at least one interest.");
      return;
    }

    const expNum = Number(experience);
    if (isNaN(expNum) || expNum < 0) {
      setFormValidationError("Please enter a valid number of years for experience.");
      return;
    }

    setIsSavingProfile(true);
    try {
      if (user) {
        await updateProfile({
          first_name: firstName,
          last_name: lastName,
          employee_id: employeeId,
          designation,
          experience_years: expNum,
          interests
        });
        await refreshProfile();
        setProfileIncomplete(false);
        fetchAIAnalysis(user.id);
      }
    } catch (err: any) {
      setFormValidationError(err.message || "Failed to update profile details.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterestTag();
    }
  };

  const addInterestTag = () => {
    const val = interestInput.trim();
    if (val && !interests.includes(val)) {
      setInterests((prev) => [...prev, val]);
      setInterestInput("");
    }
  };

  const removeInterestTag = (tagToRemove: string) => {
    setInterests((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const fetchAIAnalysis = useCallback(async (userId: string) => {
    setApiLoading(true);
    setError(null);

    try {
      const session = await supabasedb.auth.getSession();
      const jwtToken = session.data.session?.access_token;
      
      if (!jwtToken) {
        throw new Error("Session expired. Please log in again.");
      }

      let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      if (apiBaseUrl.endsWith("/")) {
        apiBaseUrl = apiBaseUrl.slice(0, -1);
      }
      const response = await fetch(`${apiBaseUrl}/api/assessment/report/${userId}`, {
        headers: {
          "Authorization": `Bearer ${jwtToken}`
        }
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to generate report.");
      }

      setApiData(result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while compiling your report.");
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      // Check authentication status
      if (!isLoggedIn || !user) {
        router.push("/login");
        return;
      }

      if (profile?.company_id) {
        const fetchSlugsAndRedirect = async () => {
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

          router.push(`/${resolvedComp}/${resolvedTm}/user`);
        };
        fetchSlugsAndRedirect();
        return;
      }

      const resolveProfileAndFetch = async () => {
        try {
          let targetUserId = user.id;
          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const queryUserId = params.get("userId");
            if (queryUserId) {
              targetUserId = queryUserId;
            }
          }
          setResolvedTargetUserId(targetUserId);

          let profileToUse = profile;
          if (targetUserId !== user.id) {
            const { data, error: profileErr } = await supabasedb
              .from("profiles")
              .select("*")
              .eq("id", targetUserId)
              .single();
            if (!profileErr && data) {
              const expVal = data.experience_years !== null && data.experience_years !== undefined 
                ? data.experience_years 
                : 0;
              profileToUse = {
                ...data,
                experience_years: String(expVal)
              };
            } else {
              setError("Failed to fetch target user profile details.");
              setApiLoading(false);
              return;
            }
          }

          if (profileToUse) {
            const fName = profileToUse.first_name;
            const lName = profileToUse.last_name;
            const emailAddr = profileToUse.email;
            
            const interestsList = Array.isArray(profileToUse.interests) ? profileToUse.interests : [];
            const expYears = profileToUse.experience_years ? String(profileToUse.experience_years) : "";

            setFirstName(fName || "");
            setLastName(lName || "");
            setEmail(emailAddr || "");
            setEmployeeId(profileToUse.employee_id || "");
            setInterests(interestsList);
            setDesignation(profileToUse.designation || "");
            setExperience(expYears);

            const hasName = fName && fName.trim();
            const hasEmpId = profileToUse.employee_id && profileToUse.employee_id.trim();
            const hasDesignation = profileToUse.designation && profileToUse.designation.trim();
            const hasInterests = interestsList.length > 0;
            const hasExperience = expYears && expYears.trim();

            if (!hasName || !hasEmpId || !hasDesignation || !hasInterests || !hasExperience) {
              setProfileIncomplete(true);
              setApiLoading(false);
            } else {
              setProfileIncomplete(false);
              fetchAIAnalysis(targetUserId);
            }
          } else {
            setProfileIncomplete(true);
            setApiLoading(false);
          }
        } catch (err: any) {
          setError("Failed to resolve user profile details.");
          setApiLoading(false);
        }
      };

      resolveProfileAndFetch();
    }
  }, [profile, isLoggedIn, user, authLoading, router, fetchAIAnalysis]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [apiLoading]);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfProgressText("Initializing PDF engine...");
    
    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;

      // Create PDF in A4 format with compression enabled
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true, // enables jsPDF's internal stream/flate compression (safe, lossless for text/vector)
      });
      const imgWidth = 210; // A4 width in mm
      const imgHeight = 297; // A4 height in mm

      const sanitizeClonedDocument = (clonedDoc: Document) => {
        // 1. Sanitize all <style> tags in cloned document
        const styleTags = clonedDoc.querySelectorAll("style");
        styleTags.forEach((tag) => {
          if (tag.innerHTML && (tag.innerHTML.includes("oklab") || tag.innerHTML.includes("oklch"))) {
            tag.innerHTML = tag.innerHTML
              .replace(/oklab\([^)]+\)/gi, "rgb(36, 59, 83)")
              .replace(/oklch\([^)]+\)/gi, "rgb(91, 164, 164)");
          }
        });

        // 2. Remove any CSS rules containing oklab/oklch from clonedDoc.styleSheets
        try {
          Array.from(clonedDoc.styleSheets).forEach((sheet) => {
            try {
              const rules = Array.from(sheet.cssRules || []);
              for (let i = rules.length - 1; i >= 0; i--) {
                const ruleText = rules[i]?.cssText || "";
                if (ruleText.includes("oklab") || ruleText.includes("oklch")) {
                  sheet.deleteRule(i);
                }
              }
            } catch (e) {
              // Cross-origin stylesheet rules ignore
            }
          });
        } catch (e) {}

        // 3. Override getComputedStyle in cloned window
        const win = clonedDoc.defaultView || window;
        const origGetComputedStyle = win.getComputedStyle;

        win.getComputedStyle = function (el: Element, pseudoElt?: string | null) {
          const style = origGetComputedStyle.call(win, el, pseudoElt);
          return new Proxy(style, {
            get(target, prop) {
              if (prop === "getPropertyValue") {
                return function (propertyName: string) {
                  const val = target.getPropertyValue(propertyName);
                  if (val && typeof val === "string" && (val.includes("oklab") || val.includes("oklch"))) {
                    if (propertyName.includes("background")) return "rgb(255, 255, 255)";
                    if (propertyName.includes("border")) return "rgb(226, 232, 240)";
                    return "rgb(36, 59, 83)";
                  }
                  return val;
                };
              }
              const val = (target as any)[prop];
              if (typeof val === "string" && (val.includes("oklab") || val.includes("oklch"))) {
                if (String(prop).includes("background")) return "rgb(255, 255, 255)";
                if (String(prop).includes("border")) return "rgb(226, 232, 240)";
                return "rgb(36, 59, 83)";
              }
              if (typeof val === "function") {
                return val.bind(target);
              }
              return val;
            }
          });
        };

        // 4. Sanitize all DOM element inline styles
        const elements = clonedDoc.querySelectorAll("*");
        elements.forEach((node) => {
          const el = node as HTMLElement;
          if (el.style) {
            ["color", "backgroundColor", "borderColor", "outlineColor", "boxShadow", "fill", "stroke"].forEach((key) => {
              const val = (el.style as any)[key];
              if (val && typeof val === "string" && (val.includes("oklab") || val.includes("oklch"))) {
                if (key === "backgroundColor") el.style.backgroundColor = "#ffffff";
                else if (key === "color") el.style.color = "#243B53";
                else if (key === "borderColor") el.style.borderColor = "#E2E8F0";
              }
            });
          }
        });
      };

      // Shared render settings tuned for quality & file size
      const RENDER_SCALE = 1.8;
      const JPEG_QUALITY = 0.82;

      // --- PAGE 1: Executive Summary & Metrics (Fixed A4 aspect ratio) ---
      setPdfProgressText("Rendering Executive Summary...");
      const page1Element = document.getElementById("tie-report-pdf-page-1");
      if (page1Element) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        const canvas1 = await html2canvas(page1Element, {
          scale: RENDER_SCALE,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          onclone: sanitizeClonedDocument
        });
        const imgData1 = canvas1.toDataURL("image/jpeg", JPEG_QUALITY);
        pdf.addImage(imgData1, "JPEG", 0, 0, imgWidth, imgHeight);
      }

      // --- PAGES 2+: Detailed Narrative (Section-by-Section with Dynamic Breaks) ---
      setPdfProgressText("Preparing layout templates...");

      // Capture the header template
      const headerElement = document.getElementById("tie-report-pdf-header-template");
      let headerImgData = "";
      let headerHeightMm = 0;
      if (headerElement) {
        const headerCanvas = await html2canvas(headerElement, {
          scale: RENDER_SCALE,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          onclone: sanitizeClonedDocument
        });
        headerImgData = headerCanvas.toDataURL("image/jpeg", JPEG_QUALITY);
        headerHeightMm = (headerCanvas.height * 180) / headerCanvas.width; // 180mm content width (210 - 30 margin)
      }

      // Capture all dynamic sections individually — PNG for crisp text
      const sectionElements = document.getElementsByClassName("pdf-narrative-section");
      const sectionImgDataList = [];
      for (let i = 0; i < sectionElements.length; i++) {
        setPdfProgressText(`Rendering section ${i + 1} of ${sectionElements.length}...`);
        const el = sectionElements[i] as HTMLElement;
        const canvas = await html2canvas(el, {
          scale: RENDER_SCALE,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          onclone: sanitizeClonedDocument
        });
        const imgData = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        const heightMm = (canvas.height * 180) / canvas.width; // 180mm content width
        sectionImgDataList.push({ imgData, heightMm });
      }

      // Layout on PDF pages
      setPdfProgressText("Assembling pages...");
      let currentPageNum = 2;
      let currentY = 15; // Top margin

      // Start Page 2
      pdf.addPage();

      // Draw Header on Page 2
      if (headerImgData) {
        pdf.addImage(headerImgData, "JPEG", 15, currentY, 180, headerHeightMm);
        currentY += headerHeightMm + 10; // Header + Gap
      }

      // Draw Main Title on Page 2
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(36, 59, 83); // #243B53
      pdf.text("DETAILED BEHAVIORAL INSIGHTS & GUIDANCE", 15, currentY);
      currentY += 12; // Title + Gap

      const bottomLimit = 297 - 25; // 25mm bottom margin for footer

      for (let i = 0; i < sectionImgDataList.length; i++) {
        const section = sectionImgDataList[i];

        // If it doesn't fit on the current page, add a new page
        if (currentY + section.heightMm > bottomLimit) {
          pdf.addPage();
          currentPageNum++;
          currentY = 15; // Reset top margin

          // Draw header on new page
          if (headerImgData) {
            pdf.addImage(headerImgData, "JPEG", 15, currentY, 180, headerHeightMm);
            currentY += headerHeightMm + 10;
          }
        }

        // Draw the section
        pdf.addImage(section.imgData, "JPEG", 15, currentY, 180, section.heightMm);
        currentY += section.heightMm + 8; // Section + Gap (8mm)
      }

      // --- PAGINATION AND FOOTER RENDERING ---
      setPdfProgressText("Applying page numbers...");
      const totalPages = (pdf as any).internal.getNumberOfPages();

      const drawFooter = (doc: any, pageNum: number, total: number) => {
        doc.setPage(pageNum);
        const pageSize = doc.internal.pageSize;
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

        // Draw divider line
        doc.setDrawColor(220, 225, 230);
        doc.setLineWidth(0.2);
        doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);

        // Confidential report note
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(143, 163, 184); // #8fa3b8
        doc.text("TALENT INTELLIGENCE ENGINE (TIE)", 15, pageHeight - 15);

        // Page number center-aligned
        doc.setFont("helvetica", "bold");
        doc.setTextColor(36, 59, 83); // #243B53
        const pageText = `Page ${pageNum} of ${total}`;
        const textWidth = doc.getTextWidth(pageText);
        doc.text(pageText, (pageWidth - textWidth) / 2, pageHeight - 15);

        // Generation date right-aligned
        doc.setFont("helvetica", "normal");
        doc.setTextColor(143, 163, 184);
        const dateText = `Generated on ${new Date().toLocaleDateString()}`;
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, pageWidth - 15 - dateWidth, pageHeight - 15);
      };

      for (let i = 1; i <= totalPages; i++) {
        drawFooter(pdf, i, totalPages);
      }

      setPdfProgressText("Saving and downloading document...");
      await new Promise((resolve) => setTimeout(resolve, 100));

      const cleanFileName = `TIE_Report_${(firstName || "Employee").replace(/\s+/g, "_")}_${(lastName || "").replace(/\s+/g, "_")}.pdf`;
      pdf.save(cleanFileName);
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF: " + (error?.message || "Please try again."));
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgressText("");
    }
  };

  if (authLoading) {
    return (
      <div className="tie-container">
        <div className="tie-dot-grid" aria-hidden />
        <div 
          className="tie-card" 
          style={{ 
            alignItems: "center", 
            justifyContent: "center", 
            minHeight: "300px", 
            textAlign: "center",
            padding: "2rem",
            maxWidth: "400px",
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div className="tie-card-top-bar" />
          
          <div style={{ position: "relative", marginBottom: "1.5rem", display: "flex", justifyContent: "center", alignItems: "center", width: "70px", height: "70px" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                border: "2px dashed #5BA4A4",
                position: "absolute"
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(91, 164, 164, 0.2)",
                position: "absolute"
              }}
            />
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#ffffff",
                border: "2px solid #5BA4A4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#5BA4A4",
                zIndex: 2
              }}
            >
              <Brain size={20} />
            </div>
          </div>
          
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "#243B53" }}>
            Loading your credentials...
          </span>
        </div>
      </div>
    );
  }

  if (profileIncomplete) {
    return (
      <div className="tie-container" style={{ justifyContent: "center", padding: "2rem 1.5rem" }}>
        <div className="tie-dot-grid" aria-hidden />
        
        <div 
          className="tie-card" 
          style={{ 
            maxWidth: "600px", 
            width: "100%", 
            padding: "2.5rem", 
            boxSizing: "border-box",
            background: "#ffffff",
            boxShadow: "0 10px 30px rgba(36, 59, 83, 0.08)"
          }}
        >
          <div className="tie-card-top-bar" />
          
          <div className="tie-header" style={{ marginBottom: "2rem", textAlign: "left" }}>
            <div className="tie-badge">
              <Sparkles size={11} style={{ marginRight: "2px" }} />
              Complete Profile
            </div>
            <h1 className="tie-title" style={{ fontSize: "1.75rem", letterSpacing: "-0.02em", marginTop: "0.5rem" }}>
              Professional Profile Details
            </h1>
            <p className="tie-desc" style={{ marginTop: "0.5rem" }}>
              Please finalize your professional information below. TIE uses these details to generate and contextualize your talent archetype report.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {formValidationError && (
              <div 
                style={{ 
                  background: "rgba(220, 53, 69, 0.06)", 
                  border: "1px solid rgba(220, 53, 69, 0.12)", 
                  padding: "0.85rem 1rem", 
                  borderRadius: "12px", 
                  color: "#c0392b", 
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textAlign: "left"
                }}
              >
                {formValidationError}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", color: "#627D98" }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Jane"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", color: "#627D98" }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Doe"
                  style={{ width: "100%" }}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", color: "#627D98" }}>
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="form-input"
                placeholder="e.g. EMP-90210"
                style={{ width: "100%" }}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", color: "#627D98" }}>
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Senior Software Engineer"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", color: "#627D98" }}>
                  Experience (Years)
                </label>
                <input
                  type="number"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="form-input"
                  placeholder="e.g. 5"
                  min="0"
                  style={{ width: "100%" }}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-start" }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", color: "#627D98" }}>
                Interests / Professional Focus Areas
              </label>
              
              <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                <input
                  type="text"
                  placeholder="e.g. TypeScript, System Architecture, UI/UX"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={handleInterestKeyDown}
                  className="form-input"
                  style={{ flexGrow: 1 }}
                />
                <button
                  type="button"
                  onClick={addInterestTag}
                  style={{
                    background: "#5BA4A4",
                    border: "none",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    padding: "0 16px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  Add
                </button>
              </div>

              {/* Tag Badges Container */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "0.5rem" }}>
                {interests.length > 0 ? (
                  interests.map((tag) => (
                    <span key={tag} className="profile-tag">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeInterestTag(tag)}
                        className="profile-tag-remove-btn"
                        style={{ cursor: "pointer", background: "none", border: "none", padding: "0 0 0 4px", display: "inline-flex", alignItems: "center" }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span style={{ color: "#9aa8b6", fontStyle: "italic", fontSize: "0.8125rem", fontWeight: 400 }}>No interests added yet (add at least one).</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="tie-btn-primary"
              style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              {isSavingProfile ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  Save & Generate Report
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (apiLoading) {
    return (
      <div className="tie-container">
        <div className="tie-dot-grid" aria-hidden />
        <div 
          className="tie-card" 
          style={{ 
            alignItems: "center", 
            justifyContent: "center", 
            minHeight: "360px", 
            textAlign: "center",
            padding: "3rem 2rem",
            maxWidth: "480px",
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div className="tie-card-top-bar" />
          
          <div style={{ position: "relative", marginBottom: "2rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                border: "2px dashed #5BA4A4",
                position: "absolute"
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: "rgba(91, 164, 164, 0.2)",
                position: "absolute"
              }}
            />
            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#ffffff",
                border: "2px solid #5BA4A4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#5BA4A4",
                boxShadow: "0 8px 16px rgba(91, 164, 164, 0.1)",
                zIndex: 2
              }}
            >
              <Brain size={28} />
            </motion.div>
          </div>

          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#243B53", display: "block" }}>
            {loadingText}
          </span>
          <p style={{ fontSize: "0.85rem", color: "#627D98", marginTop: "0.6rem", maxWidth: "320px", lineHeight: 1.5 }}>
            Our Talent Intelligence Engine is currently processing your data and calculating your behavioral metrics.
          </p>

          <div style={{ width: "100%", height: "4px", background: "#f0f4f8", borderRadius: "99px", overflow: "hidden", marginTop: "2rem", maxWidth: "280px" }}>
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              style={{ width: "40%", height: "100%", background: "#5BA4A4", borderRadius: "99px" }}
            />
          </div>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
            <button
              onClick={() => fetchAIAnalysis(resolvedTargetUserId || user?.id || "")}
              className="tie-btn-primary"
              style={{ background: "#5BA4A4", border: "none" }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Analysis
            </button>
            <button
              onClick={() => router.push("/welcome")}
              className="tie-btn-secondary"
            >
              Return to Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Redirecting in useEffect
  }
  if (!apiData) return null;

  return (
    <div className="tie-container profile-output-container" style={{ justifyContent: "flex-start", padding: "2rem 1.5rem" }}>
      {/* Background blobs */}
      <div aria-hidden style={{ position: "absolute", top: "-130px", right: "-130px", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,164,164,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", bottom: "-130px", left: "-130px", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle, rgba(163,177,138,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <ReportViewer
        reportMarkdown={apiData.report_markdown}
        scoringMetrics={apiData.scoring_metrics}
        employeeName={`${firstName} ${lastName}`}
        designation={designation}
        experienceYears={experience}
        department="Corporate"
        interests={interests}
        email={email}
        showActions={true}
      />
    </div>
  );
}
