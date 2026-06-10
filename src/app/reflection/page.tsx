"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Brain, RotateCw, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function ReflectionPage() {
  const router = useRouter();

  // Form States
  const [accuracyRating, setAccuracyRating] = useState<number | null>(null);
  const [focusArea, setFocusArea] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  
  // Submit States
  const [submitting, setSubmitting] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);

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
    
    router.push("/profile-output");
  };

  if (submitting) {
    return (
      <div className="tie-container">
        <div className="tie-dot-grid" aria-hidden />
        <div 
          className="tie-card animate-fade-up"
          style={{
            alignItems: "center",
            textAlign: "center",
            padding: "4rem 2.5rem",
            maxWidth: "480px"
          }}
        >
          <div className="tie-card-top-bar" />
          
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}
          >
            <div 
              style={{
                width: "80px",
                height: "80px",
                background: "rgba(91, 164, 164, 0.1)",
                borderRadius: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#5BA4A4"
              }}
            >
              <Brain size={36} />
            </div>
          </motion.div>
          
          <h2 className="tie-title" style={{ fontSize: "1.5rem", marginBottom: "1rem", fontWeight: 800 }}>
            Processing Your Reflection
          </h2>
          
          <p className="tie-desc" style={{ fontSize: "0.875rem", color: "#627D98", lineHeight: 1.6, marginBottom: "2.5rem", maxWidth: "360px" }}>
            We are integrating your experience insights with your assessment results to finalize your workforce intelligence profile.
          </p>

          <div style={{ height: "6px", width: "100%", background: "#F4F7FA", borderRadius: "99px", overflow: "hidden", position: "relative" }}>
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
              style={{ height: "100%", background: "#5BA4A4", borderRadius: "99px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem", width: "100%", fontSize: "9px", fontWeight: 700, color: "#b0bec8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <span>Calibrating</span>
            <span>Finalizing Insights</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tie-container">
      {/* ── Background decoration ── */}
      <div className="tie-dot-grid" aria-hidden />
      
      {/* Ambient gradient blobs */}
      <div className="tie-glow-blob-1" aria-hidden />
      <div className="tie-glow-blob-2" aria-hidden />

      {/* ── Main Centered Card ── */}
      <div className="tie-card">
        {/* Top border accent line */}
        <div className="tie-card-top-bar" />

        {/* 1. Header Block */}
        <div className="tie-header">
          <div className="tie-badge">
            <Brain size={11} style={{ marginRight: "2px" }} />
            Final Step
          </div>
          <h1 className="tie-title">
            Self Reflection
          </h1>
          <p className="tie-desc">
            Before unlocking your behavioral profile report, take a quick moment to reflect on your assessment experience.
          </p>
        </div>

        {/* 2. Form Content */}
        <form onSubmit={handleSubmit} className="reflection-form">
          
          {/* Question 1: Accuracy Rating */}
          <div className="tie-input-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              1. How accurately do the assessment scenarios match your day-to-day work style?
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div className="reflection-rating-row">
                {[1, 2, 3, 4, 5].map((rating) => {
                  const isSelected = accuracyRating === rating;
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setAccuracyRating(rating)}
                      onMouseEnter={() => setHoveredRating(rating)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className={`reflection-rating-circle ${isSelected ? "is-selected" : ""}`}
                    >
                      {rating}
                    </button>
                  );
                })}
              </div>
              <div className="reflection-rating-caption">
                <span>Not Aligned</span>
                <span>Highly Accurate</span>
              </div>
            </div>
          </div>

          {/* Question 2: Selected Focus Area */}
          <div className="tie-input-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              2. Which dimension of team performance is most important to you?
            </label>
            <div className="reflection-tags-container">
              {focusOptions.map((option) => {
                const isSelected = focusArea === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFocusArea(option.id)}
                    className={`reflection-tag-card ${isSelected ? "is-selected" : ""}`}
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
                      <div className="reflection-check-indicator">
                        <Check size={11} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3: Open Response Comments */}
          <div className="tie-input-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              3. Any key takeaways or reflections you would like to note? (Optional)
            </label>
            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Jot down any observations or thoughts about the questions..."
              className="reflection-textarea"
            />
          </div>

          {/* 3. Submit Area */}
          <button
            type="submit"
            onMouseEnter={() => setSubmitHovered(true)}
            onMouseLeave={() => setSubmitHovered(false)}
            className="tie-btn-primary"
          >
            <span>Complete & View Insights</span>
            <ArrowRight 
              size={16} 
              className="dashboard-btn-icon-right"
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
