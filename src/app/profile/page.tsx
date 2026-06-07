"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, User, Edit3, Check, X } from "lucide-react";
import { updateProfile } from "@/services/auth/ProfileServices";
import { useAuthContext } from "@/context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, profile, loading, refreshProfile } = useAuthContext();
  const [updating, setUpdating] = useState(false);

  // Profile Fields States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [experience, setExperience] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  // Edit Mode States
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [tempInterests, setTempInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [backHovered, setBackHovered] = useState(false);
  const [ctaHovered, setCtaHovered] = useState(false);
  const [isIncompleteNotice, setIsIncompleteNotice] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }

      if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setEmail(profile.email || "");
        setEmployeeId(profile.employee_id || "");
        setDesignation(profile.designation || "");
        setExperience(profile.experiense_years || "");
        setInterests(profile.interests || []);
      }

      // Check if assessment completed
      setAssessmentCompleted(localStorage.getItem("assessmentCompleted") === "true");

      // Check if redirected due to incomplete profile
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("incomplete") === "true") {
          setIsIncompleteNotice(true);
        }
      }
    }
  }, [isLoggedIn, profile, loading, router]);

  const startEdit = (field: string, value: any) => {
    setEditingField(field);
    if (field === "interests") {
      setTempInterests([...interests]);
      setInterestInput("");
    } else {
      setTempValue(String(value || ""));
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue("");
    setTempInterests([]);
    setInterestInput("");
  };

  const saveField = async (field: string) => {
    setUpdating(true);
    let dbPayload: any = {};

    if (field === "interests") {
      dbPayload = { interests: tempInterests };
    } else {
      const valueToSave = tempValue.trim();
      if (field === "firstName") dbPayload = { first_name: valueToSave };
      else if (field === "lastName") dbPayload = { last_name: valueToSave };
      else if (field === "employeeId") dbPayload = { employee_id: valueToSave };
      else if (field === "designation") dbPayload = { designation: valueToSave };
      else if (field === "experience") {
        dbPayload = { experiense_years: Number(valueToSave) || null };
      }
    }

    if (field !== "email") {
      const res = await updateProfile(dbPayload);
      if (!res.success) {
        alert(res.error?.message || "Failed to update profile in database.");
        setUpdating(false);
        return;
      }
      // Refresh global context profile
      await refreshProfile();
    }

    setEditingField(null);
    setTempValue("");
    setInterestInput("");
    setUpdating(false);
  };

  // State to track hover for edit buttons per field row
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const profileFields = [
    { id: "firstName", label: "First Name", value: firstName },
    { id: "lastName", label: "Last Name", value: lastName },
    { id: "email", label: "Email Address", value: email, readOnly: true },
    { id: "employeeId", label: "Employee ID", value: employeeId },
    { id: "designation", label: "Designation", value: designation },
    { id: "experience", label: "Experience (Years)", value: experience },
    { id: "interests", label: "My Interests", value: interests, isTags: true }
  ];

  const addTempInterest = () => {
    const val = interestInput.trim();
    if (val && !tempInterests.includes(val)) {
      setTempInterests([...tempInterests, val]);
      setInterestInput("");
    }
  };

  const removeTempInterest = (tagToRemove: string) => {
    setTempInterests(tempInterests.filter((tag) => tag !== tagToRemove));
  };

  const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTempInterest();
    }
  };

  if (loading) {
    return (
      <div className="tie-container">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <div className="tie-card-top-bar" />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#627D98" }}>
            Loading Profile...
          </span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Redirecting in useEffect
  }

  const isProfileComplete = 
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    email.trim() !== "" &&
    employeeId.trim() !== "" &&
    designation.trim() !== "" &&
    experience.trim() !== "" &&
    interests.length > 0;

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

        {/* 1. Header Area */}
        <div className="tie-header">
          {isIncompleteNotice && !isProfileComplete && (
            <div className="profile-notice-banner">
              <Sparkles size={18} style={{ color: "#c0392b", flexShrink: 0 }} />
              <div>
                <strong style={{ display: "block", marginBottom: "2px" }}>Complete Your Profile</strong>
                {assessmentCompleted
                  ? "Please fill out all profile fields below to unlock your Workforce Insight Report."
                  : "Please fill out all profile fields below to unlock the Workforce Insight Assessment."}
              </div>
            </div>
          )}

          <div className="tie-badge">
            <User size={11} style={{ marginRight: "2px" }} />
            My Profile
          </div>
          <h1 className="tie-title">
            Profile Details
          </h1>
          <p className="tie-desc">
            Manage and edit your registration credentials and professional workspace information below.
          </p>
        </div>

        {/* 2. Interactive Details List */}
        <div className="profile-info-list">
          {profileFields.map((field, idx) => {
            const isLast = idx === profileFields.length - 1;
            const isEditing = editingField === field.id;

            return (
              <div key={field.id} className={`profile-info-row ${isLast ? "is-last" : ""}`}>
                <span className="profile-field-label">{field.label}</span>
                
                {isEditing ? (
                  field.isTags ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, maxWidth: "320px", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {tempInterests.map((tag) => (
                          <span key={tag} className="profile-tag">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTempInterest(tag)}
                              className="profile-tag-remove-btn"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                        <input
                          type="text"
                          placeholder="Type & press Enter"
                          value={interestInput}
                          onChange={(e) => setInterestInput(e.target.value)}
                          onKeyDown={handleInterestKeyDown}
                          className="profile-input-edit"
                        />
                        <button
                          type="button"
                          onClick={addTempInterest}
                          style={{
                            background: "#5BA4A4",
                            border: "none",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            cursor: "pointer",
                            padding: "6px 12px",
                            borderRadius: "8px",
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="profile-input-edit"
                      autoFocus
                    />
                  )
                ) : (
                  <span className="profile-field-value">
                    {field.isTags ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {Array.isArray(field.value) && field.value.length > 0 ? (
                          field.value.map((tag) => (
                            <span key={tag} className="profile-tag">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "#9aa8b6", fontStyle: "italic", fontWeight: 400 }}>No interests added</span>
                        )}
                      </div>
                    ) : (
                      field.value || <span style={{ color: "#9aa8b6", fontStyle: "italic", fontWeight: 400 }}>Not set</span>
                    )}
                  </span>
                )}

                <div style={{ flexShrink: 0, marginLeft: "1rem" }}>
                  {field.readOnly ? null : isEditing ? (
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => saveField(field.id)}
                        disabled={updating}
                        className="profile-btn-save"
                        style={{
                          opacity: updating ? 0.7 : 1,
                          cursor: updating ? "not-allowed" : "pointer"
                        }}
                      >
                        {updating ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={updating}
                        className="profile-btn-cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredRow(field.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => startEdit(field.id, field.value)}
                      className="profile-btn-edit"
                      style={{
                        background: hoveredRow === field.id ? "rgba(91, 164, 164, 0.08)" : "none"
                      }}
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Action Area */}
        <div className="profile-action-block">
          {isProfileComplete ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%", boxSizing: "border-box" }}>
              {/* Unlock success banner */}
              <div className="profile-success-banner">
                <Check size={18} style={{ color: "#A3B18A", flexShrink: 0 }} />
                <span>
                  {assessmentCompleted
                    ? "Profile completed! Your Workforce Insight Report has been unlocked."
                    : "Profile completed! Assessment access has been unlocked."}
                </span>
              </div>

              <div style={{ display: "flex", gap: "1rem", width: "100%", flexWrap: "wrap", boxSizing: "border-box" }}>
                <Link
                  href={assessmentCompleted ? "/profile-output" : "/welcome"}
                  onMouseEnter={() => setCtaHovered(true)}
                  onMouseLeave={() => setCtaHovered(false)}
                  className="tie-btn-primary"
                  style={{
                    flex: 1,
                    minWidth: "200px",
                  }}
                >
                  <span>{assessmentCompleted ? "Proceed to View Report" : "Proceed to Assessment"}</span>
                  <ArrowRight
                    size={16}
                    className="dashboard-btn-icon-right"
                    style={{ color: "#ffffff" }}
                  />
                </Link>

                <Link
                  href="/dashboard"
                  onMouseEnter={() => setBackHovered(true)}
                  onMouseLeave={() => setBackHovered(false)}
                  className="tie-btn-secondary"
                  style={{
                    flex: 1,
                    minWidth: "200px",
                  }}
                >
                  <span>Back to Dashboard</span>
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%", boxSizing: "border-box" }}>
              <div className="profile-unlock-tip">
                <X size={14} style={{ color: "#627D98", flexShrink: 0 }} />
                <span>
                  {assessmentCompleted
                    ? "Fill in all profile details above to unlock your insights report."
                    : "Fill in all profile details above to unlock the assessment."}
                </span>
              </div>

              <Link
                href="/dashboard"
                onMouseEnter={() => setBackHovered(true)}
                onMouseLeave={() => setBackHovered(false)}
                className="tie-btn-secondary"
              >
                <span>Back to Dashboard</span>
                <ArrowRight
                  size={16}
                  className="dashboard-btn-icon-right"
                />
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
