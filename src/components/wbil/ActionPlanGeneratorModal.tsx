'use client';

import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Loader2, Target, CheckCircle2 } from 'lucide-react';
import { DevelopmentPriority, ActionPlanJSON } from '@/types/wbil';

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
  const [loadingStep, setLoadingStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
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

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

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

      clearInterval(stepInterval);


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to generate Action Plan.');
      }

      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        onActionPlanGenerated(result.data, result.action_plan_id);
        onClose();
      } else {
        throw new Error('Unexpected response format from server.');
      }
    } catch (err: any) {
      clearInterval(stepInterval);
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
          <div style={{ padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 className="animate-spin" size={48} style={{ color: '#5BA4A4' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '320px' }}>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#243B53' }}>
                Building Tailored 30-Day Action Plan...
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', fontWeight: loadingStep >= 1 ? 700 : 500, color: loadingStep >= 1 ? '#5BA4A4' : '#94A3B8' }}>
                  <CheckCircle2 size={16} />
                  <span>1. Analyzing Report Priorities...</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', fontWeight: loadingStep >= 2 ? 700 : 500, color: loadingStep >= 2 ? '#5BA4A4' : '#94A3B8' }}>
                  <CheckCircle2 size={16} />
                  <span>2. Matching Target WBIL Behavior Module...</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', fontWeight: loadingStep >= 3 ? 700 : 500, color: loadingStep >= 3 ? '#5BA4A4' : '#94A3B8' }}>
                  <CheckCircle2 size={16} />
                  <span>3. Structuring 4-Week Commitments...</span>
                </div>
              </div>
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
