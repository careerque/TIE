"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut, FileText } from "lucide-react";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const logged = localStorage.getItem("isLoggedIn") === "true";
      const email = localStorage.getItem("userEmail");
      setIsLoggedIn(logged);
      setUserEmail(email);
    };

    // Run on mount
    checkAuth();

    // Listen for custom authentication changes
    window.addEventListener("auth-change", checkAuth);
    return () => {
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    
    // Dispatch auth change event
    window.dispatchEvent(new Event("auth-change"));
    
    router.push("/");
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(36, 59, 83, 0.08)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.03)",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.25rem 4rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Logo container to crop the whitespace in logo.png without clipping sides */}
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <div
            style={{
              width: "110px",
              height: "50px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Image
              src="/logo.png"
              alt="TIE Logo"
              width={110}
              height={110}
              priority
              style={{
                position: "absolute",
                top: "-30px",
                left: "0",
                display: "block",
              }}
            />
          </div>
        </Link>

        {/* Navigation items */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {/* Main navigation links */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginRight: "0.5rem" }}>
            {["Product", "Why TIE", "Pricing"].map((item) => (
              <button
                key={item}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#627D98",
                  padding: "0.5rem 0.875rem",
                  borderRadius: "8px",
                  transition: "color 0.15s, background 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#243B53";
                  e.currentTarget.style.background = "rgba(36,59,83,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#627D98";
                  e.currentTarget.style.background = "none";
                }}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Conditional items based on auth */}
          {isLoggedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {/* User Email Indicator */}
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "#627D98",
                  fontWeight: 500,
                  background: "rgba(36,59,83,0.05)",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "20px",
                  display: "none", // Hide on mobile if space is tight, can show selectively
                }}
                className="hidden sm:inline-block"
              >
                {userEmail}
              </span>

              {/* Take Assessment Button */}
              <Link
                href="/welcome"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0.5rem 1.25rem",
                  background: "#5BA4A4",
                  color: "#ffffff",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 3px 12px rgba(91,164,164,0.3)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#4a9393";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 5px 15px rgba(91,164,164,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#5BA4A4";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 3px 12px rgba(91,164,164,0.3)";
                }}
              >
                <Sparkles size={14} />
                Take Assessment
              </Link>

              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "1px solid rgba(36,59,83,0.15)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#627D98",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#243B53";
                  e.currentTarget.style.background = "rgba(36,59,83,0.03)";
                  e.currentTarget.style.borderColor = "rgba(36,59,83,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#627D98";
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.borderColor = "rgba(36,59,83,0.15)";
                }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Link
                href="/login"
                style={{
                  padding: "0.5rem 1.25rem",
                  background: "none",
                  color: "#627D98",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  borderRadius: "8px",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#243B53";
                  e.currentTarget.style.background = "rgba(36,59,83,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#627D98";
                  e.currentTarget.style.background = "none";
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                style={{
                  padding: "0.5rem 1.25rem",
                  background: "#243B53",
                  color: "#ffffff",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.18s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1a2d40")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#243B53")}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
