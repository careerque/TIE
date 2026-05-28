"use client";

import { useEffect, useState, CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, User, ClipboardList } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");
  const [loading, setLoading] = useState(true);
  const [takeTestHovered, setTakeTestHovered] = useState(false);
  const [viewProfileHovered, setViewProfileHovered] = useState(false);

  useEffect(() => {
    // Retrieve authentication status
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const email = localStorage.getItem("userEmail") || "";
    if (email) {
      const namePart = email.split("@")[0];
      const formatted = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      setUserName(formatted);
    }
    setLoading(false);
  }, [router]);

  // --- Premium Inline Styles ---
  const containerStyle: CSSProperties = {
    minHeight: "calc(100vh - 120px)",
    background: "#F4F7FA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3.5rem 1.5rem",
    fontFamily: "'Inter', -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  };

  const dotGridStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: "radial-gradient(circle, rgba(36, 59, 83, 0.05) 1px, transparent 1px)",
    backgroundSize: "22px 22px",
    pointerEvents: "none",
    opacity: 0.8,
  };

  const cardStyle: CSSProperties = {
    position: "relative",
    background: "#ffffff",
    border: "1px solid rgba(36, 59, 83, 0.08)",
    boxShadow: "0 20px 50px rgba(36, 59, 83, 0.04), 0 4px 12px rgba(36, 59, 83, 0.01)",
    borderRadius: "28px",
    maxWidth: "680px",
    width: "100%",
    padding: "3.5rem 3rem",
    display: "flex",
    flexDirection: "column",
    gap: "2.5rem",
    boxSizing: "border-box",
    zIndex: 10,
  };

  const topBarStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "6px",
    background: "linear-gradient(90deg, #5BA4A4 0%, #243B53 100%)",
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.125rem",
    textAlign: "left",
    alignItems: "flex-start",
  };

  const badgeStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(91, 164, 164, 0.08)",
    color: "#5BA4A4",
    padding: "5px 12px",
    borderRadius: "99px",
    fontSize: "0.6875rem",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    border: "1px solid rgba(91, 164, 164, 0.15)",
  };

  const titleStyle: CSSProperties = {
    fontSize: "1.875rem",
    fontWeight: 800,
    color: "#243B53",
    letterSpacing: "-0.02em",
    lineHeight: 1.25,
    margin: 0,
  };

  const descriptionStyle: CSSProperties = {
    fontSize: "0.9375rem",
    color: "#627D98",
    lineHeight: 1.6,
    margin: 0,
  };

  const actionBlockStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    boxSizing: "border-box",
  };

  const takeTestButtonStyle: CSSProperties = {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "1.25rem 2rem",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "1rem",
    borderRadius: "14px",
    transition: "all 0.25s ease-in-out",
    cursor: "pointer",
    textDecoration: "none",
    border: "none",
    background: takeTestHovered ? "#4a9393" : "#5BA4A4",
    transform: takeTestHovered ? "translateY(-1.5px)" : "translateY(0)",
    boxShadow: takeTestHovered ? "0 6px 18px rgba(91, 164, 164, 0.38)" : "0 4px 14px rgba(91, 164, 164, 0.25)",
  };

  const viewProfileButtonStyle: CSSProperties = {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "1.25rem 2rem",
    color: "#243B53",
    fontWeight: 700,
    fontSize: "1rem",
    borderRadius: "14px",
    transition: "all 0.25s ease-in-out",
    cursor: "pointer",
    textDecoration: "none",
    border: "2px solid rgba(36, 59, 83, 0.15)",
    background: viewProfileHovered ? "#F4F7FA" : "#ffffff",
    transform: viewProfileHovered ? "translateY(-1.5px)" : "translateY(0)",
    boxShadow: viewProfileHovered ? "0 4px 12px rgba(36, 59, 83, 0.05)" : "none",
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={dotGridStyle} aria-hidden />
        <div style={{ ...cardStyle, alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <div style={topBarStyle} />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#627D98" }}>
            Loading Dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <main style={containerStyle}>
      {/* ── Background decoration ── */}
      <div style={dotGridStyle} aria-hidden />
      
      {/* Ambient gradient blobs */}
      <div 
        aria-hidden 
        style={{
          position: "absolute",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          pointerEvents: "none",
          top: "-160px",
          right: "-160px",
          background: "radial-gradient(circle, rgba(91, 164, 164, 0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
          opacity: 0.6
        }}
      />
      <div 
        aria-hidden 
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          pointerEvents: "none",
          bottom: "-120px",
          left: "-120px",
          background: "radial-gradient(circle, rgba(36, 59, 83, 0.1) 0%, transparent 70%)",
          filter: "blur(45px)",
          opacity: 0.5
        }}
      />

      {/* ── Main Centered Card ── */}
      <div style={cardStyle}>
        {/* Top border accent line */}
        <div style={topBarStyle} />

        {/* 1. Header & Greeting Area */}
        <div style={headerStyle}>
          <div style={badgeStyle}>
            <Sparkles size={11} style={{ marginRight: "2px" }} />
            User Dashboard
          </div>
          <h1 style={titleStyle}>
            Welcome back, {userName}!
          </h1>
          <p style={descriptionStyle}>
            Access your talent insights portal. Choose an option below to evaluate your professional work styles or manage your profile analytics.
          </p>
        </div>

        {/* 2. Action Area Buttons */}
        <div style={actionBlockStyle}>
          
          {/* Button 1: Take Test */}
          <Link
            href="/welcome"
            onMouseEnter={() => setTakeTestHovered(true)}
            onMouseLeave={() => setTakeTestHovered(false)}
            style={takeTestButtonStyle}
          >
            <ClipboardList size={18} />
            <span>Take Test</span>
            <ArrowRight 
              size={16} 
              style={{
                transition: "transform 0.2s",
                transform: takeTestHovered ? "translateX(3px)" : "translateX(0)",
                marginLeft: "auto"
              }}
            />
          </Link>

          {/* Button 2: View Profile Info */}
          <Link
            href="/profile"
            onMouseEnter={() => setViewProfileHovered(true)}
            onMouseLeave={() => setViewProfileHovered(false)}
            style={viewProfileButtonStyle}
          >
            <User size={18} style={{ color: "#243B53" }} />
            <span>View Profile Info</span>
            <ArrowRight 
              size={16} 
              style={{
                transition: "transform 0.2s",
                transform: viewProfileHovered ? "translateX(3px)" : "translateX(0)",
                marginLeft: "auto",
                color: "#243B53"
              }}
            />
          </Link>
          
        </div>
      </div>
    </main>
  );
}
