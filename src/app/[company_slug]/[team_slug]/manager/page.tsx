"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { supabasedb } from "@/lib/supabaseClient";
import { 
  GitMerge, 
  Users, 
  CheckCircle, 
  FileText, 
  Briefcase, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  TrendingUp,
  Percent,
  Shield,
  Activity,
  Zap,
  LayoutGrid,
  X,
  Building2,
  Mail,
  User,
  Upload,
  Database,
  FileSpreadsheet,
  UserPlus,
  AlertCircle,
  Target,
  Copy
} from "lucide-react";
import Link from "next/link";
import ReportViewer from "@/components/ReportViewer";
import InteractiveDashboardLoader from "@/components/InteractiveDashboardLoader";
import { useTenantGuard } from "@/hooks/useTenantGuard";
import { ActionPlanGeneratorModal } from "@/components/wbil/ActionPlanGeneratorModal";
import { ActionPlanView } from "@/components/wbil/ActionPlanView";
import { ActionPlanJSON, DevelopmentPriority } from "@/types/wbil";


interface MemberProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  designation: string;
  experience_years: number;
}

interface SavedReport {
  user_id: string;
  report_markdown: string;
  scoring_metrics: {
    raw_scores: Record<string, number>;
    primary_pattern: string;
    secondary_pattern: string;
    combination_profile: string;
    primary_strength_pct: number;
    secondary_strength_pct: number;
    flags: string[];
  };
}

export default function TeamLeadManagerPage() {
  const router = useRouter();
  const { company_slug, team_slug } = useParams();
  const { isLoggedIn, profile, user, loading: authLoading } = useAuthContext();
  const { loading: guardLoading, tenantMeta } = useTenantGuard(["manager", "hr_admin", "super_admin"]);

  // Loading and profiles state
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");

  // Aggregate Metrics State
  const [growthAvg, setGrowthAvg] = useState(0);
  const [ownershipAvg, setOwnershipAvg] = useState(0);
  const [dependencyAvg, setDependencyAvg] = useState(0);
  const [energyAvg, setEnergyAvg] = useState(0);

  // Modal Report Preview State
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Action Plans Map & Modal States
  const [actionPlans, setActionPlans] = useState<Record<string, any>>({});
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [generatorMember, setGeneratorMember] = useState<MemberProfile | null>(null);
  const [generatorReportId, setGeneratorReportId] = useState<string>("");
  const [generatorPriorities, setGeneratorPriorities] = useState<DevelopmentPriority[]>([]);
  const [viewingActionPlan, setViewingActionPlan] = useState<{ member: MemberProfile; plan: any } | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const cleanApiUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  // Invite Member Form State
  const [memberEmail, setMemberEmail] = useState("");
  const [memberFirstName, setMemberFirstName] = useState("");
  const [memberLastName, setMemberLastName] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleCopyInviteLink = () => {
    if (!generatedInviteUrl) return;
    navigator.clipboard.writeText(generatedInviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  // CSV State & Validation Pipeline
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRoster, setParsedRoster] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [analysisSuccess, setAnalysisSuccess] = useState<string | null>(null);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }
      if (profile?.role !== "manager" && profile?.role !== "hr_admin") {
        router.push("/dashboard");
        return;
      }
      fetchTeamData();
    }
  }, [isLoggedIn, profile, authLoading, router]);

  const fetchTeamData = async () => {
    if (!profile?.team_id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      // Fetch team name
      const { data: teamData, error: teamNameErr } = await supabasedb
        .from("teams")
        .select("name")
        .eq("id", profile.team_id)
        .single();
      if (!teamNameErr && teamData) {
        setTeamName(teamData.name);
      }

      // Fetch profiles of team members
      const { data: profilesData, error: profilesErr } = await supabasedb
        .from("profiles")
        .select("id, first_name, last_name, email, role, designation, experience_years")
        .eq("team_id", profile.team_id);
      
      if (profilesErr) throw profilesErr;
      const filteredMembers = (profilesData || []).filter((m: MemberProfile) => m.role !== "manager");
      setMembers(filteredMembers);
      
      const managerIds = (profilesData || []).filter((m: MemberProfile) => m.role === "manager").map(m => m.id);

      // Fetch team assessment reports (insulation via manager RLS policy automatically filters this!)
      const { data: reportsData, error: reportsErr } = await supabasedb
        .from("saved_reports")
        .select("user_id, report_markdown, scoring_metrics")
        .eq("team_id", profile.team_id);

      if (reportsErr) {
        console.warn("Reports RLS filter or lookup error:", reportsErr);
      } else {
        const filteredReports = (reportsData as SavedReport[] || []).filter(r => !managerIds.includes(r.user_id));
        setReports(filteredReports);
        calculateTeamMetrics(filteredReports);
      }

      // Fetch Action Plans for team members
      const memberIds = filteredMembers.map(m => m.id);
      if (memberIds.length > 0) {
        const { data: plansData } = await supabasedb
          .from("action_plans")
          .select("*")
          .in("employee_id", memberIds);
        
        if (plansData) {
          const plansMap: Record<string, any> = {};
          plansData.forEach((p: any) => {
            plansMap[p.employee_id] = p;
          });
          setActionPlans(plansMap);
        }
      }

    } catch (err) {
      console.error("Error fetching team stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionPlanGenerator = (member: MemberProfile) => {
    // 1. Instantly open modal synchronously on the very first click
    setGeneratorMember(member);
    setGeneratorReportId(member.id);
    setGeneratorPriorities([]);
    setIsGeneratorModalOpen(true);
    
    // 2. Fetch specific development priorities in background non-blocking
    fetch(`${cleanApiUrl}/api/v1/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessment_id: member.id })
    })
      .then(res => res.ok ? res.json() : null)
      .then(result => {
        if (result && result.status === 'SUCCESS' && result.data) {
          if (result.report_id) {
            setGeneratorReportId(result.report_id);
          }
          if (result.data.development_priorities && result.data.development_priorities.length > 0) {
            setGeneratorPriorities(result.data.development_priorities);
          }
        }
      })
      .catch(e => {
        console.log("Notice fetching report priorities in background:", e);
      });
  };

  const handleOpenActionPlanView = (member: MemberProfile) => {
    const planRecord = actionPlans[member.id];
    if (planRecord) {
      setViewingActionPlan({
        member,
        plan: planRecord
      });
    }
  };


  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setGeneratedInviteUrl(null);

    const email = memberEmail.trim();
    const firstName = memberFirstName.trim();
    const lastName = memberLastName.trim();

    if (!email || !firstName || !lastName || !teamName) {
      setFormError("Please fill out all member details and ensure team context is loaded.");
      return;
    }

    // Email format validation (RFC 5322 check)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setFormError("Please enter a valid email address (e.g., name@company.com).");
      return;
    }

    const normalizedEmail = email.toLowerCase();

    // Check if email already exists in the current team roster
    const emailExistsLocally = members.some(m => m.email.toLowerCase() === normalizedEmail);
    if (emailExistsLocally) {
      setFormError(`An active profile with email "${email}" already exists in this team roster.`);
      return;
    }

    setInviteSubmitting(true);
    try {
      // Pre-flight check against database profiles (case-insensitive)
      const { data: existingProfiles, error: profileLookupErr } = await supabasedb
        .from("profiles")
        .select("id, email")
        .ilike("email", normalizedEmail);

      if (!profileLookupErr && existingProfiles && existingProfiles.length > 0) {
        setFormError(`An account with email "${email}" already exists in the organization.`);
        setInviteSubmitting(false);
        return;
      }

      // Pre-flight check against pending invitations (case-insensitive)
      const { data: existingInvs, error: invLookupErr } = await supabasedb
        .from("invitations")
        .select("id, email, status")
        .ilike("email", normalizedEmail)
        .eq("status", "pending");

      if (!invLookupErr && existingInvs && existingInvs.length > 0) {
        setFormError(`A pending invitation for "${email}" already exists.`);
        setInviteSubmitting(false);
        return;
      }

      const res = await fetch(`${cleanApiUrl}/api/enterprise/invite-team-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          first_name: firstName,
          last_name: lastName,
          role: "user",
          team_name: teamName,
          hr_user_id: user?.id
        })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let errorMsg = "Failed to invite team member.";
        if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
          errorMsg = data.detail[0].msg;
        }

        const lowerErr = errorMsg.toLowerCase();
        if (lowerErr.includes("already exists")) {
          errorMsg = `An account with email "${email}" already exists.`;
        } else if (lowerErr.includes("valid email") || lowerErr.includes("@-sign") || lowerErr.includes("email address")) {
          errorMsg = "The email address is invalid. Please enter a valid email format.";
        } else if (lowerErr.includes("smtp")) {
          errorMsg = "Invitation created, but failed to send email via mail server. Please check SMTP configuration.";
        }

        throw new Error(errorMsg);
      }

      setMemberEmail("");
      setMemberFirstName("");
      setMemberLastName("");
      const inviteUrl = data.invite_url ? `${window.location.origin}${data.invite_url}` : null;
      setGeneratedInviteUrl(inviteUrl);
      setFormSuccess(`Invitation sent successfully to ${normalizedEmail}!`);
      await fetchTeamData();
    } catch (err: any) {
      setFormError(err.message || "Failed to generate invitation.");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processCsvFile(file);
  };

  const downloadSampleCsv = () => {
    const csvContent = "email,first_name,last_name\n" +
      "alex.johnson@company.com,Alex,Johnson\n" +
      "maria.garcia@company.com,Maria,Garcia\n" +
      "david.kim@company.com,David,Kim";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "manager_team_roster_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processCsvFile = async (file: File) => {
    setCsvError(null);
    setAnalysisSuccess(null);
    setParsedRoster([]);
    setCsvFile(file);
    setIsAnalyzing(true);

    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    try {
      // Step 1: Read and parse CSV file
      setAnalysisStep(1);
      setAnalysisStatus("Step 1/4: Reading and parsing CSV file structure...");
      await sleep(350);

      const text = await file.text();
      const rawLines = text.split(/\r?\n/);
      const lines = rawLines.filter(l => l.trim().length > 0);

      if (lines.length < 2) {
        throw new Error("CSV file is empty or missing data rows.");
      }

      // Parse headers stripping quotes
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
      const emailIdx = headers.findIndex(h => ["email", "e-mail", "email address"].includes(h));
      const firstIdx = headers.findIndex(h => ["first_name", "first name", "firstname", "first"].includes(h));
      const lastIdx = headers.findIndex(h => ["last_name", "last name", "lastname", "last"].includes(h));

      if (emailIdx === -1 || firstIdx === -1 || lastIdx === -1) {
        const missing = [];
        if (emailIdx === -1) missing.push("email");
        if (firstIdx === -1) missing.push("first_name");
        if (lastIdx === -1) missing.push("last_name");
        throw new Error(`CSV missing required headers: ${missing.join(", ")}. Expected format: email,first_name,last_name`);
      }

      // Step 2: Validate Data Completeness across all rows
      setAnalysisStep(2);
      setAnalysisStatus("Step 2/4: Checking data completeness and field values across rows...");
      await sleep(350);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const seenEmailsInCsv = new Set<string>();
      const candidateRows: any[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const rowNum = i + 1;
        const line = lines[i];
        const cols = line.split(",").map(c => c.trim().replace(/^["']|["']$/g, ''));

        const email = (cols[emailIdx] || "").trim();
        const firstName = (cols[firstIdx] || "").trim();
        const lastName = (cols[lastIdx] || "").trim();

        const missingFields: string[] = [];
        if (!email) missingFields.push("email");
        if (!firstName) missingFields.push("first_name");
        if (!lastName) missingFields.push("last_name");

        if (missingFields.length > 0) {
          errors.push(`Row ${rowNum}: Missing required field(s): ${missingFields.join(", ")}`);
          continue;
        }

        if (!emailRegex.test(email)) {
          errors.push(`Row ${rowNum}: Invalid email format "${email}"`);
          continue;
        }

        const normalizedEmail = email.toLowerCase();
        if (seenEmailsInCsv.has(normalizedEmail)) {
          errors.push(`Row ${rowNum}: Duplicate email "${email}" found within the CSV file.`);
          continue;
        }
        seenEmailsInCsv.add(normalizedEmail);

        candidateRows.push({
          rowNum,
          email: normalizedEmail,
          first_name: firstName,
          last_name: lastName
        });
      }

      if (candidateRows.length === 0 && errors.length === 0) {
        throw new Error("No valid data rows found in CSV.");
      }

      // Step 3: Check Email Uniqueness (Pre-flight all-or-nothing check against existing accounts and pending invitations)
      setAnalysisStep(3);
      setAnalysisStatus("Step 3/4: Checking email uniqueness against active accounts and invitations...");
      await sleep(350);

      const allCsvEmails = candidateRows.map(r => r.email);
      const existingEmailsFound = new Set<string>();

      // Check current in-memory members and invitations
      members.forEach(m => {
        if (allCsvEmails.includes(m.email.toLowerCase())) {
          existingEmailsFound.add(m.email.toLowerCase());
        }
      });

      // Direct database query for comprehensive coverage
      if (allCsvEmails.length > 0) {
        try {
          const { data: dbProfiles } = await supabasedb
            .from("profiles")
            .select("email")
            .in("email", allCsvEmails);
          if (dbProfiles) {
            dbProfiles.forEach((p: any) => {
              if (p.email) existingEmailsFound.add(p.email.toLowerCase());
            });
          }

          const { data: dbInvs } = await supabasedb
            .from("invitations")
            .select("email")
            .in("email", allCsvEmails);
          if (dbInvs) {
            dbInvs.forEach((inv: any) => {
              if (inv.email) existingEmailsFound.add(inv.email.toLowerCase());
            });
          }
        } catch (dbErr) {
          console.warn("Direct db uniqueness check warning:", dbErr);
        }
      }

      if (existingEmailsFound.size > 0) {
        const existingList = Array.from(existingEmailsFound).join(", ");
        errors.push(`The following email(s) already exist: ${existingList}. Please upload a new CSV file with updated content.`);
      }

      // If any errors were detected, stop and do not allow proceeding
      if (errors.length > 0) {
        setCsvError(errors.join("\n"));
        setParsedRoster([]);
        return;
      }

      // Step 4: Final verification
      setAnalysisStep(4);
      setAnalysisStatus("Step 4/4: Finalizing roster verification...");
      await sleep(200);

      setParsedRoster(candidateRows);
      setAnalysisSuccess(
        `All checks passed! Found ${candidateRows.length} valid new team member(s). All details filled and emails verified as new.`
      );
    } catch (err: any) {
      setCsvError(err.message || "Failed to process and analyze CSV file.");
      setParsedRoster([]);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus(null);
    }
  };

  const handleUploadRoster = async () => {
    if (parsedRoster.length === 0 || !teamName) return;
    setCsvUploading(true);
    setCsvError(null);
    setFormSuccess(null);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < parsedRoster.length; i++) {
      const candidate = parsedRoster[i];
      setUploadProgressText(`Sending invitation and activation email (${i + 1} of ${parsedRoster.length}) to ${candidate.email}...`);

      try {
        const res = await fetch(`${cleanApiUrl}/api/enterprise/invite-team-member`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: candidate.email,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            role: "user",
            team_name: teamName,
            hr_user_id: user?.id
          })
        });

        if (res.ok) {
          successCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          failCount++;
          errors.push(`${candidate.email}: ${errData.detail || "Failed to send invitation"}`);
        }
      } catch (err: any) {
        failCount++;
        errors.push(`${candidate.email}: ${err.message || "Network error"}`);
      }
    }

    setUploadProgressText(null);
    setCsvUploading(false);

    if (successCount > 0) {
      setFormSuccess(`Bulk Roster Import Complete: Successfully invited ${successCount} member(s) to ${teamName}!${failCount > 0 ? ` (${failCount} errors)` : ""}`);
    }
    if (errors.length > 0) {
      setCsvError(`Failed invitations:\n${errors.join("\n")}`);
    }

    setParsedRoster([]);
    setCsvFile(null);
    setAnalysisSuccess(null);
    await fetchTeamData();
  };

  const calculateTeamMetrics = (reportList: SavedReport[]) => {
    if (reportList.length === 0) return;

    let totalGrowth = 0;
    let totalOwnership = 0;
    let totalDependency = 0;
    let totalEnergy = 0;

    reportList.forEach(rep => {
      const raw = rep.scoring_metrics.raw_scores || { SCP: 0, FIE: 0, CCD: 0, SPO: 0 };
      
      // Calculate individual percentages out of 24 questions
      const scpPct = (raw.SCP / 24) * 100;
      const fiePct = (raw.FIE / 24) * 100;
      const ccdPct = (raw.CCD / 24) * 100;
      const spoPct = (raw.SPO / 24) * 100;

      // Map to aggregate dimensions
      // Growth (FIE + SCP)
      totalGrowth += (fiePct + scpPct) / 2;
      // Ownership (SCP + CCD)
      totalOwnership += (scpPct + ccdPct) / 2;
      // Dependency (SPO + CCD)
      totalDependency += (spoPct + ccdPct) / 2;
      // Energy (FIE + SPO)
      totalEnergy += (fiePct + spoPct) / 2;
    });

    const count = reportList.length;
    setGrowthAvg(Math.round(totalGrowth / count));
    setOwnershipAvg(Math.round(totalOwnership / count));
    setDependencyAvg(Math.round(totalDependency / count));
    setEnergyAvg(Math.round(totalEnergy / count));
  };

  // Secure Backend Report Retrieval
  const handleOpenReportModal = async (member: MemberProfile) => {
    setSelectedMember(member);
    setModalLoading(true);
    setSelectedReport(null);

    try {
      // Fetch report using the secure JWT retrieval endpoint
      const session = await supabasedb.auth.getSession();
      const jwtToken = session.data.session?.access_token;

      if (!jwtToken) {
        throw new Error("No active JWT session token found.");
      }

      const res = await fetch(`${cleanApiUrl}/api/enterprise/assessment/report/${member.id}`, {
        headers: {
          "Authorization": `Bearer ${jwtToken}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Access Denied");
      }

      setSelectedReport({
        user_id: member.id,
        report_markdown: data.report_markdown,
        scoring_metrics: data.scoring_metrics
      });
    } catch (err: any) {
      alert(err.message || "You do not have permissions to review this report (RLS enforced).");
      setSelectedMember(null);
    } finally {
      setModalLoading(false);
    }
  };

  const getReportForMember = (memberId: string) => {
    return reports.find(r => r.user_id === memberId);
  };

  // Compute metrics
  const completionsCount = reports.length;
  const participationRate = members.length > 0 ? Math.round((completionsCount / members.length) * 100) : 0;

  if (authLoading || loading) {
    return (
      <InteractiveDashboardLoader 
        title="Manager Analytics Hub" 
        subtitle="Team Lead Workspace" 
      />
    );
  }

  return (
    <>
      <main style={{ minHeight: '100vh', padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', boxSizing: 'border-box' }}>
      {/* Background decoration */}
      <div className="tie-dot-grid fixed inset-0 pointer-events-none opacity-40" />

      {/* Header Panel */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2.5rem', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#243B53' }} />
        
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', width: '100%', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '99px', background: '#F4F7FA', color: '#7B8794', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              <GitMerge size={11} style={{ color: '#5BA4A4' }} />
              Manager Control Center
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#243B53', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
              Team Alignment Analytics: {teamName || "Team"}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#627D98', marginTop: '0.35rem', fontWeight: 500, maxWidth: '600px', margin: '0.35rem 0 0 0' }}>
              Understand department preferences. Direct visibility into psychological aggregate dimension statistics and team combination profiles.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link 
              href="/welcome" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '0.625rem 1.25rem', 
                borderRadius: '6px', 
                background: 'linear-gradient(135deg, #3730A3 0%, #4F46E5 100%)', 
                border: '1px solid #4338CA', 
                color: '#ffffff', 
                fontSize: '0.8125rem', 
                fontWeight: 700, 
                letterSpacing: '0.02em',
                textDecoration: 'none', 
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                boxShadow: '0 2px 6px rgba(55, 48, 163, 0.25)' 
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.background = 'linear-gradient(135deg, #312E81 0%, #4338CA 100%)'; 
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(55, 48, 163, 0.35)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.background = 'linear-gradient(135deg, #3730A3 0%, #4F46E5 100%)'; 
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(55, 48, 163, 0.25)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Sparkles size={14} style={{ color: '#C7D2FE' }} />
              <span>Take Self-Assessment</span>
            </Link>
            <Link 
              href="/dashboard" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '0.625rem 1.2rem', 
                borderRadius: '6px', 
                border: '1.5px solid rgba(36,59,83,0.15)', 
                background: '#ffffff', 
                color: '#243B53', 
                fontSize: '0.8125rem', 
                fontWeight: 700, 
                textDecoration: 'none', 
                transition: 'all 0.2s' 
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F4F7FA'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
            >
              User Dashboard
            </Link>
          </div>
        </div>
      </div>

      {!profile?.team_id && (
        <div style={{ background: '#FFF3CD', border: '1px solid #FFEBA5', borderRadius: '16px', padding: '1.25rem', color: '#856404', fontSize: '0.875rem', fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} style={{ color: '#856404', flexShrink: 0 }} />
          <span>You have not been assigned to a team yet. Please contact your HR Administrator to assign you to a team.</span>
        </div>
      )}

      {/* Main Grid: Left Side stats/forms, Right side roster/CSV */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">
        
        {/* Left Column: Stats & Invite Form */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          
          {/* Tactical Stats */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '1.75rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team Size</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#243B53', marginTop: '2px', lineHeight: 1 }}>{members.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completions</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2E7D32', marginTop: '2px', lineHeight: 1 }}>{completionsCount}</span>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid #F4F7FA', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participation Rate</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#243B53' }}>{participationRate}%</span>
                <div style={{ flex: 1, backgroundColor: '#F4F7FA', height: '8px', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#5BA4A4', height: '100%', borderRadius: '99px', width: `${participationRate}%`, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Calculated Aggregate Score Dimensions */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F4F7FA', paddingBottom: '0.75rem' }}>
              <Activity size={18} style={{ color: '#5BA4A4' }} />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#243B53', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Aggregate Team Dynamics
              </h3>
            </div>

            {reports.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#9aa8b6', fontStyle: 'italic', margin: 0 }}>No reports completed yet to aggregate statistics.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Growth */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#243B53', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={14} style={{ color: '#5BA4A4' }} />
                      Growth Focus (FIE + SCP)
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#5BA4A4' }}>{growthAvg}%</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#F4F7FA', height: '6px', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#5BA4A4', height: '100%', borderRadius: '99px', width: `${growthAvg}%` }} />
                  </div>
                  <span style={{ fontSize: '9px', color: '#9aa8b6', fontWeight: 500, lineHeight: 1.3 }}>Combines Autonomy and Structured Clarity. Higher scores indicate standard setting and self-betterment workflows.</span>
                </div>

                {/* Ownership */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#243B53', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={14} style={{ color: '#F59E0B' }} />
                      Ownership Focus (SCP + CCD)
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#F59E0B' }}>{ownershipAvg}%</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#F4F7FA', height: '6px', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#F59E0B', height: '100%', borderRadius: '99px', width: `${ownershipAvg}%` }} />
                  </div>
                  <span style={{ fontSize: '9px', color: '#9aa8b6', fontWeight: 500, lineHeight: 1.3 }}>Combines Clarity and Connection. Higher scores show strong collaborative responsibility and communication.</span>
                </div>

                {/* Dependency */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#243B53', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} style={{ color: '#EF4444' }} />
                      Dependency Focus (SPO + CCD)
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#EF4444' }}>{dependencyAvg}%</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#F4F7FA', height: '6px', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#EF4444', height: '100%', borderRadius: '99px', width: `${dependencyAvg}%` }} />
                  </div>
                  <span style={{ fontSize: '9px', color: '#9aa8b6', fontWeight: 500, lineHeight: 1.3 }}>Combines Stable Pace and Connection. Reflects cooperative stabilizer team traits.</span>
                </div>

                {/* Energy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#243B53', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={14} style={{ color: '#10B981' }} />
                      Energy Focus (FIE + SPO)
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#10B981' }}>{energyAvg}%</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#F4F7FA', height: '6px', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#10B981', height: '100%', borderRadius: '99px', width: `${energyAvg}%` }} />
                  </div>
                  <span style={{ fontSize: '9px', color: '#9aa8b6', fontWeight: 500, lineHeight: 1.3 }}>Combines Autonomy and Stable Pace. Reflected by steady, highly reliable individual execution.</span>
                </div>
              </div>
            )}
          </div>

          {/* Invite Team Member Form */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#F4F7FA', color: '#5BA4A4', borderRadius: '14px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#243B53', margin: 0 }}>Invite Team Member</h2>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>Provision team member testing access</p>
              </div>
            </div>

            <form onSubmit={handleInviteMember} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#627D98' }}>First Name</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#9aa8b6' }}>
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="John"
                      value={memberFirstName}
                      onChange={(e) => setMemberFirstName(e.target.value)}
                      onFocus={() => setFocusedField('memFirst')}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem 0.8rem 2.8rem',
                        border: `1.5px solid ${focusedField === 'memFirst' ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
                        borderRadius: '12px',
                        background: focusedField === 'memFirst' ? '#ffffff' : '#F4F7FA',
                        color: '#1F2933',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        outline: 'none',
                        boxShadow: focusedField === 'memFirst' ? '0 0 0 3px rgba(91,164,164,0.15)' : 'none',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#627D98' }}>Last Name</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#9aa8b6' }}>
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={memberLastName}
                      onChange={(e) => setMemberLastName(e.target.value)}
                      onFocus={() => setFocusedField('memLast')}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem 0.8rem 2.8rem',
                        border: `1.5px solid ${focusedField === 'memLast' ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
                        borderRadius: '12px',
                        background: focusedField === 'memLast' ? '#ffffff' : '#F4F7FA',
                        color: '#1F2933',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        outline: 'none',
                        boxShadow: focusedField === 'memLast' ? '0 0 0 3px rgba(91,164,164,0.15)' : 'none',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#627D98' }}>Work Email</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#9aa8b6' }}>
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    placeholder="member@company.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    onFocus={() => setFocusedField('memEmail')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem 0.8rem 2.8rem',
                      border: `1.5px solid ${focusedField === 'memEmail' ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
                      borderRadius: '12px',
                      background: focusedField === 'memEmail' ? '#ffffff' : '#F4F7FA',
                      color: '#1F2933',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxShadow: focusedField === 'memEmail' ? '0 0 0 3px rgba(91,164,164,0.15)' : 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={inviteSubmitting}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: '#5BA4A4',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(91,164,164,0.2)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#4a9393'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#5BA4A4'; e.currentTarget.style.transform = 'none'; }}
              >
                {inviteSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Sending Invite...</span>
                  </>
                ) : (
                  <>
                    <span>Send Member Invite</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Error/Success banners */}
            {(formSuccess || formError) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                {formSuccess && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px', 
                    padding: '0.85rem 1rem', 
                    background: 'rgba(46,125,50,0.06)', 
                    border: '1px solid rgba(46,125,50,0.15)', 
                    borderRadius: '12px', 
                    color: '#2E7D32', 
                    fontSize: '0.8125rem', 
                    fontWeight: 600,
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      <CheckCircle size={16} style={{ flexShrink: 0, color: '#2E7D32' }} />
                      <span>{formSuccess}</span>
                    </div>
                    {generatedInviteUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap', maxWidth: '100%' }}>
                        <button
                          type="button"
                          onClick={handleCopyInviteLink}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            background: copiedInvite ? '#166534' : '#ffffff',
                            color: copiedInvite ? '#ffffff' : '#2E7D32',
                            border: '1px solid rgba(46,125,50,0.25)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flexShrink: 0
                          }}
                        >
                          {copiedInvite ? (
                            <>
                              <CheckCircle size={12} />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy Invite Link</span>
                            </>
                          )}
                        </button>
                        <span style={{ fontSize: '10px', color: '#627D98', fontWeight: 500 }}>
                          Activation mail dispatched
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {formError && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '8px', 
                    padding: '0.85rem 1rem', 
                    background: 'rgba(192,57,43,0.06)', 
                    border: '1px solid rgba(192,57,43,0.15)', 
                    borderRadius: '12px', 
                    color: '#c0392b', 
                    fontSize: '0.8125rem', 
                    fontWeight: 600,
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere'
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{formError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: CSV & Roster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', gridColumn: 'span 2' }}>
          
          {/* CSV File Dropzone */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#F4F7FA', color: '#5BA4A4', borderRadius: '14px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#243B53', margin: 0 }}>CSV Roster Ingestion</h2>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>Batch invite team members via csv import</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', width: '100%' }}>
              
              <div style={{ border: '2px dashed rgba(36,59,83,0.15)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', position: 'relative', cursor: 'pointer', transition: 'border-color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.borderColor = '#5BA4A4'}
                   onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(36,59,83,0.15)'}>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleCsvChange}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
                <Upload size={28} style={{ color: '#9aa8b6', marginBottom: '8px' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#243B53' }}>
                  {csvFile ? csvFile.name : "Select or Drop CSV File"}
                </span>
                <span style={{ fontSize: '10px', color: '#9aa8b6', fontWeight: 500, marginTop: '4px' }}>Expected headers: email, first_name, last_name</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleCsv();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#5BA4A4',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    marginTop: '8px',
                    position: 'relative',
                    zIndex: 10
                  }}
                >
                  Download Sample CSV Template
                </button>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid rgba(36,59,83,0.06)', padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#627D98' }}>
                  {isAnalyzing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5BA4A4', fontWeight: 700 }}>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Validating Roster & Checking Accounts...</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#627D98', fontWeight: 600 }}>
                        {analysisStatus}
                      </div>
                      <div style={{ width: '100%', background: '#E2E8F0', height: '5px', borderRadius: '999px', overflow: 'hidden', marginTop: '4px' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${(analysisStep / 4) * 100}%`, 
                            background: 'linear-gradient(90deg, #5BA4A4, #3B82F6)',
                            transition: 'width 0.3s ease'
                          }} 
                        />
                      </div>
                    </div>
                  ) : csvUploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3B82F6', fontWeight: 700 }}>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Provisioning & Dispatching Invitations...</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#243B53', fontWeight: 600 }}>
                        {uploadProgressText || "Processing batch..."}
                      </p>
                    </div>
                  ) : csvError ? (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991B1B', fontWeight: 700, fontSize: '0.75rem' }}>
                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>Roster Validation Error</span>
                      </div>
                      <p style={{ margin: 0, color: '#DC2626', fontSize: '11px', fontWeight: 600, whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                        {csvError}
                      </p>
                    </div>
                  ) : analysisSuccess && parsedRoster.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, fontSize: '0.8125rem' }}>
                        <CheckCircle size={15} style={{ flexShrink: 0 }} />
                        <span>Roster Verified & Ready</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#15803D', fontWeight: 600 }}>
                        {analysisSuccess}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span style={{ padding: '2px 8px', background: '#DCFCE7', color: '#15803D', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                          {parsedRoster.length} New Members
                        </span>
                        <span style={{ padding: '2px 8px', background: '#F1F5F9', color: '#475569', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                          Team: {teamName}
                        </span>
                        <span style={{ padding: '2px 8px', background: '#F1F5F9', color: '#475569', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                          Role: user
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ color: '#243B53', fontWeight: 700 }}>Awaiting Roster CSV Upload</span>
                      <span style={{ color: '#9aa8b6', fontSize: '11px', lineHeight: '1.4' }}>
                        Upload a roster spreadsheet (.csv). The system verifies all fields and checks email uniqueness before any accounts or invitations are generated.
                      </span>
                    </div>
                  )}
                </div>
                
                {parsedRoster.length > 0 && !isAnalyzing && (
                  <button
                    onClick={handleUploadRoster}
                    disabled={csvUploading}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      background: 'linear-gradient(135deg, #243B53 0%, #1a2d40 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: csvUploading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { if (!csvUploading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                    onMouseLeave={e => { if (!csvUploading) e.currentTarget.style.filter = 'none'; }}
                  >
                    {csvUploading ? (
                      <>
                        <Loader2 className="animate-spin" size={13} />
                        <span>Provisioning & Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Database size={13} />
                        <span>Provision & Send Invitation Mails</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Team roster & Report list */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #F4F7FA', paddingBottom: '0.75rem' }}>
              <div style={{ padding: '10px', background: '#F4F7FA', color: '#5BA4A4', borderRadius: '14px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LayoutGrid size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#243B53', margin: 0 }}>Team Roster and Assessment Insight</h2>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>Workforce alignment and report access registry</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {members.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: '#9aa8b6', fontStyle: 'italic', margin: 0, padding: '2rem 0', textAlign: 'center' }}>
                  No reports or direct roster records resolved for this department.
                </p>
              ) : (
                members.map((member) => {
                  const report = getReportForMember(member.id);
                  return (
                    <div key={member.id} style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(36,59,83,0.08)', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', textAlign: 'left', transition: 'border-color 0.2s' }}
                         onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(91,164,164,0.3)'}
                         onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(36,59,83,0.08)'}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#243B53' }}>
                          {member.first_name} {member.last_name}
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#627D98', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Briefcase size={12} style={{ color: '#5BA4A4' }} />
                            {member.designation || "Software Engineer"}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>|</span>
                          <span style={{ fontSize: '0.75rem', color: '#627D98' }}>{member.email}</span>
                        </div>
                        
                        {report && (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', background: 'rgba(91,164,164,0.08)', color: '#5BA4A4', fontWeight: 800, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {report.scoring_metrics.combination_profile}
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '30px',
                          fontSize: '10px',
                          fontWeight: 800,
                          background: report ? 'rgba(46,125,50,0.06)' : 'rgba(217,119,6,0.06)',
                          color: report ? '#2E7D32' : '#D97706'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: report ? '#2E7D32' : '#F59E0B' }} />
                          {report ? "Report Ready" : "Awaiting Responses"}
                        </span>

                        {report ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenReportModal(member)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                background: '#243B53',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '11px',
                                fontWeight: 700,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#1a2d40'}
                              onMouseLeave={e => e.currentTarget.style.background = '#243B53'}
                            >
                              <FileText size={12} />
                              <span>Review Report</span>
                            </button>

                            {actionPlans[member.id] ? (
                              <button
                                onClick={() => handleOpenActionPlanView(member)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '8px 14px',
                                  background: '#047857',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#065f46'}
                                onMouseLeave={e => e.currentTarget.style.background = '#047857'}
                              >
                                <Target size={12} />
                                <span>View 30-Day Plan</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenActionPlanGenerator(member)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '8px 14px',
                                  background: '#4F46E5',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = '#4338ca';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = '#4F46E5';
                                  e.currentTarget.style.transform = 'translateY(0px)';
                                }}
                                onMouseDown={e => {
                                  e.currentTarget.style.transform = 'scale(0.97)';
                                }}
                                onMouseUp={e => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                <Sparkles size={12} />
                                <span>Generate 30-Day Plan</span>
                              </button>
                            )}
                          </div>
                        ) : (

                          <span style={{ fontSize: '11px', color: '#9aa8b6', fontWeight: 500, fontStyle: 'italic' }}>Awaiting assessment</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      </main>

      {/* Modal Popup for report rendering */}
      {selectedMember && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 z-50 overflow-y-auto"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            zIndex: 99999,
            overflowY: 'auto'
          }}
        >
          <div 
            className="bg-slate-50 w-full max-w-5xl rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{
              backgroundColor: '#f8fafc',
              width: '100%',
              maxWidth: '1024px',
              borderRadius: '24px',
              border: '1px solid rgba(241, 245, 249, 1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
          >
            {/* Modal Header */}
            <div 
              className="bg-white p-4 border-b border-slate-100 flex items-center justify-between"
              style={{
                backgroundColor: '#ffffff',
                padding: '1.25rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider" style={{ margin: 0 }}>
                  Report Preview: {selectedMember.first_name} {selectedMember.last_name}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5" style={{ margin: '4px 0 0 0' }}>Enforcing Database-level insulation metrics (RLS)</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {actionPlans[selectedMember.id] ? (
                  <button
                    onClick={() => {
                      const mem = selectedMember;
                      setSelectedMember(null);
                      handleOpenActionPlanView(mem);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: '#047857',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <Target size={14} />
                    <span>View 30-Day Plan</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const mem = selectedMember;
                      setSelectedMember(null);
                      handleOpenActionPlanGenerator(mem);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: '#4F46E5',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#4338ca';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#4F46E5';
                      e.currentTarget.style.transform = 'translateY(0px)';
                    }}
                    onMouseDown={e => {
                      e.currentTarget.style.transform = 'scale(0.97)';
                    }}
                    onMouseUp={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Generate 30-Day Plan</span>
                  </button>
                )}

                <button 
                  onClick={() => setSelectedMember(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                  style={{
                    padding: '6px',
                    color: '#94a3b8',
                    borderRadius: '12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div 
              className="p-6 md:p-8 overflow-y-auto flex-1 w-full box-border"
              style={{
                padding: '2.5rem',
                overflowY: 'auto',
                flex: '1 1 0%',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-20" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
                  <Loader2 className="animate-spin text-[#5BA4A4] mb-3" size={36} />
                  <span className="text-sm font-semibold text-slate-500">Querying secure RLS database row...</span>
                </div>
              ) : selectedReport ? (
                <div 
                  className="w-full max-w-[1500px] mx-auto"
                  style={{
                    width: '100%',
                    maxWidth: '1500px',
                    margin: '0 auto'
                  }}
                >
                  <ReportViewer
                    reportMarkdown={selectedReport.report_markdown}
                    scoringMetrics={selectedReport.scoring_metrics}
                    employeeName={`${selectedMember.first_name} ${selectedMember.last_name}`}
                    designation={selectedMember.designation}
                    experienceYears={String(selectedMember.experience_years)}
                    department={team_slug as string}
                    isModal={true}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs italic font-medium">
                  Failed to fetch report metrics.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Plan Generator Modal */}
      {isGeneratorModalOpen && generatorMember && (
        <ActionPlanGeneratorModal
          isOpen={isGeneratorModalOpen}
          onClose={() => setIsGeneratorModalOpen(false)}
          reportId={generatorReportId}
          developmentPriorities={generatorPriorities.length > 0 ? generatorPriorities : [
            { priority_number: 1, behaviour_id: 'WB-001', title: 'Accountability & Milestone Ownership', description: 'Enhance proactive milestone delivery and project tracking.', rationale: 'Key sprint deliverable target.' },
            { priority_number: 2, behaviour_id: 'WB-009', title: 'Adaptive Workplace Collaboration', description: 'Improve cross-functional communication during sprint cycles.', rationale: 'Team alignment requirement.' },
            { priority_number: 3, behaviour_id: 'WB-015', title: 'Strategic Output Execution', description: 'Ensure predictable high-quality technical outputs.', rationale: 'Performance excellence objective.' }
          ]}
          onActionPlanGenerated={(planData, planId) => {
            const mem = generatorMember;
            setActionPlans(prev => ({
              ...prev,
              [mem.id]: {
                id: planId,
                report_id: generatorReportId,
                employee_id: mem.id,
                action_plan_json: planData
              }
            }));
            setIsGeneratorModalOpen(false);
            setViewingActionPlan({
              member: mem,
              plan: {
                id: planId,
                report_id: generatorReportId,
                employee_id: mem.id,
                action_plan_json: planData
              }
            });
          }}
        />
      )}

      {/* View 30-Day Action Plan Modal */}
      {viewingActionPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 z-50 overflow-y-auto" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 99999, overflowY: 'auto' }}>
          <div className="bg-white w-full max-w-6xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative" style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '1240px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
            <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between" style={{ backgroundColor: '#ffffff', padding: '1.25rem 1.75rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider" style={{ margin: 0, color: '#243B53' }}>
                  30-Day Action Plan: {viewingActionPlan.member.first_name} {viewingActionPlan.member.last_name}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5" style={{ margin: '4px 0 0 0', color: '#627D98' }}>Tailored Executive Transition & Coaching Plan</p>
              </div>
              <button 
                onClick={() => setViewingActionPlan(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                style={{ padding: '8px', color: '#94a3b8', borderRadius: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1 w-full box-border" style={{ padding: '1.75rem', overflowY: 'auto', flex: '1 1 0%', width: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
              <ActionPlanView
                actionPlanId={viewingActionPlan.plan.id}
                employeeName={`${viewingActionPlan.member.first_name} ${viewingActionPlan.member.last_name}`}
                actionPlanData={viewingActionPlan.plan.action_plan_json || viewingActionPlan.plan}
              />
            </div>
          </div>
        </div>
      )}

    </>
  );
}

