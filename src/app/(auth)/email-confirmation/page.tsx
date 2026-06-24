'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabasedb } from '@/lib/supabaseClient';

/* ─── Icons ─────────────────────────────────────────────── */
const ShieldCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3B18A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/>
  </svg>
);

const SuccessIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A3B18A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

/* ─── Component ─────────────────────────────────────────── */
export default function EmailConfirmationPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmailSession = async () => {
      try {
        // Wait a small delay to let Supabase client digest the redirect code/hash
        await new Promise((r) => setTimeout(r, 1500));

        const { data: { session }, error: sessionError } = await supabasedb.auth.getSession();

        if (sessionError) {
          setStatus('error');
          setErrorMessage(sessionError.message || 'Failed to retrieve session.');
          return;
        }

        if (session) {
          // Success! Write states to localStorage
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', session.user.email || '');



          // Dispatch event to update global header
          window.dispatchEvent(new Event('auth-change'));

          setStatus('success');
        } else {
          // Check if there are error parameters in the URL
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const queryParams = new URLSearchParams(window.location.search);
          const errorMsg = hashParams.get('error_description') || queryParams.get('error_description');

          if (errorMsg) {
            setStatus('error');
            setErrorMessage(decodeURIComponent(errorMsg).replace(/\+/g, ' '));
          } else {
            // Check if user is already logged in as a fallback
            const logged = localStorage.getItem('isLoggedIn') === 'true';
            if (logged) {
              setStatus('success');
            } else {
              setStatus('error');
              setErrorMessage('Verification link is invalid, expired, or has already been used.');
            }
          }
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected error occurred during confirmation.');
      }
    };

    verifyEmailSession();
  }, []);

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

        <div style={{ padding: '2.5rem 2.5rem 2.75rem', textAlign: 'center' }}>

          {/* ── Logo ── */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.5rem', animation:'fadeUp .5s .06s both' }}>
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

          {status === 'loading' && (
            <div style={{ animation: 'fadeIn .4s both', padding: '1rem 0' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '3.5px solid rgba(91,164,164,0.15)',
                borderTopColor: '#5BA4A4',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin .8s linear infinite',
                marginBottom: '1.5rem'
              }} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#243B53', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                Verifying Account
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#627D98', lineHeight: 1.5 }}>
                Syncing with secure servers. Please do not close this window...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div style={{ animation: 'fadeIn .5s both', padding: '0.5rem 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(163,177,138,0.14)',
                border: '2px solid #A3B18A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <SuccessIcon />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#243B53', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                Email Verified!
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#627D98', marginBottom: '1.75rem', lineHeight: 1.55 }}>
                Your account is confirmed successfully. You are ready to complete your onboarding and explore workforce insights.
              </p>
              <Link
                href="/welcome"
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
                Start Onboarding  →
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div style={{ animation: 'fadeIn .5s both', padding: '0.5rem 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(192,57,43,0.08)',
                border: '2px solid #e74c3c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <ErrorIcon />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#c0392b', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                Verification Failed
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#627D98', marginBottom: '1.75rem', lineHeight: 1.55 }}>
                {errorMessage}
              </p>
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '0.825rem 1.5rem',
                  background: '#243B53',
                  color: '#ffffff',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 3px 14px rgba(36,59,83,0.2)',
                  transition: 'background .18s, transform .12s, box-shadow .18s',
                }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.background='#1a2d40'; b.style.transform='translateY(-1px)'; b.style.boxShadow='0 6px 20px rgba(36,59,83,0.3)'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.background='#243B53'; b.style.transform='none'; b.style.boxShadow='0 3px 14px rgba(36,59,83,0.2)'; }}
              >
                Return to Login
              </Link>
            </div>
          )}

          {/* ── Divider ── */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', margin:'1.75rem 0 1rem', animation:'fadeUp .5s .32s both' }}>
            <div style={{ flex:1, height:'1px', background:'rgba(36,59,83,0.09)' }} />
            <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#9aa8b6', letterSpacing:'0.07em', textTransform:'uppercase' }}>Verification Service</span>
            <div style={{ flex:1, height:'1px', background:'rgba(36,59,83,0.09)' }} />
          </div>

          {/* ── Trust badge ── */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.375rem', animation:'fadeUp .5s .38s both' }}>
            <ShieldCheck />
            <span style={{ fontSize:'0.775rem', color:'#9aa8b6' }}>Verified by Talent Intelligence Engine</span>
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
      `}</style>
    </main>
  );
}
