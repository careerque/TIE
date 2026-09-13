"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { supabasedb } from "@/lib/supabaseClient";
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  Copy, 
  Check, 
  FileText, 
  Briefcase, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Upload,
  Database,
  FileSpreadsheet,
  Building2,
  Sparkles,
  Mail,
  User,
  X
} from "lucide-react";
import Link from "next/link";
import ReportViewer from "@/components/ReportViewer";
import InteractiveDashboardLoader from "@/components/InteractiveDashboardLoader";
import { useTenantGuard } from "@/hooks/useTenantGuard";
import { fetchWithTimeout } from "@/lib/fetchUtils";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  designation: string;
  experience_years: number;
  team_id: string;
  team_name: string;
  manager_id: string;
  has_completed_assessment: boolean;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  company_id: string;
  team_id: string;
  token: string;
  status: string;
  created_at: string;
  accepted_at: string;
}

export default function CorporateHrAdminPage() {
  const router = useRouter();
  const { company_slug } = useParams();
  const { isLoggedIn, profile, user, loading: authLoading } = useAuthContext();
  const { loading: guardLoading, tenantMeta } = useTenantGuard(["hr_admin", "super_admin"]);

  // API Data
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State - Manager Invitation
  const [mgrEmail, setMgrEmail] = useState("");
  const [mgrFirstName, setMgrFirstName] = useState("");
  const [mgrLastName, setMgrLastName] = useState("");
  const [mgrTeamName, setMgrTeamName] = useState("");
  const [mgrDesignation, setMgrDesignation] = useState("Manager");
  const [mgrSubmitting, setMgrSubmitting] = useState(false);

  // CSV Parsing & Validation Pipeline State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRoster, setParsedRoster] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [analysisSuccess, setAnalysisSuccess] = useState<string | null>(null);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);

  // UI Feedback
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [generatedMgrInviteUrl, setGeneratedMgrInviteUrl] = useState<string | null>(null);
  const [copiedMgrInvite, setCopiedMgrInvite] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleCopyMgrInviteLink = () => {
    if (!generatedMgrInviteUrl) return;
    navigator.clipboard.writeText(generatedMgrInviteUrl);
    setCopiedMgrInvite(true);
    setTimeout(() => setCopiedMgrInvite(false), 2000);
  };

  // Team Management State
  const [teams, setTeams] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [teamSubmitting, setTeamSubmitting] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamSuccess, setTeamSuccess] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const cleanApiUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  // Modal Report Preview State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }
      if (profile?.role !== "hr_admin" || !profile?.company_id) {
        router.push("/dashboard");
        return;
      }
      fetchCompanyData();
    }
  }, [isLoggedIn, profile, authLoading, router]);

  const handleOpenReportModal = async (member: Member) => {
    setSelectedMember(member);
    setModalLoading(true);
    setSelectedReport(null);

    try {
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

  const fetchCompanyData = async () => {
    if (!profile?.company_id) return;
    try {
      setLoading(true);

      let membersData: Member[] = [];
      let invs: Invitation[] = [];

      // 1. Fetch Company Members with timeout & Supabase fallback
      try {
        const membersRes = await fetchWithTimeout(`${cleanApiUrl}/api/company/members?company_id=${profile.company_id}`, { timeoutMs: 3500 });
        if (membersRes.ok) {
          membersData = await membersRes.json();
        }
      } catch (err) {
        console.warn("FastAPI company members fetch timed out/failed. Falling back to direct Supabase query.");
      }

      if (!membersData || membersData.length === 0) {
        const { data: supaProfiles } = await supabasedb
          .from("profiles")
          .select("id, first_name, last_name, email, role, designation, experience_years, team_id, manager_id")
          .eq("company_id", profile.company_id);

        if (supaProfiles) {
          membersData = supaProfiles.map((p: any) => ({
            id: p.id,
            first_name: p.first_name || "",
            last_name: p.last_name || "",
            email: p.email || "",
            role: p.role || "user",
            designation: p.designation || "Member",
            experience_years: Number(p.experience_years || 0),
            team_id: p.team_id || "",
            team_name: "General",
            manager_id: p.manager_id || "",
            has_completed_assessment: true,
          }));
        }
      }
      setMembers(membersData);

      // 2. Fetch Invitations with timeout & Supabase fallback
      try {
        const invRes = await fetchWithTimeout(`${cleanApiUrl}/api/invitations?company_id=${profile.company_id}`, { timeoutMs: 3500 });
        if (invRes.ok) {
          invs = await invRes.json();
        }
      } catch (err) {
        console.warn("FastAPI invitations fetch timed out/failed. Falling back to direct Supabase query.");
      }

      if (!invs || invs.length === 0) {
        const { data: supaInvs } = await supabasedb
          .from("invitations")
          .select("id, email, role, company_id, team_id, token, status, created_at, accepted_at")
          .eq("company_id", profile.company_id);
        if (supaInvs) invs = supaInvs;
      }

      // Filter invitations for managers/users only
      setInvitations(invs.filter((i: Invitation) => i.role === "manager" || i.role === "user"));

      // 3. Fetch existing teams
      const { data: teamsData, error: teamsError } = await supabasedb
        .from("teams")
        .select("*")
        .eq("company_id", profile.company_id);
      if (teamsError) throw teamsError;
      setTeams(teamsData || []);
      
    } catch (err) {
      console.error("Error fetching company data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError(null);
    setTeamSuccess(null);

    if (!newTeamName.trim() || !profile?.company_id) {
      setTeamError("Please specify a team name.");
      return;
    }

    setTeamSubmitting(true);
    try {
      const slug = newTeamName.trim().toLowerCase().replace(/ /g, "-");
      
      // Check if team already exists
      const existing = teams.find(t => t.slug === slug);
      if (existing) {
        throw new Error("A team with this name already exists in this company.");
      }

      const { data, error: insertError } = await supabasedb
        .from("teams")
        .insert({
          company_id: profile.company_id,
          name: newTeamName.trim(),
          slug: slug
        })
        .select();

      if (insertError) throw insertError;

      setNewTeamName("");
      setTeamSuccess(`Team "${newTeamName.trim()}" successfully created!`);
      await fetchCompanyData();
    } catch (err: any) {
      setTeamError(err.message || "Failed to create team.");
    } finally {
      setTeamSubmitting(false);
    }
  };

  const handleInviteManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setGeneratedMgrInviteUrl(null);

    const email = mgrEmail.trim();
    const firstName = mgrFirstName.trim();
    const lastName = mgrLastName.trim();
    const teamName = mgrTeamName.trim();

    if (!email || !firstName || !lastName || !teamName || !profile?.company_id) {
      setFormError("Please fill out all manager details.");
      return;
    }

    // Email format validation (RFC 5322 check)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setFormError("Please enter a valid email address (e.g., lead@company.com).");
      return;
    }

    const normalizedEmail = email.toLowerCase();

    // Check in-memory members and invitations
    const emailExistsLocally = members.some(m => m.email.toLowerCase() === normalizedEmail);
    if (emailExistsLocally) {
      setFormError(`An active profile with email "${email}" already exists in the organization.`);
      return;
    }

    const invExistsLocally = invitations.some(inv => inv.email.toLowerCase() === normalizedEmail && inv.status === "pending");
    if (invExistsLocally) {
      setFormError(`A pending invitation for "${email}" already exists.`);
      return;
    }

    setMgrSubmitting(true);
    try {
      // Pre-flight check against database profiles (case-insensitive)
      const { data: existingProfiles, error: profileLookupErr } = await supabasedb
        .from("profiles")
        .select("id, email")
        .ilike("email", normalizedEmail);

      if (!profileLookupErr && existingProfiles && existingProfiles.length > 0) {
        setFormError(`An account with email "${email}" already exists in the organization.`);
        setMgrSubmitting(false);
        return;
      }

      // Pre-flight check against pending database invitations (case-insensitive)
      const { data: existingInvs, error: invLookupErr } = await supabasedb
        .from("invitations")
        .select("id, email, status")
        .ilike("email", normalizedEmail)
        .eq("status", "pending");

      if (!invLookupErr && existingInvs && existingInvs.length > 0) {
        setFormError(`A pending invitation for "${email}" already exists.`);
        setMgrSubmitting(false);
        return;
      }

      const res = await fetch(`${cleanApiUrl}/api/enterprise/invite-team-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          first_name: firstName,
          last_name: lastName,
          role: "manager",
          team_name: teamName,
          hr_user_id: user?.id
        })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let errorMsg = "Failed to invite manager.";
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

      setMgrEmail("");
      setMgrFirstName("");
      setMgrLastName("");
      setMgrTeamName("");
      const inviteUrl = data.invite_url ? `${window.location.origin}${data.invite_url}` : null;
      setGeneratedMgrInviteUrl(inviteUrl);
      setFormSuccess(`Invitation sent successfully to Manager ${normalizedEmail}!`);
      
      // Refresh Lists
      await fetchCompanyData();
    } catch (err: any) {
      setFormError(err.message || "Failed to generate manager invitation.");
    } finally {
      setMgrSubmitting(false);
    }
  };

  // CSV Drag and Drop ingestion pipeline
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processCsvFile(file);
  };

  const downloadSampleCsv = () => {
    const csvContent = "email,first_name,last_name,role,team_name\n" +
      "john.doe@company.com,John,Doe,user,Engineering\n" +
      "jane.smith@company.com,Jane,Smith,manager,Design\n" +
      "alex.taylor@company.com,Alex,Taylor,user,Product";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "roster_sample_template.csv");
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
      // Step 1: Read and parse CSV file structure
      setAnalysisStep(1);
      setAnalysisStatus("Step 1/5: Reading and parsing CSV file structure...");
      await sleep(350);

      const text = await file.text();
      const rawLines = text.split(/\r?\n/);
      const lines = rawLines.filter(l => l.trim().length > 0);

      if (lines.length < 2) {
        throw new Error("CSV file is empty or missing data rows.");
      }

      // Parse headers with quote stripping
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
      
      const emailIdx = headers.findIndex(h => ["email", "e-mail", "email address"].includes(h));
      const firstIdx = headers.findIndex(h => ["first_name", "first name", "firstname", "first"].includes(h));
      const lastIdx = headers.findIndex(h => ["last_name", "last name", "lastname", "last"].includes(h));
      const roleIdx = headers.findIndex(h => ["role", "user_role", "position"].includes(h));
      const teamIdx = headers.findIndex(h => ["team_name", "team name", "teamname", "team", "department"].includes(h));

      if (emailIdx === -1 || firstIdx === -1 || lastIdx === -1 || roleIdx === -1 || teamIdx === -1) {
        const missingHeaders = [];
        if (emailIdx === -1) missingHeaders.push("email");
        if (firstIdx === -1) missingHeaders.push("first_name");
        if (lastIdx === -1) missingHeaders.push("last_name");
        if (roleIdx === -1) missingHeaders.push("role");
        if (teamIdx === -1) missingHeaders.push("team_name");
        throw new Error(`CSV is missing required headers: ${missingHeaders.join(", ")}. Expected format: email,first_name,last_name,role,team_name`);
      }

      // Step 2: Check data completeness and format across all rows
      setAnalysisStep(2);
      setAnalysisStatus("Step 2/5: Checking data completeness and field values across all rows...");
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
        const rawRole = (cols[roleIdx] || "").trim();
        const teamName = (cols[teamIdx] || "").trim();

        const missingFields: string[] = [];
        if (!email) missingFields.push("email");
        if (!firstName) missingFields.push("first_name");
        if (!lastName) missingFields.push("last_name");
        if (!rawRole) missingFields.push("role");
        if (!teamName) missingFields.push("team_name");

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
          last_name: lastName,
          rawRole,
          team_name: teamName
        });
      }

      if (candidateRows.length === 0 && errors.length === 0) {
        throw new Error("No valid data rows found in CSV.");
      }

      // Step 3: Validate Role (Non Case-Sensitive for 'user' and 'manager')
      setAnalysisStep(3);
      setAnalysisStatus("Step 3/5: Validating roles (accepts 'user' or 'manager', case-insensitive)...");
      await sleep(350);

      const validatedRoleRows: any[] = [];
      for (const row of candidateRows) {
        const lowerRole = row.rawRole.toLowerCase();
        if (lowerRole !== "user" && lowerRole !== "manager") {
          errors.push(`Row ${row.rowNum}: Role "${row.rawRole}" is invalid. Role must be either 'user' or 'manager' (e.g. user, manager, User, Manager).`);
        } else {
          validatedRoleRows.push({
            ...row,
            role: lowerRole
          });
        }
      }

      // Step 4: Validate Team Name (Non Case-Sensitive against company created teams)
      setAnalysisStep(4);
      setAnalysisStatus("Step 4/5: Verifying team names against created company teams (case-insensitive)...");
      await sleep(350);

      // Refresh teams from Supabase to guarantee up-to-date data
      let currentTeams = teams;
      if (profile?.company_id) {
        const { data: freshTeams } = await supabasedb
          .from("teams")
          .select("*")
          .eq("company_id", profile.company_id);
        if (freshTeams && freshTeams.length > 0) {
          currentTeams = freshTeams;
          setTeams(freshTeams);
        }
      }

      const existingTeamNamesLower = new Set(
        currentTeams.map((t: any) => (t.name || "").trim().toLowerCase())
      );
      const existingTeamSlugs = new Set(
        currentTeams.map((t: any) => (t.slug || "").trim().toLowerCase())
      );

      const missingTeams = new Set<string>();
      for (const row of candidateRows) {
        const cleanTeamName = row.team_name.trim();
        const lowerTeamName = cleanTeamName.toLowerCase();
        const slugTeam = lowerTeamName.replace(/\s+/g, "-");

        const exists = existingTeamNamesLower.has(lowerTeamName) || existingTeamSlugs.has(slugTeam);
        if (!exists) {
          missingTeams.add(cleanTeamName);
        }
      }

      if (missingTeams.size > 0) {
        const missingList = Array.from(missingTeams).map(t => `"${t}"`).join(", ");
        errors.push(`Please create all teams before sending mail. Missing team(s): ${missingList}`);
      }

      // Step 5: Check Email Uniqueness (Pre-flight all-or-nothing check against existing accounts and pending invitations)
      setAnalysisStep(5);
      setAnalysisStatus("Step 5/5: Checking email uniqueness against active accounts and pending invitations...");
      await sleep(350);

      const allCsvEmails = candidateRows.map(r => r.email);
      const existingEmailsFound = new Set<string>();

      // Check current in-memory members and invitations
      members.forEach(m => {
        if (allCsvEmails.includes(m.email.toLowerCase())) {
          existingEmailsFound.add(m.email.toLowerCase());
        }
      });
      invitations.forEach(inv => {
        if (allCsvEmails.includes(inv.email.toLowerCase())) {
          existingEmailsFound.add(inv.email.toLowerCase());
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

      // If any validation errors occurred, halt and block proceeding
      if (errors.length > 0) {
        setCsvError(errors.join("\n"));
        setParsedRoster([]);
        return;
      }

      // All validations passed!
      const userCount = validatedRoleRows.filter(r => r.role === "user").length;
      const mgrCount = validatedRoleRows.filter(r => r.role === "manager").length;
      const teamSet = new Set(validatedRoleRows.map(r => r.team_name));

      setParsedRoster(validatedRoleRows);
      setAnalysisSuccess(
        `All checks passed! Found ${validatedRoleRows.length} valid new candidate(s) (${userCount} user${userCount === 1 ? '' : 's'}, ${mgrCount} manager${mgrCount === 1 ? '' : 's'}) across ${teamSet.size} verified team(s). All details filled, roles validated, teams confirmed, and emails verified as new.`
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
    if (parsedRoster.length === 0) return;
    setCsvUploading(true);
    setCsvError(null);
    setFormSuccess(null);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < parsedRoster.length; i++) {
      const item = parsedRoster[i];
      setUploadProgressText(`Sending invitation and activation email (${i + 1} of ${parsedRoster.length}) to ${item.email}...`);

      try {
        const res = await fetch(`${cleanApiUrl}/api/enterprise/invite-team-member`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: item.email,
            first_name: item.first_name,
            last_name: item.last_name,
            role: item.role,
            team_name: item.team_name,
            hr_user_id: user?.id
          })
        });
        if (res.ok) {
          successCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          failCount++;
          errors.push(`${item.email}: ${errData.detail || "Failed to send invitation"}`);
        }
      } catch (err: any) {
        failCount++;
        errors.push(`${item.email}: ${err.message || "Network error"}`);
      }
    }

    setUploadProgressText(null);
    setCsvUploading(false);

    if (successCount > 0) {
      setFormSuccess(`Ingested Roster: Successfully invited ${successCount} member(s) and dispatched activation email(s)!${failCount > 0 ? ` (${failCount} errors)` : ""}`);
    }
    if (errors.length > 0) {
      setCsvError(`Failed invitations:\n${errors.join("\n")}`);
    }

    setCsvFile(null);
    setParsedRoster([]);
    setAnalysisSuccess(null);
    await fetchCompanyData();
  };

  const getInviteUrl = (token: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/accept-invite?token=${token}`;
    }
    return `/accept-invite?token=${token}`;
  };

  const handleCopyLink = (token: string) => {
    const url = getInviteUrl(token);
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Stats computation
  const totalManagersCount = members.filter(m => m.role === "manager").length;
  const pendingInvsCount = invitations.filter(i => i.status === "pending").length;
  const totalCompletedAssessments = members.filter(m => m.has_completed_assessment).length;

  if (authLoading || loading) {
    return (
      <InteractiveDashboardLoader 
        title="Corporate HR Dashboard" 
        subtitle="Enterprise Organization Hub" 
      />
    );
  }

  return (
    <>
      <main style={{ minHeight: '100vh', padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', boxSizing: 'border-box' }}>
      {/* Mesh Background Grid */}
      <div className="tie-dot-grid fixed inset-0 pointer-events-none opacity-40" />

      {/* Corporate HR Header */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2.5rem', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#5BA4A4' }} />
        
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', width: '100%', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '99px', background: '#F4F7FA', color: '#7B8794', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              <ShieldCheck size={11} style={{ color: '#5BA4A4' }} />
              Enterprise Organization Hub
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#243B53', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
              {profile?.email?.split("@")[1]?.split(".")[0]?.toUpperCase() || "TIE"} Corporate Office
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#627D98', marginTop: '0.35rem', fontWeight: 500, maxWidth: '600px', margin: '0.35rem 0 0 0' }}>
              Insulated workspace environment. Manage roles, audit team metrics, and invite team leaders or employee cohorts.
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

      {/* Operational Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', width: '100%' }}>
        
        {/* Card 1: Corporate Roster */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.06)', borderRadius: '20px', padding: '1.5rem', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '1.25rem', textAlign: 'left', transition: 'transform 0.2s', cursor: 'pointer' }}
             onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
             onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ padding: '12px', background: 'rgba(91,164,164,0.08)', color: '#5BA4A4', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate Roster</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#243B53', marginTop: '2px', lineHeight: 1 }}>{members.length}</span>
          </div>
        </div>

        {/* Card 2: Active Team Leads */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.06)', borderRadius: '20px', padding: '1.5rem', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '1.25rem', textAlign: 'left', transition: 'transform 0.2s', cursor: 'pointer' }}
             onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
             onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ padding: '12px', background: 'rgba(36,59,83,0.06)', color: '#243B53', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Team Leads</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#243B53', marginTop: '2px', lineHeight: 1 }}>{totalManagersCount}</span>
          </div>
        </div>

        {/* Card 3: Completed Reports */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.06)', borderRadius: '20px', padding: '1.5rem', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '1.25rem', textAlign: 'left', transition: 'transform 0.2s', cursor: 'pointer' }}
             onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
             onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ padding: '12px', background: 'rgba(46,125,50,0.06)', color: '#2E7D32', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} style={{ color: '#2E7D32' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Reports</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2E7D32', marginTop: '2px', lineHeight: 1 }}>{totalCompletedAssessments}</span>
          </div>
        </div>

        {/* Card 4: Pending Tokens */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.06)', borderRadius: '20px', padding: '1.5rem', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '1.25rem', textAlign: 'left', transition: 'transform 0.2s', cursor: 'pointer' }}
             onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
             onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ padding: '12px', background: 'rgba(217,119,6,0.06)', color: '#D97706', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={22} style={{ color: '#D97706' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Tokens</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#D97706', marginTop: '2px', lineHeight: 1 }}>{pendingInvsCount}</span>
          </div>
        </div>
        
      </div>

      {/* Dashboard Split Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', width: '100%', alignItems: 'start' }}>
        
        {/* Col 1: Create Team Card & Invite Manager Card */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          
          {/* Card 1.1: Create Team */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#F4F7FA', color: '#5BA4A4', borderRadius: '14px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#243B53', margin: 0 }}>Create Separate Team</h2>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>Establish team container first</p>
              </div>
            </div>

            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#627D98' }}>Team Name</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#9aa8b6' }}>
                    <Building2 size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Sales Team"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    onFocus={() => setFocusedField('newTeam')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem 0.8rem 2.8rem',
                      border: `1.5px solid ${focusedField === 'newTeam' ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
                      borderRadius: '12px',
                      background: focusedField === 'newTeam' ? '#ffffff' : '#F4F7FA',
                      color: '#1F2933',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxShadow: focusedField === 'newTeam' ? '0 0 0 3px rgba(91,164,164,0.15)' : 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={teamSubmitting}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: '#243B53',
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
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a2d40'}
                onMouseLeave={e => e.currentTarget.style.background = '#243B53'}
              >
                {teamSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Creating Team...</span>
                  </>
                ) : (
                  <>
                    <span>Create Team</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Team errors and success alerts */}
            {(teamSuccess || teamError) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {teamSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.8rem 1rem', background: 'rgba(46,125,50,0.06)', border: '1px solid rgba(46,125,50,0.15)', borderRadius: '12px', color: '#2E7D32', fontSize: '0.8125rem', fontWeight: 600 }}>
                    <CheckCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{teamSuccess}</span>
                  </div>
                )}
                {teamError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.8rem 1rem', background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.15)', borderRadius: '12px', color: '#c0392b', fontSize: '0.8125rem', fontWeight: 600 }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{teamError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Available Created Teams Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(36,59,83,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Available Teams in Company ({teams.length})
                </span>
                <span style={{ fontSize: '10px', color: '#5BA4A4', fontWeight: 700 }}>
                  Case-Insensitive
                </span>
              </div>
              {teams.length === 0 ? (
                <div style={{ padding: '0.75rem', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: '10px', color: '#B78103', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>
                  ⚠️ No teams created yet. HR Admin must create all teams (e.g. teachteam, pr team) before importing a roster.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {teams.map((t) => (
                    <span 
                      key={t.id}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        padding: '4px 10px', 
                        borderRadius: '8px', 
                        background: '#F4F7FA', 
                        border: '1px solid rgba(36,59,83,0.08)', 
                        color: '#243B53', 
                        fontSize: '0.75rem', 
                        fontWeight: 700 
                      }}
                    >
                      <Building2 size={11} style={{ color: '#5BA4A4' }} />
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card 1.2: Invite Team Lead */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#F4F7FA', color: '#5BA4A4', borderRadius: '14px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#243B53', margin: 0 }}>Invite Team Lead</h2>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>Provision team management access</p>
              </div>
            </div>

            <form onSubmit={handleInviteManager} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#627D98' }}>First Name</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#9aa8b6' }}>
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Jane"
                      value={mgrFirstName}
                      onChange={(e) => setMgrFirstName(e.target.value)}
                      onFocus={() => setFocusedField('mgrFirst')}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem 0.8rem 2.8rem',
                        border: `1.5px solid ${focusedField === 'mgrFirst' ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
                        borderRadius: '12px',
                        background: focusedField === 'mgrFirst' ? '#ffffff' : '#F4F7FA',
                        color: '#1F2933',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        outline: 'none',
                        boxShadow: focusedField === 'mgrFirst' ? '0 0 0 3px rgba(91,164,164,0.15)' : 'none',
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
                      value={mgrLastName}
                      onChange={(e) => setMgrLastName(e.target.value)}
                      onFocus={() => setFocusedField('mgrLast')}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem 0.8rem 2.8rem',
                        border: `1.5px solid ${focusedField === 'mgrLast' ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
                        borderRadius: '12px',
                        background: focusedField === 'mgrLast' ? '#ffffff' : '#F4F7FA',
                        color: '#1F2933',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        outline: 'none',
                        boxShadow: focusedField === 'mgrLast' ? '0 0 0 3px rgba(91,164,164,0.15)' : 'none',
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
                    placeholder="lead@company.com"
                    value={mgrEmail}
                    onChange={(e) => setMgrEmail(e.target.value)}
                    onFocus={() => setFocusedField('mgrEmail')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem 0.8rem 2.8rem',
                      border: `1.5px solid ${focusedField === 'mgrEmail' ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
                      borderRadius: '12px',
                      background: focusedField === 'mgrEmail' ? '#ffffff' : '#F4F7FA',
                      color: '#1F2933',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxShadow: focusedField === 'mgrEmail' ? '0 0 0 3px rgba(91,164,164,0.15)' : 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#627D98' }}>Department / Team</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#9aa8b6' }}>
                    <Building2 size={16} />
                  </span>
                  <select
                    value={mgrTeamName}
                    onChange={(e) => setMgrTeamName(e.target.value)}
                    onFocus={() => setFocusedField('mgrTeam')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem 0.8rem 2.8rem',
                      border: `1.5px solid ${focusedField === 'mgrTeam' ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
                      borderRadius: '12px',
                      background: focusedField === 'mgrTeam' ? '#ffffff' : '#F4F7FA',
                      color: '#1F2933',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxShadow: focusedField === 'mgrTeam' ? '0 0 0 3px rgba(91,164,164,0.15)' : 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      height: '45px'
                    }}
                    required
                  >
                    <option value="">-- Select Team --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                {teams.length === 0 ? (
                  <span style={{ fontSize: '10px', color: '#c0392b', fontWeight: 700, marginTop: '2px' }}>
                    ⚠️ No teams exist. Create a team first!
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', color: '#9aa8b6', fontWeight: 500, fontStyle: 'italic', marginTop: '2px' }}>Assigns manager to the selected team.</span>
                )}
              </div>

              <button
                type="submit"
                disabled={mgrSubmitting || teams.length === 0}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: teams.length === 0 ? '#bdc3c7' : '#5BA4A4',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: teams.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: teams.length === 0 ? 'none' : '0 4px 6px -1px rgba(91,164,164,0.2), 0 2px 4px -1px rgba(91,164,164,0.1)'
                }}
                onMouseEnter={e => { if (teams.length > 0) { e.currentTarget.style.background = '#4a9393'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { if (teams.length > 0) { e.currentTarget.style.background = '#5BA4A4'; e.currentTarget.style.transform = 'none'; } }}
              >
                {mgrSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Generating Invite...</span>
                  </>
                ) : (
                  <>
                    <span>Send Manager Invite</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Form Errors and Success Alerts */}
            {(formSuccess || formError) && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
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
                    {generatedMgrInviteUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap', maxWidth: '100%' }}>
                        <button
                          type="button"
                          onClick={handleCopyMgrInviteLink}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            background: copiedMgrInvite ? '#166534' : '#ffffff',
                            color: copiedMgrInvite ? '#ffffff' : '#2E7D32',
                            border: '1px solid rgba(46,125,50,0.25)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flexShrink: 0
                          }}
                        >
                          {copiedMgrInvite ? (
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

        {/* Col 2 & 3: CSV File Dropzone & Pending Invites */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', gridColumn: 'span 2' }}>
          
          {/* CSV File Dropzone & Validation Pipeline */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: '#F4F7FA', color: '#5BA4A4', borderRadius: '14px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#243B53', margin: 0 }}>CSV Roster Ingestion & Validation</h2>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>Strict prerequisite validation & automated email dispatch</p>
                </div>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: teams.length > 0 ? 'rgba(91,164,164,0.1)' : 'rgba(217,119,6,0.1)', color: teams.length > 0 ? '#5BA4A4' : '#D97706', fontSize: '10px', fontWeight: 700 }}>
                <ShieldCheck size={13} />
                <span>{teams.length} Team{teams.length === 1 ? '' : 's'} Registered</span>
              </div>
            </div>

            {/* Prerequisite Guidance Note */}
            <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} style={{ color: '#5BA4A4', flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: '#627D98', fontWeight: 600 }}>
                  <strong style={{ color: '#243B53' }}>Prerequisite:</strong> First create all teams (e.g. teachteam, pr team) before importing. Role must be <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: '4px', color: '#1E293B', fontWeight: 700 }}>user</code> or <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: '4px', color: '#1E293B', fontWeight: 700 }}>manager</code>.
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', width: '100%' }}>
              
              {/* Dropzone */}
              <div style={{ border: '2px dashed rgba(36,59,83,0.15)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', position: 'relative', cursor: 'pointer', transition: 'border-color 0.2s', minHeight: '160px' }}
                   onMouseEnter={e => e.currentTarget.style.borderColor = '#5BA4A4'}
                   onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(36,59,83,0.15)'}>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleCsvChange}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 5 }}
                />
                <Upload size={28} style={{ color: '#5BA4A4', marginBottom: '8px' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#243B53', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {csvFile ? csvFile.name : "Select or Drop CSV File"}
                </span>
                <span style={{ fontSize: '10px', color: '#9aa8b6', fontWeight: 500, marginTop: '4px' }}>
                  Headers: email, first_name, last_name, role, team_name
                </span>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px', position: 'relative', zIndex: 10 }}>
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
                      textDecoration: 'underline'
                    }}
                  >
                    Sample Template
                  </button>
                  {csvFile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCsvFile(null);
                        setParsedRoster([]);
                        setCsvError(null);
                        setAnalysisSuccess(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#c0392b',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Clear File
                    </button>
                  )}
                </div>
              </div>

              {/* Status / Analysis Pipeline / Progression Panel */}
              <div style={{ background: '#F8FAFC', border: '1px solid rgba(36,59,83,0.08)', padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px', textAlign: 'left' }}>
                
                {/* 1. Loading Text: Analysis in Progress */}
                {isAnalyzing && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', height: '100%', padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Loader2 className="animate-spin text-[#5BA4A4]" size={22} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#5BA4A4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Analyzing CSV Pipeline (Step {analysisStep}/5)
                        </span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#243B53', marginTop: '2px' }}>
                          {analysisStatus || "Analyzing CSV file..."}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar Indicator */}
                    <div style={{ width: '100%', height: '6px', background: 'rgba(91,164,164,0.15)', borderRadius: '99px', overflow: 'hidden', marginTop: '4px' }}>
                      <div style={{ width: `${(analysisStep / 5) * 100}%`, height: '100%', background: '#5BA4A4', transition: 'width 0.3s ease' }} />
                    </div>
                    <span style={{ fontSize: '10px', color: '#9aa8b6', fontWeight: 500, fontStyle: 'italic' }}>
                      Checking completeness, role validity ('user'/'manager'), team existence, and email uniqueness...
                    </span>
                  </div>
                )}

                {/* 2. Loading Text: Batch Upload / Dispatching in Progress */}
                {csvUploading && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', height: '100%', padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Loader2 className="animate-spin text-[#243B53]" size={22} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#243B53', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Provisioning & Email Dispatch
                        </span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#243B53', marginTop: '2px' }}>
                          {uploadProgressText || "Dispatching activation emails..."}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', color: '#9aa8b6', fontWeight: 500, fontStyle: 'italic' }}>
                      Creating invitations and dispatching secure activation links...
                    </span>
                  </div>
                )}

                {/* 3. Error Banner: Validation Failed */}
                {!isAnalyzing && !csvUploading && csvError && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c0392b', fontSize: '0.75rem', fontWeight: 800 }}>
                      <AlertCircle size={15} style={{ flexShrink: 0 }} />
                      <span>Validation Failed — Cannot Proceed</span>
                    </div>
                    <div style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '8px', padding: '0.75rem', color: '#c0392b', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                      {csvError}
                    </div>
                    <span style={{ fontSize: '10px', color: '#9aa8b6', fontWeight: 500, fontStyle: 'italic' }}>
                      Please resolve the issues above or update the CSV file before sending mail.
                    </span>
                  </div>
                )}

                {/* 4. Success State: Verified & Ready to Proceed */}
                {!isAnalyzing && !csvUploading && !csvError && analysisSuccess && parsedRoster.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2E7D32', fontSize: '0.75rem', fontWeight: 800 }}>
                      <CheckCircle size={15} style={{ flexShrink: 0 }} />
                      <span>CSV Analysis Verified</span>
                    </div>
                    <div style={{ background: 'rgba(46,125,50,0.06)', border: '1px solid rgba(46,125,50,0.2)', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#2E7D32', fontSize: '0.75rem', fontWeight: 600 }}>
                      {analysisSuccess}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#ffffff', border: '1px solid rgba(36,59,83,0.1)', fontSize: '10px', fontWeight: 700, color: '#243B53' }}>
                        {parsedRoster.length} Total Rows
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#ffffff', border: '1px solid rgba(36,59,83,0.1)', fontSize: '10px', fontWeight: 700, color: '#5BA4A4' }}>
                        {parsedRoster.filter(r => r.role === 'user').length} Users
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#ffffff', border: '1px solid rgba(36,59,83,0.1)', fontSize: '10px', fontWeight: 700, color: '#2E7D32' }}>
                        {parsedRoster.filter(r => r.role === 'manager').length} Managers
                      </span>
                    </div>

                    <button
                      onClick={handleUploadRoster}
                      disabled={csvUploading}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#243B53',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '4px',
                        boxShadow: '0 4px 6px -1px rgba(36,59,83,0.2)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#1a2d40'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#243B53'; e.currentTarget.style.transform = 'none'; }}
                    >
                      <Mail size={14} />
                      <span>Proceed to Send Invitations & Mails</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* 5. Idle Initial State */}
                {!isAnalyzing && !csvUploading && !csvError && !analysisSuccess && (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#243B53' }}>
                      Ready for Roster Ingestion
                    </span>
                    <span style={{ fontSize: '11px', color: '#627D98', fontWeight: 500, lineHeight: 1.4 }}>
                      Select or drop a CSV file on the left. The system will automatically analyze data completeness, role values, created teams, and email uniqueness before unlocking invitations.
                    </span>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Pending Invites Registry */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#F4F7FA', color: '#5BA4A4', borderRadius: '14px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#243B53', margin: 0 }}>Pending Corporate Invitation Tokens</h2>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>Single-use secure workspace activation links</p>
              </div>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              {invitations.filter(i => i.status === "pending").length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9aa8b6', fontSize: '0.8125rem', fontWeight: 500, fontStyle: 'italic' }}>
                  No active pending registration tokens found.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #F4F7FA' }}>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.6875rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.6875rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workspace Role</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.6875rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Invitation Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.filter(i => i.status === "pending").map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #F4F7FA' }}>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem', fontWeight: 700, color: '#243B53' }}>{inv.email}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', background: 'rgba(36,59,83,0.06)', color: '#243B53', fontWeight: 800, textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em' }}>
                            {inv.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleCopyLink(inv.token)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              border: '1.5px solid #5BA4A4',
                              background: 'rgba(91,164,164,0.06)',
                              color: '#5BA4A4',
                              fontSize: '10px',
                              fontWeight: 700,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(91,164,164,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(91,164,164,0.06)'}
                          >
                            {copiedToken === inv.token ? (
                              <>
                                <Check size={11} style={{ color: '#A3B18A' }} />
                                <span style={{ color: '#A3B18A', fontWeight: 800 }}>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Workforce assessments registry */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2.5rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', background: '#F4F7FA', color: '#5BA4A4', borderRadius: '14px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#243B53', margin: 0 }}>Organization Assessment Registry</h2>
            <p style={{ fontSize: '9px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>Real-time audit of workforce onboarding status and assessment results</p>
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9aa8b6', fontSize: '0.875rem', fontWeight: 500, fontStyle: 'italic' }}>
              No employees or managers currently resolved in your corporate environment.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #F4F7FA' }}>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee Name</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Designation</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const teamSlug = member.team_name ? member.team_name.toLowerCase().replace(/ /g, "-") : "none";
                  return (
                    <tr key={member.id} style={{ borderBottom: '1px solid #F4F7FA' }}>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 700, color: '#243B53', textAlign: 'left' }}>
                        {member.first_name || member.last_name 
                          ? `${member.first_name} ${member.last_name}` 
                          : <span style={{ color: '#9aa8b6', fontWeight: 500, fontStyle: 'italic' }}>Onboarding pending</span>
                        }
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.8125rem', color: '#627D98', textAlign: 'left' }}>{member.email}</td>
                      <td style={{ padding: '1rem', fontSize: '0.8125rem', color: '#243B53', fontWeight: 700, textAlign: 'left' }}>
                        {member.designation || <span style={{ color: '#9aa8b6', fontWeight: 500, fontStyle: 'italic' }}>Not set</span>}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'left' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '30px', fontSize: '10px', fontWeight: 800, background: 'rgba(36,59,83,0.06)', color: '#243B53' }}>
                          {member.team_name || "Unassigned"}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'left' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '30px',
                          fontSize: '10px',
                          fontWeight: 800,
                          background: member.has_completed_assessment ? 'rgba(46,125,50,0.06)' : 'rgba(217,119,6,0.06)',
                          color: member.has_completed_assessment ? '#2E7D32' : '#D97706'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: member.has_completed_assessment ? '#2E7D32' : '#F59E0B'
                          }} />
                          {member.has_completed_assessment ? "Report Ready" : "Awaiting Responses"}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {member.has_completed_assessment ? (
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
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 700,
                              borderRadius: '8px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#1a2d40'}
                            onMouseLeave={e => e.currentTarget.style.background = '#243B53'}
                          >
                            <FileText size={12} />
                            <span>View Report</span>
                          </button>
                        ) : (
                          <span style={{ color: '#9aa8b6', fontSize: '11px', fontWeight: 500, fontStyle: 'italic' }}>Pending completion</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
                justifyContent: 'between'
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider" style={{ margin: 0 }}>
                  Report Preview: {selectedMember.first_name} {selectedMember.last_name}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5" style={{ margin: '4px 0 0 0' }}>Enforcing Database-level insulation metrics (RLS)</p>
              </div>
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
                    department={selectedMember.team_name || "tech-team"}
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
    </>
  );
}
