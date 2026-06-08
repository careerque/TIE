"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut, Menu, X } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export default function Navbar() {
  const { isLoggedIn, profile, logout } = useAuthContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

        {/* Desktop Navigation Group */}
        <div className="tie-navbar-desktop-group">
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

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="tie-navbar-mobile-toggle"
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown Overlay */}
      {isMenuOpen && (
        <div className="tie-navbar-mobile-drawer">
          {/* Menu links */}
          <div className="tie-navbar-mobile-links">
            {["Product", "Why TIE", "Pricing"].map((item) => (
              <button
                key={item}
                onClick={() => setIsMenuOpen(false)}
                className="tie-navbar-mobile-btn-link"
              >
                {item}
              </button>
            ))}
          </div>

          <div style={{ height: "1px", background: "rgba(36, 59, 83, 0.08)", margin: "0.25rem 0" }} />

          {/* Auth options */}
          {isLoggedIn ? (
            <div className="tie-navbar-mobile-auth">
              <span className="tie-navbar-mobile-email">
                {profile?.email}
              </span>
              <Link
                href="/welcome"
                onClick={() => setIsMenuOpen(false)}
                className="tie-navbar-btn-cta"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Sparkles size={14} />
                Take Assessment
              </Link>
              <button
                onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                className="tie-navbar-btn-signout"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="tie-navbar-mobile-auth">
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="tie-navbar-btn-signin"
                style={{ width: "100%", textAlign: "center", justifyContent: "center", display: "inline-flex" }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMenuOpen(false)}
                className="tie-navbar-btn-register"
                style={{ width: "100%", textAlign: "center", justifyContent: "center", display: "inline-flex" }}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
