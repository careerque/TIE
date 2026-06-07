'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

/* ─── Icons ─────────────────────────────────────────────── */
const ShieldCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#627D98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9,12 11,14 15,10"/>
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
    <main className="logout-container">
      {/* bg blobs */}
      <div className="tie-glow-blob-1" aria-hidden />
      <div className="tie-glow-blob-2" aria-hidden />

      {/* ── Card ── */}
      <div className="logout-card">
        {/* top accent bar */}
        <div className="logout-card-top-bar" />

        <div className="logout-body">
          {/* ── Logo ── */}
          <div className="logout-logo-container">
            <div className="logout-logo-crop">
              <Image
                src="/logo.png"
                alt="Company Logo"
                width={130}
                height={130}
                priority
                className="logout-logo-img"
              />
            </div>
          </div>

          <div className="logout-animation-area">
            <div className="logout-spinner" />
            <h2 className="logout-title">
              Signing Out
            </h2>
            <p className="logout-desc">
              Thank you for using Talent Intelligence Engine. Cleansing session cookies and returning to home...
            </p>
          </div>

          {/* ── Divider ── */}
          <div className="logout-divider">
            <div className="logout-divider-line" />
            <span className="logout-divider-text">Secure Session Termination</span>
            <div className="logout-divider-line" />
          </div>

          {/* ── Trust badge ── */}
          <div className="logout-footer">
            <ShieldCheck />
            <span className="logout-footer-text">Security protocols enforced by TIE</span>
          </div>
        </div>
      </div>
    </main>
  );
}
