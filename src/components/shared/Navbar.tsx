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
    router.refresh();
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
            src="/logo.png"
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
            {isLoggedIn && (
              <Link href="/dashboard" className="tie-navbar-btn-link">
                Dashboard
              </Link>
            )}
            {isLoggedIn && profile?.role === "super_admin" && (
              <Link href="/super-admin" className="tie-navbar-btn-link" style={{ fontWeight: 600 }}>
                Super Admin
              </Link>
            )}
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

              {/* Take Assessment or View Dashboard CTA Button */}
              {profile?.role === "user" ? (
                <Link href="/welcome" className="tie-navbar-btn-cta">
                  <Sparkles size={14} />
                  <span className="navbar-btn-text">Take Assessment</span>
                </Link>
              ) : profile?.role ? (
                <div className="flex items-center gap-2">
                  {(profile.role === "manager" || profile.role === "hr_admin") && (
                    <Link
                      href="/welcome"
                      className="px-3 py-1.5 rounded-md text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all flex items-center gap-1.5 border border-indigo-200 shadow-sm"
                    >
                      <Sparkles size={13} className="text-indigo-600" />
                      <span className="navbar-btn-text">Self-Assessment</span>
                    </Link>
                  )}
                  <Link
                    href={
                      profile.role === "super_admin"
                        ? "/super-admin"
                        : profile.role === "hr_admin"
                        ? "/hr-admin"
                        : profile.role === "manager"
                        ? "/manager"
                        : "/dashboard"
                    }
                    className="tie-navbar-btn-cta"
                  >
                    <span className="navbar-btn-text">View Dashboard</span>
                  </Link>
                </div>
              ) : null}

              {/* Sign Out Button */}
              <button onClick={handleLogout} className="tie-navbar-btn-signout">
                <LogOut size={14} />
                <span className="navbar-btn-text">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="tie-navbar-links-group">
              <Link href="/login" className="tie-navbar-btn-cta">
                Sign In
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
              {isLoggedIn && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="tie-navbar-mobile-btn-link"
                >
                  Dashboard
                </Link>
              )}
              {isLoggedIn && profile?.role === "super_admin" && (
                <Link
                  href="/super-admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="tie-navbar-mobile-btn-link"
                  style={{ fontWeight: 600 }}
                >
                  Super Admin
                </Link>
              )}
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
                {(profile?.role === "user" || profile?.role === "manager" || profile?.role === "hr_admin") && (
                  <Link
                    href="/welcome"
                    onClick={() => setIsMenuOpen(false)}
                    className="tie-navbar-btn-cta"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    <Sparkles size={14} />
                    {profile?.role === "user" ? "Take Assessment" : "Take Self-Assessment"}
                  </Link>
                )}
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
                  className="tie-navbar-btn-cta"
                  style={{ width: "100%", textAlign: "center", justifyContent: "center", display: "inline-flex" }}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
