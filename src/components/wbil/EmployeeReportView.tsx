'use client';

import React, { useState } from 'react';
import { Download, Sparkles, User, Briefcase, Building, ShieldAlert, CheckCircle2, Target, BookOpen, Layers } from 'lucide-react';
import { EmployeeReportJSON } from '@/types/wbil';
import { exportEmployeeReportPdf } from '@/lib/wbilPdfExporter';

interface EmployeeReportViewProps {
  reportId: string;
  employeeProfile: {
    name: string;
    designation: string;
    department: string;
    experience: number;
    organisation: string;
  };
  reportData: EmployeeReportJSON;
  isManager?: boolean;
  onOpenActionPlanModal?: () => void;
}

export const EmployeeReportView: React.FC<EmployeeReportViewProps> = ({
  reportId,
  employeeProfile,
  reportData,
  isManager = true,
  onOpenActionPlanModal
}) => {
  const [activeTab, setActiveTab] = useState<'coaching' | 'communication'>('coaching');
  const [isExporting, setIsExporting] = useState(false);

  const {
    executive_summary,
    behaviour_profile,
    workplace_value,
    performance_enablers,
    performance_risks,
    manager_guide,
    development_priorities,
    metadata
  } = reportData;

  const handlePdfDownload = async () => {
    setIsExporting(true);
    try {
      await exportEmployeeReportPdf(employeeProfile.name, 'employee-report-container');
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 font-sans space-y-8 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen">
      {/* ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
            TIE Employee Behavioral Intelligence Report
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Version {metadata?.prompt_version || 'v1.0'}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePdfDownload}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
          {isManager && onOpenActionPlanModal && (
            <button
              onClick={onOpenActionPlanModal}
              className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-indigo-500/25"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate 30-Day Action Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* CONTAINER FOR PDF EXPORT */}
      <div id="employee-report-container" className="space-y-8 bg-slate-50 dark:bg-slate-900 p-2 md:p-6 rounded-3xl">
        {/* HEADER / PROFILE SUMMARY CARD */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-500/20">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-extrabold tracking-tight">{employeeProfile.name}</h1>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold rounded-full">
                  Active Profile
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  {employeeProfile.designation}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-indigo-400" />
                  {employeeProfile.department} ({employeeProfile.organisation})
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-400" />
                  {employeeProfile.experience} Yrs Experience
                </span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-right">
              <div className="text-xs text-indigo-200 uppercase tracking-widest font-bold">Dominant Work Style</div>
              <div className="text-xl font-bold text-amber-300 mt-1">
                {behaviour_profile?.primary_pattern} / {behaviour_profile?.secondary_pattern}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Calculated via TIE Assessment Matrix
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: EXECUTIVE SUMMARY */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Executive Summary</h2>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
            {executive_summary?.overview}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Key Workplace Strengths
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {executive_summary?.key_strengths_summary}
              </p>
            </div>

            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                Growth Opportunities
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {executive_summary?.growth_areas_summary}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: BEHAVIOUR PROFILE VIEW */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Behaviour Profile & Pattern Interplay</h2>
          </div>
          
          <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                Pattern Combination: {behaviour_profile?.primary_pattern} + {behaviour_profile?.secondary_pattern}
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {behaviour_profile?.pattern_description}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Core Operating Values</h3>
            <div className="flex flex-wrap gap-2">
              {behaviour_profile?.core_values?.map((val, idx) => (
                <span key={idx} className="px-3.5 py-1.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800">
                  {val}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: WORKPLACE VALUE GRID */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Building className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Workplace Value & Contributions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Team Value Contribution</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {workplace_value?.team_impact}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Organizational Alignment</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {workplace_value?.organizational_alignment}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 4 & 5: ENABLERS & RISKS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* SECTION 4: PERFORMANCE ENABLERS */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Performance Enablers</h2>
            </div>
            <ul className="space-y-3">
              {performance_enablers?.enablers?.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="w-2 h-2 mt-2 bg-emerald-500 rounded-full flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION 5: PERFORMANCE RISKS */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Performance Watch-outs</h2>
            </div>
            <ul className="space-y-3">
              {performance_risks?.risks?.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="w-2 h-2 mt-2 bg-amber-500 rounded-full flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SECTION 6: MANAGER GUIDE PLAYBOOK */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. Manager Coaching Guide</h2>
          </div>

          <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('coaching')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'coaching'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Coaching Recommendations
            </button>
            <button
              onClick={() => setActiveTab('communication')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'communication'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Communication Strategies
            </button>
          </div>

          <div className="pt-2">
            {activeTab === 'coaching' && (
              <ul className="space-y-3">
                {manager_guide?.coaching_tips?.map((tip, idx) => (
                  <li key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-sm text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                    {tip}
                  </li>
                ))}
              </ul>
            )}
            {activeTab === 'communication' && (
              <ul className="space-y-3">
                {manager_guide?.communication_strategies?.map((strat, idx) => (
                  <li key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-sm text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                    {strat}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* SECTION 7: PRIORITY DEVELOPMENT AREAS (EXACTLY 3 CARDS) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">7. Development Priorities (Top 3)</h2>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 rounded-full">
              Targeted WBIL Modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {development_priorities?.slice(0, 3).map((prio, idx) => (
              <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 flex items-center justify-center bg-indigo-600 text-white font-bold text-xs rounded-full">
                      #{prio.priority_number || idx + 1}
                    </span>
                    <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold rounded-md">
                      {prio.behaviour_id}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {prio.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {prio.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Business Rationale</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    {prio.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 8: METADATA FOOTER */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <div>TIE Workplace Behaviour Intelligence Engine • Prompt Version {metadata?.prompt_version || 'v1.0'}</div>
          <div>Generated At: {metadata?.generated_at ? new Date(metadata.generated_at).toLocaleString() : 'N/A'}</div>
        </div>

      </div>
    </div>
  );
};
