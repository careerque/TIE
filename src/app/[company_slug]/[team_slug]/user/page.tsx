"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { supabasedb } from "@/lib/supabaseClient";
import { seededShuffle } from "@/lib/seededShuffle";
import { 
  fetchAssessmentStructure, 
  fetchUserSavedProgress, 
  autoSaveSingleResponse, 
  CleanQuestion 
} from "@/services/assessmentService";
import { projectService } from "@/services/projectService";
import { 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Cloud, 
  AlertCircle,
  Brain,
  ArrowRight,
  Check,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReportViewer from "@/components/ReportViewer";

interface SeededQuestion extends CleanQuestion {
  shuffledOptions: {
    text: string;
    originalIndex: number;
  }[];
}

interface SavedReport {
  user_id: string;
  report_markdown: string;
  scoring_metrics: any;
  manager_signals: any;
}

export default function EmployeeWorkspacePage() {
  const router = useRouter();
  const { company_slug, team_slug } = useParams();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("viewReportFor");

  const { isLoggedIn, profile, user, loading: authLoading } = useAuthContext();

  // Unified Workflow State: 'loading' | 'viewing_report' | 'taking_test' | 'taking_reflection' | 'generating_report'
  const [workflowState, setWorkflowState] = useState<string>("loading");
  const [error, setError] = useState<string | null>(null);

  // Assessment Wizard State
  const [questions, setQuestions] = useState<SeededQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  // Reflection Form State
  const [accuracyRating, setAccuracyRating] = useState<number | null>(null);
  const [focusArea, setFocusArea] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  // Report Display State
  const [reportData, setReportData] = useState<SavedReport | null>(null);
  const [reportTargetProfile, setReportTargetProfile] = useState<any>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const cleanApiUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }
      if (profile?.role && profile.role !== "user" && (!targetUserId || targetUserId === user?.id)) {
        router.push("/dashboard");
        return;
      }
      resolveWorkspaceState();
    }
  }, [isLoggedIn, profile, authLoading, router, targetUserId, user]);

  // Resolve state based on URL parameters and database records
  const resolveWorkspaceState = async () => {
    if (!user) return;
    setWorkflowState("loading");
    setError(null);

    try {
      const session = await supabasedb.auth.getSession();
      const jwtToken = session.data.session?.access_token;
      
      if (!jwtToken) {
        throw new Error("Session expired. Please log in again.");
      }

      // Context A: An administrator or lead is viewing a target member's report
      if (targetUserId && targetUserId !== user.id) {
        // Retrieve profile details for headers
        const { data: memberProfile } = await supabasedb
          .from("profiles")
          .select("first_name, last_name, designation, experience_years")
          .eq("id", targetUserId)
          .single();

        setReportTargetProfile(memberProfile || { first_name: "Team", last_name: "Member" });

        // Retrieve report using secure JWT endpoint
        const res = await fetch(`${cleanApiUrl}/api/enterprise/assessment/report/${targetUserId}`, {
          headers: {
            "Authorization": `Bearer ${jwtToken}`
          }
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "You do not have permissions to review this user's report.");
        }

        setReportData({
          user_id: targetUserId,
          report_markdown: data.report_markdown,
          scoring_metrics: data.scoring_metrics,
          manager_signals: data.manager_signals
        });
        setWorkflowState("viewing_report");
        return;
      }

      // Context B: Regular employee workflow (Self)
      // Check if report has already been generated
      const { data: cachedReport, error: cacheErr } = await supabasedb
        .from("saved_reports")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cachedReport) {
        setReportData(cachedReport as SavedReport);
        setReportTargetProfile(profile);
        setWorkflowState("viewing_report");
        return;
      }

      // Check user responses count
      const progressRes = await fetchUserSavedProgress(user.id);
      const answeredCount = progressRes.success && progressRes.data ? progressRes.data.length : 0;

      if (answeredCount < 24) {
        // Load assessment structure
        const qRes = await fetchAssessmentStructure();
        if (qRes.success && qRes.data) {
          let seed = profile?.assessment_seed ? Number(profile.assessment_seed) : null;
          if (!seed || isNaN(seed)) {
            seed = Math.floor(Math.random() * 999999 + 1);
            await supabasedb.from("profiles").update({ assessment_seed: seed }).eq("id", user.id);
          }

          // Shuffled options positions locked in state
          const prepared: SeededQuestion[] = qRes.data.map((q) => {
            const opts = q.options.map((t, orgIdx) => ({ text: t, originalIndex: orgIdx }));
            const shuf = seededShuffle(opts, seed + q.question_id);
            return { ...q, shuffledOptions: shuf };
          });

          setQuestions(prepared);

          const mappedAnswers: Record<number, number> = {};
          if (progressRes.success && progressRes.data) {
            progressRes.data.forEach((row) => {
              mappedAnswers[row.question_id] = row.selected_option_index;
            });
            setAnswers(mappedAnswers);
          }

          const firstUnanswered = prepared.findIndex(q => mappedAnswers[q.question_id] === undefined);
          setCurrentIndex(firstUnanswered !== -1 ? firstUnanswered : 0);
          setWorkflowState("taking_test");
        } else {
          throw new Error("Unable to load assessment questionnaire.");
        }
      } else {
        // Renders reflection form
        setWorkflowState("taking_reflection");
      }

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setWorkflowState("error");
    }
  };

  const handleAutofillAssessment = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user || questions.length === 0) return;
    setSavingId(9999);

    try {
      const bulkData = questions.map((q) => ({
        user_id: user.id,
        question_id: q.question_id,
        selected_option_index: Math.floor(Math.random() * 4),
        submitted_at: new Date().toISOString()
      }));

      const { error: upsertError } = await supabasedb
        .from("user_responses")
        .upsert(bulkData, { onConflict: "user_id,question_id" });

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      const mappedAnswers: Record<number, number> = {};
      bulkData.forEach((row) => {
        mappedAnswers[row.question_id] = row.selected_option_index;
      });
      setAnswers(mappedAnswers);

      setAccuracyRating(4);
      setFocusArea("collab");
      setFeedback("Automated test reflection.");

      setWorkflowState("generating_report");

      await projectService.saveReflection(user.id, {
        work_style_accuracy: 4,
        important_dimension: "Collaboration",
        takeaways_reflection: "Automated test reflection."
      });

      const res = await fetch(`${cleanApiUrl}/api/assessment/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Report generation failed.");
      }

      setReportData({
        user_id: user.id,
        report_markdown: data.report_markdown,
        scoring_metrics: data.scoring_metrics,
        manager_signals: data.manager_signals
      });
      setWorkflowState("viewing_report");
    } catch (err: any) {
      alert(`Auto-fill submission failed: ${err.message}`);
      setWorkflowState("taking_test");
    } finally {
      setSavingId(null);
    }
  };

  // Auto-Save Question Answer
  const handleSelectOption = async (questionId: number, originalIndex: number) => {
    if (!user) return;
    setAnswers(prev => ({ ...prev, [questionId]: originalIndex }));
    setSavingId(questionId);

    const res = await autoSaveSingleResponse(user.id, questionId, originalIndex);
    setSavingId(null);

    if (!res.success) {
      alert(`Auto-save failed: ${res.error?.message}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleCompleteTest = () => {
    setWorkflowState("taking_reflection");
  };

  // Submit Reflection and trigger Report Generation
  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setWorkflowState("generating_report");

    try {
      const focusMapping: Record<string, string> = {
        collab: "Collaboration",
        adapt: "Adaptability",
        growth: "Growth Style"
      };

      // Save reflection context
      await projectService.saveReflection(user.id, {
        work_style_accuracy: accuracyRating,
        important_dimension: focusMapping[focusArea] || "Collaboration",
        takeaways_reflection: feedback || null
      });

      // Invoke backend calculation / report compilation endpoint
      const res = await fetch(`${cleanApiUrl}/api/assessment/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Report generation failed.");
      }

      setReportData({
        user_id: user.id,
        report_markdown: data.report_markdown,
        scoring_metrics: data.scoring_metrics,
        manager_signals: data.manager_signals
      });
      setReportTargetProfile(profile);
      setWorkflowState("viewing_report");
    } catch (err: any) {
      setError(err.message || "Failed to generate report.");
      setWorkflowState("error");
    }
  };

  // Computed wizard properties
  const totalAnsweredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const isAllCompleted = totalAnsweredCount === 24;
  const currentQuestion = questions[currentIndex];
  const currentAnswerIndex = currentQuestion ? answers[currentQuestion.question_id] : undefined;

  // Render Loading
  if (workflowState === "loading") {
    return (
      <main className="tie-container bg-mesh">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ alignItems: "center", justifyContent: "center", minHeight: "350px" }}>
          <div className="tie-card-top-bar" />
          <Loader2 className="animate-spin text-[#5BA4A4] mb-3" size={36} />
          <span className="text-sm font-semibold text-slate-500">Resolving workspace state...</span>
        </div>
      </main>
    );
  }

  // Render Error
  if (workflowState === "error" || error) {
    return (
      <main className="tie-container bg-mesh">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ maxWidth: "480px", margin: "0 auto" }}>
          <div className="tie-card-top-bar" style={{ background: "#c0392b" }} />
          <div className="tie-header" style={{ alignItems: "center", textAlign: "center" }}>
            <div className="logo-ring" style={{ color: "#c0392b", border: "1.5px solid rgba(192, 57, 43, 0.2)", background: "rgba(192, 57, 43, 0.05)", marginBottom: "1rem" }}>
              <AlertCircle size={28} />
            </div>
            <h1 className="tie-title" style={{ fontSize: "1.5rem" }}>System Workspace Error</h1>
            <p className="tie-desc" style={{ marginTop: "0.5rem", color: "#c0392b" }}>
              {error || "An error occurred loading this page."}
            </p>
            <button
              onClick={resolveWorkspaceState}
              className="tie-btn-primary"
              style={{ marginTop: "1.5rem", width: "100%" }}
            >
              Retry Connection
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Render Report Generation Loading screen
  if (workflowState === "generating_report") {
    return (
      <main className="tie-container bg-mesh">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ maxWidth: "480px", textAlign: "center", padding: "3rem", margin: "0 auto" }}>
          <div className="tie-card-top-bar" />
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 6, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
            style={{ display: "inline-flex", padding: "1.25rem", background: "rgba(91,164,164,0.1)", borderRadius: "20px", color: "#5BA4A4", marginBottom: "1.5rem" }}
          >
            <Sparkles size={36} />
          </motion.div>
          <h2 className="tie-title" style={{ fontSize: "1.5rem", fontWeight: 800 }}>Analyzing Workforce Data</h2>
          <p className="tie-desc" style={{ marginTop: "0.5rem" }}>
            Connecting response profiles, calculating metric combinations, and generating your high-fidelity narrative insight report...
          </p>
          <div style={{ height: "6px", width: "100%", background: "#F4F7FA", borderRadius: "99px", overflow: "hidden", position: "relative", marginTop: "2rem" }}>
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3.5, ease: "easeInOut" }}
              style={{ height: "100%", background: "#5BA4A4", borderRadius: "99px" }}
            />
          </div>
        </div>
      </main>
    );
  }

  // Render 24 Scenario List (Single Page Layout)
  if (workflowState === "taking_test") {
    return (
      <main style={{ minHeight: '100vh', padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', boxSizing: 'border-box' }}>
        {/* Background decoration */}
        <div className="tie-dot-grid fixed inset-0 pointer-events-none opacity-40" />

        {/* Header Panel */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#243B53' }} />
          
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#243B53', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
              Work Style Preferences Assessment
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#627D98', marginTop: '0.5rem', fontWeight: 500 }}>
              Select the response that best describes your typical behavior for each workplace scenario. All choices are securely auto-saved instantly.
            </p>
          </div>
        </div>

        {/* Sticky/Fixed Progress Bar */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '20px', padding: '1.25rem 1.75rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', position: 'sticky', top: '10px', zIndex: 10, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.95)' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Progress</span>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#243B53', marginTop: '2px' }}>
              {totalAnsweredCount} <span style={{ color: '#9aa8b6', fontSize: '0.875rem', fontWeight: 500 }}>/ 24 Answered</span>
            </div>
          </div>

          <div style={{ flex: 1, maxHeight: '8px', backgroundColor: '#F4F7FA', height: '8px', borderRadius: '99px', overflow: 'hidden', minWidth: '150px' }}>
            <div style={{ backgroundColor: '#5BA4A4', height: '100%', borderRadius: '99px', width: `${Math.round((totalAnsweredCount / 24) * 100)}%`, transition: 'width 0.4s ease' }} />
          </div>

          {isAllCompleted ? (
            <button
              onClick={handleCompleteTest}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.65rem 1.25rem',
                background: '#5BA4A4',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(91,164,164,0.2)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4a9393'}
              onMouseLeave={e => e.currentTarget.style.background = '#5BA4A4'}
            >
              <span>Continue to Reflection</span>
              <Send size={13} />
            </button>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#c0392b', fontWeight: 700 }}>
              ⚠️ Answer {24 - totalAnsweredCount} more to submit
            </span>
          )}
        </div>

        {/* 24 Question List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {questions.map((q, qIdx) => {
            const answerIndex = answers[q.question_id];
            return (
              <div 
                key={q.question_id}
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid rgba(36,59,83,0.08)', 
                  borderRadius: '24px', 
                  padding: '2rem', 
                  boxShadow: 'var(--shadow-card)', 
                  textAlign: 'left', 
                  position: 'relative', 
                  overflow: 'hidden',
                  transition: 'border-color 0.2s'
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: answerIndex !== undefined ? '#5BA4A4' : 'transparent' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '99px', background: '#F4F7FA', color: '#7B8794', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Scenario {qIdx + 1} of 24
                  </div>
                  {savingId === q.question_id && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#5BA4A4', fontWeight: 600 }}>
                      <Loader2 className="animate-spin" size={11} />
                      Saving...
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#243B53', lineHeight: 1.4, margin: '0 0 1.25rem 0' }}>
                  {q.question_text}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {q.shuffledOptions.map((opt, oIdx) => {
                    const isSelected = answerIndex === opt.originalIndex;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(q.question_id, opt.originalIndex)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.85rem 1.25rem',
                          borderRadius: '12px',
                          border: `1.5px solid ${isSelected ? '#5BA4A4' : 'rgba(36,59,83,0.1)'}`,
                          background: isSelected ? 'rgba(91,164,164,0.06)' : '#ffffff',
                          color: isSelected ? '#5BA4A4' : '#627D98',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = 'rgba(91,164,164,0.4)';
                            e.currentTarget.style.background = '#F8FAFC';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = 'rgba(36,59,83,0.1)';
                            e.currentTarget.style.background = '#ffffff';
                          }
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          fontWeight: 800,
                          background: isSelected ? '#5BA4A4' : '#F4F7FA',
                          color: isSelected ? '#ffffff' : '#9aa8b6',
                          flexShrink: 0
                        }}>
                          {isSelected ? '✓' : String.fromCharCode(65 + oIdx)}
                        </div>
                        <span style={{ lineHeight: 1.3 }}>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Submit Section */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#243B53', margin: 0 }}>Ready to Submit?</h3>
          <p style={{ fontSize: '0.8125rem', color: '#627D98', margin: 0, textAlign: 'center', maxWidth: '400px' }}>
            Please make sure you have answered all 24 scenarios. Your answers are auto-saved automatically.
          </p>

          <button
            onClick={handleCompleteTest}
            disabled={!isAllCompleted}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.85rem 2rem',
              background: isAllCompleted ? '#243B53' : '#bdc3c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: isAllCompleted ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: isAllCompleted ? '0 4px 6px -1px rgba(36,59,83,0.2)' : 'none'
            }}
            onMouseEnter={e => { if (isAllCompleted) e.currentTarget.style.background = '#1a2d40'; }}
            onMouseLeave={e => { if (isAllCompleted) e.currentTarget.style.background = '#243B53'; }}
          >
            <span>Submit Assessment</span>
            <Send size={14} />
          </button>

          {!isAllCompleted && (
            <span style={{ fontSize: '11px', color: '#c0392b', fontWeight: 700 }}>
              ⚠️ You must answer all 24 questions first ({totalAnsweredCount} answered so far).
            </span>
          )}
        </div>
      </main>
    );
  }

  // Render Post-Test Reflection Form
  if (workflowState === "taking_reflection") {
    const focusOptions = [
      { id: "collab", label: "Collaboration", desc: "Team communication & trust" },
      { id: "adapt", label: "Adaptability", desc: "Resilience under pressure" },
      { id: "growth", label: "Growth Style", desc: "Agility & initiative" }
    ];

    return (
      <main style={{ minHeight: '100vh', padding: '2rem 1.5rem', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', boxSizing: 'border-box' }}>
        {/* Background decoration */}
        <div className="tie-dot-grid fixed inset-0 pointer-events-none opacity-40" />

        {/* Header Panel */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#243B53' }} />
          
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '99px', background: '#F4F7FA', color: '#7B8794', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              <Brain size={11} style={{ color: '#5BA4A4' }} />
              Self-Reflection Feedback
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#243B53', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
              Self Reflection
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#627D98', marginTop: '0.5rem', fontWeight: 500 }}>
              Reflect on your assessment experience to align results with your preferred work behaviors.
            </p>
          </div>
        </div>

        {/* Reflection Card */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-card)', textAlign: 'left' }}>
          <form onSubmit={handleSubmitReflection} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Q1: Accuracy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 800, color: '#243B53' }}>
                1. How accurately do the scenarios align with your operational preference?
              </label>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '0.5rem 0' }}>
                {[1, 2, 3, 4, 5].map((rating) => {
                  const isSelected = accuracyRating === rating;
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setAccuracyRating(rating)}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1.5px solid ${isSelected ? '#5BA4A4' : 'rgba(36,59,83,0.1)'}`,
                        background: isSelected ? '#5BA4A4' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#243B53',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 4px 6px -1px rgba(91,164,164,0.3)' : 'none'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#5BA4A4';
                          e.currentTarget.style.background = '#F4F7FA';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(36,59,83,0.1)';
                          e.currentTarget.style.background = '#ffffff';
                        }
                      }}
                    >
                      {rating}
                    </button>
                  );
                })}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>Not Aligned</span>
                <span>Highly Accurate</span>
              </div>
            </div>

            {/* Q2: Focus Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 800, color: '#243B53' }}>
                2. Which dimension of team dynamics holds the highest value for you?
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {focusOptions.map((opt) => {
                  const isSelected = focusArea === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFocusArea(opt.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '1.25rem',
                        borderRadius: '16px',
                        border: `1.5px solid ${isSelected ? '#5BA4A4' : 'rgba(36,59,83,0.1)'}`,
                        background: isSelected ? 'rgba(91,164,164,0.06)' : '#ffffff',
                        color: isSelected ? '#5BA4A4' : '#627D98',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        position: 'relative',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(91,164,164,0.4)';
                          e.currentTarget.style.background = '#F8FAFC';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(36,59,83,0.1)';
                          e.currentTarget.style.background = '#ffffff';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#243B53' }}>{opt.label}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9aa8b6', fontWeight: 500 }}>{opt.desc}</span>
                      </div>
                      
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isSelected ? '#5BA4A4' : '#F4F7FA',
                        color: isSelected ? '#ffffff' : '#9aa8b6',
                        flexShrink: 0
                      }}>
                        {isSelected ? '✓' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q3: Comments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 800, color: '#243B53' }}>
                3. Additional observations or workspace insights (Optional)
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write comments or reflections..."
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '1px solid rgba(36,59,83,0.15)',
                  borderRadius: '16px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  outline: 'none',
                  color: '#243B53',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#5BA4A4'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(36,59,83,0.15)'}
              />
            </div>

            <button
              type="submit"
              disabled={!accuracyRating || !focusArea}
              style={{
                width: '100%',
                padding: '0.9rem',
                background: (!accuracyRating || !focusArea) ? '#bdc3c7' : '#5BA4A4',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: (!accuracyRating || !focusArea) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: (!accuracyRating || !focusArea) ? 'none' : '0 4px 6px -1px rgba(91,164,164,0.2)'
              }}
              onMouseEnter={e => { if (accuracyRating && focusArea) e.currentTarget.style.background = '#4a9393'; }}
              onMouseLeave={e => { if (accuracyRating && focusArea) e.currentTarget.style.background = '#5BA4A4'; }}
            >
              <span>Compile & Unlock Insights</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Render Report Viewer (Extraction Portal)
  if (workflowState === "viewing_report" && reportData) {
    return (
      <main className="min-h-screen w-full px-4 py-8 md:px-8 max-w-5xl mx-auto flex flex-col gap-6">
        <div className="tie-dot-grid fixed inset-0 pointer-events-none opacity-40" />

        {/* Dashboard Navigation headers if viewing other members' reports */}
        {targetUserId && targetUserId !== user?.id && (
          <div className="flex items-center gap-2 mb-2 bg-[#243B53] text-white px-4 py-2.5 rounded-xl border border-[#1a2d40] text-xs font-semibold justify-between shadow-sm">
            <span className="flex items-center gap-1">
              <FileText size={14} />
              Reviewing Workspace Member: {reportTargetProfile?.first_name} {reportTargetProfile?.last_name}
            </span>
            <button 
              onClick={() => router.back()}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-bold"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        <ReportViewer
          reportMarkdown={reportData.report_markdown}
          scoringMetrics={reportData.scoring_metrics}
          employeeName={`${reportTargetProfile?.first_name || ""} ${reportTargetProfile?.last_name || ""}`.trim() || "Employee"}
          designation={reportTargetProfile?.designation}
          experienceYears={String(reportTargetProfile?.experience_years || 0)}
          department={(team_slug as string) === "none" ? "Corporate" : (team_slug as string)}
        />
      </main>
    );
  }

  return null;
}
