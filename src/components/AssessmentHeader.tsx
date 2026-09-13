"use client";

import React from "react";
import { 
  Building2, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  Send,
  Sparkles,
  Award
} from "lucide-react";
import { motion } from "framer-motion";

interface AssessmentHeaderProps {
  companyName: string;
  teamName: string;
  managerName: string;
  userName: string;
  userDesignation?: string;
  userEmployeeId?: string;
  totalAnsweredCount: number;
  totalQuestions?: number;
  isAllCompleted: boolean;
  onCompleteTest: () => void;
}

export const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  companyName,
  teamName,
  managerName,
  userName,
  userDesignation = "Team Member",
  userEmployeeId,
  totalAnsweredCount,
  totalQuestions = 24,
  isAllCompleted,
  onCompleteTest,
}) => {
  const completionPercentage = Math.round((totalAnsweredCount / totalQuestions) * 100);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(36, 59, 83, 0.09)",
        borderRadius: "20px",
        padding: "1.75rem 2rem",
        boxShadow: "0 4px 20px -2px rgba(36, 59, 83, 0.06), 0 2px 6px -1px rgba(36, 59, 83, 0.03)",
        position: "relative",
        overflow: "hidden",
        color: "#243B53",
        marginBottom: "1.5rem"
      }}
    >
      {/* Top Accent Gradient Bar matching TIE branding */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "4px",
          background: "linear-gradient(90deg, #243B53 0%, #5BA4A4 50%, #A3B18A 100%)",
        }}
      />

      {/* Main Header Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        {/* Row 1: Badges & Tenant Insulation Tag */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          
          {/* Entity Badges Group */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.625rem" }}>
            
            {/* Company Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 14px",
                background: "rgba(91, 164, 164, 0.08)",
                border: "1px solid rgba(91, 164, 164, 0.25)",
                borderRadius: "99px",
                color: "#243B53",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.02em"
              }}
            >
              <Building2 size={14} style={{ color: "#5BA4A4" }} />
              <span>{companyName || "Enterprise Workspace"}</span>
            </div>

            {/* Team & Manager Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 14px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "99px",
                color: "#334E68",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.02em"
              }}
            >
              <Users size={14} style={{ color: "#627D98" }} />
              <span>
                {teamName || "Team"} {managerName && managerName !== "Reporting Manager" ? `• Mgr: ${managerName}` : ""}
              </span>
            </div>
          </div>

          {/* Security / Isolation Verification Tag */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              background: "rgba(46, 125, 50, 0.06)",
              border: "1px solid rgba(46, 125, 50, 0.2)",
              borderRadius: "99px",
              color: "#166534",
              fontSize: "0.6875rem",
              fontWeight: 600
            }}
          >
            <ShieldCheck size={13} style={{ color: "#16A34A" }} />
            <span>Verified Tenant Session</span>
          </div>
        </div>

        {/* Row 2: Title & Candidate Identity Block */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1.5rem" }}>
          
          {/* Assessment Title & Subtitle */}
          <div style={{ flex: "1 1 300px" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.25, color: "#243B53" }}>
              Work Style Preferences Assessment
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#627D98", marginTop: "0.35rem", marginBottom: 0, fontWeight: 400, lineHeight: 1.45 }}>
              Scenarios evaluate behavioral defaults, adaptability, and collaboration fit. All choices auto-save instantly.
            </p>
          </div>

          {/* User Candidate Identity Card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "0.75rem 1.25rem",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "14px",
              flexShrink: 0,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)"
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #243B53 0%, #334E68 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "0.95rem",
                boxShadow: "0 2px 6px rgba(36, 59, 83, 0.15)"
              }}
            >
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#243B53" }}>{userName}</span>
                {userEmployeeId && (
                  <span style={{ fontSize: "0.6875rem", padding: "1px 6px", background: "#EDF2F7", border: "1px solid #CBD5E1", borderRadius: "4px", color: "#486581", fontWeight: 600 }}>
                    #{userEmployeeId}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#627D98", marginTop: "2px", fontWeight: 500 }}>
                {userDesignation}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Progress & Submit Control Sub-Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.25rem",
            padding: "0.875rem 1.25rem",
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            marginTop: "0.25rem",
            flexWrap: "wrap"
          }}
        >
          {/* Progress Tracker Numbers */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: "160px" }}>
            <div>
              <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "#829AB1" }}>
                Progress
              </span>
              <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#243B53" }}>
                {totalAnsweredCount} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#627D98" }}>/ {totalQuestions} Completed</span>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div style={{ flex: 1, minWidth: "140px", height: "8px", background: "#E2E8F0", borderRadius: "99px", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{
                height: "100%",
                background: isAllCompleted 
                  ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
                  : "linear-gradient(90deg, #5BA4A4 0%, #3B82F6 100%)",
                borderRadius: "99px"
              }}
            />
          </div>

          {/* Submission Action Button or Helper Status */}
          {isAllCompleted ? (
            <button
              onClick={onCompleteTest}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.65rem 1.25rem",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 3px 10px rgba(16, 185, 129, 0.25)",
                transition: "all 0.2s ease"
              }}
            >
              <span>Continue to Reflection</span>
              <Send size={14} />
            </button>
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.4rem 0.85rem",
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                borderRadius: "99px",
                fontSize: "0.75rem",
                color: "#B45309",
                fontWeight: 600
              }}
            >
              <span>Answer {totalQuestions - totalAnsweredCount} more to submit</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AssessmentHeader;
