"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export default function Navbar() {
  const { isLoggedIn, profile, logout } = useAuthContext();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/logout");
  };

  return (
    <nav className="tie-navbar">
      <div className="tie-navbar-container">
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
        <div className="tie-navbar-links-group">
          {/* Main navigation links */}
          <div className="tie-navbar-links">
            {["Product", "Why TIE", "Pricing"].map((item) => (
              <button key={item} className="tie-navbar-btn-link">
                {item}
              </button>
            ))}
          </div>

          {/* Conditional items based on auth */}
          {isLoggedIn ? (
            <div className="tie-navbar-auth-group">
              {/* User Email Indicator */}
              <span className="tie-navbar-email hidden sm:inline-block">
                {profile?.email}
              </span>

              {/* Take Assessment Button */}
              <Link href="/welcome" className="tie-navbar-btn-cta">
                <Sparkles size={14} />
                <span className="navbar-btn-text">Take Assessment</span>
              </Link>

              {/* Sign Out Button */}
              <button onClick={handleLogout} className="tie-navbar-btn-signout">
                <LogOut size={14} />
                <span className="navbar-btn-text">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="tie-navbar-links-group">
              <Link href="/login" className="tie-navbar-btn-signin">
                Sign In
              </Link>
              <Link href="/register" className="tie-navbar-btn-register">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
