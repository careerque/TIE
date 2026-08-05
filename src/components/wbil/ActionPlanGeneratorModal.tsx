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

    // Simulated progress steps for user feedback
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await fetch('/api/v1/action-plans/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_id: reportId,
          manager_priority: managerPriority || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Generate 30-Day Action Plan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tailor development focus with manager context
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOADING OVERLAY */}
        {isLoading ? (
          <div className="p-8 space-y-6 text-center">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Building Personalized 30-Day Action Plan</span>
              </div>

              <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                <div className={`flex items-center space-x-2 ${loadingStep >= 1 ? 'text-indigo-600 font-bold' : 'opacity-40'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. Analyzing Report Priorities...</span>
                </div>
                <div className={`flex items-center space-x-2 ${loadingStep >= 2 ? 'text-indigo-600 font-bold' : 'opacity-40'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>2. Matching Target WBIL Module...</span>
                </div>
                <div className={`flex items-center space-x-2 ${loadingStep >= 3 ? 'text-indigo-600 font-bold' : 'opacity-40'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>3. Building 4-Week Transition Commitments...</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* FORM CONTENT */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-2xl flex items-start space-x-3 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* FORM FIELD 1: PRIORITY SELECTOR */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                1. Select Target Development Priority
              </label>
              <select
                value={selectedPriorityId}
                onChange={(e) => setSelectedPriorityId(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {developmentPriorities.map((prio) => (
                  <option key={prio.behaviour_id} value={prio.behaviour_id}>
                    #{prio.priority_number} [{prio.behaviour_id}] - {prio.title}
                  </option>
                ))}
              </select>
            </div>

            {/* FORM FIELD 2: MANAGER PRIORITY */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                2. Manager Operational Focus (Optional)
              </label>
              <input
                type="text"
                value={managerPriority}
                onChange={(e) => setManagerPriority(e.target.value)}
                placeholder="e.g., Improve proactive milestone communication"
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* FORM FIELD 3: WORKPLACE CONTEXT */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                3. Current Workplace Context (Optional)
              </label>
              <textarea
                value={workplaceContext}
                onChange={(e) => setWorkplaceContext(e.target.value)}
                rows={3}
                placeholder="e.g., Leading Q3 cloud infrastructure migration with tight deliverables..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-indigo-500/25 transition-all"
              >
                <Target className="w-4 h-4" />
                <span>Generate Plan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
