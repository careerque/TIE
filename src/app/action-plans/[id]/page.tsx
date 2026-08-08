'use client';

import React, { useEffect, useState, use } from 'react';
import { ActionPlanView } from '@/components/wbil/ActionPlanView';
import { ActionPlanJSON } from '@/types/wbil';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ActionPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const actionPlanId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionPlanData, setActionPlanData] = useState<ActionPlanJSON | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('Employee');

  useEffect(() => {
    async function fetchActionPlan() {
      setIsLoading(true);
      setErrorMsg(null);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const cleanApiUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

      try {
        // Generate or fetch plan
        const response = await fetch(`${cleanApiUrl}/api/v1/action-plans/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_id: actionPlanId }),
        });


        if (!response.ok) {
          const errRes = await response.json().catch(() => ({}));
          throw new Error(errRes.detail || errRes.message || 'Failed to load Action Plan.');
        }

        const result = await response.json();
        if (result.status === 'SUCCESS' && result.data) {
          setActionPlanData(result.data);
        } else {
          throw new Error('Action Plan data format error.');
        }
      } catch (err: any) {
        console.error("Fetch action plan error:", err);
        setErrorMsg(err.message || 'Error loading Action Plan.');
      } finally {
        setIsLoading(false);
      }
    }

    if (actionPlanId) {
      fetchActionPlan();
    }
  }, [actionPlanId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-lg font-bold">Loading 30-Day Action Plan...</h2>
        <p className="text-xs text-slate-400 mt-1">Fetching weekly breakdown & commitments</p>
      </div>
    );
  }

  if (errorMsg || !actionPlanData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md w-full p-6 bg-slate-800 border border-slate-700 rounded-3xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Action Plan Unavailable</h2>
          <p className="text-xs text-slate-300">{errorMsg || 'Could not load action plan data.'}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6">
      <ActionPlanView
        actionPlanId={actionPlanId}
        employeeName={employeeName}
        actionPlanData={actionPlanData}
      />
    </main>
  );
}
