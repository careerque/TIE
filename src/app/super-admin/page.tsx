"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { 
  Building2, 
  UserPlus, 
  FileSpreadsheet, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Sparkles, 
  Info, 
  TrendingUp, 
  ArrowRight,
  Loader2,
  UserCheck,
  Clock,
  User,
  Mail,
  FileText
} from "lucide-react";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  company_id: string;
  token: string;
  status: string;
  created_at: string;
  accepted_at: string;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { isLoggedIn, user, profile, loading: authLoading } = useAuthContext();

  // API Data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms State
  const [companyName, setCompanyName] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");
  const [companySubmitting, setCompanySubmitting] = useState(false);

  const [hrEmail, setHrEmail] = useState("");
  const [hrFirstName, setHrFirstName] = useState("");
  const [hrLastName, setHrLastName] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [hrSubmitting, setHrSubmitting] = useState(false);

  // UI Feedback
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const cleanApiUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }
      if (profile?.role !== "super_admin") {
        router.push("/dashboard");
        return;
      }
      fetchInitialData();
    }
  }, [isLoggedIn, profile, authLoading, router]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const compRes = await fetch(`${cleanApiUrl}/api/companies`);
      const comps = await compRes.json();
      setCompanies(comps);

      const invRes = await fetch(`${cleanApiUrl}/api/invitations`);
      const invs = await invRes.json();
      setInvitations(invs);
      
      if (comps.length > 0) {
        setSelectedCompanyId(comps[0].id);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    
    if (!companyName.trim()) return;

    setCompanySubmitting(true);
    try {
      const res = await fetch(`${cleanApiUrl}/api/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          description: companyDesc.trim() || null
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to create company");
      }

      setCompanyName("");
      setCompanyDesc("");
      setFormSuccess(`Company "${data.name}" created successfully!`);
      
      // Refresh list
      const compRes = await fetch(`${cleanApiUrl}/api/companies`);
      const comps = await compRes.json();
      setCompanies(comps);
      
      if (!selectedCompanyId) {
        setSelectedCompanyId(data.id);
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to create company.");
    } finally {
      setCompanySubmitting(false);
    }
  };

  const handleInviteHr = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!hrEmail.trim() || !selectedCompanyId) {
      setFormError("Please select a company and enter an email.");
      return;
    }

    setHrSubmitting(true);
    try {
      const res = await fetch(`${cleanApiUrl}/api/invitations/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: hrEmail.trim(),
          role: "hr_admin",
          company_id: selectedCompanyId,
          invited_by: user?.id // For tracing
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to invite HR admin");
      }

      setHrEmail("");
      setFormSuccess(`Invitation successfully generated for ${data.invitation.email}!`);
      
      // Refresh list
      const invRes = await fetch(`${cleanApiUrl}/api/invitations`);
      const invs = await invRes.json();
      setInvitations(invs);
    } catch (err: any) {
      setFormError(err.message || "Failed to invite HR Admin.");
    } finally {
      setHrSubmitting(false);
    }
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

  const getCompanyName = (compId: string) => {
    const comp = companies.find(c => c.id === compId);
    return comp ? comp.name : "Unknown Company";
  };

  // Stats computation
  const totalInvites = invitations.length;
  const acceptedInvites = invitations.filter(i => i.status === "accepted").length;
  const pendingInvites = totalInvites - acceptedInvites;

  if (authLoading || loading) {
    return (
      <main className="tie-container bg-mesh">
        <div className="tie-dot-grid" aria-hidden />
        <div className="tie-card" style={{ alignItems: "center", justifyContent: "center", minHeight: "350px" }}>
          <div className="tie-card-top-bar" />
          <Loader2 className="animate-spin" size={36} style={{ color: "#5BA4A4", marginBottom: "1rem" }} />
          <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#627D98" }}>
            Loading Super Admin Control Panel...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }} className="animate-fade-in">
      {/* Mesh Background */}
      <div className="tie-dot-grid fixed inset-0 pointer-events-none opacity-40" />

      {/* Header Panel */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2.5rem', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#243B53' }} />
        
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', width: '100%', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '99px', background: '#F4F7FA', color: '#7B8794', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              <Sparkles size={11} style={{ color: '#5BA4A4' }} />
              Super Administration Panel
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#243B53', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
              TIE Platform Operations
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#627D98', marginTop: '0.35rem', fontWeight: 500, maxWidth: '600px', margin: '0.35rem 0 0 0' }}>
              Register new corporate partner workspaces, provision HR organization administrators, and audit system-wide access invitations.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link 
              href="/dashboard" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                border: '1.5px solid rgba(36,59,83,0.15)',
                color: '#243B53',
                fontSize: '0.8125rem',
                fontWeight: 700,
                borderRadius: '12px',
                background: '#ffffff',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(36,59,83,0.05)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F4F7FA'; e.currentTarget.style.borderColor = 'rgba(36,59,83,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(36,59,83,0.15)'; }}
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {/* Card 1 */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '20px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(36,59,83,0.03)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Companies</span>
            <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#243B53', marginTop: '0.25rem', lineHeight: 1 }}>{companies.length}</span>
          </div>
          <div style={{ padding: '12px', background: '#F4F7FA', color: '#243B53', borderRadius: '16px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={24} />
          </div>
        </div>
        
        {/* Card 2 */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '20px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(36,59,83,0.03)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Invites</span>
            <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#243B53', marginTop: '0.25rem', lineHeight: 1 }}>{totalInvites}</span>
          </div>
          <div style={{ padding: '12px', background: '#F4F7FA', color: '#5BA4A4', borderRadius: '16px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LinkIcon size={24} />
          </div>
        </div>

        {/* Card 3 */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '20px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(36,59,83,0.03)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activated Users</span>
            <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#A3B18A', marginTop: '0.25rem', lineHeight: 1 }}>{acceptedInvites}</span>
          </div>
          <div style={{ padding: '12px', background: 'rgba(163,177,138,0.1)', color: '#A3B18A', borderRadius: '16px', border: '1px solid rgba(163,177,138,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={24} />
          </div>
        </div>

        {/* Card 4 */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '20px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(36,59,83,0.03)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Invites</span>
            <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#F4B942', marginTop: '0.25rem', lineHeight: 1 }}>{pendingInvites}</span>
          </div>
          <div style={{ padding: '12px', background: 'rgba(244,185,66,0.1)', color: '#F4B942', borderRadius: '16px', border: '1px solid rgba(244,185,66,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {(formSuccess || formError) && (
        <div className="animate-fade-up" style={{ width: '100%' }}>
          {formSuccess && (
            <div style={{ padding: '1rem 1.25rem', borderRadius: '16px', border: '1.5px solid rgba(163,177,138,0.3)', background: 'rgba(163,177,138,0.06)', color: '#4F5E3D', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(163,177,138,0.05)', textAlign: 'left' }}>
              <Check size={16} style={{ color: '#A3B18A', flexShrink: 0 }} />
              <span>{formSuccess}</span>
            </div>
          )}
          {formError && (
            <div style={{ padding: '1rem 1.25rem', borderRadius: '16px', border: '1.5px solid rgba(220,53,69,0.2)', background: 'rgba(220,53,69,0.04)', color: '#c0392b', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(220,53,69,0.03)', textAlign: 'left' }}>
              <Info size={16} style={{ color: '#c0392b', flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}
        </div>
      )}

      {/* Forms Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Card 1: Create Company */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2.5rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: '#F4F7FA', color: '#243B53', borderRadius: '14px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#243B53', margin: 0 }}>Add New Partner Company</h2>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>Register corporate entities</p>
            </div>
          </div>
          
          <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#627D98' }}>Company Name</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#9aa8b6' }}>
                  <Building2 size={16} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onFocus={() => setFocusedField('compName')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 2.8rem',
                    border: `1.5px solid ${focusedField === 'compName' ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
                    borderRadius: '12px',
                    background: focusedField === 'compName' ? '#ffffff' : '#F4F7FA',
                    color: '#1F2933',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxShadow: focusedField === 'compName' ? '0 0 0 3px rgba(91,164,164,0.15)' : 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#627D98' }}>Description / Scope</label>
              <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ position: 'absolute', left: '14px', top: '14px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#9aa8b6' }}>
                  <FileText size={16} />
                </span>
                <textarea
                  placeholder="Corporate workspace description, active licenses count, pilot info, etc."
                  value={companyDesc}
                  onChange={(e) => setCompanyDesc(e.target.value)}
                  onFocus={() => setFocusedField('compDesc')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 2.8rem',
                    border: `1.5px solid ${focusedField === 'compDesc' ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
                    borderRadius: '12px',
                    background: focusedField === 'compDesc' ? '#ffffff' : '#F4F7FA',
                    color: '#1F2933',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxShadow: focusedField === 'compDesc' ? '0 0 0 3px rgba(91,164,164,0.15)' : 'none',
                    minHeight: '120px',
                    resize: 'vertical',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    flex: 1
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={companySubmitting}
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
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(36,59,83,0.15)',
                marginTop: '0.5rem'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1a2d40'}
              onMouseLeave={e => e.currentTarget.style.background = '#243B53'}
            >
              {companySubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Register Company</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Card 2: Invite HR Admin */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2.5rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: '#F4F7FA', color: '#5BA4A4', borderRadius: '14px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#243B53', margin: 0 }}>Invite HR Organization Admin</h2>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>Provision management access</p>
            </div>
          </div>

          <form onSubmit={handleInviteHr} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, textAlign: 'left' }}>


            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#627D98' }}>HR Admin Email</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#9aa8b6' }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="hr@partnercompany.com"
                  value={hrEmail}
                  onChange={(e) => setHrEmail(e.target.value)}
                  onFocus={() => setFocusedField('hrEmail')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 2.8rem',
                    border: `1.5px solid ${focusedField === 'hrEmail' ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
                    borderRadius: '12px',
                    background: focusedField === 'hrEmail' ? '#ffffff' : '#F4F7FA',
                    color: '#1F2933',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxShadow: focusedField === 'hrEmail' ? '0 0 0 3px rgba(91,164,164,0.15)' : 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#627D98' }}>Associate Company</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#9aa8b6' }}>
                  <Building2 size={16} />
                </span>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  onFocus={() => setFocusedField('hrCompany')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 2.5rem 0.8rem 2.8rem',
                    border: `1.5px solid ${focusedField === 'hrCompany' ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
                    borderRadius: '12px',
                    background: focusedField === 'hrCompany' ? '#ffffff' : '#F4F7FA',
                    color: '#1F2933',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxShadow: focusedField === 'hrCompany' ? '0 0 0 3px rgba(91,164,164,0.15)' : 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  {companies.length === 0 ? (
                    <option value="">-- Register a company first --</option>
                  ) : (
                    companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  )}
                </select>
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9aa8b6', fontSize: '9px' }}>▼</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={hrSubmitting || companies.length === 0}
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
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(91,164,164,0.18)',
                marginTop: '0.5rem'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4a9393'}
              onMouseLeave={e => e.currentTarget.style.background = '#5BA4A4'}
            >
              {hrSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Generating Token...</span>
                </>
              ) : (
                <>
                  <span>Generate Invitation Token</span>
                  <LinkIcon size={14} />
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Audit Log / Tables Section */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(36,59,83,0.08)', borderRadius: '24px', padding: '2.5rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', background: '#F4F7FA', color: '#243B53', borderRadius: '14px', border: '1px solid rgba(36,59,83,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSpreadsheet size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#243B53', margin: 0 }}>Invitations and Access Registry</h2>
            <p style={{ fontSize: '9px', fontWeight: 700, color: '#9aa8b6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>Audit log of system invites</p>
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          {invitations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9aa8b6', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              No access invitations generated yet. Create a company and invite an HR admin to begin.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid rgba(36,59,83,0.08)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 800, color: '#9aa8b6' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Invitee Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Company</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Created Date</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Invitation Link</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid rgba(36,59,83,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F4F7FA'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '1.2rem 1rem', fontWeight: 700, color: '#243B53', textAlign: 'left' }}>{inv.email}</td>
                    <td style={{ padding: '1.2rem 1rem', color: '#627D98', fontWeight: 600, textAlign: 'left' }}>{getCompanyName(inv.company_id)}</td>
                    <td style={{ padding: '1.2rem 1rem', textAlign: 'left' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, background: '#E4E7EB', color: '#486581', textTransform: 'uppercase' }}>
                        {inv.role === "hr_admin" ? "HR Admin" : inv.role}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1rem', textAlign: 'left' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '9px',
                        fontWeight: 700,
                        background: inv.status === "accepted" ? 'rgba(163,177,138,0.15)' : 'rgba(244,185,66,0.15)',
                        color: inv.status === "accepted" ? '#4F5E3D' : '#A7791F',
                        border: `1px solid ${inv.status === "accepted" ? 'rgba(163,177,138,0.2)' : 'rgba(244,185,66,0.2)'}`,
                        textTransform: 'uppercase'
                      }}>
                        {inv.status === "accepted" ? "Activated" : "Pending"}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1rem', color: '#9aa8b6', fontWeight: 600, textAlign: 'left' }}>
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1.2rem 1rem', textAlign: 'right' }}>
                      {inv.status === "pending" ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
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
                            title="Copy invitation link"
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
                        </div>
                      ) : (
                        <span style={{ color: '#9aa8b6', fontSize: '10px', fontWeight: 600, fontStyle: 'italic' }}>
                          Activated on {new Date(inv.accepted_at).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
