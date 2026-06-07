"use client";

import { useState, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Brain, RotateCw, Check } from "lucide-react";

export default function ReflectionPage() {
  const router = useRouter();

  // Form States
  const [accuracyRating, setAccuracyRating] = useState<number | null>(null);
  const [focusArea, setFocusArea] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  
  // Submit States
  const [submitting, setSubmitting] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Hover states for rating buttons
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const focusOptions = [
    { id: "collab", label: "Collaboration", desc: "Team communication & trust" },
    { id: "adapt", label: "Adaptability", desc: "Resilience under pressure" },
    { id: "growth", label: "Growth Style", desc: "Agility & initiative" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate compilation of insights
    await new Promise((resolve) => setTimeout(resolve, 1800));
    
    localStorage.setItem("assessmentCompleted", "true");
    
    router.push("/profile-output");
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

  const formStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    boxSizing: "border-box",
  };

  const questionGroupStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.875rem",
  };

  const labelStyle: CSSProperties = {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#243B53",
    lineHeight: 1.4,
  };

  const ratingRowStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.5rem",
  };

  const ratingCircleStyle = (rating: number): CSSProperties => {
    const isSelected = accuracyRating === rating;
    const isHovered = hoveredRating === rating;
    return {
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      border: `2px solid ${isSelected ? "#5BA4A4" : isHovered ? "#5BA4A4" : "rgba(36, 59, 83, 0.1)"}`,
      background: isSelected ? "#5BA4A4" : isHovered ? "rgba(91,164,164,0.06)" : "#ffffff",
      color: isSelected ? "#ffffff" : "#243B53",
      fontSize: "0.9375rem",
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
      outline: "none",
      boxShadow: isSelected ? "0 4px 12px rgba(91, 164, 164, 0.3)" : "none",
    };
  };

  const ratingCaptionStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.6875rem",
    color: "#8fa3b8",
    fontWeight: 600,
    textTransform: "uppercase",
    padding: "0 0.25rem",
  };

  const tagsContainerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  };

  const tagCardStyle = (optionId: string): CSSProperties => {
    const isSelected = focusArea === optionId;
    return {
      border: `1.5px solid ${isSelected ? "#5BA4A4" : "rgba(36, 59, 83, 0.08)"}`,
      background: isSelected ? "rgba(91,164,164,0.04)" : "#ffffff",
      padding: "0.875rem 1.125rem",
      borderRadius: "14px",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      transition: "all 0.2s ease",
      textAlign: "left",
      outline: "none",
    };
  };

  const textareaStyle: CSSProperties = {
    width: "100%",
    padding: "0.875rem 1.125rem",
    border: `2px solid ${inputFocused ? "#5BA4A4" : "rgba(36, 59, 83, 0.1)"}`,
    borderRadius: "14px",
    background: inputFocused ? "#ffffff" : "#F4F7FA",
    color: "#1F2933",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    outline: "none",
    boxShadow: inputFocused ? "0 0 0 3px rgba(91, 164, 164, 0.1)" : "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
    resize: "none",
  };

  const ctaButtonStyle: CSSProperties = {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "1.125rem 2rem",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "0.9375rem",
    borderRadius: "12px",
    transition: "all 0.25s ease-in-out",
    cursor: "pointer",
    textDecoration: "none",
    border: "none",
    background: submitHovered ? "#4a9393" : "#5BA4A4",
    transform: submitHovered ? "translateY(-1.5px)" : "translateY(0)",
    boxShadow: submitHovered ? "0 6px 18px rgba(91, 164, 164, 0.38)" : "0 4px 14px rgba(91, 164, 164, 0.25)",
  };

  if (submitting) {
    return (
      <div style={containerStyle}>
        <div style={dotGridStyle} aria-hidden />
        <div 
          style={{
            ...cardStyle,
            alignItems: "center",
            textAlign: "center",
            padding: "4.5rem 3rem"
          }}
        >
          <div style={topBarStyle} />
          
          <div 
            style={{
              width: "72px",
              height: "72px",
              background: "rgba(91, 164, 164, 0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              color: "#5BA4A4"
            }}
          >
            <RotateCw size={32} className="animate-spin" />
          </div>
          
          <h2 style={{ ...titleStyle, fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            Processing Your Reflection
          </h2>
          
          <p style={{ ...descriptionStyle, fontSize: "0.875rem", maxWidth: "340px" }}>
            We are integrating your experience insights with your assessment results to finalize your workforce intelligence profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
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

        {/* 1. Header Block */}
        <div style={headerStyle}>
          <div style={badgeStyle}>
            <Brain size={11} style={{ marginRight: "2px" }} />
            Final Step
          </div>
          <h1 style={titleStyle}>
            Self Reflection
          </h1>
          <p style={descriptionStyle}>
            Before unlocking your behavioral profile report, take a quick moment to reflect on your assessment experience.
          </p>
        </div>

        {/* 2. Form Content */}
        <form onSubmit={handleSubmit} style={formStyle}>
          
          {/* Question 1: Accuracy Rating */}
          <div style={questionGroupStyle}>
            <label style={labelStyle}>
              1. How accurately do the assessment scenarios match your day-to-day work style?
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={ratingRowStyle}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setAccuracyRating(rating)}
                    onMouseEnter={() => setHoveredRating(rating)}
                    onMouseLeave={() => setHoveredRating(null)}
                    style={ratingCircleStyle(rating)}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <div style={ratingCaptionStyle}>
                <span>Not Aligned</span>
                <span>Highly Accurate</span>
              </div>
            </div>
          </div>

          {/* Question 2: Selected Focus Area */}
          <div style={questionGroupStyle}>
            <label style={labelStyle}>
              2. Which dimension of team performance is most important to you?
            </label>
            <div style={tagsContainerStyle}>
              {focusOptions.map((option) => {
                const isSelected = focusArea === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFocusArea(option.id)}
                    style={tagCardStyle(option.id)}
                  >
                    <div>
                      <span style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#243B53" }}>
                        {option.label}
                      </span>
                      <span style={{ display: "block", fontSize: "0.6875rem", color: "#627D98", marginTop: "2px" }}>
                        {option.desc}
                      </span>
                    </div>
                    {isSelected && (
                      <div 
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: "#5BA4A4",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={11} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3: Open Response Comments */}
          <div style={questionGroupStyle}>
            <label style={labelStyle}>
              3. Any key takeaways or reflections you would like to note? (Optional)
            </label>
            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Jot down any observations or thoughts about the questions..."
              style={textareaStyle}
            />
          </div>

          {/* 3. Submit Area */}
          <button
            type="submit"
            onMouseEnter={() => setSubmitHovered(true)}
            onMouseLeave={() => setSubmitHovered(false)}
            style={ctaButtonStyle}
          >
            <span>Complete & View Insights</span>
            <ArrowRight 
              size={16} 
              style={{
                transition: "transform 0.2s",
                transform: submitHovered ? "translateX(3px)" : "translateX(0)"
              }}
            />
          </button>
        </form>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes cardEnter {
          from { opacity: 0; transform: scale(0.98) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
