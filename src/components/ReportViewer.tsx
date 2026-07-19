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
  CheckCircle2
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

// Map section index or text to Lucide icon
const getSectionIcon = (title: string, index: number) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("pattern") || index === 0) return <Award size={20} className="text-[#5BA4A4]" />;
  if (lowerTitle.includes("observed") || index === 1) return <Eye size={20} className="text-[#5BA4A4]" />;
  if (lowerTitle.includes("value") || index === 2) return <TrendingUp size={20} className="text-[#5BA4A4]" />;
  if (lowerTitle.includes("implication") || index === 3) return <Zap size={20} className="text-amber-500" />;
  if (lowerTitle.includes("support") && lowerTitle.includes("need") || index === 4) return <HeartHandshake size={20} className="text-rose-500" />;
  if (lowerTitle.includes("growth block") || index === 5) return <ShieldAlert size={20} className="text-rose-600" />;
  if (lowerTitle.includes("risk") || index === 6) return <AlertTriangle size={20} className="text-amber-600" />;
  if (lowerTitle.includes("business") || index === 7) return <Briefcase size={20} className="text-[#243B53]" />;
  if (lowerTitle.includes("thrive") || index === 8) return <Sparkles size={20} className="text-emerald-500" />;
  if (lowerTitle.includes("challenge") || index === 9) return <Target size={20} className="text-orange-500" />;
  if (lowerTitle.includes("watch-out") || index === 10) return <ShieldCheck size={20} className="text-yellow-600" />;
  if (lowerTitle.includes("experience you") || index === 11) return <Users size={20} className="text-[#5BA4A4]" />;
  if (lowerTitle.includes("manager should know") || index === 12) return <MessageSquare size={20} className="text-[#243B53]" />;
  if (lowerTitle.includes("manager support") || index === 13) return <Compass size={20} className="text-[#243B53]" />;
  if (lowerTitle.includes("growth suggestion") || index === 14) return <ArrowUpRight size={20} className="text-emerald-600" />;
  if (lowerTitle.includes("conclusion") || index === 15) return <HelpCircle size={20} className="text-[#5BA4A4]" />;
  if (lowerTitle.includes("measure") && !lowerTitle.includes("not") || index === 16) return <Ruler size={20} className="text-[#5BA4A4]" />;
  return <Activity size={20} className="text-[#5BA4A4]" />;
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

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    setExportSuccess(false);

    // Save original getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;

    // Temporary override to convert oklch colors (Tailwind CSS v4) to standard web safe formats
    window.getComputedStyle = function (el, pseudoElt) {
      const style = originalGetComputedStyle(el, pseudoElt);
      
      const convertOklch = (val: any) => {
        if (typeof val === "string" && val.includes("oklch")) {
          // Fallback replacements for Tailwind oklch defaults to avoid html2canvas parser crash
          if (val.includes("0.96")) return "rgb(241, 245, 249)"; // Light gray backgrounds
          if (val.includes("0.6") || val.includes("0.7")) return "rgb(91, 164, 164)"; // Teal focus colors
          if (val.includes("0.1") || val.includes("0.2")) return "rgb(36, 59, 83)"; // Dark slate headings
          return "rgb(240, 240, 240)";
        }
        return val;
      };

      return new Proxy(style, {
        get(target, prop) {
          if (prop === "getPropertyValue") {
            return function(propertyName: string) {
              const val = target.getPropertyValue(propertyName);
              return convertOklch(val);
            };
          }
          const val = target[prop as any];
          if (typeof val === "function") {
            return (val as any).bind(target);
          }
          return convertOklch(val);
        }
      });
    };

    const element = reportRef.current;
    
    // Create an off-screen clone container styled for high-fidelity desktop A4 width
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
      // Use html2canvas to capture the off-screen clone element
      const canvas = await html2canvas(clone, {
        scale: 2.2, // higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgWidth = 210; // A4 dimensions
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `TIE-Report-${employeeName.replace(/\s+/g, "-")}.pdf`;
      pdf.save(fileName);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      // Clean up off-screen clone element
      if (clone && clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
      // Restore original getComputedStyle
      window.getComputedStyle = originalGetComputedStyle;
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Action Header */}
      <div className={`flex items-center justify-between p-4 rounded-2xl border border-slate-100 shadow-sm z-40 ${
        isModal 
          ? "bg-white mb-2" 
          : "bg-white/70 backdrop-blur-md sticky top-20"
      }`}>
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-[#5BA4A4]" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Work Preference Analysis Report
          </span>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#243B53] hover:bg-[#1a2d40] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-75"
        >
          {exporting ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>Generating PDF...</span>
            </>
          ) : exportSuccess ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download size={14} />
              <span>Export as PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Printable Area Wrapper */}
      <div 
        ref={reportRef} 
        id="report-printable-area" 
        className="bg-white p-6 md:p-10 rounded-3xl border border-slate-100 shadow-lg flex flex-col gap-8 text-slate-800 w-full box-border overflow-hidden"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
        }}
      >
        
        {/* Print Header Branding */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 gap-4">
          <div>
            <span 
              className="text-[10px] font-black text-[#5BA4A4] uppercase tracking-widest bg-teal-50"
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                display: 'inline-block',
                lineHeight: '1.2',
                backgroundColor: '#f0fdfa',
                color: '#5BA4A4'
              }}
            >
              Talent Intelligence Engine (TIE)
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-[#243B53] mt-3">
              {employeeName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-xs mt-1.5 font-medium">
              <span>{designation}</span>
              <span>•</span>
              <span>{department} Department</span>
              <span>•</span>
              <span>{experienceYears} Years Experience</span>
            </div>
          </div>
          
          <div className="text-left md:text-right bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[200px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Combination Profile</span>
            <span className="text-sm font-extrabold text-[#243B53] mt-1 block">
              {combination_profile}
            </span>
            <div className="flex flex-wrap gap-1 mt-2">
              {flags.map((flag, idx) => (
                <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 bg-teal-50 text-[#5BA4A4] rounded border border-teal-100/50">
                  {flag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scoring Matrix Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main archetypes */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Dominant Preference Layout</h2>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-bold text-slate-700">Primary: {patternFullNames[primary_pattern]} ({primary_pattern})</span>
                  <span className="text-sm font-extrabold text-[#5BA4A4]">{primary_strength_pct}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#5BA4A4] h-2 rounded-full" style={{ width: `${primary_strength_pct}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 italic">{patternDescriptions[primary_pattern]}</p>
              </div>

              {secondary_pattern && (
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-bold text-slate-700">Secondary: {patternFullNames[secondary_pattern]} ({secondary_pattern})</span>
                    <span className="text-sm font-extrabold text-slate-500">{secondary_strength_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${secondary_strength_pct}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 italic">{patternDescriptions[secondary_pattern]}</p>
                </div>
              )}
            </div>
          </div>

          {/* All 4 Raw Scores Distribution */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Operational Style Distribution</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(raw_scores).map(([pat, score]) => {
                  const pct = Math.round((score / 24) * 100);
                  return (
                    <div key={pat} className="flex flex-col">
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                        <span>{pat} Style</span>
                        <span>{score}/24 ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${
                            pat === primary_pattern ? "bg-[#5BA4A4]" : pat === secondary_pattern ? "bg-slate-400" : "bg-slate-300"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-slate-200/50 pt-3 mt-4 text-[10px] text-slate-400 italic">
              * The raw scores are computed based on choice selections mapping to the SCP, FIE, CCD, and SPO behavioral archetypes.
            </div>
          </div>
        </div>

        {/* Narrative sections display */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-2">Detailed Narrative Report</h2>
          <div className="flex flex-col md:flex-row gap-6 w-full">
            {/* Column 1 */}
            <div className="flex-grow flex-1 flex flex-col gap-6 min-w-0">
              {sections.filter((_, idx) => idx % 2 === 0).map((sec, idx) => {
                const icon = getSectionIcon(sec.title, idx * 2);
                const paragraphs = sec.content.split("\n\n").filter(p => p.trim());

                return (
                  <div 
                    key={idx} 
                    className="p-6 rounded-2xl border border-slate-100 bg-white hover:border-[#5BA4A4]/20 transition-all flex flex-col shadow-sm"
                    style={{ pageBreakInside: "avoid" }}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-1.5 bg-slate-50 rounded-lg text-[#5BA4A4] border border-slate-100/50">
                        {icon}
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-700">
                        {sec.title}
                      </h3>
                    </div>

                    <div className="flex-1 flex flex-col gap-2.5">
                      {paragraphs.map((p, pIdx) => (
                        <p key={pIdx} className="text-xs text-slate-500 leading-relaxed font-medium">
                          {p.replace(/^\*\s*/, "• ").trim()}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Column 2 */}
            <div className="flex-grow flex-1 flex flex-col gap-6 min-w-0">
              {sections.filter((_, idx) => idx % 2 !== 0).map((sec, idx) => {
                const icon = getSectionIcon(sec.title, idx * 2 + 1);
                const paragraphs = sec.content.split("\n\n").filter(p => p.trim());

                return (
                  <div 
                    key={idx} 
                    className="p-6 rounded-2xl border border-slate-100 bg-white hover:border-[#5BA4A4]/20 transition-all flex flex-col shadow-sm"
                    style={{ pageBreakInside: "avoid" }}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-1.5 bg-slate-50 rounded-lg text-[#5BA4A4] border border-slate-100/50">
                        {icon}
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-700">
                        {sec.title}
                      </h3>
                    </div>

                    <div className="flex-1 flex flex-col gap-2.5">
                      {paragraphs.map((p, pIdx) => (
                        <p key={pIdx} className="text-xs text-slate-500 leading-relaxed font-medium">
                          {p.replace(/^\*\s*/, "• ").trim()}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
