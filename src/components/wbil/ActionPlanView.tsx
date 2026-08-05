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
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 font-sans space-y-8 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen">
      {/* ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          {onBackToReport && (
            <button
              onClick={onBackToReport}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-xl transition-all"
              title="Back to Employee Report"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
            30-Day Behavioral Action Plan
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            For {employeeName}
          </span>
        </div>

        <button
          onClick={handlePdfDownload}
          disabled={isExporting}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-indigo-500/25 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating PDF...' : 'Download Plan PDF'}</span>
        </button>
      </div>

      {/* CONTAINER FOR PDF EXPORT */}
      <div id="action-plan-container" className="space-y-8 bg-slate-50 dark:bg-slate-900 p-2 md:p-6 rounded-3xl">
        {/* ACTION PLAN BANNER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-500/20">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-3 py-1 bg-indigo-500/30 text-indigo-300 text-xs font-mono font-bold rounded-md border border-indigo-400/30">
                {selected_behaviour?.id}: {selected_behaviour?.name}
              </span>
              <span className="text-xs text-slate-400">
                Status: ACTIVE (30-Day Execution Cycle)
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                30-Day Target Outcome Goal
              </h1>
              <p className="text-base text-indigo-200 leading-relaxed max-w-3xl">
                {outcome_30_day}
              </p>
            </div>
          </div>
        </div>

        {/* REASON FOR SELECTION CALLOUT */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>Reason for Selection & Alignment Rationale</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {reason_for_selection}
          </p>
        </div>

        {/* COMMITMENTS SIDE-BY-SIDE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* EMPLOYEE COMMITMENTS */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Employee Action Commitments</h2>
            </div>
            <ul className="space-y-3">
              {employee_commitments?.map((item, idx) => (
                <li key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-sm text-slate-700 dark:text-slate-300 flex items-start space-x-3">
                  <span className="w-5 h-5 flex items-center justify-center bg-indigo-600 text-white font-bold text-xs rounded-full flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* MANAGER COMMITMENTS */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Manager Coaching Support</h2>
            </div>
            <ul className="space-y-3">
              {manager_commitments?.map((item, idx) => (
                <li key={idx} className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-sm text-slate-700 dark:text-slate-300 flex items-start space-x-3">
                  <span className="w-5 h-5 flex items-center justify-center bg-emerald-600 text-white font-bold text-xs rounded-full flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4-WEEK JOURNEY TIMELINE */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">4-Week Execution Breakdown</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* WEEK 1 */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-600 uppercase">Week 1</span>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 px-2 py-0.5 rounded font-semibold">Awareness</span>
              </div>
              <ul className="space-y-2">
                {weekly_breakdown?.week_1?.map((step, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start space-x-1.5">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* WEEK 2 */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-600 uppercase">Week 2</span>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 px-2 py-0.5 rounded font-semibold">Guided Practice</span>
              </div>
              <ul className="space-y-2">
                {weekly_breakdown?.week_2?.map((step, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start space-x-1.5">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* WEEK 3 */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-600 uppercase">Week 3</span>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 px-2 py-0.5 rounded font-semibold">Integration</span>
              </div>
              <ul className="space-y-2">
                {weekly_breakdown?.week_3?.map((step, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start space-x-1.5">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* WEEK 4 */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-600 uppercase">Week 4</span>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 px-2 py-0.5 rounded font-semibold">Reinforcement</span>
              </div>
              <ul className="space-y-2">
                {weekly_breakdown?.week_4?.map((step, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start space-x-1.5">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* SUCCESS MEASURES & REVIEW CHECKPOINTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SUCCESS MEASURES */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              Success Indicators
            </h3>
            <ul className="space-y-2">
              {success_measures?.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* DAY 15 REVIEW */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              Day 15 Mid-Point Review
            </h3>
            <ul className="space-y-2">
              {day_15_review?.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-2">
                  <span className="text-indigo-500 font-bold">?</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* DAY 30 REVIEW */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-600" />
              Day 30 Final Evaluation
            </h3>
            <ul className="space-y-2">
              {day_30_review?.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">★</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
