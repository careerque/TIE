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
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "24px",
        padding: "1.75rem 2rem",
        boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
        position: "relative",
        overflow: "hidden",
        color: "#ffffff",
        marginBottom: "1.5rem"
      }}
    >
      {/* Top Accent Gradient Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "4px",
          background: "linear-gradient(90deg, #0EA5E9 0%, #14B8A6 50%, #3B82F6 100%)",
        }}
      />

      {/* Background Micro Decorative Glows */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(0, 0, 0, 0) 70%)",
          pointerEvents: "none"
        }}
      />

      {/* Main Header Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        {/* Row 1: Badges & Tenant Insulation Tag */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          
          {/* Entity Badges Group */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
            
            {/* Company Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: "rgba(14, 165, 233, 0.15)",
                border: "1px solid rgba(14, 165, 233, 0.3)",
                borderRadius: "99px",
                color: "#38BDF8",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.02em"
              }}
            >
              <Building2 size={14} />
              <span>{companyName || "Enterprise Workspace"}</span>
            </div>

            {/* Team & Manager Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: "rgba(20, 184, 166, 0.15)",
                border: "1px solid rgba(20, 184, 166, 0.3)",
                borderRadius: "99px",
                color: "#2DD4BF",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.02em"
              }}
            >
              <Users size={14} />
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
              padding: "4px 12px",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              borderRadius: "99px",
              color: "#4ADE80",
              fontSize: "0.6875rem",
              fontWeight: 600
            }}
          >
            <ShieldCheck size={13} />
            <span>Verified Tenant Session</span>
          </div>
        </div>

        {/* Row 2: Title & Candidate Identity Block */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1.5rem" }}>
          
          {/* Assessment Title & Subtitle */}
          <div style={{ flex: "1 1 300px" }}>
            <h1 style={{ fontSize: "1.625rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2, color: "#F8FAFC" }}>
              Work Style Preferences Assessment
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#94A3B8", marginTop: "0.35rem", marginBottom: 0, fontWeight: 400, lineHeight: 1.4 }}>
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
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              backdropFilter: "blur(10px)",
              flexShrink: 0
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "1rem",
                boxShadow: "0 4px 10px rgba(14, 165, 233, 0.3)"
              }}
            >
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#F8FAFC" }}>{userName}</span>
                {userEmployeeId && (
                  <span style={{ fontSize: "0.6875rem", padding: "1px 6px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", color: "#CBD5E1", fontWeight: 600 }}>
                    #{userEmployeeId}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "2px", fontWeight: 500 }}>
                {userDesignation}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Sticky Progress & Submit Control Sub-Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.25rem",
            padding: "1rem 1.25rem",
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            marginTop: "0.25rem",
            flexWrap: "wrap"
          }}
        >
          {/* Progress Tracker Numbers */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: "160px" }}>
            <div>
              <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "#64748B" }}>
                Progress
              </span>
              <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#F8FAFC" }}>
                {totalAnsweredCount} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#64748B" }}>/ {totalQuestions} Completed</span>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div style={{ flex: 1, minWidth: "140px", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "99px", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{
                height: "100%",
                background: isAllCompleted 
                  ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
                  : "linear-gradient(90deg, #0EA5E9 0%, #14B8A6 100%)",
                borderRadius: "99px"
              }}
            />
          </div>

          {/* Submission Action Button */}
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
                borderRadius: "12px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                transition: "all 0.2s ease"
              }}
            >
              <span>Continue to Reflection</span>
              <Send size={14} />
            </button>
          ) : (
            <span style={{ fontSize: "0.75rem", color: "#F87171", fontWeight: 700 }}>
              ⚠️ Answer {totalQuestions - totalAnsweredCount} more to submit
            </span>
          )}
        </div>

      </div>
    </div>
  );
};

export default AssessmentHeader;
