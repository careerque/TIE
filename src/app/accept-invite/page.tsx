"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabasedb } from "@/lib/supabaseClient";
import { CookieUtils } from "@/lib/cookieUtils";
import { Sparkles, KeyRound, User, CheckCircle2, ShieldAlert, Loader2, Briefcase, Award } from "lucide-react";
import { validatePasswordStrength } from "@/lib/validationUtils";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Loading & State
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Invite Details
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [teamId, setTeamId] = useState("");

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [designation, setDesignation] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 1. Frictionless Verification Action: Clear older sessions on mount
  useEffect(() => {
    const initializePage = async () => {
      try {
        await supabasedb.auth.signOut();
        CookieUtils.clearAll();
        if (typeof window !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
        }
      } catch (err) {
        console.warn("Error signing out previous sessions:", err);
      }

      if (!token) {
        setError("No invitation token was provided. Please check your link.");
        setVerifying(false);
        return;
      }

      // Verify token with backend
      try {
        let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        if (apiBaseUrl.endsWith("/")) {
          apiBaseUrl = apiBaseUrl.slice(0, -1);
        }

        const res = await fetch(`${apiBaseUrl}/api/enterprise/verify-invite?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Verification failed");
        }

        setEmail(data.email);
        setRole(data.role);
        setCompanyName(data.company_name);
        setCompanyId(data.company_id);
        setTeamId(data.team_id || "");
        
        // Auto default designation based on role
        if (data.role === "hr_admin") {
          setDesignation("HR Administrator");
        } else if (data.role === "manager") {
          setDesignation("Team Lead");
        } else {
          setDesignation("Software Engineer");
        }
      } catch (err: any) {
        setError(err.message || "The invitation link is invalid or has expired.");
      } finally {
        setVerifying(false);
      }
    };

    initializePage();
  }, [token]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please fill out your first name and last name.");
      return;
    }

    const valRes = validatePasswordStrength(password);
    if (!valRes.isValid) {
      setError(valRes.error || "Password does not meet policy requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      if (apiBaseUrl.endsWith("/")) {
        apiBaseUrl = apiBaseUrl.slice(0, -1);
      }

      // Accept Invitation & Activate Account
      const res = await fetch(`${apiBaseUrl}/api/enterprise/accept-and-activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          first_name: firstName,
          last_name: lastName,
          designation: designation.trim() || "Workspace Member",
          experience_years: Number(experienceYears) || 0
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to accept invitation");
      }

      // Login immediately with newly created credentials
      const { error: loginError } = await supabasedb.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        throw new Error("Account created, but automatic sign in failed. Please sign in manually.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(data.redirect_path || "/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  const getRoleLabel = (roleKey: string) => {
    if (roleKey === "hr_admin") return "HR Administrator";
    if (roleKey === "manager") return "Team Lead / Manager";
    return "Workspace Member";
  };

  if (verifying) {
    return (
      <main className="tie-container bg-mesh">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
          <div className="tie-card-top-bar" />
          <Loader2 className="animate-spin text-[#5BA4A4]" size={32} style={{ marginBottom: "1rem" }} />
          <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#627D98" }}>
            Verifying secure invitation token...
          </span>
        </div>
      </main>
    );
  }

  if (error && !email) {
    return (
      <main className="tie-container bg-mesh">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ maxWidth: "450px" }}>
          <div className="tie-card-top-bar" style={{ background: "#c0392b" }} />
          <div className="tie-header" style={{ alignItems: "center", textAlign: "center" }}>
            <div className="logo-ring" style={{ color: "#c0392b", border: "1.5px solid rgba(192, 57, 43, 0.2)", background: "rgba(192, 57, 43, 0.05)", marginBottom: "1rem" }}>
              <ShieldAlert size={28} />
            </div>
            <h1 className="tie-title" style={{ fontSize: "1.5rem" }}>Invitation Error</h1>
            <p className="tie-desc" style={{ marginTop: "0.5rem", color: "#c0392b" }}>
              {error}
            </p>
            <button
              onClick={() => router.push("/login")}
              className="tie-btn-secondary"
              style={{ marginTop: "1.5rem", width: "100%" }}
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="tie-container bg-mesh">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ maxWidth: "450px", textAlign: "center" }}>
          <div className="tie-card-top-bar" />
          <div className="tie-header" style={{ alignItems: "center" }}>
            <div className="logo-ring" style={{ color: "#A3B18A", border: "1.5px solid rgba(163, 177, 138, 0.2)", background: "rgba(163, 177, 138, 0.05)", marginBottom: "1.25rem" }}>
              <CheckCircle2 size={32} />
            </div>
            <h1 className="tie-title" style={{ fontSize: "1.6rem" }}>Account Activated!</h1>
            <p className="tie-desc" style={{ marginTop: "0.5rem" }}>
              Your account has been securely set up. Signing you in and redirecting to your workspace...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="tie-container bg-mesh">
      <div className="tie-dot-grid" aria-hidden />
      
      <div className="tie-glow-blob-1" aria-hidden />
      <div className="tie-glow-blob-2" aria-hidden />

      <div className="tie-card" style={{ maxWidth: "550px", width: "100%" }}>
        <div className="tie-card-top-bar" />

        <div className="tie-header">
          <div className="tie-badge">
            <Sparkles size={11} style={{ marginRight: "2px" }} />
            Invitation Confirmed
          </div>
          <h1 className="tie-title" style={{ marginTop: "0.5rem", fontSize: "1.6rem" }}>
            Join {companyName}
          </h1>
          <p className="tie-desc" style={{ marginTop: "0.4rem" }}>
            Set up your credentials below to activate your account as a <strong>{getRoleLabel(role)}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
          {error && (
            <div className="profile-notice-banner" style={{ border: "1px solid rgba(192, 57, 43, 0.12)", background: "rgba(192, 57, 43, 0.05)", color: "#c0392b" }}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{error}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#627D98", textTransform: "uppercase" }}>Email Address</label>
            <input
              type="text"
              value={email}
              disabled
              className="form-input"
              style={{ width: "100%", background: "#f0f4f8", cursor: "not-allowed", color: "#627D98" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#627D98", textTransform: "uppercase" }}>Assigned Role</label>
            <input
              type="text"
              value={getRoleLabel(role)}
              disabled
              className="form-input"
              style={{ width: "100%", background: "#f0f4f8", cursor: "not-allowed", color: "#243B53", fontWeight: 700 }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#627D98", textTransform: "uppercase" }}>First Name</label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-input"
                  style={{ width: "100%", paddingLeft: "2.25rem" }}
                  required
                />
                <User size={14} style={{ position: "absolute", left: "10px", top: "14px", color: "#9aa8b6" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#627D98", textTransform: "uppercase" }}>Last Name</label>
              <input
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="form-input"
                style={{ width: "100%" }}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#627D98", textTransform: "uppercase" }}>Title / Designation</label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type="text"
                  placeholder="e.g. Lead Developer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="form-input"
                  style={{ width: "100%", paddingLeft: "2.25rem" }}
                  required
                />
                <Briefcase size={14} style={{ position: "absolute", left: "10px", top: "14px", color: "#9aa8b6" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#627D98", textTransform: "uppercase" }}>Experience (Years)</label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={experienceYears || ""}
                  onChange={(e) => setExperienceYears(Math.max(0, parseInt(e.target.value) || 0))}
                  className="form-input"
                  style={{ width: "100%", paddingLeft: "2.25rem" }}
                  min="0"
                  required
                />
                <Award size={14} style={{ position: "absolute", left: "10px", top: "14px", color: "#9aa8b6" }} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#627D98", textTransform: "uppercase" }}>Choose Password</label>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ width: "100%", paddingLeft: "2.25rem" }}
                required
              />
              <KeyRound size={14} style={{ position: "absolute", left: "10px", top: "14px", color: "#9aa8b6" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#627D98", textTransform: "uppercase" }}>Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              style={{ width: "100%" }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="tie-btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Activating Account...</span>
              </>
            ) : (
              <span>Activate Account & Log In</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <main className="tie-container bg-mesh">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
          <div className="tie-card-top-bar" />
          <Loader2 className="animate-spin text-[#5BA4A4]" size={32} style={{ marginBottom: "1rem" }} />
          <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#627D98" }}>
            Loading invitation handler...
          </span>
        </div>
      </main>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
