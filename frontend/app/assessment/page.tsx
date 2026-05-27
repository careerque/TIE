"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type BaseQuestion = {
  id: number;
  question: string;
};

type MultipleChoiceQuestion = BaseQuestion & {
  type: "multiple-choice";
  options: string[];
};

type YesNoQuestion = BaseQuestion & {
  type: "yes-no";
};

type RatingQuestion = BaseQuestion & {
  type: "rating";
  min: number;
  max: number;
};

type ShortTextQuestion = BaseQuestion & {
  type: "short-text";
  placeholder?: string;
};

type TextAreaQuestion = BaseQuestion & {
  type: "textarea";
  placeholder?: string;
};

type Question =
  | MultipleChoiceQuestion
  | YesNoQuestion
  | RatingQuestion
  | ShortTextQuestion
  | TextAreaQuestion;

type Answers = Record<number, string | number>;

export default function AssessmentPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const [answers, setAnswers] = useState<Answers>({});
  const [validationError, setValidationError] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Hover states for interactive elements
  const [hoveredOptionIdx, setHoveredOptionIdx] = useState<number | null>(null);
  const [hoveredYesNo, setHoveredYesNo] = useState<string | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [hoveredPrev, setHoveredPrev] = useState(false);
  const [hoveredNext, setHoveredNext] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("/questions.json");
        if (!res.ok) throw new Error("Failed to fetch questions");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid JSON structure");
        setQuestions(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load assessment questions.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const currentQuestion = questions.length > 0 ? questions[currentIndex] : undefined;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const totalQuestions = questions.length;

  const progress = useMemo(() => {
    if (!totalQuestions) return 0;
    return Math.round((currentIndex / totalQuestions) * 100);
  }, [currentIndex, totalQuestions]);

  const isLastQuestion = currentIndex === totalQuestions - 1;

  const isAnswered = () => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];
    if (answer === undefined || answer === null) return false;
    return String(answer).trim().length > 0;
  };

  const updateAnswer = (value: string | number) => {
    if (!currentQuestion) return;
    setValidationError(false);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const nextQuestion = () => {
    if (!isAnswered()) {
      setValidationError(true);
      return;
    }
    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      // Reset hover state
      setHoveredOptionIdx(null);
    }
  };

  const previousQuestion = () => {
    setValidationError(false);
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      // Reset hover state
      setHoveredOptionIdx(null);
    }
  };

  const submitAssessment = async () => {
    if (!isAnswered()) {
      setValidationError(true);
      return;
    }
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    router.push("/profile-output");
  };

  // Render Loader
  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "calc(100vh - 150px)", alignItems: "center", justifyContent: "center", background: "#F4F7FA", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ position: "relative", width: "80px", height: "80px" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{ width: "100%", height: "100%", borderRadius: "50%", border: "4px solid rgba(91,164,164,0.15)", borderTopColor: "#5BA4A4", boxSizing: "border-box" }}
            />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles className="h-8 w-8" style={{ color: "#5BA4A4" }} />
            </div>
          </div>
          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(36,59,83,0.7)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Loading Assessment
          </p>
        </div>
      </div>
    );
  }

  // Render Error
  if (error || !questions.length || !currentQuestion) {
    return (
      <div style={{ display: "flex", minHeight: "calc(100vh - 150px)", alignItems: "center", justifyContent: "center", background: "#F4F7FA", padding: "1.5rem", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: "100%", maxWidth: "480px", background: "#ffffff", borderRadius: "24px", padding: "3rem", boxShadow: "0 8px 30px rgba(36,59,83,0.06)", border: "1px solid rgba(36,59,83,0.08)", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
            <div style={{ width: "80px", height: "80px", background: "rgba(220,53,69,0.06)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle className="h-10 w-10" style={{ color: "#c0392b" }} />
            </div>
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#243B53", marginBottom: "1rem" }}>
            Assessment Initialization Failed
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#627D98", lineHeight: 1.6, margin: 0 }}>
            {error || "We couldn't retrieve the assessment questions. Please verify questions.json exists."}
          </p>
        </div>
      </div>
    );
  }

  // Render Submitting state
  if (submitting) {
    return (
      <div style={{ display: "flex", minHeight: "calc(100vh - 150px)", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F4F7FA", padding: "1.5rem", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: "100%", maxWidth: "480px", background: "#ffffff", borderRadius: "24px", padding: "3rem", boxShadow: "0 8px 30px rgba(36,59,83,0.06)", border: "1px solid rgba(36,59,83,0.08)", textAlign: "center", margin: "0 auto" }}>
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}
          >
            <div style={{ width: "88px", height: "88px", background: "rgba(91,164,164,0.1)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles className="h-10 w-10" style={{ color: "#5BA4A4" }} />
            </div>
          </motion.div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#243B53", marginBottom: "1rem" }}>
            Analyzing Your Responses
          </h2>

          <p style={{ fontSize: "0.875rem", color: "#627D98", lineHeight: 1.6, marginBottom: "2.5rem" }}>
            TIE is compiling your answers and building your workforce intelligence profile.
          </p>

          <div style={{ height: "6px", width: "100%", background: "#F4F7FA", borderRadius: "99px", overflow: "hidden", position: "relative" }}>
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
              style={{ height: "100%", background: "#5BA4A4", borderRadius: "99px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "between", marginTop: "1rem", fontSize: "10px", fontWeight: 700, color: "#b0bec8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <span style={{ float: "left" }}>Processing</span>
            <span style={{ float: "right" }}>Finalizing</span>
          </div>
        </div>
      </div>
    );
  }

  // --- Dynamic Inline Styles ---
  const containerStyle: CSSProperties = {
    minHeight: "calc(100vh - 150px)",
    background: "#F4F7FA",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    padding: "2rem 4rem",
    fontFamily: "'Inter', system-ui, sans-serif",
    position: "relative",
    boxSizing: "border-box",
  };

  const progressContainerStyle: CSSProperties = {
    width: "100%",
    maxWidth: "100%",
    background: "#ffffff",
    borderRadius: "14px",
    border: "1px solid rgba(36,59,83,0.06)",
    padding: "0.8rem 1.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1.25rem",
    boxShadow: "0 4px 15px rgba(36,59,83,0.02)",
    boxSizing: "border-box",
    marginBottom: "1rem",
  };

  const cardStyle: CSSProperties = {
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 8px 30px rgba(36,59,83,0.05), 0 2px 6px rgba(36,59,83,0.02)",
    border: "1px solid rgba(36,59,83,0.06)",
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
    boxSizing: "border-box",
    position: "relative",
    zIndex: 10,
  };

  const badgeStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "rgba(91,164,164,0.1)",
    padding: "4px 10px",
    borderRadius: "99px",
    marginBottom: "0.75rem",
  };

  const badgeTextStyle: CSSProperties = {
    fontSize: "0.68rem",
    fontWeight: 700,
    color: "#5BA4A4",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  };

  const questionTextStyle: CSSProperties = {
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#243B53",
    lineHeight: 1.35,
    marginBottom: "1.25rem",
    letterSpacing: "-0.02em",
  };

  const optionButtonStyle = (idx: number): CSSProperties => {
    const isSelected = String(currentAnswer) === (currentQuestion as MultipleChoiceQuestion).options?.[idx];
    const isHovered = hoveredOptionIdx === idx;
    return {
      display: "flex",
      alignItems: "center",
      width: "100%",
      padding: "0.75rem 1.125rem",
      border: `2px solid ${isSelected ? "#5BA4A4" : isHovered ? "rgba(91,164,164,0.4)" : "rgba(36,59,83,0.06)"}`,
      borderRadius: "12px",
      background: isSelected ? "rgba(91,164,164,0.04)" : isHovered ? "#F8FBFF" : "#ffffff",
      color: "#243B53",
      textAlign: "left",
      fontSize: "0.875rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)",
      fontFamily: "inherit",
      boxShadow: isSelected ? "0 2px 8px rgba(91,164,164,0.04)" : "none",
      boxSizing: "border-box",
      marginBottom: "0.5rem",
      outline: "none",
      transform: isHovered ? "translateX(4px)" : "translateX(0)",
    };
  };

  const optionCircleStyle = (idx: number): CSSProperties => {
    const isSelected = String(currentAnswer) === (currentQuestion as MultipleChoiceQuestion).options?.[idx];
    const isHovered = hoveredOptionIdx === idx;
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      border: `2px solid ${isSelected ? "#5BA4A4" : isHovered ? "#5BA4A4" : "rgba(36,59,83,0.12)"}`,
      background: isSelected ? "#5BA4A4" : "#ffffff",
      color: isSelected ? "#ffffff" : isHovered ? "#5BA4A4" : "#8fa3b8",
      fontSize: "0.72rem",
      fontWeight: 700,
      marginRight: "0.75rem",
      flexShrink: 0,
      transition: "all 0.18s",
    };
  };

  const yesNoButtonStyle = (val: string): CSSProperties => {
    const isSelected = String(currentAnswer).toLowerCase() === val.toLowerCase();
    const isHovered = hoveredYesNo === val;
    return {
      flex: 1,
      padding: "0.875rem",
      border: `2px solid ${isSelected ? "#5BA4A4" : isHovered ? "rgba(91,164,164,0.4)" : "rgba(36,59,83,0.06)"}`,
      borderRadius: "12px",
      background: isSelected ? "#5BA4A4" : isHovered ? "#F8FBFF" : "#ffffff",
      color: isSelected ? "#ffffff" : "#243B53",
      textAlign: "center",
      fontSize: "0.9rem",
      fontWeight: 700,
      cursor: "pointer",
      transition: "all 0.2s",
      fontFamily: "inherit",
      boxShadow: isSelected ? "0 3px 10px rgba(91,164,164,0.15)" : "none",
      boxSizing: "border-box",
      outline: "none",
      transform: isHovered ? "scale(1.025)" : "scale(1)",
    };
  };

  const ratingCircleStyle = (rating: number): CSSProperties => {
    const isSelected = Number(currentAnswer) === rating;
    const isHovered = hoveredRating === rating;
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      border: `2px solid ${isSelected ? "#5BA4A4" : isHovered ? "#5BA4A4" : "rgba(36,59,83,0.1)"}`,
      background: isSelected ? "#5BA4A4" : isHovered ? "#F8FBFF" : "#ffffff",
      color: isSelected ? "#ffffff" : "#243B53",
      fontSize: "0.875rem",
      fontWeight: 700,
      cursor: "pointer",
      transition: "all 0.15s",
      boxShadow: isSelected ? "0 3px 10px rgba(91,164,164,0.15)" : "none",
      outline: "none",
      transform: isHovered ? "scale(1.08)" : "scale(1)",
    };
  };

  const inputStyle = (isFocused: boolean): CSSProperties => ({
    width: "100%",
    padding: "0.75rem 1.125rem",
    border: `2px solid ${isFocused ? "#5BA4A4" : "rgba(36,59,83,0.1)"}`,
    borderRadius: "12px",
    background: isFocused ? "#ffffff" : "#F4F7FA",
    color: "#1F2933",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
    boxShadow: isFocused ? "0 0 0 3px rgba(91,164,164,0.1)" : "none",
    transition: "all 0.18s",
    boxSizing: "border-box",
    resize: "none",
  });

  const prevButtonStyle = (disabled: boolean, isHovered: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "0.75rem 1.25rem",
    border: "1.5px solid rgba(36,59,83,0.15)",
    borderRadius: "10px",
    background: disabled ? "#EAEFF4" : isHovered ? "rgba(36,59,83,0.12)" : "rgba(36,59,83,0.06)",
    color: disabled ? "#b0bec8" : "#243B53",
    fontSize: "0.8125rem",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.18s",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transform: isHovered && !disabled ? "scale(1.025)" : "scale(1)",
  });

  const nextButtonStyle = (isHovered: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "10px",
    background: isHovered ? "#4a9393" : "#5BA4A4",
    color: "#ffffff",
    fontSize: "0.8125rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(91,164,164,0.2)",
    transition: "all 0.18s",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transform: isHovered ? "scale(1.025)" : "scale(1)",
  });

  return (
    <div style={containerStyle}>
      {/* Background decoration blobs */}
      <div aria-hidden style={{ position: "absolute", top: "-130px", right: "-130px", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,164,164,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", bottom: "-130px", left: "-130px", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle, rgba(163,177,138,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Main Title Headers */}
      <div style={{ textAlign: "left", marginBottom: "1rem", zIndex: 10, width: "100%", maxWidth: "100%" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#243B53", letterSpacing: "-0.03em", marginBottom: "0.25rem" }}>
          Workforce Insight Assessment
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#627D98", lineHeight: 1.5, margin: 0 }}>
          Help TIE understand your work style and professional strengths through this brief assessment.
        </p>
      </div>

      {/* Sleek Progress Container */}
      <div style={progressContainerStyle}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#8fa3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Question Progress</span>
          <span style={{ fontSize: "1rem", fontWeight: 800, color: "#243B53", marginTop: "0.125rem" }}>
            {currentIndex + 1} <span style={{ color: "#8fa3b8", fontSize: "0.75rem", fontWeight: 500 }}>/ {totalQuestions}</span>
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#8fa3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Assessment Progress</span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#5BA4A4" }}>{progress}%</span>
          </div>
          <div style={{ width: "100%", height: "5px", background: "#EAEFF4", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#5BA4A4", borderRadius: "99px", transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)" }} />
          </div>
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div style={cardStyle}>
          {/* Card Top Glow Accent */}
          <div style={{ height: "4px", width: "100%", background: "linear-gradient(90deg, #5BA4A4 0%, #A3B18A 55%, #5BA4A4 100%)" }} />

          <div style={{ padding: "1.5rem 2rem" }}>
            {/* Question Type Badge */}
            <div style={badgeStyle}>
              <Sparkles className="h-3 w-3" style={{ color: "#5BA4A4" }} />
              <span style={badgeTextStyle}>
                {currentQuestion.type.replace("-", " ")}
              </span>
            </div>

            {/* Question Text */}
            <h2 style={questionTextStyle}>
              {currentQuestion.question}
            </h2>

            {/* Answer Options */}
            <div style={{ minHeight: "180px" }}>
              {/* Multiple Choice */}
              {currentQuestion.type === "multiple-choice" &&
                Array.isArray(currentQuestion.options) &&
                currentQuestion.options.map((option, idx) => {
                  const optionLetter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={option}
                      onClick={() => updateAnswer(option)}
                      onMouseEnter={() => setHoveredOptionIdx(idx)}
                      onMouseLeave={() => setHoveredOptionIdx(null)}
                      style={optionButtonStyle(idx)}
                    >
                      <div style={optionCircleStyle(idx)}>
                        {String(currentAnswer) === option ? <CheckCircle2 className="h-5 w-5" /> : optionLetter}
                      </div>
                      <span style={{ flexGrow: 1 }}>{option}</span>
                    </button>
                  );
                })}

              {/* Yes No */}
              {currentQuestion.type === "yes-no" && (
                <div style={{ display: "flex", gap: "1.25rem", marginTop: "1rem" }}>
                  {["yes", "no"].map((value) => (
                    <button
                      key={value}
                      onClick={() => updateAnswer(value)}
                      onMouseEnter={() => setHoveredYesNo(value)}
                      onMouseLeave={() => setHoveredYesNo(null)}
                      style={yesNoButtonStyle(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}

              {/* Rating */}
              {currentQuestion.type === "rating" &&
                typeof currentQuestion.min === "number" &&
                typeof currentQuestion.max === "number" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", padding: "1rem 0" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.75rem" }}>
                      {Array.from(
                        { length: Math.max(0, currentQuestion.max - currentQuestion.min + 1) },
                        (_, i) => (currentQuestion.min ?? 0) + i
                      ).map((rating) => (
                        <button
                          key={rating}
                          onClick={() => updateAnswer(rating)}
                          onMouseEnter={() => setHoveredRating(rating)}
                          onMouseLeave={() => setHoveredRating(null)}
                          style={ratingCircleStyle(rating)}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", width: "100%", maxWidth: "340px", justifyContent: "space-between", padding: "0 10px", fontSize: "10px", fontWeight: 700, color: "#9aa8b6", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                )}

              {/* Short Text */}
              {currentQuestion.type === "short-text" && (
                <div style={{ position: "relative", marginTop: "1rem" }}>
                  <input
                    type="text"
                    value={String(currentAnswer || "")}
                    placeholder={currentQuestion.placeholder || "Type your answer..."}
                    onChange={(e) => updateAnswer(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    style={inputStyle(isInputFocused)}
                  />
                </div>
              )}

              {/* Textarea */}
              {currentQuestion.type === "textarea" && (
                <div style={{ position: "relative", marginTop: "1rem" }}>
                  <textarea
                    rows={5}
                    value={String(currentAnswer || "")}
                    placeholder={currentQuestion.placeholder || "Share your response..."}
                    onChange={(e) => updateAnswer(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    style={inputStyle(isInputFocused)}
                  />
                </div>
              )}
            </div>

            {/* Validation Error Banner */}
            <AnimatePresence>
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "start", gap: "0.75rem", borderRadius: "14px", border: "1px solid rgba(220,53,69,0.15)", background: "rgba(220,53,69,0.03)", padding: "1rem 1.25rem", boxSizing: "border-box" }}>
                    <AlertCircle className="h-5 w-5" style={{ color: "#c0392b", flexShrink: 0, marginTop: "1px" }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#c0392b", lineHeight: 1.4 }}>
                      Please provide an answer before moving to the next question.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ width: "100%", maxWidth: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", zIndex: 10, boxSizing: "border-box" }}>
        <button
          onClick={previousQuestion}
          disabled={currentIndex === 0}
          onMouseEnter={() => setHoveredPrev(true)}
          onMouseLeave={() => setHoveredPrev(false)}
          style={prevButtonStyle(currentIndex === 0, hoveredPrev)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {isLastQuestion ? (
          <button
            onClick={submitAssessment}
            onMouseEnter={() => setHoveredNext(true)}
            onMouseLeave={() => setHoveredNext(false)}
            style={nextButtonStyle(hoveredNext)}
          >
            Submit Assessment
            <Send className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            onMouseEnter={() => setHoveredNext(true)}
            onMouseLeave={() => setHoveredNext(false)}
            style={nextButtonStyle(hoveredNext)}
          >
            Next Question
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}