'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect, CSSProperties } from 'react';
import { useAuth } from '@/hooks/useAuth';

/* ─── Icons ─────────────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa8b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
  </svg>
);
const ShieldCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3B18A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/>
  </svg>
);
const CheckCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3B18A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="9,12 11,14 15,10"/>
  </svg>
);
const XCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa8b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const SuccessIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A3B18A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

/* ─── Password strength helpers ─────────────────────────── */
const rules = [
  { label: 'At least 8 characters',       test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',         test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number',                   test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character',        test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function strengthScore(p: string) { return rules.filter(r => r.test(p)).length; }
const strengthMeta: Record<number, { label: string; color: string }> = {
  0: { label: '', color: 'rgba(36,59,83,0.10)' },
  1: { label: 'Weak',      color: '#e05c5c' },
  2: { label: 'Fair',      color: '#e0a64a' },
  3: { label: 'Good',      color: '#5BA4A4' },
  4: { label: 'Strong',    color: '#A3B18A' },
};

/* ─── Component ─────────────────────────────────────────── */
export default function UpdatePasswordPage() {
  const { handleUpdatePassword, loading, error, successMessage, setError } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const passwordRef = useRef<HTMLInputElement>(null);
  useEffect(() => { passwordRef.current?.focus(); }, []);

  const score = strengthScore(password);
  const meta  = strengthMeta[score];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      return setError('Please enter a new password.');
    }
    if (score < 2) {
      return setError('Please choose a stronger password.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    await handleUpdatePassword(password);
  };

  /* Shared input style */
  const inp = (field: string): CSSProperties => ({
    display: 'block',
    width: '100%',
    padding: '11px 44px',
    border: `1.5px solid ${focused === field ? '#5BA4A4' : 'rgba(36,59,83,0.15)'}`,
    borderRadius: '10px',
    background: focused === field ? '#ffffff' : '#F4F7FA',
    color: '#1F2933',
    fontSize: '0.9375rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxShadow: focused === field
      ? '0 0 0 3px rgba(91,164,164,0.14), 0 1px 3px rgba(36,59,83,0.06)'
      : '0 1px 3px rgba(36,59,83,0.05)',
    transition: 'border-color .18s, box-shadow .18s, background .18s',
    boxSizing: 'border-box',
  });

  return (
    <main style={{
      minHeight: 'calc(100vh - 150px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      background: 'linear-gradient(135deg, #eef2f7 0%, #F4F7FA 55%, #e8edf4 100%)',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* bg blobs */}
      <div aria-hidden style={{ position:'fixed', top:'-130px', left:'-130px', width:'420px', height:'420px', borderRadius:'50%', background:'radial-gradient(circle, rgba(91,164,164,0.13) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div aria-hidden style={{ position:'fixed', bottom:'-130px', right:'-130px', width:'420px', height:'420px', borderRadius:'50%', background:'radial-gradient(circle, rgba(36,59,83,0.09) 0%, transparent 70%)', pointerEvents:'none' }} />

      {/* ── Card ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 8px 40px rgba(36,59,83,0.12), 0 2px 8px rgba(36,59,83,0.06)',
        border: '1px solid rgba(36,59,83,0.08)',
        width: '100%',
        maxWidth: '440px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
        animation: 'cardIn .52s cubic-bezier(.22,1,.36,1) both',
      }}>

        {/* top accent bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #243B53 0%, #5BA4A4 55%, #A3B18A 100%)' }} />

        <div style={{ padding: '2.25rem 2.5rem 2.5rem' }}>

          {/* ── Logo ── */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'0.5rem', animation:'fadeUp .5s .06s both' }}>
            <Image
              src="/logo.png"
              alt="Company Logo"
              width={152}
              height={65}
              priority
              style={{
                display: "block",
                height: "65px",
                width: "auto",
              }}
            />
          </div>

          {!successMessage ? (
            <>
              {/* ── Heading ── */}
              <div style={{ textAlign: 'center', marginBottom: '1.75rem', animation: 'fadeUp .5s .13s both' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#243B53', letterSpacing: '-0.03em', marginBottom: '0.3rem', lineHeight: 1.15 }}>
                  Set New Password
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#627D98', fontWeight: 400 }}>
                  Create a secure new password for your account.
                </p>
              </div>

              {/* ── Error banner ── */}
              {error && (
                <div role="alert" style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(220,53,69,0.06)',
                  border: '1px solid rgba(220,53,69,0.18)',
                  borderRadius: '10px',
                  color: '#c0392b',
                  fontSize: '0.8375rem',
                  fontWeight: 500,
                  animation: 'fadeIn .22s both',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', animation: 'fadeUp .5s .20s both' }}>

                {/* Password */}
                <div>
                  <label htmlFor="password" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#243B53', marginBottom: '0.4rem' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 1 }}>
                      <LockIcon />
                    </span>
                    <input
                      ref={passwordRef}
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(null); }}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      placeholder="Create a strong password"
                      style={{ ...inp('password'), paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9aa8b6', display: 'flex', alignItems: 'center', padding: 0, zIndex: 1 }}
                    >
                      {showPass ? <EyeOpen /> : <EyeOff />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div style={{ marginTop:'0.6rem', animation:'fadeIn .2s both' }}>
                      <div style={{ display:'flex', gap:'4px', marginBottom:'0.4rem' }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{
                            flex: 1, height: '3px', borderRadius: '99px',
                            background: i <= score ? meta.color : 'rgba(36,59,83,0.10)',
                            transition: 'background .25s',
                          }} />
                        ))}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                          {rules.map((r, idx) => {
                            const ok = r.test(password);
                            return (
                              <span key={idx} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.7rem', color: ok ? '#A3B18A' : '#9aa8b6', transition:'color .2s' }}>
                                {ok ? <CheckCircle /> : <XCircle />} {r.label}
                              </span>
                            );
                          })}
                        </div>
                        {meta.label && (
                          <span style={{ fontSize:'0.75rem', fontWeight:700, color: meta.color, letterSpacing:'0.03em', alignSelf:'flex-start', paddingTop:'2px' }}>
                            {meta.label}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#243B53', marginBottom: '0.4rem' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 1 }}>
                      <LockIcon />
                    </span>
                    <input
                      id="confirmPassword"
                      type={showConfirmPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(null); }}
                      onFocus={() => setFocused('confirmPassword')}
                      onBlur={() => setFocused(null)}
                      placeholder="Confirm your password"
                      style={{ ...inp('confirmPassword'), paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(v => !v)}
                      aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9aa8b6', display: 'flex', alignItems: 'center', padding: 0, zIndex: 1 }}
                    >
                      {showConfirmPass ? <EyeOpen /> : <EyeOff />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.825rem 1.5rem',
                    marginTop: '0.25rem',
                    background: loading ? '#7bbfbf' : '#5BA4A4',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 3px 14px rgba(91,164,164,0.34)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'background .18s, transform .12s, box-shadow .18s',
                  }}
                  onMouseEnter={e => { if (!loading) { const b = e.currentTarget; b.style.background='#4a9393'; b.style.transform='translateY(-1px)'; b.style.boxShadow='0 6px 20px rgba(91,164,164,0.42)'; }}}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.background=loading?'#7bbfbf':'#5BA4A4'; b.style.transform='none'; b.style.boxShadow='0 3px 14px rgba(91,164,164,0.34)'; }}
                >
                  {loading ? (
                    <>
                      <span style={{ width:'17px', height:'17px', border:'2.5px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .72s linear infinite' }} />
                      Resetting Password…
                    </>
                  ) : 'Reset Password  →'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', animation: 'fadeIn .4s ease both', padding: '1rem 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(163, 177, 138, 0.12)', color: '#A3B18A', marginBottom: '1.25rem' }}>
                <SuccessIcon />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#243B53', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                Password Updated!
              </h1>
              <p style={{ fontSize: '0.9rem', color: '#627D98', lineHeight: 1.5, marginBottom: '2rem' }}>
                {successMessage}
              </p>
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '0.825rem 1.5rem',
                  background: '#5BA4A4',
                  color: '#ffffff',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 3px 14px rgba(91,164,164,0.34)',
                  transition: 'background .18s, transform .12s, box-shadow .18s',
                }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.background='#4a9393'; b.style.transform='translateY(-1px)'; b.style.boxShadow='0 6px 20px rgba(91,164,164,0.42)'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.background='#5BA4A4'; b.style.transform='none'; b.style.boxShadow='0 3px 14px rgba(91,164,164,0.34)'; }}
              >
                Go to Sign In  →
              </Link>
            </div>
          )}

          {/* Back to login */}
          <div style={{ borderTop:'1px solid rgba(36,59,83,0.08)', marginTop:'1.75rem', paddingTop:'1.25rem', textAlign:'center', animation:'fadeUp .5s .38s both' }}>
            <Link
              href="/login"
              style={{ color:'#627D98', fontWeight:600, fontSize:'0.875rem', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'0.375rem' }}
              onMouseEnter={e => (e.currentTarget.style.color='#243B53')}
              onMouseLeave={e => (e.currentTarget.style.color='#627D98')}
            >
              Sign In Instead
            </Link>
          </div>

          {/* ── Divider ── */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', margin:'1.5rem 0 1rem', animation:'fadeUp .5s .44s both' }}>
            <div style={{ flex:1, height:'1px', background:'rgba(36,59,83,0.09)' }} />
            <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#9aa8b6', letterSpacing:'0.07em', textTransform:'uppercase' }}>Secure Data Management</span>
            <div style={{ flex:1, height:'1px', background:'rgba(36,59,83,0.09)' }} />
          </div>

          {/* ── Trust badge ── */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.375rem', animation:'fadeUp .5s .50s both' }}>
            <ShieldCheck />
            <span style={{ fontSize:'0.775rem', color:'#9aa8b6' }}>Your data is encrypted and never shared</span>
          </div>

        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes cardIn { from { opacity:0; transform:translateY(22px) scale(0.985); } to { opacity:1; transform:none; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(13px); } to { opacity:1; transform:none; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes spin   { to   { transform:rotate(360deg); } }
        input::placeholder { color: #b0bec8; }
      `}</style>
    </main>
  );
}
