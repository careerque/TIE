'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Loader2, Target, CheckCircle2, Zap } from 'lucide-react';
import { DevelopmentPriority, ActionPlanJSON } from '@/types/wbil';

const ACTION_PLAN_STAGES = [
  { threshold: 24, label: "Analyzing Report Priorities & Diagnostics...", tag: "Diagnostics" },
  { threshold: 48, label: "Querying WBIL Behavioral Modules & Pedagogies...", tag: "WBIL Modules" },
  { threshold: 72, label: "Synthesizing 4-Week Milestone Objectives...", tag: "Milestones" },
  { threshold: 92, label: "Calibrating Habit Commitments & Measurement Criteria...", tag: "Commitments" },
  { threshold: 98, label: "Assembling Final Executive Coaching Plan...", tag: "Assembly" }
];

interface ActionPlanGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  developmentPriorities: DevelopmentPriority[];
  onActionPlanGenerated: (actionPlanData: ActionPlanJSON, actionPlanId: string) => void;
}

export const ActionPlanGeneratorModal: React.FC<ActionPlanGeneratorModalProps> = ({
  isOpen,
  onClose,
  reportId,
  developmentPriorities = [],
  onActionPlanGenerated
}) => {
  const [selectedPriorityId, setSelectedPriorityId] = useState<string>(
    developmentPriorities[0]?.behaviour_id || 'WB-001'
  );
  const [managerPriority, setManagerPriority] = useState<string>('');
  const [workplaceContext, setWorkplaceContext] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(14);
  const [loadingStep, setLoadingStep] = useState<number>(1);
  const [showLiveInsights, setShowLiveInsights] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (developmentPriorities && developmentPriorities.length > 0) {
      if (!selectedPriorityId || selectedPriorityId === 'WB-001') {
        setSelectedPriorityId(developmentPriorities[0].behaviour_id);
      }
    }
  }, [developmentPriorities]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setProgress(14);
    setLoadingStep(1);

    // Combine selected dropdown priority + custom manager priority text
    let combinedPriority = "";
    if (selectedPriorityId === 'CUSTOM') {
      combinedPriority = managerPriority ? managerPriority.trim() : "Custom Growth Focus";
    } else {
      const selectedPrioObj = developmentPriorities.find(p => p.behaviour_id === selectedPriorityId);
      combinedPriority = selectedPrioObj 
        ? `[${selectedPrioObj.behaviour_id}] ${selectedPrioObj.title}` 
        : selectedPriorityId;
      if (managerPriority && managerPriority.trim()) {
        combinedPriority += ` - ${managerPriority.trim()}`;
      }
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const cleanApiUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

    // Progressive percentage counter that smoothly advances during LLM generation
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) {
          return Math.min(prev + 0.25, 97);
        }
        const jump = Math.floor(Math.random() * 6) + 3;
        const next = Math.min(prev + jump, 95);
        if (next >= 90) setLoadingStep(5);
        else if (next >= 70) setLoadingStep(4);
        else if (next >= 48) setLoadingStep(3);
        else if (next >= 24) setLoadingStep(2);
        return next;
      });
    }, 280);

    try {
      const response = await fetch(`${cleanApiUrl}/api/v1/action-plans/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_id: reportId,
          manager_priority: combinedPriority || undefined,
          workplace_context: workplaceContext || undefined,
        }),
      });

      clearInterval(progressTimer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to generate Action Plan.');
      }

      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setProgress(100);
        onActionPlanGenerated(result.data, result.action_plan_id);
        onClose();
      } else {
        throw new Error('Unexpected response format from server.');
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setErrorMsg(err.message || 'An unexpected error occurred during Action Plan generation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        zIndex: 99999
      }}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
        style={{
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: '560px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
      >
        {/* MODAL HEADER */}
        <div 
          className="flex items-center justify-between p-6 bg-slate-50 border-b border-slate-100"
          style={{
            backgroundColor: '#F8FAFC',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(91, 164, 164, 0.12)',
                color: '#5BA4A4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Sparkles size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#243B53' }}>
                Generate 30-Day Action Plan
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#627D98', fontWeight: 500 }}>
                Tailor a 4-week executive coaching plan for this employee
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '8px',
              color: '#94A3B8',
              borderRadius: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#243B53'}
            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
          >
            <X size={20} />
          </button>
        </div>

        {/* LOADING OVERLAY */}
        {isLoading ? (
          <div style={{ padding: '2.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Top progress and percentage row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#5BA4A4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AI Coaching Engine Active
                </span>
                <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#243B53', margin: '2px 0 0 0' }}>
                  Synthesizing 30-Day Action Plan...
                </h4>
              </div>
              <span style={{ fontSize: '2.25rem', fontWeight: 900, color: '#243B53', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(progress)}<span style={{ fontSize: '1.25rem', color: '#5BA4A4', fontWeight: 700 }}>%</span>
              </span>
            </div>

            {/* Glowing progress bar */}
            <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #5BA4A4 0%, #243B53 100%)',
                  borderRadius: '99px',
                  transition: 'width 0.25s ease-out',
                  boxShadow: '0 0 12px rgba(91,164,164,0.45)'
                }}
              />
            </div>

            {/* Stage items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              {ACTION_PLAN_STAGES.map((st, i) => {
                const isPassed = progress >= st.threshold;
                const isCurrent = (progress < st.threshold) && (i === 0 || progress >= ACTION_PLAN_STAGES[i - 1].threshold);

                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2
                        size={16}
                        style={{
                          color: isPassed ? '#2E7D32' : isCurrent ? '#5BA4A4' : '#CBD5E1',
                          flexShrink: 0,
                          transition: 'color 0.2s'
                        }}
                      />
                      <span style={{ fontWeight: isPassed || isCurrent ? 700 : 500, color: isPassed ? '#243B53' : isCurrent ? '#5BA4A4' : '#94A3B8' }}>
                        {st.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: isPassed ? 'rgba(46,125,50,0.1)' : isCurrent ? 'rgba(91,164,164,0.1)' : '#E2E8F0', color: isPassed ? '#2E7D32' : isCurrent ? '#5BA4A4' : '#94A3B8', textTransform: 'uppercase' }}>
                      {isPassed ? 'Complete' : isCurrent ? 'Active' : 'Queued'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#9aa8b6', fontSize: '11px', fontStyle: 'italic' }}>
              <Sparkles size={12} style={{ color: '#5BA4A4' }} />
              <span>Tailoring custom developmental milestones based on psychological assessment scores...</span>
            </div>

          </div>
        ) : (
          /* FORM CONTENT */
          <form onSubmit={handleSubmit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
            {errorMsg && (
              <div 
                style={{
                  padding: '1rem',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '10px',
                  color: '#991B1B',
                  fontSize: '0.8125rem'
                }}
              >
                <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* FORM FIELD 1: PRIORITY SELECTOR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#243B53' }}>
                1. Select Target Growth Priority
              </label>
              <select
                value={selectedPriorityId}
                onChange={(e) => setSelectedPriorityId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#243B53',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#5BA4A4'}
                onBlur={e => e.currentTarget.style.borderColor = '#CBD5E1'}
              >
                {developmentPriorities.map((prio) => (
                  <option key={prio.behaviour_id} value={prio.behaviour_id}>
                    #{prio.priority_number} [{prio.behaviour_id}] - {prio.title}
                  </option>
                ))}
                <option value="CUSTOM">
                  #4 [CUSTOM] - Custom Focus (Defined in Field 2 Below)
                </option>
              </select>
            </div>

            {/* FORM FIELD 2: MANAGER PRIORITY */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#243B53' }}>
                2. Manager Operational Focus (Optional)
              </label>
              <input
                type="text"
                value={managerPriority}
                onChange={(e) => setManagerPriority(e.target.value)}
                placeholder="e.g., Lead Q3 migration sprint smoothly with proactive milestone updates"
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#243B53',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#5BA4A4'}
                onBlur={e => e.currentTarget.style.borderColor = '#CBD5E1'}
              />
            </div>

            {/* FORM FIELD 3: WORKPLACE CONTEXT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#243B53' }}>
                3. Current Project / Team Context (Optional)
              </label>
              <textarea
                value={workplaceContext}
                onChange={(e) => setWorkplaceContext(e.target.value)}
                rows={3}
                placeholder="e.g., Leading microservices delivery with tight cross-team dependencies..."
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#243B53',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#5BA4A4'}
                onBlur={e => e.currentTarget.style.borderColor = '#CBD5E1'}
              />
            </div>

            {/* MODAL ACTIONS */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '1.25rem',
                borderTop: '1px solid #E2E8F0',
                marginTop: '0.5rem'
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#F1F5F9',
                  color: '#627D98',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E2E8F0'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#5BA4A4',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px -2px rgba(91, 164, 164, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4A9393'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#5BA4A4'}
              >
                <Target size={16} />
                <span>Generate 30-Day Plan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
