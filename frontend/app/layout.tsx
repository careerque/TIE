import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

/* ── Font Setup ── */
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

/* ── Metadata ── */
export const metadata: Metadata = {
  title: 'Sign In | Your App Name',
  description: 'Sign in to your account to continue.',
  robots: 'noindex, nofollow', // login pages shouldn't be indexed
};

/* ── Root Layout ── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}