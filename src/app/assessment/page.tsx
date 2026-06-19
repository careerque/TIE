"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Cloud,
  Loader2,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import {
  fetchAssessmentStructure,
  fetchUserSavedProgress,
  autoSaveSingleResponse,
  CleanQuestion
} from "@/services/assessmentService";
import { supabasedb } from "@/lib/supabaseClient";
import { seededShuffle } from "@/lib/seededShuffle";

// Define a structural interface for our wrapped questions containing locked random layout variants
interface SeededQuestion extends CleanQuestion {
  shuffledOptions: {
    text: string;
    originalIndex: number;
  }[];
}

export default function AssessmentPage() {
  const router = useRouter();
  const { isLoggedIn, profile, user, loading: authLoading } = useAuthContext();

  // 🔧 CHANGED: Modified core state array to accept our explicit SeededQuestion structural shape
  const [questions, setQuestions] = useState<SeededQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // { questionId: selectedOptionIndex (0-3) }
  const [savingId, setSavingId] = useState<number | null>(null); // Visual feedback indicator for auto-save

  const [submitting, setSubmitting] = useState(false);
  const [hoveredOptionIdx, setHoveredOptionIdx] = useState<number | null>(null);
  const [hoveredPrev, setHoveredPrev] = useState(false);
  const [hoveredNext, setHoveredNext] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      // Check authentication status
      if (!isLoggedIn || !user) {
        router.push("/login");
        return;
      }

      const initializeAssessment = async () => {
        try {
          // Fetch structural questions, user response metrics, and profile seed parallelly
          const [questionsRes, progressRes, profileRes] = await Promise.all([
            fetchAssessmentStructure(),
            fetchUserSavedProgress(user.id),
            supabasedb.from("profiles").select("assessment_seed").eq("id", user.id).single()
          ]);

          if (questionsRes.success && questionsRes.data) {
            // 🔧 CHANGED: Safely pull the user profile assessment seed integer
            let sessionSeed = profileRes.data?.assessment_seed;

            // 🔧 CHANGED: Secure fallback fallback generation matching the DB trigger pattern if no seed is assigned
            if (!sessionSeed) {
              sessionSeed = Math.floor(Math.random() * 100000 + 1);
              await supabasedb.from("profiles").update({ assessment_seed: sessionSeed }).eq("id", user.id);
            }

            // 🔧 CHANGED: Map over core structural questions and lock their visual positions permanently inside state
            const preparedQuestions: SeededQuestion[] = questionsRes.data.map((q) => {
              const optionWithOriginalIndex = q.options.map((text, orgIndex) => ({
                text: text,
                originalIndex: orgIndex // Un-spoofable scoring tracer: 0=SCP, 1=FIE, 2=CCD, 3=SPO
              }));

              // Unique question seed generation math ensuring different variations cross questions
              const uniqueSeedValue = sessionSeed + q.question_id;
              
              return {
                ...q,
                shuffledOptions: seededShuffle(optionWithOriginalIndex, uniqueSeedValue)
              };
            });

            setQuestions(preparedQuestions);

            // Reconstruct saved progress if it exists
            if (progressRes.success && progressRes.data && progressRes.data.length > 0) {
              const mappedAnswers: Record<number, number> = {};
              progressRes.data.forEach((row) => {
                mappedAnswers[row.question_id] = row.selected_option_index;
              });
              setAnswers(mappedAnswers);

              // Find the first question index that has not been answered yet
              const firstUnansweredIndex = preparedQuestions.findIndex(
                (q) => mappedAnswers[q.question_id] === undefined
              );

              if (firstUnansweredIndex !== -1) {
                setCurrentIndex(firstUnansweredIndex);
              } else {
                setCurrentIndex(preparedQuestions.length - 1);
              }
            }
          } else {
            setError(questionsRes.error?.message || "Unable to load assessment questions.");
          }
        } catch (err: any) {
          console.error("Initialization error:", err);
          setError("Unable to initialize assessment session.");
        } finally {
          setLoading(false);
        }
      };

      initializeAssessment();
    }
  }, [isLoggedIn, profile, user, authLoading, router]);

  const currentQuestion = questions.length > 0 ? questions[currentIndex] : undefined;
  const currentAnswerIndex = currentQuestion ? answers[currentQuestion.question_id] : undefined;
  const totalQuestions = questions.length;

  const totalAnsweredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const progress = useMemo(() => {
    if (!totalQuestions) return 0;
    return Math.round((totalAnsweredCount / totalQuestions) * 100);
  }, [totalAnsweredCount, totalQuestions]);

  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isAllCompleted = totalAnsweredCount === totalQuestions;

  const handleSelectOption = async (questionId: number, originalIndex: number) => {
    if (!user) return;

    // 🔧 CHANGED: Optimistically update state tracking via the locked originalIndex identity contract (0-3)
    setAnswers((prev) => ({ ...prev, [questionId]: originalIndex }));
    setSavingId(questionId); 

    // Fire network call instantly behind the scenes using the correct immutable tracker indicator mapping index
    const res = await autoSaveSingleResponse(user.id, questionId, originalIndex);

    setSavingId(null); 

    if (!res.success) {
      alert(`Auto-save failed: ${res.error?.message}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setHoveredOptionIdx(null);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setHoveredOptionIdx(null);
    }
  };

  const submitAssessment = async () => {
    if (!isAllCompleted) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    router.push("/reflection");
  };

  // Render Loader
  if (authLoading || loading) {
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
            {error || "We couldn't retrieve the assessment questions."}
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

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", fontSize: "10px", fontWeight: 700, color: "#b0bec8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <span>Processing</span>
            <span>Finalizing</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tie-container assessment-page-container">
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
      <div className="assessment-progress-container">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.65rem", fontWeight: 700, color: "#8fa3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {savingId === currentQuestion.question_id ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#5BA4A4" }} />
                <span>Saving changes...</span>
              </>
            ) : (
              <>
                <Cloud className="h-3.5 w-3.5" style={{ color: "#A3B18A" }} />
                <span>All changes saved to cloud</span>
              </>
            )}
          </div>
          <span style={{ fontSize: "1rem", fontWeight: 800, color: "#243B53", marginTop: "0.125rem" }}>
            Question {currentIndex + 1} <span style={{ color: "#8fa3b8", fontSize: "0.75rem", fontWeight: 500 }}>/ {totalQuestions}</span>
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#8fa3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Assessment Progress</span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#5BA4A4" }}>{totalAnsweredCount} / {totalQuestions} Completed</span>
          </div>
          <div style={{ width: "100%", height: "5px", background: "#EAEFF4", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#5BA4A4", borderRadius: "99px", transition: "width 0.4s ease" }} />
          </div>
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="tie-card" style={{ padding: 0, gap: 0, maxWidth: "100%" }}>
          {/* Card Top Glow Accent */}
          <div style={{ height: "4px", width: "100%", background: "linear-gradient(90deg, #5BA4A4 0%, #A3B18A 55%, #5BA4A4 100%)" }} />

          <div className="assessment-card-body">
            {/* Question Type Badge */}
            <div className="tie-badge" style={{ marginBottom: "0.75rem" }}>
              <Sparkles className="h-3 w-3" style={{ color: "#5BA4A4", marginRight: "2px" }} />
              <span>Multiple Choice</span>
            </div>

            {/* Question Text */}
            <h2 className="assessment-question-text">
              {currentQuestion.question_text}
            </h2>

            {/* Answer Options */}
            <div style={{ minHeight: "180px" }}>
              {/* 🔧 CHANGED: Loop dynamically through the locked, cached shuffled options array tool */}
              {currentQuestion.shuffledOptions.map((option, index) => {
                // Check selection match directly by referencing its hidden original index identity key
                const isSelected = currentAnswerIndex === option.originalIndex;
                const optionLetter = String.fromCharCode(65 + index);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectOption(currentQuestion.question_id, option.originalIndex)}
                    onMouseEnter={() => setHoveredOptionIdx(index)}
                    onMouseLeave={() => setHoveredOptionIdx(null)}
                    className={`assessment-option-btn ${isSelected ? "is-selected" : ""}`}
                  >
                    <div className="assessment-option-circle">
                      {isSelected ? <CheckCircle2 className="h-5 w-5" /> : optionLetter}
                    </div>
                    <span style={{ flexGrow: 1 }}>{option.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ width: "100%", maxWidth: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", zIndex: 10, boxSizing: "border-box" }}>
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          onMouseEnter={() => setHoveredPrev(true)}
          onMouseLeave={() => setHoveredPrev(false)}
          className="assessment-nav-prev"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {isLastQuestion ? (
          <button
            onClick={submitAssessment}
            disabled={!isAllCompleted}
            onMouseEnter={() => setHoveredNext(true)}
            onMouseLeave={() => setHoveredNext(false)}
            className="assessment-nav-next"
            style={{
              background: isAllCompleted ? "#5BA4A4" : "#ccc",
              cursor: isAllCompleted ? "pointer" : "not-allowed",
              boxShadow: isAllCompleted ? "0 3px 10px rgba(91,164,164,0.2)" : "none",
            }}
          >
            Submit Assessment
            <Send className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={currentQuestion && answers[currentQuestion.question_id] === undefined}
            onMouseEnter={() => setHoveredNext(true)}
            onMouseLeave={() => setHoveredNext(false)}
            className="assessment-nav-next"
          >
            Next Question
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}