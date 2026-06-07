"use client";

import { useEffect, useState, CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, User, Edit3, Check, X } from "lucide-react";
import { getProfile, updateProfile } from "@/services/auth/ProfileServices";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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
    // Check authentication status
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const fetchUserProfile = async () => {
      setLoading(true);
      // Fetch details from Supabase
      const res = await getProfile();
      if (res.success && res.data) {
        const profileData = res.data;
        setFirstName(profileData.first_name || "");
        setLastName(profileData.last_name || "");
        setEmail(profileData.email || "");
        setEmployeeId(profileData.employee_id || "");
        setDesignation(profileData.designation || "");
        setExperience(profileData.experiense_years ? String(profileData.experiense_years) : "");
        setInterests(profileData.interests || []);

        // Sync to localStorage for compatibility with other pages
        localStorage.setItem("userFirstName", profileData.first_name || "");
        localStorage.setItem("userLastName", profileData.last_name || "");
        localStorage.setItem("userEmail", profileData.email || "");
        localStorage.setItem("userEmployeeId", profileData.employee_id || "");
        localStorage.setItem("userDesignation", profileData.designation || "");
        localStorage.setItem("userExperience", profileData.experiense_years ? String(profileData.experiense_years) : "");
        localStorage.setItem("userInterests", JSON.stringify(profileData.interests || []));
      } else {
        // Fallback to localStorage if Supabase call fails
        setFirstName(localStorage.getItem("userFirstName") || "");
        setLastName(localStorage.getItem("userLastName") || "");
        setEmail(localStorage.getItem("userEmail") || "");
        setEmployeeId(localStorage.getItem("userEmployeeId") || "");
        setDesignation(localStorage.getItem("userDesignation") || "");
        setExperience(localStorage.getItem("userExperience") || "");
        try {
          const storedInterests = localStorage.getItem("userInterests");
          setInterests(storedInterests ? JSON.parse(storedInterests) : []);
        } catch (e) {
          setInterests([]);
        }
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
      setLoading(false);
    };

    fetchUserProfile();
  }, [router]);

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

  const saveField = async (field: string, storageKey: string) => {
    setUpdating(true);
    let valueToSave: any = "";
    let dbPayload: any = {};

    if (field === "interests") {
      valueToSave = tempInterests;
      dbPayload = { interests: tempInterests };
    } else {
      valueToSave = tempValue.trim();
      if (field === "firstName") dbPayload = { first_name: valueToSave };
      else if (field === "lastName") dbPayload = { last_name: valueToSave };
      else if (field === "employeeId") dbPayload = { employee_id: valueToSave };
      else if (field === "designation") dbPayload = { designation: valueToSave };
      else if (field === "experience") {
        dbPayload = { experiense_years: Number(valueToSave) || null };
      }
    }

    // Call Supabase update
    if (field !== "email") {
      const res = await updateProfile(dbPayload);
      if (!res.success) {
        alert(res.error?.message || "Failed to update profile in database.");
        setUpdating(false);
        return;
      }
    }

    // Sync to LocalStorage
    if (field === "interests") {
      localStorage.setItem(storageKey, JSON.stringify(valueToSave));
      setInterests(valueToSave);
    } else {
      localStorage.setItem(storageKey, valueToSave);
      if (field === "firstName") setFirstName(valueToSave);
      if (field === "lastName") setLastName(valueToSave);
      if (field === "email") setEmail(valueToSave);
      if (field === "employeeId") setEmployeeId(valueToSave);
      if (field === "designation") setDesignation(valueToSave);
      if (field === "experience") setExperience(valueToSave);
    }

    setEditingField(null);
    setTempValue("");
    setInterestInput("");
    setUpdating(false);

    // Dispatch auth-change event if name or email changes to sync headers
    if (field === "firstName" || field === "email" || field === "lastName") {
      window.dispatchEvent(new Event("auth-change"));
    }
  };

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

  const infoListStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  };

  const infoRowStyle = (isLast = false): CSSProperties => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.25rem 0.5rem",
    borderBottom: isLast ? "none" : "1px solid rgba(36, 59, 83, 0.08)",
    boxSizing: "border-box",
    minHeight: "72px",
  });

  const fieldLabelStyle: CSSProperties = {
    fontSize: "0.8125rem",
    fontWeight: 700,
    color: "#8fa3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    width: "150px",
    flexShrink: 0,
    textAlign: "left",
  };

  const fieldValueStyle: CSSProperties = {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "#243B53",
    flex: 1,
    paddingRight: "1rem",
    textAlign: "left",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const inputStyle: CSSProperties = {
    flex: 1,
    maxWidth: "320px",
    padding: "0.5rem 0.875rem",
    border: "2px solid #5BA4A4",
    borderRadius: "8px",
    fontSize: "0.875rem",
    color: "#1F2933",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const editButtonStyle = (hovered: boolean): CSSProperties => ({
    background: hovered ? "rgba(91, 164, 164, 0.08)" : "none",
    border: "none",
    color: "#5BA4A4",
    fontWeight: 700,
    fontSize: "0.8125rem",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  });

  const saveButtonStyle: CSSProperties = {
    background: "#5BA4A4",
    border: "none",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "0.8125rem",
    cursor: "pointer",
    padding: "6px 14px",
    borderRadius: "8px",
    marginRight: "6px",
    transition: "background 0.2s",
  };

  const cancelButtonStyle: CSSProperties = {
    background: "none",
    border: "1.5px solid rgba(36, 59, 83, 0.15)",
    color: "#627D98",
    fontWeight: 600,
    fontSize: "0.8125rem",
    cursor: "pointer",
    padding: "5px 12px",
    borderRadius: "8px",
    transition: "background 0.2s",
  };

  const actionBlockStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    boxSizing: "border-box",
    borderTop: "1px solid rgba(36, 59, 83, 0.08)",
    paddingTop: "2rem",
  };

  const backButtonStyle: CSSProperties = {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "1.125rem 2rem",
    color: "#243B53",
    fontWeight: 700,
    fontSize: "0.9375rem",
    borderRadius: "12px",
    transition: "all 0.25s ease-in-out",
    cursor: "pointer",
    textDecoration: "none",
    border: "2px solid rgba(36, 59, 83, 0.15)",
    background: backHovered ? "#F4F7FA" : "#ffffff",
    transform: backHovered ? "translateY(-1.5px)" : "translateY(0)",
    boxShadow: backHovered ? "0 4px 12px rgba(36, 59, 83, 0.05)" : "none",
  };

  const tagStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(91, 164, 164, 0.08)",
    color: "#5BA4A4",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "0.8125rem",
    fontWeight: 600,
    border: "1px solid rgba(91, 164, 164, 0.15)",
  };

  const removeTagButtonStyle: CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    marginLeft: "2px",
    display: "inline-flex",
    alignItems: "center",
    color: "#5BA4A4",
    outline: "none",
  };
  // State to track hover for edit buttons per field row
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const profileFields = [
    { id: "firstName", label: "First Name", value: firstName, key: "userFirstName" },
    { id: "lastName", label: "Last Name", value: lastName, key: "userLastName" },
    { id: "email", label: "Email Address", value: email, key: "userEmail", readOnly: true },
    { id: "employeeId", label: "Employee ID", value: employeeId, key: "userEmployeeId" },
    { id: "designation", label: "Designation", value: designation, key: "userDesignation" },
    { id: "experience", label: "Experience (Years)", value: experience, key: "userExperience" },
    { id: "interests", label: "My Interests", value: interests, key: "userInterests", isTags: true }
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
      <div style={containerStyle}>
        <div style={dotGridStyle} aria-hidden />
        <div style={{ ...cardStyle, alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <div style={topBarStyle} />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#627D98" }}>
            Loading Profile...
          </span>
        </div>
      </div>
    );
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
          background: "radial-gradient(circle, rgba(91,164,164,0.15) 0%, transparent 70%)",
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
          background: "radial-gradient(circle, rgba(36,59,83,0.1) 0%, transparent 70%)",
          filter: "blur(45px)",
          opacity: 0.5
        }}
      />

      {/* ── Main Centered Card ── */}
      <div style={cardStyle}>
        {/* Top border accent line */}
        <div style={topBarStyle} />

        {/* 1. Header Area */}
        <div style={headerStyle}>
          {isIncompleteNotice && !isProfileComplete && (
            <div
              style={{
                background: "rgba(220, 53, 69, 0.08)",
                border: "1px solid rgba(220, 53, 69, 0.2)",
                borderRadius: "16px",
                padding: "1.125rem 1.5rem",
                color: "#c0392b",
                fontSize: "0.875rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textAlign: "left",
                marginBottom: "1rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <Sparkles size={18} style={{ color: "#c0392b", flexShrink: 0 }} />
              <div>
                <strong style={{ display: "block", marginBottom: "2px" }}>Complete Your Profile</strong>
                {assessmentCompleted
                  ? "Please fill out all profile fields below to unlock your Workforce Insight Report."
                  : "Please fill out all profile fields below to unlock the Workforce Insight Assessment."}
              </div>
            </div>
          )}

          <div style={badgeStyle}>
            <User size={11} style={{ marginRight: "2px" }} />
            My Profile
          </div>
          <h1 style={titleStyle}>
            Profile Details
          </h1>
          <p style={descriptionStyle}>
            Manage and edit your registration credentials and professional workspace information below.
          </p>
        </div>

        {/* 2. Interactive Details List */}
        <div style={infoListStyle}>
          {profileFields.map((field, idx) => {
            const isLast = idx === profileFields.length - 1;
            const isEditing = editingField === field.id;

            return (
              <div key={field.id} style={infoRowStyle(isLast)}>
                <span style={fieldLabelStyle}>{field.label}</span>
                
                {isEditing ? (
                  field.isTags ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, maxWidth: "320px", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {tempInterests.map((tag) => (
                          <span key={tag} style={tagStyle}>
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTempInterest(tag)}
                              style={removeTagButtonStyle}
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
                          style={inputStyle}
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
                      style={inputStyle}
                      autoFocus
                    />
                  )
                ) : (
                  <span style={fieldValueStyle}>
                    {field.isTags ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {Array.isArray(field.value) && field.value.length > 0 ? (
                          field.value.map((tag) => (
                            <span key={tag} style={tagStyle}>
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
                        onClick={() => saveField(field.id, field.key)}
                        disabled={updating}
                        style={{
                          ...saveButtonStyle,
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
                        style={cancelButtonStyle}
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
                      style={editButtonStyle(hoveredRow === field.id)}
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
        <div style={actionBlockStyle}>
          {isProfileComplete ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%", boxSizing: "border-box" }}>
              {/* Unlock success banner */}
              <div
                style={{
                  background: "rgba(163, 177, 138, 0.08)",
                  border: "1px solid rgba(163, 177, 138, 0.2)",
                  borderRadius: "16px",
                  padding: "1rem 1.25rem",
                  color: "#A3B18A",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  textAlign: "left",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
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
                  style={{
                    ...backButtonStyle,
                    flex: 1,
                    minWidth: "200px",
                    background: ctaHovered ? "#4a9393" : "#5BA4A4",
                    color: "#ffffff",
                    border: "none",
                    transform: ctaHovered ? "translateY(-1.5px)" : "translateY(0)",
                    boxShadow: ctaHovered ? "0 6px 18px rgba(91, 164, 164, 0.38)" : "0 4px 14px rgba(91, 164, 164, 0.25)",
                  }}
                >
                  <span>{assessmentCompleted ? "Proceed to View Report" : "Proceed to Assessment"}</span>
                  <ArrowRight
                    size={16}
                    style={{
                      transition: "transform 0.2s",
                      transform: ctaHovered ? "translateX(3px)" : "translateX(0)",
                      marginLeft: "auto",
                      color: "#ffffff",
                    }}
                  />
                </Link>

                <Link
                  href="/dashboard"
                  onMouseEnter={() => setBackHovered(true)}
                  onMouseLeave={() => setBackHovered(false)}
                  style={{
                    ...backButtonStyle,
                    flex: 1,
                    minWidth: "200px",
                    background: backHovered ? "#F4F7FA" : "#ffffff",
                    color: "#243B53",
                    border: "2px solid rgba(36, 59, 83, 0.15)",
                  }}
                >
                  <span>Back to Dashboard</span>
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%", boxSizing: "border-box" }}>
              <div
                style={{
                  background: "rgba(36, 59, 83, 0.03)",
                  borderRadius: "16px",
                  padding: "0.875rem 1.25rem",
                  color: "#627D98",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  textAlign: "left",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
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
                style={backButtonStyle}
              >
                <span>Back to Dashboard</span>
                <ArrowRight
                  size={16}
                  style={{
                    transition: "transform 0.2s",
                    transform: backHovered ? "translateX(3px)" : "translateX(0)",
                    marginLeft: "auto",
                  }}
                />
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
