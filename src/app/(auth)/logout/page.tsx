'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

/* ─── Icons ─────────────────────────────────────────────── */
const ShieldCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#627D98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/>
  </svg>
);

/* ─── Component ─────────────────────────────────────────── */
export default function LogoutPage() {
  const { handleLogout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      // Small timeout for user experience/animation smoothness
      await new Promise((r) => setTimeout(r, 1200));
      await handleLogout();
    };
    performLogout();
  }, [handleLogout]);

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
            <div
              style={{
                width: "130px",
                height: "60px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Image
                src="/logo.png"
                alt="Company Logo"
                width={130}
                height={130}
                priority
                style={{
                  position: "absolute",
                  top: "-35px",
                  left: "0",
                  display: "block",
                }}
              />
            </div>
          </div>

          <div style={{ animation: 'fadeIn .4s both', padding: '1rem 0' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3.5px solid rgba(91,164,164,0.15)',
              borderTopColor: '#243B53',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin .8s linear infinite',
              marginBottom: '1.5rem'
            }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#243B53', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
              Signing Out
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#627D98', lineHeight: 1.5 }}>
              Thank you for using Talent Intelligence Engine. Cleansing session cookies and returning to home...
            </p>
          </div>

          {/* ── Divider ── */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', margin:'1.75rem 0 1rem', animation:'fadeUp .5s .32s both' }}>
            <div style={{ flex:1, height:'1px', background:'rgba(36,59,83,0.09)' }} />
            <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#9aa8b6', letterSpacing:'0.07em', textTransform:'uppercase' }}>Secure Session Termination</span>
            <div style={{ flex:1, height:'1px', background:'rgba(36,59,83,0.09)' }} />
          </div>

          {/* ── Trust badge ── */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.375rem', animation:'fadeUp .5s .38s both' }}>
            <ShieldCheck />
            <span style={{ fontSize:'0.775rem', color:'#9aa8b6' }}>Security protocols enforced by TIE</span>
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
