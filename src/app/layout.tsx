import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { AuthProvider } from '@/context/AuthContext';

/* ── Font Setup ── */
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

/* ── Metadata ── */
export const metadata: Metadata = {
  title: 'TIE | Talent Intelligence Engine',
  description: 'Understand your workforce beyond performance.',
};

/* ── Root Layout ── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var cryptoObj = typeof window !== 'undefined' ? window.crypto : (typeof globalThis !== 'undefined' ? globalThis.crypto : null);
                if (!cryptoObj) {
                  cryptoObj = {};
                  if (typeof window !== 'undefined') window.crypto = cryptoObj;
                  if (typeof globalThis !== 'undefined') globalThis.crypto = cryptoObj;
                }
                if (!cryptoObj.randomUUID) {
                  cryptoObj.randomUUID = function() {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                      var r = Math.random() * 16 | 0;
                      var v = c === 'x' ? r : (r & 0x3 | 0x8);
                      return v.toString(16);
                    });
                  };
                }
              })();
            `,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning={true}>
        <AuthProvider>
          <Navbar />
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}