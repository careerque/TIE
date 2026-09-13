"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, Sparkles, Server, Users, Building2, Zap } from "lucide-react";

interface InteractiveDashboardLoaderProps {
  title?: string;
  subtitle?: string;
}

const STAGES = [
  {
    percent: 22,
    label: "Authenticating workspace credentials & session...",
    icon: ShieldCheck,
    tag: "Security Verification"
  },
  {
    percent: 48,
    label: "Resolving organization structure & department teams...",
    icon: Building2,
    tag: "Team Structure"
  },
  {
    percent: 74,
    label: "Synchronizing corporate roster & team permissions...",
    icon: Users,
    tag: "Roster Sync"
  },
  {
    percent: 94,
    label: "Applying database-level insulation metrics (RLS)...",
    icon: Server,
    tag: "Data Insulation"
  },
  {
    percent: 100,
    label: "Finalizing dashboard view and analytics widgets...",
    icon: Sparkles,
    tag: "Ready"
  }
];

export default function InteractiveDashboardLoader({
  title = "Corporate HR Dashboard",
  subtitle = "Enterprise Organization Hub"
}: InteractiveDashboardLoaderProps) {
  const [progress, setProgress] = useState(14);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Smooth, realistic progressive loading simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) {
          // Slow down asymptotically near 98% while waiting for async fetches to finish
          return Math.min(prev + 0.3, 98);
        }
        // Realistic dynamic jumps
        const increment = Math.floor(Math.random() * 8) + 4;
        const next = Math.min(prev + increment, 96);
        return next;
      });
    }, 180);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Determine active stage based on progress
    const idx = STAGES.findIndex((s) => progress <= s.percent);
    setCurrentStageIndex(idx === -1 ? STAGES.length - 1 : idx);
  }, [progress]);

  const currentStage = STAGES[currentStageIndex] || STAGES[0];
  const CurrentIcon = currentStage.icon;

  return (
    <main className="tie-container bg-mesh" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div className="tie-dot-grid fixed inset-0 pointer-events-none opacity-40" aria-hidden />

      <div
        style={{
          background: "#ffffff",
          border: "1px solid rgba(36,59,83,0.08)",
          borderRadius: "24px",
          padding: "2.5rem",
          boxShadow: "0 20px 40px -15px rgba(36,59,83,0.12)",
          position: "relative",
          overflow: "hidden",
          width: "100%",
          maxWidth: "540px",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          textAlign: "left"
        }}
      >
        {/* Top Gradient Bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "4px",
            width: "100%",
            background: "linear-gradient(90deg, #5BA4A4, #243B53)"
          }}
        />

        {/* Header with Organization badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "99px", background: "#F4F7FA", color: "#7B8794", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <ShieldCheck size={11} style={{ color: "#5BA4A4" }} />
            {subtitle}
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#5BA4A4",
                boxShadow: "0 0 8px #5BA4A4",
                display: "inline-block"
              }}
            />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#5BA4A4" }}>
              Active Session
            </span>
          </div>
        </div>

        {/* Title and Animated Percentage display */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#243B53", letterSpacing: "-0.02em", margin: 0 }}>
              {title}
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "#627D98", margin: "4px 0 0 0", fontWeight: 500 }}>
              Initializing corporate environment...
            </p>
          </div>

          {/* Big Interactive Percentage */}
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: "2.25rem",
                fontWeight: 900,
                color: "#243B53",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                fontVariantNumeric: "tabular-nums"
              }}
            >
              {Math.round(progress)}
              <span style={{ fontSize: "1.25rem", color: "#5BA4A4", fontWeight: 700 }}>%</span>
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "#F0F4F8",
              borderRadius: "99px",
              overflow: "hidden",
              position: "relative"
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #5BA4A4 0%, #243B53 100%)",
                borderRadius: "99px",
                transition: "width 0.25s ease-out",
                boxShadow: "0 0 12px rgba(91,164,164,0.4)"
              }}
            />
          </div>

          {/* Current Stage Label with Pulsing Icon */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  padding: "4px",
                  borderRadius: "6px",
                  background: "rgba(91,164,164,0.1)",
                  color: "#5BA4A4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <CurrentIcon size={13} />
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#243B53" }}>
                {currentStage.label}
              </span>
            </div>

            <span
              style={{
                fontSize: "9px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "6px",
                background: "#F4F7FA",
                color: "#627D98",
                textTransform: "uppercase",
                letterSpacing: "0.04em"
              }}
            >
              {currentStage.tag}
            </span>
          </div>
        </div>

        {/* Milestone Steps Toggler */}
        <div style={{ paddingTop: "0.75rem", borderTop: "1px solid rgba(36,59,83,0.06)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 800, color: "#9aa8b6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Pipeline Milestones
            </span>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              style={{
                background: "none",
                border: "none",
                color: "#5BA4A4",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Zap size={10} />
              <span>{showDetails ? "Hide Checks" : "View Live Checks"}</span>
            </button>
          </div>

          {/* Stepper Pills */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
            {STAGES.map((s, idx) => {
              const isPassed = progress >= s.percent;
              const isCurrent = currentStageIndex === idx;

              return (
                <div
                  key={idx}
                  style={{
                    height: "4px",
                    borderRadius: "4px",
                    background: isPassed
                      ? "#5BA4A4"
                      : isCurrent
                      ? "rgba(91,164,164,0.5)"
                      : "#E2E8F0",
                    transition: "all 0.3s ease"
                  }}
                  title={s.label}
                />
              );
            })}
          </div>

          {/* Expandable Live Sub-checks View */}
          {showDetails && (
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid rgba(36,59,83,0.06)",
                borderRadius: "12px",
                padding: "0.75rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem"
              }}
            >
              {STAGES.map((s, idx) => {
                const isPassed = progress >= s.percent;
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: isPassed ? "#243B53" : "#9aa8b6",
                      fontWeight: isPassed ? 700 : 500
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle2
                        size={12}
                        style={{
                          color: isPassed ? "#2E7D32" : "#CBD5E1",
                          transition: "color 0.2s"
                        }}
                      />
                      <span>{s.tag}</span>
                    </div>
                    <span style={{ fontSize: "10px", color: isPassed ? "#5BA4A4" : "#94A3B8" }}>
                      {isPassed ? "Ready" : "Pending..."}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
