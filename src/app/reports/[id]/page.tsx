'use client';

import React, { useEffect, useState, use } from 'react';
import { EmployeeReportView } from '@/components/wbil/EmployeeReportView';
import { ActionPlanGeneratorModal } from '@/components/wbil/ActionPlanGeneratorModal';
import { ActionPlanView } from '@/components/wbil/ActionPlanView';
import { EmployeeReportJSON, ActionPlanJSON } from '@/types/wbil';
import { Loader2, AlertCircle } from 'lucide-react';

export default function EmployeeReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const assessmentId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportData, setReportData] = useState<EmployeeReportJSON | null>(null);
  const [reportId, setReportId] = useState<string>(assessmentId);
  const [employeeProfile, setEmployeeProfile] = useState({
    name: 'Employee Profile',
    designation: 'Professional',
    department: 'Team',
    experience: 5,
    organisation: 'Organization'
  });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [generatedActionPlan, setGeneratedActionPlan] = useState<{
    id: string;
    data: ActionPlanJSON;
  } | null>(null);

  useEffect(() => {
    async function fetchReport() {
      setIsLoading(true);
      setErrorMsg(null);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const cleanApiUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

      try {
        const response = await fetch(`${cleanApiUrl}/api/v1/reports/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assessment_id: assessmentId }),
        });


        if (!response.ok) {
          const errRes = await response.json().catch(() => ({}));
          throw new Error(errRes.detail?.message || errRes.detail || errRes.message || 'Failed to load report.');
        }

        const result = await response.json();
        if (result.status === 'SUCCESS' && result.data) {
          setReportData(result.data);
          if (result.report_id) {
            setReportId(result.report_id);
          }
        } else {
          throw new Error('Report format error.');
        }
      } catch (err: any) {
        console.error("Fetch report error:", err);
        setErrorMsg(err.message || 'Error loading employee report.');
      } finally {
        setIsLoading(false);
      }
    }

    if (assessmentId) {
      fetchReport();
    }
  }, [assessmentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-lg font-bold">Loading Employee Behavioral Report...</h2>
        <p className="text-xs text-slate-400 mt-1">Retrieving assessment metrics & WBIL intelligence</p>
      </div>
    );
  }

  if (errorMsg || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md w-full p-6 bg-slate-800 border border-slate-700 rounded-3xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Report Unavailable</h2>
          <p className="text-xs text-slate-300">{errorMsg || 'Could not load report data.'}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6">
      {generatedActionPlan ? (
        <ActionPlanView
          actionPlanId={generatedActionPlan.id}
          employeeName={employeeProfile.name}
          actionPlanData={generatedActionPlan.data}
          onBackToReport={() => setGeneratedActionPlan(null)}
        />
      ) : (
        <>
          <EmployeeReportView
            reportId={reportId}
            employeeProfile={employeeProfile}
            reportData={reportData}
            isManager={true}
            onOpenActionPlanModal={() => setIsModalOpen(true)}
          />

          <ActionPlanGeneratorModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            reportId={reportId}
            developmentPriorities={reportData.development_priorities || []}
            onActionPlanGenerated={(planData, planId) => {
              setGeneratedActionPlan({ id: planId, data: planData });
            }}
          />
        </>
      )}
    </main>
  );
}
