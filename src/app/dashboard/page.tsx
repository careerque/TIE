"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, User, ClipboardList } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoggedIn, profile, loading } = useAuthContext();
  const [userName, setUserName] = useState<string>("User");
  const [takeTestHovered, setTakeTestHovered] = useState(false);
  const [viewProfileHovered, setViewProfileHovered] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }

      if (profile?.first_name) {
        setUserName(profile.first_name);
      } else if (profile?.email) {
        const namePart = profile.email.split("@")[0];
        const formatted = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        setUserName(formatted);
      }
    }
  }, [isLoggedIn, profile, loading, router]);

  if (loading) {
    return (
      <div className="tie-container">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <div className="tie-card-top-bar" />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#627D98" }}>
            Loading Dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Redirecting in useEffect
  }

  return (
    <main className="tie-container">
      {/* ── Background decoration ── */}
      <div className="tie-dot-grid" aria-hidden />
      
      {/* Ambient gradient blobs */}
      <div className="tie-glow-blob-1" aria-hidden />
      <div className="tie-glow-blob-2" aria-hidden />

      {/* ── Main Centered Card ── */}
      <div className="tie-card">
        {/* Top border accent line */}
        <div className="tie-card-top-bar" />

        {/* 1. Header & Greeting Area */}
        <div className="tie-header">
          <div className="tie-badge">
            <Sparkles size={11} style={{ marginRight: "2px" }} />
            User Dashboard
          </div>
          <h1 className="tie-title">
            Welcome back, {userName}!
          </h1>
          <p className="tie-desc">
            Access your talent insights portal. Choose an option below to evaluate your professional work styles or manage your profile analytics.
          </p>
        </div>

        {/* 2. Action Area Buttons */}
        <div className="dashboard-action-block">
          
          {/* Button 1: Take Test */}
          <Link
            href="/welcome"
            onMouseEnter={() => setTakeTestHovered(true)}
            onMouseLeave={() => setTakeTestHovered(false)}
            className="tie-btn-primary"
          >
            <ClipboardList size={18} />
            <span>Take Test</span>
            <ArrowRight 
              size={16} 
              className="dashboard-btn-icon-right"
            />
          </Link>

          {/* Button 2: View Profile Info */}
          <Link
            href="/profile"
            onMouseEnter={() => setViewProfileHovered(true)}
            onMouseLeave={() => setViewProfileHovered(false)}
            className="tie-btn-secondary"
          >
            <User size={18} style={{ color: "#243B53" }} />
            <span>View Profile Info</span>
            <ArrowRight 
              size={16} 
              className="dashboard-btn-icon-right"
              style={{ color: "#243B53" }}
            />
          </Link>
          
        </div>
      </div>
    </main>
  );
}
