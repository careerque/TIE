"use client";

import React, { useState } from "react";
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

  const toggleMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <nav className="tie-navbar">
      <div className="tie-navbar-container" style={{ position: "relative" }}>
        {/* Logo container to crop the whitespace in logo.png without clipping sides */}
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image
            src="/Logo.png"
            alt="TIE Logo"
            width={112}
            height={48}
            priority
            style={{
              display: "block",
              height: "48px",
              width: "auto",
            }}
          />
        </Link>

        {/* Desktop Navigation Group */}
        <div className="tie-navbar-desktop-group">
          {/* Main navigation links */}
          <div className="tie-navbar-links">
            <Link href="/#why-tie" className="tie-navbar-btn-link">
              Why TIE
            </Link>
            <Link href="/#product" className="tie-navbar-btn-link">
              Product
            </Link>
            <Link href="/#pricing" className="tie-navbar-btn-link">
              Pricing
            </Link>
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
          type="button"
          onClick={toggleMenu}
          onTouchEnd={toggleMenu}
          className="tie-navbar-mobile-toggle"
          aria-label="Toggle navigation menu"
          style={{ position: "relative", zIndex: 110 }}
        >
          {isMenuOpen ? (
            <X size={24} style={{ pointerEvents: "none" }} />
          ) : (
            <Menu size={24} style={{ pointerEvents: "none" }} />
          )}
        </button>

        {/* Mobile Drawer Dropdown Overlay */}
        {isMenuOpen && (
          <div className="tie-navbar-mobile-drawer">
            {/* Menu links */}
            <div className="tie-navbar-mobile-links">
              <Link
                href="/#why-tie"
                onClick={() => setIsMenuOpen(false)}
                className="tie-navbar-mobile-btn-link"
              >
                Why TIE
              </Link>
              <Link
                href="/#product"
                onClick={() => setIsMenuOpen(false)}
                className="tie-navbar-mobile-btn-link"
              >
                Product
              </Link>
              <Link
                href="/#pricing"
                onClick={() => setIsMenuOpen(false)}
                className="tie-navbar-mobile-btn-link"
              >
                Pricing
              </Link>
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
      </div>
    </nav>
  );
}
