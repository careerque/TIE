"use client";

import React, { useRef, useState } from "react";
import { 
  FileText, 
  Download, 
  Award, 
  Eye, 
  TrendingUp, 
  Zap, 
  HeartHandshake, 
  ShieldAlert, 
  AlertTriangle, 
  Briefcase, 
  Sparkles, 
  Target, 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  Compass, 
  ArrowUpRight, 
  HelpCircle, 
  Ruler, 
  Activity,
  Loader2,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
  Info
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface ReportViewerProps {
  reportMarkdown: string;
  scoringMetrics: {
    raw_scores: Record<string, number>;
    primary_pattern: string;
    secondary_pattern: string;
    combination_profile: string;
    primary_strength_pct: number;
    secondary_strength_pct: number;
    flags: string[];
    answers_hash?: string;
  };
  employeeName?: string;
  designation?: string;
  experienceYears?: string;
  department?: string;
  isModal?: boolean;
}

// Map section title or index to Lucide icon
const getSectionIcon = (title: string, index: number) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("pattern") || index === 0) return <Award size={16} />;
  if (lowerTitle.includes("observed") || index === 1) return <Eye size={16} />;
  if (lowerTitle.includes("value") || index === 2) return <TrendingUp size={16} />;
  if (lowerTitle.includes("implication") || index === 3) return <Zap size={16} />;
  if ((lowerTitle.includes("support") && lowerTitle.includes("need")) || index === 4) return <HeartHandshake size={16} />;
  if (lowerTitle.includes("growth block") || index === 5) return <ShieldAlert size={16} />;
  if (lowerTitle.includes("risk") || index === 6) return <AlertTriangle size={16} />;
  if (lowerTitle.includes("business") || index === 7) return <Briefcase size={16} />;
  if (lowerTitle.includes("thrive") || index === 8) return <Sparkles size={16} />;
  if (lowerTitle.includes("challenge") || index === 9) return <Target size={16} />;
  if (lowerTitle.includes("watch-out") || index === 10) return <ShieldCheck size={16} />;
  if (lowerTitle.includes("experience you") || index === 11) return <Users size={16} />;
  if (lowerTitle.includes("manager should know") || index === 12) return <MessageSquare size={16} />;
  if (lowerTitle.includes("manager support") || index === 13) return <Compass size={16} />;
  if (lowerTitle.includes("growth suggestion") || index === 14) return <ArrowUpRight size={16} />;
  if (lowerTitle.includes("conclusion") || index === 15) return <HelpCircle size={16} />;
  if (lowerTitle.includes("measure") && !lowerTitle.includes("not") || index === 16) return <Ruler size={16} />;
  return <Activity size={16} />;
};

const parseMarkdownSections = (markdown: string) => {
  const sections: { title: string; content: string }[] = [];
  const lines = markdown.split("\n");
  let currentSection = { title: "", content: "" };

  lines.forEach((line) => {
    if (line.startsWith("# ") || line.startsWith("## ")) {
      if (currentSection.title) {
        sections.push({ ...currentSection });
      }
      currentSection.title = line.replace(/^#+\s*/, "").trim();
      currentSection.content = "";
    } else {
      if (currentSection.title) {
        currentSection.content += line + "\n";
      }
    }
  });
  if (currentSection.title) {
    sections.push({ ...currentSection });
  }
  return sections;
};

// Helper to render markdown text with bolding and bullet list support
const renderFormattedParagraphs = (content: string) => {
  const rawParagraphs = content.split("\n\n").filter((p) => p.trim().length > 0);

  return rawParagraphs.map((para, pIdx) => {
    const lines = para.split("\n").filter((l) => l.trim().length > 0);

    return (
      <div key={pIdx} className="flex flex-col gap-2.5 min-w-0 w-full">
        {lines.map((line, lIdx) => {
          const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("- ") || line.trim().startsWith("• ");
          const cleanLine = line.replace(/^[\*\-\•]\s*/, "").trim();

          const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
          const lineElements = parts.map((part, partIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={partIdx} className="font-semibold text-slate-800">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={lIdx} className="flex items-start gap-2 my-0.5 min-w-0 w-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2A6B6B] mt-2 flex-shrink-0" />
                <span className="text-sm text-slate-600 leading-normal font-normal min-w-0 w-full break-words overflow-wrap-break-word">
                  {lineElements}
                </span>
              </div>
            );
          }

          return (
            <p key={lIdx} className="text-sm text-slate-600 leading-normal font-normal min-w-0 w-full break-words overflow-wrap-break-word">
              {lineElements}
            </p>
          );
        })}
      </div>
    );
  });
};

export default function ReportViewer({
  reportMarkdown,
  scoringMetrics,
  employeeName = "Employee",
  designation = "Workspace Member",
  experienceYears = "Not Specified",
  department = "Not Specified",
  isModal = false
}: ReportViewerProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const sections = parseMarkdownSections(reportMarkdown);
  const { raw_scores, primary_pattern, secondary_pattern, combination_profile, primary_strength_pct, secondary_strength_pct, flags } = scoringMetrics;

  const patternFullNames: Record<string, string> = {
    SCP: "Structure & Clarity",
    FIE: "Focus & Independence",
    CCD: "Collaboration & Connection",
    SPO: "Stability & Process"
  };

  const patternDescriptions: Record<string, string> = {
    SCP: "Prefers defined expectations, detailed requirements, and structured processes before starting tasks.",
    FIE: "Favors high autonomy, self-directed execution, and solving problems independently.",
    CCD: "Values team connection, open communication, group alignment, and collaborative settings.",
    SPO: "Prefers stable workflows, consistent processes, and predictable day-to-day operations."
  };

  const cardAccents = [
    { border: "border-l-4 border-l-[#2A6B6B]", bg: "bg-[#FAFBFB]", iconBg: "bg-[#2A6B6B]/10 text-[#2A6B6B]" },
    { border: "border-l-4 border-l-[#3B5A75]", bg: "bg-[#F7F9FA]", iconBg: "bg-[#3B5A75]/10 text-[#3B5A75]" },
    { border: "border-l-4 border-l-[#3D8B7A]", bg: "bg-[#F8FAF9]", iconBg: "bg-[#3D8B7A]/10 text-[#3D8B7A]" },
    { border: "border-l-4 border-l-[#4A5D96]", bg: "bg-[#F9FAFC]", iconBg: "bg-[#4A5D96]/10 text-[#4A5D96]" },
  ];

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    setExportSuccess(false);

    const element = reportRef.current;
    
    const clone = element.cloneNode(true) as HTMLDivElement;
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.width = "1024px";
    clone.style.padding = "40px";
    clone.style.boxSizing = "border-box";
    clone.style.background = "#ffffff";
    document.body.appendChild(clone);

    try {
      await new Promise((resolve) => setTimeout(resolve, 80));
      const canvas = await html2canvas(clone, {
        scale: 1.8,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        onclone: (clonedDoc: Document) => {
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
        }
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.82);
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `TIE_Report_${(employeeName || "Employee").replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF: " + (error?.message || "Please try again."));
    } finally {
      if (clone && clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
      setExporting(false);
    }
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto flex flex-col gap-8 box-border min-w-0">
      {/* 1. TOP REPORT HEADER BAR */}
      <div className={`w-full flex items-center justify-between p-4 px-6 rounded-xl border border-slate-200/50 shadow-sm z-30 transition-all box-border ${
        isModal 
          ? "bg-white mb-2" 
          : "bg-white/80 backdrop-blur-md sticky top-[72px] md:top-[80px]"
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-[#2A6B6B]/10 text-[#2A6B6B] border border-[#2A6B6B]/20 flex items-center justify-center flex-shrink-0">
            <FileText size={16} />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800 tracking-tight truncate">
                Work Preference Analysis Report
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2A6B6B] flex-shrink-0 animate-pulse" />
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
              Talent Intelligence Engine • Executive Summary
            </span>
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex-shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 bg-[#2A6B6B] hover:bg-[#1f5252] active:bg-[#1a4444] text-white text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-75 cursor-pointer"
        >
          {exporting ? (
            <>
              <Loader2 className="animate-spin flex-shrink-0" size={14} />
              <span>Generating PDF...</span>
            </>
          ) : exportSuccess ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download size={14} className="flex-shrink-0" />
              <span>Export as PDF</span>
            </>
          )}
        </button>
      </div>

      {/* 2. ONE CONSISTENT MAIN REPORT CONTAINER */}
      <div 
        ref={reportRef} 
        id="report-printable-area" 
        className="w-full max-w-full bg-white p-6 sm:p-10 md:p-14 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col gap-10 text-slate-800 box-border overflow-hidden min-w-0"
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          background: '#ffffff',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
          boxShadow: '0 10px 30px -5px rgba(36, 59, 83, 0.08)',
          overflow: 'hidden'
        }}
      >
        
        {/* 3. PROFILE SECTION */}
        <div className="w-full flex flex-col md:flex-row md:items-start justify-between border-b border-slate-200/80 pb-8 gap-6 min-w-0 box-border">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5BA4A4]/10 text-[#5BA4A4] text-[11px] font-black uppercase tracking-widest border border-[#5BA4A4]/20">
              <Sparkles size={12} className="text-[#5BA4A4]" />
              Talent Intelligence Engine (TIE)
            </span>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#243B53] tracking-tight mt-3 mb-3 truncate">
              {employeeName}
            </h1>
            
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-semibold border border-slate-200/60">
                <Briefcase size={13} className="text-slate-400 flex-shrink-0" />
                {designation}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-semibold border border-slate-200/60">
                <Building2 size={13} className="text-slate-400 flex-shrink-0" />
                {department} Department
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-semibold border border-slate-200/60">
                <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                {experienceYears} Years Experience
              </span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-50 to-teal-50/40 p-6 rounded-2xl border border-slate-200/80 w-full md:w-auto min-w-[260px] max-w-full flex flex-col justify-between shadow-xs flex-shrink-0 box-border self-start">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Combination Profile</span>
                <Layers size={15} className="text-[#5BA4A4]" />
              </div>
              <span className="text-base sm:text-lg font-black text-[#243B53] block leading-snug">
                {combination_profile}
              </span>
            </div>

            {flags && flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-200/60">
                {flags.map((flag, idx) => (
                  <span key={idx} className="text-[10px] font-bold px-2.5 py-0.5 bg-white text-[#5BA4A4] rounded-md border border-[#5BA4A4]/30 shadow-2xs">
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. DOMINANT PREFERENCE + OPERATIONAL STYLE SECTION (REUSABLE TWO-COLUMN GRID) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch min-w-0 box-border">
          {/* Dominant Preference Layout Card */}
          <div 
            className="w-full min-w-0 max-w-full bg-[#FAFBFB] rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs h-full box-border overflow-hidden"
            style={{ padding: '2rem', boxSizing: 'border-box' }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
                <Award size={15} className="text-[#2A6B6B] flex-shrink-0" />
                <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider truncate">Dominant Preference Layout</h2>
              </div>
              
              <div className="flex flex-col gap-6 min-w-0">
                {/* Primary Pattern */}
                <div className="min-w-0">
                  <div className="flex justify-between items-center mb-1.5 min-w-0">
                    <span className="text-sm font-medium text-slate-800 truncate pr-2">
                      Primary: {patternFullNames[primary_pattern] || primary_pattern} ({primary_pattern})
                    </span>
                    <span className="text-xs font-semibold text-[#2A6B6B] bg-[#2A6B6B]/10 px-2 py-0.5 rounded border border-[#2A6B6B]/20 flex-shrink-0">
                      {primary_strength_pct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden p-0">
                    <div className="bg-gradient-to-r from-[#2A6B6B] to-[#3B8282] h-full rounded-full transition-all duration-500" style={{ width: `${primary_strength_pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 italic bg-white/80 p-3 rounded-lg border border-slate-100 leading-normal font-normal break-words">
                    {patternDescriptions[primary_pattern]}
                  </p>
                </div>

                {/* Secondary Pattern */}
                {secondary_pattern && (
                  <div className="min-w-0">
                    <div className="flex justify-between items-center mb-1.5 min-w-0">
                      <span className="text-sm font-medium text-slate-700 truncate pr-2">
                        Secondary: {patternFullNames[secondary_pattern] || secondary_pattern} ({secondary_pattern})
                      </span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex-shrink-0">
                        {secondary_strength_pct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden p-0">
                      <div className="bg-gradient-to-r from-slate-500 to-slate-400 h-full rounded-full transition-all duration-500" style={{ width: `${secondary_strength_pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-2 italic bg-white/80 p-3 rounded-lg border border-slate-100 leading-normal font-normal break-words">
                      {patternDescriptions[secondary_pattern]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Operational Style Distribution Card */}
          <div 
            className="w-full min-w-0 max-w-full bg-[#FAFBFB] rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs h-full box-border overflow-hidden"
            style={{ padding: '2rem', boxSizing: 'border-box' }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
                <Activity size={15} className="text-[#2A6B6B] flex-shrink-0" />
                <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider truncate">Operational Style Distribution</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                {Object.entries(raw_scores).map(([pat, score]) => {
                  const pct = Math.round((score / 24) * 100);
                  const isPrimary = pat === primary_pattern;
                  const isSecondary = pat === secondary_pattern;

                  return (
                    <div key={pat} className="bg-white p-3 rounded-lg border border-slate-100 flex flex-col justify-between min-w-0">
                      <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-2 min-w-0">
                        <span className="flex items-center gap-1.5 truncate">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPrimary ? "bg-[#2A6B6B]" : isSecondary ? "bg-slate-500" : "bg-slate-300"}`} />
                          {pat} Style
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 flex-shrink-0">
                          {score}/24 ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden p-0">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPrimary ? "bg-[#2A6B6B]" : isSecondary ? "bg-slate-500" : "bg-slate-300"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-100 text-[11px] text-slate-500 italic mt-6 flex items-start gap-2 font-medium min-w-0">
              <Info size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="break-words leading-normal">The raw scores are computed based on choice selections mapping to the SCP, FIE, CCD, and SPO behavioral archetypes.</span>
            </div>
          </div>
        </div>

        {/* 5. DETAILED NARRATIVE REPORT SECTION (EXACT SAME TWO-COLUMN GRID BOUNDARIES) */}
        <div className="w-full flex flex-col gap-6 min-w-0 box-border">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 min-w-0">
            <FileText size={16} className="text-[#2A6B6B] flex-shrink-0" />
            <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Detailed Narrative Report</h2>
          </div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch min-w-0 box-border">
            {sections.map((sec, idx) => {
              const icon = getSectionIcon(sec.title, idx);
              const accent = cardAccents[idx % cardAccents.length];

              return (
                <div 
                  key={idx} 
                  className={`w-full min-w-0 max-w-full rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between h-full box-border overflow-hidden transition-all duration-200 hover:shadow-sm ${accent.border} ${accent.bg}`}
                  style={{ pageBreakInside: "avoid", boxSizing: "border-box", padding: "2rem" }}
                >
                  <div className="min-w-0 w-full">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/30 mb-6 min-w-0">
                      <div className={`p-1.5 rounded-md flex items-center justify-center flex-shrink-0 ${accent.iconBg}`}>
                        {icon}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 tracking-tight truncate">
                        {sec.title}
                      </h3>
                    </div>

                    <div className="flex-1 flex flex-col gap-3 min-w-0 w-full break-words">
                      {renderFormattedParagraphs(sec.content)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}