'use client';

import React, { useState } from 'react';
import { Download, Target, Calendar, UserCheck, ShieldCheck, CheckSquare, HelpCircle, ArrowLeft } from 'lucide-react';
import { ActionPlanJSON } from '@/types/wbil';
import { exportActionPlanPdf } from '@/lib/wbilPdfExporter';

interface ActionPlanViewProps {
  actionPlanId?: string;
  employeeName: string;
  actionPlanData: ActionPlanJSON;
  onBackToReport?: () => void;
}

export const ActionPlanView: React.FC<ActionPlanViewProps> = ({
  actionPlanId,
  employeeName,
  actionPlanData,
  onBackToReport
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const {
    selected_behaviour,
    reason_for_selection,
    outcome_30_day,
    employee_commitments,
    manager_commitments,
    weekly_breakdown,
    success_measures,
    day_15_review,
    day_30_review
  } = actionPlanData;

  const handlePdfDownload = async () => {
    setIsExporting(true);
    try {
      await exportActionPlanPdf(employeeName, selected_behaviour?.id || 'WBIL', 'action-plan-container');
    } catch (err) {
      console.error("Action Plan PDF generation error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div 
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#FFFFFF',
        color: '#243B53',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        boxSizing: 'border-box'
      }}
    >
      {/* ACTION BAR */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.5rem',
          backgroundColor: '#F8FAFC',
          borderRadius: '16px',
          border: '1px solid #E2E8F0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBackToReport && (
            <button
              onClick={onBackToReport}
              style={{
                padding: '8px 12px',
                color: '#627D98',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600
              }}
              title="Back to Employee Report"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}
          <span 
            style={{
              padding: '4px 12px',
              backgroundColor: 'rgba(91, 164, 164, 0.12)',
              color: '#5BA4A4',
              fontSize: '0.75rem',
              fontWeight: 800,
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            30-Day Executive Action Plan
          </span>
          <span style={{ fontSize: '0.8125rem', color: '#627D98', fontWeight: 600 }}>
            Employee: <strong style={{ color: '#243B53' }}>{employeeName}</strong>
          </span>
        </div>

        <button
          onClick={handlePdfDownload}
          disabled={isExporting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.625rem 1.25rem',
            backgroundColor: '#5BA4A4',
            color: '#FFFFFF',
            fontSize: '0.875rem',
            fontWeight: 700,
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 10px -2px rgba(91, 164, 164, 0.3)',
            opacity: isExporting ? 0.6 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4A9393'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#5BA4A4'}
        >
          <Download size={16} />
          <span>{isExporting ? 'Generating PDF...' : 'Download Plan PDF'}</span>
        </button>
      </div>

      {/* CONTAINER FOR PDF EXPORT */}
      <div 
        id="action-plan-container" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          backgroundColor: '#FFFFFF'
        }}
      >
        {/* HERO BANNER */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #102A43 0%, #243B53 100%)',
            color: '#FFFFFF',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(36, 59, 83, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span 
              style={{
                padding: '6px 14px',
                backgroundColor: 'rgba(91, 164, 164, 0.25)',
                color: '#81E6D9',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                borderRadius: '8px',
                border: '1px solid rgba(129, 230, 217, 0.3)'
              }}
            >
              {selected_behaviour?.id}: {selected_behaviour?.name}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#9FB3C8', fontWeight: 600 }}>
              Status: <strong style={{ color: '#3EBD93' }}>ACTIVE (30-Day Execution Cycle)</strong>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              30-Day Target Outcome Goal
            </h1>
            <p style={{ margin: 0, fontSize: '1rem', color: '#F0F4F8', lineHeight: 1.6, maxWidth: '900px' }}>
              {outcome_30_day}
            </p>
          </div>
        </div>

        {/* REASON FOR SELECTION CALLOUT */}
        <div 
          style={{
            padding: '1.5rem',
            backgroundColor: '#F8FAFC',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5BA4A4', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Target size={16} />
            <span>Reason for Selection & Alignment Rationale</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#243B53', lineHeight: 1.6, fontWeight: 500 }}>
            {reason_for_selection}
          </p>
        </div>

        {/* COMMITMENTS SIDE-BY-SIDE GRID */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {/* EMPLOYEE COMMITMENTS */}
          <div 
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9' }}>
              <div 
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(91, 164, 164, 0.12)',
                  color: '#5BA4A4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <UserCheck size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#243B53' }}>
                Employee Action Commitments
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {employee_commitments?.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{
                    padding: '1rem',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.875rem',
                    color: '#243B53',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '12px',
                    lineHeight: 1.5
                  }}
                >
                  <span 
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#5BA4A4',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MANAGER COMMITMENTS */}
          <div 
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9' }}>
              <div 
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(5, 150, 105, 0.12)',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#243B53' }}>
                Manager Coaching Support
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {manager_commitments?.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{
                    padding: '1rem',
                    backgroundColor: '#F0FDF4',
                    borderRadius: '12px',
                    border: '1px solid #BBF7D0',
                    fontSize: '0.875rem',
                    color: '#14532D',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '12px',
                    lineHeight: 1.5
                  }}
                >
                  <span 
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4-WEEK JOURNEY TIMELINE */}
        <div 
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9' }}>
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(91, 164, 164, 0.12)',
                color: '#5BA4A4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Calendar size={20} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#243B53' }}>
              4-Week Execution Breakdown
            </h2>
          </div>

          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem'
            }}
          >
            {/* WEEK 1 */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#5BA4A4', textTransform: 'uppercase' }}>Week 1</span>
                <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(91, 164, 164, 0.15)', color: '#2C6E6E', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>Awareness</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {weekly_breakdown?.week_1?.map((step, idx) => (
                  <div key={idx} style={{ fontSize: '0.8125rem', color: '#243B53', lineHeight: 1.5, display: 'flex', alignItems: 'start', gap: '6px' }}>
                    <span style={{ color: '#5BA4A4', fontWeight: 800 }}>•</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* WEEK 2 */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#5BA4A4', textTransform: 'uppercase' }}>Week 2</span>
                <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(91, 164, 164, 0.15)', color: '#2C6E6E', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>Guided Practice</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {weekly_breakdown?.week_2?.map((step, idx) => (
                  <div key={idx} style={{ fontSize: '0.8125rem', color: '#243B53', lineHeight: 1.5, display: 'flex', alignItems: 'start', gap: '6px' }}>
                    <span style={{ color: '#5BA4A4', fontWeight: 800 }}>•</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* WEEK 3 */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#5BA4A4', textTransform: 'uppercase' }}>Week 3</span>
                <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(91, 164, 164, 0.15)', color: '#2C6E6E', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>Integration</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {weekly_breakdown?.week_3?.map((step, idx) => (
                  <div key={idx} style={{ fontSize: '0.8125rem', color: '#243B53', lineHeight: 1.5, display: 'flex', alignItems: 'start', gap: '6px' }}>
                    <span style={{ color: '#5BA4A4', fontWeight: 800 }}>•</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* WEEK 4 */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#5BA4A4', textTransform: 'uppercase' }}>Week 4</span>
                <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(91, 164, 164, 0.15)', color: '#2C6E6E', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>Reinforcement</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {weekly_breakdown?.week_4?.map((step, idx) => (
                  <div key={idx} style={{ fontSize: '0.8125rem', color: '#243B53', lineHeight: 1.5, display: 'flex', alignItems: 'start', gap: '6px' }}>
                    <span style={{ color: '#5BA4A4', fontWeight: 800 }}>•</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SUCCESS MEASURES & REVIEW CHECKPOINTS */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            breakInside: 'avoid',
            pageBreakInside: 'avoid'
          }}
        >
          {/* SUCCESS MEASURES */}
          <div style={{ backgroundColor: '#F0FDF4', borderRadius: '16px', border: '1px solid #BBF7D0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#14532D', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={18} style={{ color: '#059669' }} />
              Success Indicators
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {success_measures?.map((item, idx) => (
                <div key={idx} style={{ fontSize: '0.8125rem', color: '#166534', lineHeight: 1.5, display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DAY 15 REVIEW */}
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #CBD5E1', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#243B53', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} style={{ color: '#5BA4A4' }} />
              Day 15 Mid-Point Review
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {day_15_review?.map((item, idx) => (
                <div key={idx} style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.5, display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <span style={{ color: '#5BA4A4', fontWeight: 800 }}>?</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DAY 30 REVIEW */}
          <div style={{ backgroundColor: '#FFFBEB', borderRadius: '16px', border: '1px solid #FDE68A', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#78350F', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} style={{ color: '#D97706' }} />
              Day 30 Final Evaluation
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {day_30_review?.map((item, idx) => (
                <div key={idx} style={{ fontSize: '0.8125rem', color: '#92400E', lineHeight: 1.5, display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <span style={{ color: '#D97706', fontWeight: 800 }}>★</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
