"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { supabasedb } from "@/lib/supabaseClient";

interface Profile {
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
  designation: string;
  experiense_years: string;
  interests: string[];
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionInstanceId] = useState(() => Math.random().toString(36).substring(2));
  const [showSessionRevokedModal, setShowSessionRevokedModal] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);

  const fetchProfile = async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabasedb
        .from("profiles")
        .select("first_name, last_name, employee_id, designation, experiense_years, interests, role")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile from Supabase:", error);
        
        // PGRST116: PostgREST code for "0 rows returned" (Profile missing in database)
        if (error.code === "PGRST116") {
          console.log("No profile row found. Creating default self-healing profile row...");
          const { data: newData, error: createError } = await supabasedb
            .from("profiles")
            .upsert({
              id: userId,
              email: userEmail,
              first_name: "",
              last_name: "",
              employee_id: "",
              designation: "",
              experiense_years: 0,
              interests: [],
              role: "user"
            })
            .select()
            .single();

          if (!createError && newData) {
            setProfile({
              first_name: newData.first_name || "",
              last_name: newData.last_name || "",
              email: userEmail || "",
              employee_id: newData.employee_id ? String(newData.employee_id) : "",
              designation: newData.designation || "",
              experiense_years: newData.experiense_years ? String(newData.experiense_years) : "",
              interests: newData.interests || [],
              role: newData.role || "user",
            });
            return;
          } else {
            console.error("Failed to create self-healing profile row:", createError);
          }
        }
        setProfile(null);
      } else if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: userEmail || "",
          employee_id: data.employee_id ? String(data.employee_id) : "",
          designation: data.designation || "",
          experiense_years: data.experiense_years ? String(data.experiense_years) : "",
          interests: data.interests || [],
          role: data.role || "user",
        });
      }
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email || "");
    }
  };

  const logout = async () => {
    try {
      await supabasedb.auth.signOut();
      setUser(null);
      setProfile(null);
      // Dispatch custom auth-change event to alert other listening components
      window.dispatchEvent(new Event("auth-change"));
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    // Listen for auth state changes (including the initial session retrieval on mount)
    const { data: { subscription } } = supabasedb.auth.onAuthStateChange(async (event, session) => {
      // Only set loading back to true for initial loads or explicit sign-ins to avoid background token refresh flashes
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        setLoading(true);
      }

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email || "");
      } else {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
      window.dispatchEvent(new Event("auth-change"));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (logoutCountdown === null) return;

    if (logoutCountdown > 0) {
      const timer = setTimeout(() => {
        setLogoutCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      console.log("Countdown reached 0. Performing logout...");
      logout();
    }
  }, [logoutCountdown]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to realtime session broadcasts for this user to enforce single-device session
    const channel = supabasedb.channel(`user_sessions_${user.id}`);
    
    channel
      .on("broadcast", { event: "force_logout" }, (payload) => {
        if (payload.payload?.senderId !== sessionInstanceId) {
          console.log("Force logout broadcast received from another session. Initializing countdown...");
          setShowSessionRevokedModal(true);
          setLogoutCountdown(5);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to session channel. Broadcasting force_logout...");
          // Send a broadcast message to invalidate all other active tabs/devices
          channel.send({
            type: "broadcast",
            event: "force_logout",
            payload: { senderId: sessionInstanceId }
          });
        }
      });

    return () => {
      supabasedb.removeChannel(channel);
    };
  }, [user, sessionInstanceId, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isLoggedIn: !!user,
        logout,
        refreshProfile,
      }}
    >
      {children}

      {/* Session Revoked/Countdown Overlay Modal */}
      {showSessionRevokedModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.7)", // darker slate backdrop
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999999, // Ensure it is on top of everything
          fontFamily: "'Inter', sans-serif",
          animation: "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            padding: "3rem 2.5rem",
            width: "100%",
            maxWidth: "460px",
            textAlign: "center",
            boxSizing: "border-box",
            animation: "scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both"
          }}>
            {logoutCountdown !== null && logoutCountdown > 0 ? (
              // Countdown Warning View
              <>
                <div style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "2px solid #F59E0B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                  position: "relative"
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1.5s infinite" }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                
                <h2 style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#0F172A",
                  margin: "0 0 0.75rem",
                  letterSpacing: "-0.025em"
                }}>
                  New Login Attempt
                </h2>
                
                <p style={{
                  fontSize: "0.9375rem",
                  color: "#475569",
                  lineHeight: 1.6,
                  margin: "0 0 1.5rem"
                }}>
                  Another device is logging into this account. To maintain your security, this session will be logged out automatically.
                </p>

                {/* Countdown display */}
                <div style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#F59E0B",
                  marginBottom: "0.5rem"
                }}>
                  Logging out in {logoutCountdown} second{logoutCountdown === 1 ? "" : "s"}...
                </div>

                {/* Visual Progress Bar */}
                <div style={{
                  width: "100%",
                  height: "6px",
                  background: "#F1F5F9",
                  borderRadius: "3px",
                  overflow: "hidden",
                  marginBottom: "2.5rem"
                }}>
                  <div style={{
                    width: `${logoutCountdown * 20}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #F59E0B, #EF4444)",
                    borderRadius: "3px",
                    transition: "width 1s linear"
                  }} />
                </div>
                
                <button
                  onClick={async () => {
                    setLogoutCountdown(0);
                    await logout();
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    padding: "0.875rem 1.5rem",
                    background: "#0F172A",
                    color: "#ffffff",
                    borderRadius: "12px",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#1E293B"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#0F172A"}
                >
                  Log Out Immediately
                </button>
              </>
            ) : (
              // Final Session Terminated View
              <>
                <div style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "2px solid #EF4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem"
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                
                <h2 style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#0F172A",
                  margin: "0 0 0.75rem",
                  letterSpacing: "-0.025em"
                }}>
                  Session Terminated
                </h2>
                
                <p style={{
                  fontSize: "0.9375rem",
                  color: "#475569",
                  lineHeight: 1.6,
                  margin: "0 0 2rem"
                }}>
                  This session has been safely closed because another device logged in to your account.
                </p>
                
                <button
                  onClick={() => {
                    setShowSessionRevokedModal(false);
                    setLogoutCountdown(null);
                    router.push("/login");
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    padding: "0.875rem 1.5rem",
                    background: "#0F172A",
                    color: "#ffffff",
                    borderRadius: "12px",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#1E293B"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#0F172A"}
                >
                  Sign In Again
                </button>
              </>
            )}
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.05); opacity: 0.8; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
