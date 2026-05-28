"use client";

import { useEffect, useState, CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, User, Edit3, Check, X } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Profile Fields States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [experience, setExperience] = useState("");

  // Edit Mode States
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [backHovered, setBackHovered] = useState(false);

  useEffect(() => {
    // Check authentication status
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // Load details from localStorage
    setFirstName(localStorage.getItem("userFirstName") || "");
    setLastName(localStorage.getItem("userLastName") || "");
    setEmail(localStorage.getItem("userEmail") || "");
    setEmployeeId(localStorage.getItem("userEmployeeId") || "");
    setDepartment(localStorage.getItem("userDepartment") || "");
    setDesignation(localStorage.getItem("userDesignation") || "");
    setExperience(localStorage.getItem("userExperience") || "");
    
    setLoading(false);
  }, [router]);

  const startEdit = (field: string, value: string) => {
    setEditingField(field);
    setTempValue(value);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue("");
  };

  const saveField = (field: string, storageKey: string) => {
    const value = tempValue.trim();
    localStorage.setItem(storageKey, value);

    // Update local state
    if (field === "firstName") setFirstName(value);
    if (field === "lastName") setLastName(value);
    if (field === "email") setEmail(value);
    if (field === "employeeId") setEmployeeId(value);
    if (field === "department") setDepartment(value);
    if (field === "designation") setDesignation(value);
    if (field === "experience") setExperience(value);

    setEditingField(null);
    setTempValue("");

    // Dispatch auth-change event if name or email changes to sync headers
    if (field === "firstName" || field === "email") {
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

  // State to track hover for edit buttons per field row
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const profileFields = [
    { id: "firstName", label: "First Name", value: firstName, key: "userFirstName" },
    { id: "lastName", label: "Last Name", value: lastName, key: "userLastName" },
    { id: "email", label: "Email Address", value: email, key: "userEmail" },
    { id: "employeeId", label: "Employee ID", value: employeeId, key: "userEmployeeId" },
    { id: "department", label: "Department", value: department, key: "userDepartment" },
    { id: "designation", label: "Designation", value: designation, key: "userDesignation" },
    { id: "experience", label: "Experience (Years)", value: experience, key: "userExperience" }
  ];

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
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    style={inputStyle}
                    autoFocus
                  />
                ) : (
                  <span style={fieldValueStyle}>
                    {field.value}
                  </span>
                )}

                <div style={{ flexShrink: 0, marginLeft: "1rem" }}>
                  {isEditing ? (
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => saveField(field.id, field.key)}
                        style={saveButtonStyle}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
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
                marginLeft: "auto"
              }}
            />
          </Link>
        </div>
      </div>
    </main>
  );
}
