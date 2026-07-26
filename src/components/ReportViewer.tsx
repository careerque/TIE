"use client";

import React, { useRef, useState } from "react";
import {
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
  Info,
  FileText,
  Download,
  Brain,
  RefreshCw,
  Shield,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

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
  employeeId?: string;
  designation?: string;
  experienceYears?: string;
  department?: string;
  interests?: string | string[] | null;
  email?: string;
  showActions?: boolean;
  isModal?: boolean;
}

const TAGLINES: Record<string, string> = {
  "Structured Collaborator":
    "Process-Oriented & Team-Centric Professional",
  "Steady Executor":
    "Methodical, Reliable & Result-Driven Builder",
  "Independent Problem Solver":
    "Autonomous, Analytical & Adaptive Explorer",
  "Adaptive Team Contributor":
    "Collaborative, Flexible & Initiative-Driven Contributor",
  "Supportive Team Stabilizer":
    "Empathetic, Stable & Trust-Building Anchor",
  "Practical Adapter":
    "Pragmatic, Flexible & Experiential Learner",
  "Flexible Adapter":
    "Highly Versatile & Context-Aware Contributor",
};

const SUMMARIES: Record<string, string> = {
  "Structured Collaborator":
    "You thrive in structured team environments with clear processes. You balance organization with active cooperation to drive projects forward.",
  "Steady Executor":
    "You deliver consistent, high-quality results by sticking to proven processes and maintaining a stable pace. You are a reliable anchor for execution.",
  "Independent Problem Solver":
    "You excel at solving complex challenges autonomously. You value independence and learn best by experimenting and digging deep into problems.",
  "Adaptive Team Contributor":
    "You easily adjust to new team dynamics and shifting requirements. You bring energy to collaborative spaces and learn quickly by doing.",
  "Supportive Team Stabilizer":
    "You focus on team harmony, steady pacing, and creating psychological safety. You support others and build trust in relationships.",
  "Practical Adapter":
    "You tackle changing circumstances with pragmatism. You learn through hands-on experience and keep team objectives grounded.",
  "Flexible Adapter":
    "You bring a balanced mix of adaptability and execution, adjusting your style to fit the specific needs of your team and current tasks.",
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

function getGrowthAreas(
  primaryPattern: string,
  secondaryPattern: string
): string[] {
  const list: string[] = [];

  if (primaryPattern === "SCP" || secondaryPattern === "SCP") {
    list.push(
      "Practice decision-making under uncertainty without waiting for complete info"
    );
    list.push("Build tolerance for flexible, un-documented experiments");
  }

  if (primaryPattern === "FIE" || secondaryPattern === "FIE") {
    list.push(
      "Proactively share knowledge and updates before team check-ins"
    );
    list.push("Align independent tasks with overall group architecture");
  }

  if (primaryPattern === "CCD" || secondaryPattern === "CCD") {
    list.push(
      "Strengthen independent decision confidence and solo execution"
    );
    list.push("Establish personal focus blocks to avoid meeting fatigue");
  }

  if (primaryPattern === "SPO" || secondaryPattern === "SPO") {
    list.push(
      "Build comfort with iterative releases and rapid prototyping"
    );
    list.push("Take active leadership roles during team transitions");
  }

  if (list.length < 3) {
    list.push("Improve cross-functional communication clarity");
  }

  if (list.length < 3) {
    list.push(
      "Engage in peer-reviews to align problem-solving styles"
    );
  }

  return list.slice(0, 3);
}

function getManagerSupport(signals: any): string[] {
  if (!signals) {
    return [
      "Provide context behind decisions",
      "Offer periodic feedback check-ins",
      "Encourage gradual ownership expansion",
    ];
  }

  const list: string[] = [];

  if (signals.s1_adaptability_dominant === "SCP") {
    list.push(
      "Provide context behind decisions and clear transition maps."
    );
  } else if (signals.s1_adaptability_dominant === "FIE") {
    list.push(
      "Provide clear goal alignment but allow space to discover execution routes."
    );
  } else if (signals.s1_adaptability_dominant === "CCD") {
    list.push(
      "Ensure regular communicative check-ins to support transitions."
    );
  } else if (signals.s1_adaptability_dominant === "SPO") {
    list.push("Offer predictability and gradual transition pacing.");
  }

  if (signals.s2_execution_dominant === "SCP") {
    list.push(
      "Specify exact scope, deliverables, and quality standards."
    );
  } else if (signals.s2_execution_dominant === "FIE") {
    list.push(
      "Grant execution details autonomy while maintaining high-level alignment."
    );
  } else if (signals.s2_execution_dominant === "CCD") {
    list.push(
      "Encourage collaborative pairing or cross-functional reviews."
    );
  } else if (signals.s2_execution_dominant === "SPO") {
    list.push("Provide stable workloads and respect focus timelines.");
  }

  if (list.length < 3) {
    list.push(
      "Offer periodic feedback check-ins to align expectations."
    );
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
      let title = lines[0]
        .replace(/^#\s+\d+\.\s+/, "")
        .trim();

      if (lines[0].startsWith("#")) {
        title = lines[0]
          .replace(/^#+\s+/, "")
          .trim();
      }

      const content = lines.slice(1).join("\n").trim();

      if (title || content) {
        sections.push({
          title,
          content,
        });
      }
    }
  });

  return sections;
}

function formatInlineMarkdown(text: string): string {
  let formatted = text.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  formatted = formatted.replace(
    /\*(.*?)\*/g,
    "<em>$1</em>"
  );

  formatted = formatted.replace(
    /`(.*?)`/g,
    "<code style='background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.85em;'>$1</code>"
  );

  return formatted;
}

function formatInterests(
  interests?: string | string[] | null
): string {
  if (Array.isArray(interests)) {
    return interests.length > 0
      ? interests.join(", ")
      : "None";
  }

  if (
    typeof interests === "string" &&
    interests.trim().length > 0
  ) {
    return interests;
  }

  return "None";
}

function MarkdownRenderer({
  content,
  fontSize = "0.85rem",
  color = "#627D98",
}: {
  content: string;
  fontSize?: string;
  color?: string;
}) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`list-${key}`}
          style={{
            paddingLeft: "1.25rem",
            margin: "0.5rem 0",
            listStyleType: "disc",
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          {listItems.map((item, idx) => (
            <li
              key={idx}
              style={{
                fontSize,
                color,
                lineHeight: 1.5,
                textAlign: "left",
              }}
              dangerouslySetInnerHTML={{
                __html: formatInlineMarkdown(item),
              }}
            />
          ))}
        </ul>
      );

      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ")
    ) {
      listItems.push(trimmed.substring(2));
    } else {
      flushList(String(index));

      if (trimmed) {
        if (trimmed.startsWith("###")) {
          elements.push(
            <h4
              key={index}
              style={{
                fontSize: "0.9rem",
                fontWeight: 800,
                color: "#243B53",
                marginTop: "1rem",
                marginBottom: "0.5rem",
                textAlign: "left",
              }}
              dangerouslySetInnerHTML={{
                __html: formatInlineMarkdown(
                  trimmed.replace(/^###\s+/, "")
                ),
              }}
            />
          );
        } else if (trimmed.startsWith("##")) {
          elements.push(
            <h3
              key={index}
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "#243B53",
                marginTop: "1.25rem",
                marginBottom: "0.75rem",
                textAlign: "left",
              }}
              dangerouslySetInnerHTML={{
                __html: formatInlineMarkdown(
                  trimmed.replace(/^##\s+/, "")
                ),
              }}
            />
          );
        } else {
          elements.push(
            <p
              key={index}
              style={{
                marginBottom: "0.75rem",
                fontSize,
                color,
                lineHeight: 1.5,
                textAlign: "left",
              }}
              dangerouslySetInnerHTML={{
                __html: formatInlineMarkdown(trimmed),
              }}
            />
          );
        }
      }
    }
  });

  flushList("final");

  return <div>{elements}</div>;
}

export default function ReportViewer({
  reportMarkdown,
  scoringMetrics,
  employeeName = "Employee",
  employeeId = "Not Specified",
  designation = "Workspace Member",
  experienceYears = "Not Specified",
  department = "Not Specified",
  interests = "",
  email = "Not Specified",
  showActions = false,
  isModal = false,
}: ReportViewerProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] =
    useState(false);

  const [pdfProgressText, setPdfProgressText] =
    useState("");

  const {
    raw_scores,
    primary_pattern,
    secondary_pattern,
    combination_profile,
    primary_strength_pct,
    secondary_strength_pct,
    flags,
  } = scoringMetrics;

  const interestsDisplay = formatInterests(interests);

  const combinationName =
    combination_profile || "Flexible Adapter";

  const tagline =
    TAGLINES[combinationName] ||
    "Balanced & Context-Aware Work Style";

  const summary =
    SUMMARIES[combinationName] ||
    "You adapt your style dynamically to align with changing requirements and team environments.";

  const rawScores = raw_scores || {
    SCP: 0,
    FIE: 0,
    CCD: 0,
    SPO: 0,
  };

  const getPercentage = (score: number) =>
    Math.round((score / 24) * 100);

  const dimensions = [
    {
      title: "Structured Clarity (SCP)",
      score: getPercentage(rawScores.SCP),
      icon: (
        <BookOpen
          className="h-5 w-5"
          style={{ color: "#243B53" }}
        />
      ),
      color: "#243B53",
      details: "Process & Guidelines",
      description:
        "Measures your value for structured workflows, documentation, clear expectations, and process integrity.",
    },
    {
      title: "Focused Independence (FIE)",
      score: getPercentage(rawScores.FIE),
      icon: (
        <Zap
          className="h-5 w-5"
          style={{ color: "#A3B18A" }}
        />
      ),
      color: "#A3B18A",
      details: "Autonomy & Execution",
      description:
        "Measures your drive for self-directed problem solving, hands-on experimentation, and execution freedom.",
    },
    {
      title: "Cooperative Collaboration (CCD)",
      score: getPercentage(rawScores.CCD),
      icon: (
        <Users
          className="h-5 w-5"
          style={{ color: "#5BA4A4" }}
        />
      ),
      color: "#5BA4A4",
      details: "Team Alignment",
      description:
        "Measures your preference for collective brainstorming, consensus building, and cross-functional team synergy.",
    },
    {
      title: "Stable Pace Orientation (SPO)",
      score: getPercentage(rawScores.SPO),
      icon: (
        <TrendingUp
          className="h-5 w-5"
          style={{ color: "#E07A5F" }}
        />
      ),
      color: "#E07A5F",
      details: "Predictable Pacing",
      description:
        "Measures your comfort with consistent workflows, sustainable project pacing, and supportive dynamics.",
    },
  ];

  const parsedSections =
    parseMarkdown(reportMarkdown);

<<<<<<< HEAD
  const currentFrictionArea =
    getFrictionArea(primary_pattern);

  const currentGrowthAreas =
    getGrowthAreas(
      primary_pattern,
      secondary_pattern
    );

  const currentManagerSupport =
    getManagerSupport(null);

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    setPdfProgressText(
      "Initializing PDF engine..."
    );

    const originalGetComputedStyle =
      window.getComputedStyle;

    window.getComputedStyle = function (
      el,
      pseudoElt
    ) {
      const style =
        originalGetComputedStyle(
          el,
          pseudoElt
        );

      const convertOklch = (val: any) => {
        if (
          typeof val === "string" &&
          val.includes("oklch")
        ) {
          if (val.includes("0.96")) {
            return "rgb(241, 245, 249)";
          }

          if (
            val.includes("0.6") ||
            val.includes("0.7")
          ) {
            return "rgb(91, 164, 164)";
          }

          if (
            val.includes("0.1") ||
            val.includes("0.2")
          ) {
            return "rgb(36, 59, 83)";
          }

          return "rgb(240, 240, 240)";
        }

        return val;
      };

      return new Proxy(style, {
        get(target, prop) {
          if (
            prop === "color" ||
            prop === "backgroundColor" ||
            prop === "borderColor"
          ) {
            const val =
              target[prop as any];

            if (typeof val === "function") {
              return (val as any).bind(target);
            }

            return convertOklch(val);
          }

          const val =
            target[prop as any];

          if (typeof val === "function") {
            return (val as any).bind(target);
          }

          return convertOklch(val);
        },
      });
    };

    try {
      const jsPDF =
        (await import("jspdf")).default;

      const html2canvas =
        (await import("html2canvas")).default;

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const imgWidth = 210;
      const imgHeight = 297;
=======
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
>>>>>>> b14fc4cfda51e027794730babcdfbfd9eae8438a

      // Reduced rendering scale for smaller PDF size.
      const RENDER_SCALE = 1.5;

<<<<<<< HEAD
      // Reduced JPEG quality for a much smaller PDF.
      const JPEG_QUALITY = 0.72;

      // ============================================
      // PAGE 1: EXECUTIVE SUMMARY
      // ============================================

      setPdfProgressText(
        "Rendering Executive Summary..."
      );

      const page1Element =
        document.getElementById(
          "tie-report-pdf-page-1"
        );

      if (page1Element) {
        await new Promise((resolve) =>
          setTimeout(resolve, 60)
        );

        const canvas1 =
          await html2canvas(
            page1Element,
            {
              scale: RENDER_SCALE,
              useCORS: true,
              backgroundColor: "#ffffff",
              logging: false,
            }
          );

        const imgData1 =
          canvas1.toDataURL(
            "image/jpeg",
            JPEG_QUALITY
          );

        pdf.addImage(
          imgData1,
          "JPEG",
          0,
          0,
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        );
      }

      // ============================================
      // PAGES 2+: DETAILED NARRATIVE
      // ============================================

      setPdfProgressText(
        "Preparing layout templates..."
      );

      const headerElement =
        document.getElementById(
          "tie-report-pdf-header-template"
        );

      let headerImgData = "";
      let headerHeightMm = 0;

      if (headerElement) {
        const headerCanvas =
          await html2canvas(
            headerElement,
            {
              scale: RENDER_SCALE,
              useCORS: true,
              backgroundColor: "#ffffff",
              logging: false,
            }
          );

        headerImgData =
          headerCanvas.toDataURL(
            "image/jpeg",
            JPEG_QUALITY
          );

        headerHeightMm =
          (headerCanvas.height * 180) /
          headerCanvas.width;
      }

      const sectionElements =
        document.getElementsByClassName(
          "pdf-narrative-section"
        );

      const sectionImgDataList: {
        imgData: string;
        heightMm: number;
      }[] = [];

      for (
        let i = 0;
        i < sectionElements.length;
        i++
      ) {
        setPdfProgressText(
          `Rendering section ${i + 1} of ${sectionElements.length}...`
        );

        const el =
          sectionElements[i] as HTMLElement;

        const canvas =
          await html2canvas(
            el,
            {
              scale: RENDER_SCALE,
              useCORS: true,
              backgroundColor: "#ffffff",
              logging: false,
            }
          );

        // JPEG instead of PNG to significantly reduce PDF size.
        const imgData =
          canvas.toDataURL(
            "image/jpeg",
            JPEG_QUALITY
          );

        const heightMm =
          (canvas.height * 180) /
          canvas.width;

        sectionImgDataList.push({
          imgData,
          heightMm,
        });
      }

      // ============================================
      // PDF PAGE LAYOUT
      // ============================================

      setPdfProgressText(
        "Assembling pages..."
      );

      let currentPageNum = 2;

      // Reduced top margin.
      let currentY = 12;

      pdf.addPage();

      // Header
      if (headerImgData) {
        pdf.addImage(
          headerImgData,
          "JPEG",
          15,
          currentY,
          180,
          headerHeightMm,
          undefined,
          "FAST"
        );

        // Reduced header gap.
        currentY +=
          headerHeightMm + 6;
      }

      // Main title
      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(16);

      pdf.setTextColor(
        36,
        59,
        83
      );

      pdf.text(
        "DETAILED BEHAVIORAL INSIGHTS & GUIDANCE",
        15,
        currentY
      );

      // Reduced title gap.
      currentY += 9;

      // Reduced bottom margin.
      const bottomLimit =
        297 - 22;

      for (
        let i = 0;
        i <
        sectionImgDataList.length;
        i++
      ) {
        const section =
          sectionImgDataList[i];

        if (
          currentY +
            section.heightMm >
          bottomLimit
        ) {
          pdf.addPage();

          currentPageNum++;

          currentY = 12;

          if (headerImgData) {
            pdf.addImage(
              headerImgData,
              "JPEG",
              15,
              currentY,
              180,
              headerHeightMm,
              undefined,
              "FAST"
            );

            currentY +=
              headerHeightMm + 6;
          }
        }

        pdf.addImage(
          section.imgData,
          "JPEG",
          15,
          currentY,
          180,
          section.heightMm,
          undefined,
          "FAST"
        );

        // Reduced section gap.
        currentY +=
          section.heightMm + 5;
      }

      // ============================================
      // FOOTERS
      // ============================================

      setPdfProgressText(
        "Applying page numbers..."
      );

      const totalPages =
        (pdf as any).internal
          .getNumberOfPages();

      const drawFooter = (
        doc: any,
        pageNum: number,
        total: number
      ) => {
        doc.setPage(pageNum);

        const pageSize =
          doc.internal.pageSize;

        const pageWidth =
          pageSize.width
            ? pageSize.width
            : pageSize.getWidth();

        const pageHeight =
          pageSize.height
            ? pageSize.height
            : pageSize.getHeight();

        doc.setDrawColor(
          220,
          225,
          230
        );

        doc.setLineWidth(0.2);

        doc.line(
          15,
          pageHeight - 18,
          pageWidth - 15,
          pageHeight - 18
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(8);

        doc.setTextColor(
          143,
          163,
          184
        );

        doc.text(
          "TALENT INTELLIGENCE ENGINE (TIE)",
          15,
          pageHeight - 13
        );

        const pageNumText =
          `Page ${pageNum} of ${total}`;

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setTextColor(
          36,
          59,
          83
        );

        const pageNumWidth =
          doc.getTextWidth(
            pageNumText
          );

        doc.text(
          pageNumText,
          (pageWidth -
            pageNumWidth) /
            2,
          pageHeight - 13
        );

        const dateText =
          `Generated on ${new Date().toLocaleDateString()}`;

        const dateWidth =
          doc.getTextWidth(
            dateText
          );

        doc.text(
          dateText,
          pageWidth -
            15 -
            dateWidth,
          pageHeight - 13
        );
      };

      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        drawFooter(
          pdf,
          i,
          totalPages
        );
      }

      // ============================================
      // SAVE PDF
      // ============================================

      setPdfProgressText(
        "Saving and downloading document..."
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 100)
      );

      pdf.save(
        `TIE_Workforce_Insight_Report_${employeeName.replace(
          /\s+/g,
          "_"
        )}.pdf`
      );
    } catch (error) {
      console.error(
        "PDF generation failed:",
        error
      );
    } finally {
      window.getComputedStyle =
        originalGetComputedStyle;

      setIsGeneratingPdf(false);

      setPdfProgressText("");
=======
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
>>>>>>> b14fc4cfda51e027794730babcdfbfd9eae8438a
    }
  };

  return (
    <div 
      className="w-full max-w-[960px] mx-auto flex flex-col gap-6 box-border min-w-0"
      style={{
        width: "100%",
        maxWidth: "960px",
        marginLeft: "auto",
        marginRight: "auto",
        boxSizing: "border-box",
        alignSelf: "center",
      }}
    >

      {/* ============================================
          TOP REPORT HEADER BAR
      ============================================ */}

      <div
        className="w-full flex items-center justify-between z-30 transition-all box-border bg-white sticky top-[72px] md:top-[80px]"
        style={{
          height: "76px",
          padding: "12px 24px",
          borderRadius: "16px",
          border:
            "1px solid rgba(226, 232, 240, 0.8)",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
          boxSizing: "border-box",
          backgroundColor: "#ffffff",
          width: "100%",
          maxWidth: "960px",
          alignSelf: "center",
        }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="text-[#2A6B6B] flex items-center justify-center flex-shrink-0"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor:
                "rgba(42, 107, 107, 0.1)",
              border:
                "1px solid rgba(42, 107, 107, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={18} />
          </div>

          <div className="min-w-0 flex flex-col justify-center gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-slate-800 tracking-tight truncate">
                Work Preference Analysis Report
              </span>

              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2A6B6B] flex-shrink-0" />
            </div>

            <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
              Talent Intelligence Engine • Executive Summary
            </span>
          </div>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className="flex-shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-2 bg-[#2A6B6B] hover:bg-[#1f5252] active:bg-[#1a4444] text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-75 cursor-pointer"
          style={{
            height: "40px",
            padding: "8px 18px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            boxSizing: "border-box",
          }}
        >
          {isGeneratingPdf ? (
            <>
              <Loader2
                className="animate-spin flex-shrink-0"
                size={14}
              />
              <span>
                Generating PDF...
              </span>
            </>
          ) : (
            <>
              <Download
                size={14}
                className="flex-shrink-0"
              />
              <span>
                Export as PDF
              </span>
            </>
          )}
        </button>
      </div>

      {/* ============================================
          MAIN VISIBLE REPORT
      ============================================ */}

      <div
        ref={reportRef}
        id="report-printable-area"
        className="w-full max-w-[960px] mx-auto bg-white p-6 sm:p-8 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col gap-8 text-slate-800 box-border overflow-hidden min-w-0"
        style={{
          width: "100%",
          maxWidth: "960px",
          boxSizing: "border-box",
          background: "#ffffff",
          borderRadius: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
          padding: "32px",
          boxShadow:
            "0 10px 30px -5px rgba(36, 59, 83, 0.08)",
          overflow: "hidden",
          margin: "0 auto",
          alignSelf: "center",
        }}
      >

        {/* ============================================
            REPORT TITLE
        ============================================ */}

        <div
          className="profile-output-header"
          style={{
            marginBottom: 0,
            padding: "0 8px",
          }}
        >
          <div className="tie-badge">
            <Sparkles
              className="h-3.5 w-3.5"
              style={{
                color: "#5BA4A4",
                marginRight: "2px",
              }}
            />

            <span>
              ASSESSMENT OUTPUT
            </span>
          </div>

          <h1 className="profile-output-title">
            Your Talent Dynamics Insights
          </h1>

          <p
            className="tie-desc"
            style={{
              textAlign: "center",
            }}
          >
            A personalized breakdown of your collaboration habits, change adaptability, and growth vectors.
          </p>
        </div>

        {/* ============================================
            EMPLOYEE DETAILS
        ============================================ */}

        <div
          className="profile-output-details-card"
          style={{
            padding: "24px 28px",
            marginTop: "-4px",
          }}
        >
          <div className="profile-output-detail-col">
            <span className="profile-output-detail-label">
              Employee Name
            </span>

            <span className="profile-output-detail-value">
              {employeeName}
            </span>
          </div>

          <div className="profile-output-detail-col">
            <span className="profile-output-detail-label">
              Employee ID
            </span>

            <span className="profile-output-detail-value">
              {employeeId ||
                "Not Specified"}
            </span>
          </div>

          <div className="profile-output-detail-col">
            <span className="profile-output-detail-label">
              Interests
            </span>

            <span className="profile-output-detail-value">
              {interestsDisplay}
            </span>
          </div>

          <div className="profile-output-detail-col">
            <span className="profile-output-detail-label">
              Designation
            </span>

            <span className="profile-output-detail-value">
              {designation}
            </span>
          </div>

          <div className="profile-output-detail-col">
            <span className="profile-output-detail-label">
              Experience
            </span>

            <span className="profile-output-detail-value">
              {experienceYears} Years
            </span>
          </div>

          <div className="profile-output-detail-col">
            <span className="profile-output-detail-label">
              Email Address
            </span>

            <span className="profile-output-detail-value">
              {email}
            </span>
          </div>
        </div>

        {/* ============================================
            ARCHETYPE BANNER
        ============================================ */}

        <div className="profile-output-archetype-card">
          <div className="profile-output-archetype-accent-glow" />

          <div
            style={{
              flex: 1,
              minWidth: "280px",
            }}
          >
            <p
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#5BA4A4",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
                textAlign: "left",
              }}
            >
              Primary Profile Archetype
            </p>

            <h2 className="profile-output-archetype-title">
              {combinationName}
            </h2>

            <p
              style={{
                fontSize: "0.85rem",
                color: "#A3B18A",
                fontStyle: "italic",
                marginBottom: "1rem",
                fontWeight: 500,
                textAlign: "left",
              }}
            >
              {tagline}
            </p>

            <p
              style={{
                fontSize: "0.875rem",
                color: "#b0bec8",
                lineHeight: 1.6,
                margin: 0,
                textAlign: "left",
              }}
            >
              {summary}
            </p>
          </div>

          <div className="profile-output-archetype-badge">
            <span className="profile-output-archetype-badge-val">
              {primary_strength_pct}%
            </span>

            <span className="profile-output-archetype-badge-label">
              Primary Strength
            </span>
          </div>
        </div>

        {/* ============================================
            DIMENSIONS GRID
        ============================================ */}

        <div className="profile-output-dimensions-grid">
          {dimensions.map((dim) => (
            <div
              key={dim.title}
              className="profile-output-dimension-card"
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        background: `${dim.color}12`,
                        padding: "8px",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "center",
                      }}
                    >
                      {dim.icon}
                    </div>

                    <h3
                      style={{
                        fontSize:
                          "0.875rem",
                        fontWeight: 800,
                        color:
                          "#243B53",
                        margin: 0,
                      }}
                    >
                      {dim.title}
                    </h3>
                  </div>

                  <span
                    style={{
                      fontSize:
                        "1.1rem",
                      fontWeight: 800,
                      color:
                        dim.color,
                    }}
                  >
                    {dim.score}%
                  </span>
                </div>

                <div
                  style={{
                    marginBottom:
                      "0.875rem",
                    textAlign:
                      "left",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "9px",
                      fontWeight: 700,
                      border: `1px solid ${dim.color}30`,
                      borderRadius:
                        "99px",
                      padding:
                        "3px 10px",
                      textTransform:
                        "uppercase",
                      color:
                        dim.color,
                      background:
                        `${dim.color}05`,
                      letterSpacing:
                        "0.04em",
                    }}
                  >
                    {dim.details}
                  </span>
                </div>

                <p
                  style={{
                    fontSize:
                      "0.78rem",
                    color:
                      "#627D98",
                    lineHeight: 1.6,
                    margin: 0,
                    textAlign:
                      "left",
                  }}
                >
                  {dim.description}
                </p>
              </div>

              <div
                style={{
                  marginTop:
                    "1.25rem",
                  paddingTop:
                    "0.875rem",
                  borderTop:
                    "1px solid #f0f4f8",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    fontSize:
                      "9px",
                    fontWeight: 700,
                    color:
                      "#9aa8b6",
                    textTransform:
                      "uppercase",
                    marginBottom:
                      "0.375rem",
                  }}
                >
                  <span>
                    Dimensional Strength
                  </span>

                  <span>
                    {dim.score}%
                  </span>
                </div>

                <div
                  style={{
                    height: "5px",
                    width: "100%",
                    background:
                      "#F4F7FA",
                    borderRadius:
                      "99px",
                    overflow:
                      "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${dim.score}%`,
                      height: "100%",
                      background:
                        dim.color,
                      borderRadius:
                        "99px",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ============================================
            QUALITATIVE SNAPSHOT
        ============================================ */}

        <div className="profile-output-split-row">
          <div className="profile-output-split-card">
            <div className="profile-output-card-header">
              <Sparkles
                className="h-5 w-5"
                style={{
                  color: "#5BA4A4",
                }}
              />

              <h3
                style={{
                  fontSize:
                    "1.125rem",
                  fontWeight: 800,
                  color:
                    "#243B53",
                  margin: 0,
                  textAlign:
                    "left",
                }}
              >
                Workplace Dynamics Insights
              </h3>
            </div>

            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap: "1rem",
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize:
                      "0.75rem",
                    fontWeight: 800,
                    color:
                      "#8fa3b8",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.06em",
                    marginBottom:
                      "0.375rem",
                    textAlign:
                      "left",
                  }}
                >
                  Workforce Style Snapshot
                </h4>

                <p
                  style={{
                    fontSize:
                      "0.875rem",
                    color:
                      "#627D98",
                    lineHeight: 1.5,
                    margin: 0,
                    textAlign:
                      "left",
                  }}
                >
                  {parsedSections.find(
                    (s) =>
                      s.title
                        .toLowerCase()
                        .includes(
                          "observed"
                        ) ||
                      s.title
                        .toLowerCase()
                        .includes(
                          "snapshot"
                        ) ||
                      s.title
                        .toLowerCase()
                        .includes(
                          "dominant"
                        )
                  )?.content?.split(
                    "\n"
                  )[0] ||
                    "A " +
                      combinationName.toLowerCase() +
                      " worker style with primary reliance on structured execution and supportive team dynamics."}
                </p>
              </div>

              <div>
                <h4
                  style={{
                    fontSize:
                      "0.75rem",
                    fontWeight: 800,
                    color:
                      "#8fa3b8",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.06em",
                    marginBottom:
                      "0.375rem",
                    textAlign:
                      "left",
                  }}
                >
                  Growth & Adaptability Style
                </h4>

                <p
                  style={{
                    fontSize:
                      "0.875rem",
                    color:
                      "#627D98",
                    lineHeight: 1.5,
                    margin: 0,
                    textAlign:
                      "left",
                  }}
                >
                  {parsedSections.find(
                    (s) =>
                      s.title
                        .toLowerCase()
                        .includes(
                          "thrive"
                        ) ||
                      s.title
                        .toLowerCase()
                        .includes(
                          "growth"
                        ) ||
                      s.title
                        .toLowerCase()
                        .includes(
                          "change"
                        )
                  )?.content?.split(
                    "\n"
                  )[0] ||
                    "Prefers guided execution and responds well when transition parameters are documented."}
                </p>
              </div>

              <div>
                <h4
                  style={{
                    fontSize:
                      "0.75rem",
                    fontWeight: 800,
                    color:
                      "#8fa3b8",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.06em",
                    marginBottom:
                      "0.375rem",
                    textAlign:
                      "left",
                  }}
                >
                  Collaboration Style
                </h4>

                <p
                  style={{
                    fontSize:
                      "0.875rem",
                    color:
                      "#627D98",
                    lineHeight: 1.5,
                    margin: 0,
                    textAlign:
                      "left",
                  }}
                >
                  {parsedSections.find(
                    (s) =>
                      s.title
                        .toLowerCase()
                        .includes(
                          "others"
                        ) ||
                      s.title
                        .toLowerCase()
                        .includes(
                          "implications"
                        ) ||
                      s.title
                        .toLowerCase()
                        .includes(
                          "collaboration"
                        )
                  )?.content?.split(
                    "\n"
                  )[0] ||
                    "Values team alignment, clear ownership boundaries, and empathetic cross-functional feedback."}
                </p>
              </div>
            </div>
          </div>

          {/* Development & Manager Support */}

          <div className="profile-output-split-card">
            <div className="profile-output-card-header">
              <BookOpen
                className="h-5 w-5"
                style={{
                  color: "#5BA4A4",
                }}
              />

              <h3
                style={{
                  fontSize:
                    "1.125rem",
                  fontWeight: 800,
                  color:
                    "#243B53",
                  margin: 0,
                  textAlign:
                    "left",
                }}
              >
                Development & Support Plan
              </h3>
            </div>

            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap: "1rem",
              }}
            >
              <div className="profile-output-friction-block">
                <h4
                  style={{
                    fontSize:
                      "0.72rem",
                    fontWeight: 800,
                    color:
                      "#c0392b",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.06em",
                    marginBottom:
                      "0.375rem",
                    textAlign:
                      "left",
                  }}
                >
                  Potential Workplace Friction Areas
                </h4>

                <p
                  style={{
                    fontSize:
                      "0.85rem",
                    color:
                      "#c0392b",
                    lineHeight: 1.4,
                    margin: 0,
                    textAlign:
                      "left",
                  }}
                >
                  {currentFrictionArea}
                </p>
              </div>

              <div>
                <h4
                  style={{
                    fontSize:
                      "0.75rem",
                    fontWeight: 800,
                    color:
                      "#243B53",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.06em",
                    marginBottom:
                      "0.5rem",
                    textAlign:
                      "left",
                  }}
                >
                  Suggested Growth Areas
                </h4>

                <ul className="profile-output-bullet-list">
                  {currentGrowthAreas.map(
                    (area, idx) => (
                      <li key={idx}>
                        {area}
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div
                style={{
                  borderTop:
                    "1px solid #f0f4f8",
                  paddingTop:
                    "0.875rem",
                }}
              >
                <h4
                  style={{
                    fontSize:
                      "0.75rem",
                    fontWeight: 800,
                    color:
                      "#5BA4A4",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.06em",
                    marginBottom:
                      "0.5rem",
                    textAlign:
                      "left",
                  }}
                >
                  Recommended Manager Support
                </h4>

                <ul className="profile-output-bullet-list">
                  {currentManagerSupport.map(
                    (support, idx) => (
                      <li key={idx}>
                        {support}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================
            AI NARRATIVE ANALYSIS
        ============================================ */}

        <div className="profile-output-suggestions-container">
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "0.75rem",
              marginBottom:
                "1.5rem",
            }}
          >
            <Sparkles
              className="h-5 w-5"
              style={{
                color: "#5BA4A4",
              }}
            />

            <h3
              style={{
                fontSize:
                  "1.125rem",
                fontWeight: 800,
                color:
                  "#243B53",
                margin: 0,
                textAlign:
                  "left",
              }}
            >
              Detailed Workforce Personality Report
            </h3>
          </div>

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap: "1.75rem",
            }}
          >
            {parsedSections.map(
              (section, idx) => {
                let sectionIcon = (
                  <Sparkles
                    className="h-4 w-4"
                    style={{
                      color:
                        "#5BA4A4",
                    }}
                  />
                );

                const titleLower =
                  section.title.toLowerCase();

                if (
                  titleLower.includes(
                    "snapshot"
                  ) ||
                  titleLower.includes(
                    "dominant"
                  ) ||
                  titleLower.includes(
                    "observed"
                  )
                ) {
                  sectionIcon = (
                    <Brain
                      className="h-4 w-4"
                      style={{
                        color:
                          "#5BA4A4",
                      }}
                    />
                  );
                } else if (
                  titleLower.includes(
                    "best work"
                  ) ||
                  titleLower.includes(
                    "thrive"
                  ) ||
                  titleLower.includes(
                    "value"
                  )
                ) {
                  sectionIcon = (
                    <Zap
                      className="h-4 w-4"
                      style={{
                        color:
                          "#A3B18A",
                      }}
                    />
                  );
                } else if (
                  titleLower.includes(
                    "change"
                  ) ||
                  titleLower.includes(
                    "implications"
                  ) ||
                  titleLower.includes(
                    "challenge"
                  )
                ) {
                  sectionIcon = (
                    <RefreshCw
                      className="h-4 w-4"
                      style={{
                        color:
                          "#5BA4A4",
                      }}
                    />
                  );
                } else if (
                  titleLower.includes(
                    "responsibility"
                  ) ||
                  titleLower.includes(
                    "manager"
                  ) ||
                  titleLower.includes(
                    "what your manager"
                  )
                ) {
                  sectionIcon = (
                    <Shield
                      className="h-4 w-4"
                      style={{
                        color:
                          "#243B53",
                      }}
                    />
                  );
                } else if (
                  titleLower.includes(
                    "others"
                  ) ||
                  titleLower.includes(
                    "experience"
                  )
                ) {
                  sectionIcon = (
                    <Users
                      className="h-4 w-4"
                      style={{
                        color:
                          "#5BA4A4",
                      }}
                    />
                  );
                } else if (
                  titleLower.includes(
                    "frustrate"
                  ) ||
                  titleLower.includes(
                    "watch-out"
                  )
                ) {
                  sectionIcon = (
                    <AlertCircle
                      className="h-4 w-4"
                      style={{
                        color:
                          "#c0392b",
                      }}
                    />
                  );
                } else if (
                  titleLower.includes(
                    "growth"
                  ) ||
                  titleLower.includes(
                    "suggestion"
                  )
                ) {
                  sectionIcon = (
                    <TrendingUp
                      className="h-4 w-4"
                      style={{
                        color:
                          "#A3B18A",
                      }}
                    />
                  );
                } else if (
                  titleLower.includes(
                    "reflection"
                  ) ||
                  titleLower.includes(
                    "conclusion"
                  ) ||
                  titleLower.includes(
                    "measure"
                  )
                ) {
                  sectionIcon = (
                    <HelpCircle
                      className="h-4 w-4"
                      style={{
                        color:
                          "#E07A5F",
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={idx}
                    className="profile-output-sug-item"
                    style={{
                      borderBottom:
                        idx ===
                        parsedSections.length -
                          1
                          ? "none"
                          : "1px solid #f0f4f8",
                      paddingBottom:
                        "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "0.5rem",
                        marginBottom:
                          "0.875rem",
                      }}
                    >
                      <div
                        style={{
                          background:
                            "rgba(91,164,164,0.06)",
                          padding: "6px",
                          borderRadius:
                            "8px",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                        }}
                      >
                        {sectionIcon}
                      </div>

                      <h4
                        style={{
                          fontSize:
                            "0.9rem",
                          fontWeight: 800,
                          color:
                            "#243B53",
                          textTransform:
                            "uppercase",
                          letterSpacing:
                            "0.08em",
                          margin: 0,
                          textAlign:
                            "left",
                        }}
                      >
                        {section.title}
                      </h4>
                    </div>

                    <div
                      style={{
                        paddingLeft:
                          "0.5rem",
                      }}
                    >
                      <MarkdownRenderer
                        content={
                          section.content
                        }
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* ============================================
            BOTTOM ACTIONS
        ============================================ */}

        {showActions && (
          <div className="profile-output-footer-actions">
            <Link
              href="/welcome"
              className="profile-output-btn-retake"
            >
              <RefreshCw size={14} />
              Retake Assessment
            </Link>

            <button
              onClick={
                handleDownloadPDF
              }
              disabled={
                isGeneratingPdf
              }
              className="profile-output-btn-pdf"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
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
        )}
      </div>

      {/* ============================================
          PDF GENERATION LOADER
      ============================================ */}

      {isGeneratingPdf && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15, 23, 42, 0.75)",
            backdropFilter:
              "blur(12px)",
            display: "flex",
            flexDirection:
              "column",
            alignItems:
              "center",
            justifyContent:
              "center",
            zIndex: 9999,
            fontFamily:
              "'Inter', -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              background:
                "#ffffff",
              borderRadius:
                "24px",
              padding:
                "2.5rem 2rem",
              maxWidth:
                "380px",
              width:
                "calc(100% - 32px)",
              textAlign:
                "center",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              boxSizing:
                "border-box",
              animation:
                "scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                margin:
                  "0 auto 1.5rem",
                position:
                  "relative",
              }}
            >
              <div
                style={{
                  position:
                    "absolute",
                  inset: 0,
                  borderRadius:
                    "50%",
                  border:
                    "4px solid #F1F5F9",
                  borderTopColor:
                    "#243B53",
                  animation:
                    "spin 1s linear infinite",
                }}
              />
            </div>

            <h3
              style={{
                fontSize:
                  "1.25rem",
                fontWeight: 800,
                color:
                  "#0F172A",
                margin:
                  "0 0 0.5rem",
              }}
            >
              Preparing Your Report
            </h3>

            <p
              style={{
                fontSize:
                  "0.9375rem",
                color:
                  "#64748B",
                margin:
                  "0 0 1.5rem",
                lineHeight: 1.5,
              }}
            >
              Please wait while we render a high-resolution, print-ready PDF document.
            </p>

            <div
              style={{
                display:
                  "inline-flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                padding:
                  "0.5rem 1rem",
                background:
                  "#F8FAFC",
                border:
                  "1px solid #E2E8F0",
                borderRadius:
                  "99px",
                fontSize:
                  "0.875rem",
                fontWeight: 600,
                color:
                  "#243B53",
              }}
            >
              {pdfProgressText ||
                "Processing pages..."}
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      )}

      {/* ============================================
          INVISIBLE PDF RENDERING AREA
      ============================================ */}

      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          zIndex: -100,
        }}
      >

        {/* ============================================
            PDF PAGE 1
        ============================================ */}

        <div
          id="tie-report-pdf-page-1"
          style={{
            width: "794px",
            height: "1123px",
            padding:
              "40px 48px",
            background:
              "#ffffff",
            fontFamily:
              "'Inter', -apple-system, sans-serif",
            boxSizing:
              "border-box",
            color:
              "#1F2933",
            display:
              "flex",
            flexDirection:
              "column",
            justifyContent:
              "space-between",
          }}
        >
          <div>

            {/* PDF Header */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "12px",
              }}
            >
              <img
                src="/logo.png"
                alt="TIE Logo"
                style={{
                  height: "48px",
                  width: "auto",
                  display:
                    "block",
                }}
              />

              <div
                style={{
                  textAlign:
                    "right",
                }}
              >
                <h2
                  style={{
                    fontSize:
                      "15px",
                    fontWeight: 800,
                    color:
                      "#243B53",
                    letterSpacing:
                      "0.05em",
                    margin: 0,
                    textTransform:
                      "uppercase",
                  }}
                >
                  Talent Intelligence Engine
                </h2>

                <p
                  style={{
                    fontSize:
                      "10px",
                    color:
                      "#627D98",
                    margin:
                      "2px 0 0",
                  }}
                >
                  Workforce Style Insights Report
                </p>
              </div>
            </div>

            <div
              style={{
                height: "4px",
                width: "100%",
                background:
                  "#5BA4A4",
                marginBottom:
                  "16px",
              }}
            />

            <h1
              style={{
                fontSize:
                  "18px",
                fontWeight: 800,
                color:
                  "#243B53",
                letterSpacing:
                  "-0.02em",
                margin:
                  "0 0 14px",
                textTransform:
                  "uppercase",
                textAlign:
                  "left",
              }}
            >
              Employee Workforce Assessment Profile
            </h1>

            {/* Employee Details */}

            <div
              style={{
                background:
                  "#F4F7FA",
                border:
                  "1px solid rgba(36, 59, 83, 0.08)",
                borderRadius:
                  "14px",
                padding:
                  "14px 18px",
                marginBottom:
                  "16px",
                display:
                  "flex",
                flexWrap:
                  "wrap",
                gap:
                  "10px 0px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  width:
                    "50%",
                  fontSize:
                    "12px",
                  boxSizing:
                    "border-box",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      "#8fa3b8",
                    width:
                      "115px",
                    textTransform:
                      "uppercase",
                    fontSize:
                      "9px",
                    letterSpacing:
                      "0.03em",
                  }}
                >
                  Employee Name:
                </span>

                <span
                  style={{
                    fontWeight: 700,
                    color:
                      "#243B53",
                  }}
                >
                  {employeeName}
                </span>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  width:
                    "50%",
                  fontSize:
                    "12px",
                  boxSizing:
                    "border-box",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      "#8fa3b8",
                    width:
                      "115px",
                    textTransform:
                      "uppercase",
                    fontSize:
                      "9px",
                    letterSpacing:
                      "0.03em",
                  }}
                >
                  Employee ID:
                </span>

                <span
                  style={{
                    fontWeight: 700,
                    color:
                      "#243B53",
                  }}
                >
                  {employeeId ||
                    "Not Specified"}
                </span>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  width:
                    "50%",
                  fontSize:
                    "12px",
                  boxSizing:
                    "border-box",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      "#8fa3b8",
                    width:
                      "115px",
                    textTransform:
                      "uppercase",
                    fontSize:
                      "9px",
                    letterSpacing:
                      "0.03em",
                  }}
                >
                  Interests:
                </span>

                <span
                  style={{
                    fontWeight: 700,
                    color:
                      "#243B53",
                  }}
                >
                  {interestsDisplay}
                </span>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  width:
                    "50%",
                  fontSize:
                    "12px",
                  boxSizing:
                    "border-box",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      "#8fa3b8",
                    width:
                      "115px",
                    textTransform:
                      "uppercase",
                    fontSize:
                      "9px",
                    letterSpacing:
                      "0.03em",
                  }}
                >
                  Designation:
                </span>

                <span
                  style={{
                    fontWeight: 700,
                    color:
                      "#243B53",
                  }}
                >
                  {designation}
                </span>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  width:
                    "50%",
                  fontSize:
                    "12px",
                  boxSizing:
                    "border-box",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      "#8fa3b8",
                    width:
                      "115px",
                    textTransform:
                      "uppercase",
                    fontSize:
                      "9px",
                    letterSpacing:
                      "0.03em",
                  }}
                >
                  Experience:
                </span>

                <span
                  style={{
                    fontWeight: 700,
                    color:
                      "#243B53",
                  }}
                >
                  {experienceYears} Years
                </span>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  width:
                    "50%",
                  fontSize:
                    "12px",
                  boxSizing:
                    "border-box",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      "#8fa3b8",
                    width:
                      "115px",
                    textTransform:
                      "uppercase",
                    fontSize:
                      "9px",
                    letterSpacing:
                      "0.03em",
                  }}
                >
                  Email Address:
                </span>

                <span
                  style={{
                    fontWeight: 700,
                    color:
                      "#243B53",
                  }}
                >
                  {email}
                </span>
              </div>
            </div>

            {/* Archetype Banner */}

            <div
              style={{
                background:
                  "linear-gradient(135deg, #243B53 0%, #1a2d40 100%)",
                borderRadius:
                  "16px",
                padding:
                  "18px 22px",
                color:
                  "#ffffff",
                marginBottom:
                  "16px",
                boxSizing:
                  "border-box",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                }}
              >
                <div
                  style={{
                    textAlign:
                      "left",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "9px",
                      fontWeight: 700,
                      color:
                        "#5BA4A4",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.1em",
                    }}
                  >
                    Primary Profile Archetype
                  </span>

                  <h3
                    style={{
                      fontSize:
                        "20px",
                      fontWeight: 800,
                      margin:
                        "4px 0",
                      letterSpacing:
                        "-0.01em",
                      color:
                        "#ffffff",
                    }}
                  >
                    {combinationName}
                  </h3>

                  <p
                    style={{
                      fontSize:
                        "11px",
                      color:
                        "#A3B18A",
                      fontStyle:
                        "italic",
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    {tagline}
                  </p>
                </div>

                <div
                  style={{
                    background:
                      "rgba(255,255,255,0.08)",
                    border:
                      "1px solid rgba(255,255,255,0.12)",
                    padding:
                      "10px 16px",
                    borderRadius:
                      "12px",
                    textAlign:
                      "center",
                  }}
                >
                  <span
                    style={{
                      display:
                        "block",
                      fontSize:
                        "20px",
                      fontWeight: 800,
                      color:
                        "#5BA4A4",
                      lineHeight: 1,
                    }}
                  >
                    {primary_strength_pct}%
                  </span>

                  <span
                    style={{
                      display:
                        "block",
                      fontSize:
                        "7px",
                      color:
                        "#b0bec8",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.05em",
                      marginTop:
                        "2px",
                    }}
                  >
                    Strength
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Insights */}

            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap:
                  "12px",
                marginBottom:
                  "16px",
                boxSizing:
                  "border-box",
              }}
            >
              <div
                style={{
                  borderLeft:
                    "4px solid #5BA4A4",
                  paddingLeft:
                    "14px",
                  textAlign:
                    "left",
                }}
              >
                <h4
                  style={{
                    fontSize:
                      "11px",
                    fontWeight: 800,
                    color:
                      "#243B53",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.05em",
                    margin:
                      "0 0 4px",
                  }}
                >
                  Workforce Style Snapshot
                </h4>

                <p
                  style={{
                    fontSize:
                      "11px",
                    color:
                      "#627D98",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {parsedSections.find(
                    (s) =>
                      s.title
                        .toLowerCase()
                        .includes(
                          "observed"
                        ) ||
                      s.title
                        .toLowerCase()
                        .includes(
                          "snapshot"
                        ) ||
                      s.title
                        .toLowerCase()
                        .includes(
                          "dominant"
                        )
                  )?.content?.split(
                    "\n"
                  )[0] ||
                    "A " +
                      combinationName.toLowerCase() +
                      " worker style with reliance on structured execution and supportive team dynamics."}
                </p>
              </div>

              <div
                style={{
                  borderLeft:
                    "4px solid #243B53",
                  paddingLeft:
                    "14px",
                  textAlign:
                    "left",
                }}
              >
                <h4
                  style={{
                    fontSize:
                      "11px",
                    fontWeight: 800,
                    color:
                      "#243B53",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.05em",
                    margin:
                      "0 0 4px",
                  }}
                >
                  Growth & Adaptability Style
                </h4>

                <p
                  style={{
                    fontSize:
                      "11px",
                    color:
                      "#627D98",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {parsedSections.find(
                    (s) =>
                      s.title
                        .toLowerCase()
                        .includes(
                          "thrive"
                        ) ||
                      s.title
                        .toLowerCase()
                        .includes(
                          "growth"
                        ) ||
                      s.title
                        .toLowerCase()
                        .includes(
                          "change"
                        )
                  )?.content?.split(
                    "\n"
                  )[0] ||
                    "Prefers guided execution and responds well when transition parameters are documented."}
                </p>
              </div>

              <div
                style={{
                  borderLeft:
                    "4px solid #A3B18A",
                  paddingLeft:
                    "14px",
                  textAlign:
                    "left",
                }}
              >
                <h4
                  style={{
                    fontSize:
                      "11px",
                    fontWeight: 800,
                    color:
                      "#243B53",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.05em",
                    margin:
                      "0 0 4px",
                  }}
                >
                  Collaboration Style
                </h4>

                <p
                  style={{
                    fontSize:
                      "11px",
                    color:
                      "#627D98",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {parsedSections.find(
                    (s) =>
                      s.title
                        .toLowerCase()
                        .includes(
                          "others"
                        ) ||
                      s.title
                        .toLowerCase()
                        .includes(
                          "implications"
                        ) ||
                      s.title
                        .toLowerCase()
                        .includes(
                          "collaboration"
                        )
                  )?.content?.split(
                    "\n"
                  )[0] ||
                    "Values team alignment, clear ownership boundaries, and empathetic cross-functional feedback."}
                </p>
              </div>
            </div>

            {/* Friction & Growth */}

            <div
              style={{
                display:
                  "flex",
                gap:
                  "20px",
                boxSizing:
                  "border-box",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap:
                    "12px",
                  boxSizing:
                    "border-box",
                }}
              >
                <div
                  style={{
                    background:
                      "rgba(220, 53, 69, 0.03)",
                    border:
                      "1px solid rgba(220, 53, 69, 0.15)",
                    borderRadius:
                      "12px",
                    padding:
                      "11px 15px",
                    textAlign:
                      "left",
                  }}
                >
                  <h4
                    style={{
                      fontSize:
                        "10px",
                      fontWeight: 800,
                      color:
                        "#c0392b",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.05em",
                      margin:
                        "0 0 6px",
                    }}
                  >
                    Potential Workplace Friction Areas
                  </h4>

                  <p
                    style={{
                      fontSize:
                        "10.5px",
                      color:
                        "#c0392b",
                      lineHeight: 1.4,
                      margin: 0,
                    }}
                  >
                    {currentFrictionArea}
                  </p>
                </div>

                <div
                  style={{
                    background:
                      "#FDFDFD",
                    border:
                      "1px solid rgba(36, 59, 83, 0.06)",
                    borderRadius:
                      "12px",
                    padding:
                      "11px 15px",
                    textAlign:
                      "left",
                  }}
                >
                  <h4
                    style={{
                      fontSize:
                        "10px",
                      fontWeight: 800,
                      color:
                        "#243B53",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.05em",
                      margin:
                        "0 0 8px",
                    }}
                  >
                    Suggested Growth Areas
                  </h4>

                  <ul
                    style={{
                      paddingLeft:
                        "14px",
                      margin: 0,
                      fontSize:
                        "10.5px",
                      color:
                        "#627D98",
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap:
                        "4px",
                    }}
                  >
                    {currentGrowthAreas.map(
                      (
                        area,
                        idx
                      ) => (
                        <li key={idx}>
                          {area}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  boxSizing:
                    "border-box",
                }}
              >
                <div
                  style={{
                    height:
                      "100%",
                    background:
                      "#F4F9F9",
                    border:
                      "1px solid rgba(91, 164, 164, 0.15)",
                    borderRadius:
                      "12px",
                    padding:
                      "11px 15px",
                    boxSizing:
                      "border-box",
                    textAlign:
                      "left",
                  }}
                >
                  <h4
                    style={{
                      fontSize:
                        "10px",
                      fontWeight: 800,
                      color:
                        "#5BA4A4",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.05em",
                      margin:
                        "0 0 8px",
                    }}
                  >
                    Recommended Manager Support
                  </h4>

                  <ul
                    style={{
                      paddingLeft:
                        "14px",
                      margin: 0,
                      fontSize:
                        "10.5px",
                      color:
                        "#627D98",
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap:
                        "6px",
                    }}
                  >
                    {currentManagerSupport.map(
                      (
                        support,
                        idx
                      ) => (
                        <li key={idx}>
                          {support}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              height:
                "10px",
            }}
          />
        </div>

        {/* ============================================
            PDF NARRATIVE
        ============================================ */}

        <div
          id="tie-report-pdf-narrative"
          style={{
            width:
              "794px",
            padding:
              "40px 48px",
            background:
              "#ffffff",
            fontFamily:
              "'Inter', -apple-system, sans-serif",
            boxSizing:
              "border-box",
            color:
              "#1F2933",
            display:
              "flex",
            flexDirection:
              "column",
            gap:
              "20px",
          }}
        >
          {/* Header Template */}

          <div
            id="tie-report-pdf-header-template"
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap:
                "12px",
              width:
                "100%",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
              }}
            >
              <img
                src="/logo.png"
                alt="TIE Logo"
                style={{
                  height:
                    "48px",
                  width:
                    "auto",
                  display:
                    "block",
                }}
              />

              <div
                style={{
                  textAlign:
                    "right",
                }}
              >
                <h2
                  style={{
                    fontSize:
                      "15px",
                    fontWeight: 800,
                    color:
                      "#243B53",
                    letterSpacing:
                      "0.05em",
                    margin: 0,
                    textTransform:
                      "uppercase",
                  }}
                >
                  Talent Intelligence Engine
                </h2>

                <p
                  style={{
                    fontSize:
                      "10px",
                    color:
                      "#627D98",
                    margin:
                      "2px 0 0",
                  }}
                >
                  Workforce Style Insights Report
                </p>
              </div>
            </div>

            <div
              style={{
                height:
                  "4px",
                width:
                  "100%",
                background:
                  "#5BA4A4",
              }}
            />
          </div>

          <h1
            style={{
              fontSize:
                "18px",
              fontWeight: 800,
              color:
                "#243B53",
              letterSpacing:
                "-0.02em",
              margin:
                "0 0 6px",
              textTransform:
                "uppercase",
              textAlign:
                "left",
            }}
          >
            Detailed Behavioral Insights & Guidance
          </h1>

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap:
                "16px",
            }}
          >
            {parsedSections.map(
              (
                section,
                idx
              ) => (
                <div
                  key={idx}
                  className="pdf-narrative-section"
                  style={{
                    borderLeft:
                      "3px solid #5BA4A4",
                    paddingLeft:
                      "14px",
                    textAlign:
                      "left",
                  }}
                >
                  <h4
                    style={{
                      fontSize:
                        "11px",
                      fontWeight: 800,
                      color:
                        "#243B53",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.06em",
                      margin:
                        "0 0 6px",
                    }}
                  >
                    {section.title}
                  </h4>

                  <div
                    style={{
                      paddingLeft:
                        "4px",
                    }}
                  >
                    <MarkdownRenderer
                      content={
                        section.content
                      }
                      fontSize="10.5px"
                      color="#486581"
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}