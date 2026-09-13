"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { supabasedb } from "@/lib/supabaseClient";
import { CookieUtils } from "@/lib/cookieUtils";

interface Profile {
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
  designation: string;
  experience_years: string;
  interests: string[];
  role: string;
  company_id?: string;
  team_id?: string;
  manager_id?: string;
  assessment_seed?: number;
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


  const fetchProfile = async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabasedb
        .from("profiles")
        .select("first_name, last_name, employee_id, designation, experience_years, interests, role, company_id, team_id, manager_id, assessment_seed")
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
              experience_years: 0,
              interests: [],
              role: "user"
            })
            .select()
            .single();

          if (!createError && newData) {
            const expVal = newData.experience_years !== null && newData.experience_years !== undefined 
              ? newData.experience_years 
              : 0;

            const profileData = {
              first_name: newData.first_name || "",
              last_name: newData.last_name || "",
              email: userEmail || "",
              employee_id: newData.employee_id ? String(newData.employee_id) : "",
              designation: newData.designation || "",
              experience_years: String(expVal),
              interests: newData.interests || [],
              role: newData.role || "user",
              company_id: newData.company_id || undefined,
              team_id: newData.team_id || undefined,
              manager_id: newData.manager_id || undefined,
              assessment_seed: newData.assessment_seed ? Number(newData.assessment_seed) : undefined,
            };
            setProfile(profileData);
            if (typeof window !== "undefined") {
              CookieUtils.set("tie-user-profile", JSON.stringify(profileData));
            }
            return;
          } else {
            console.error("Failed to create self-healing profile row:", createError);
          }
        }
        setProfile(null);
      } else if (data) {
        const expVal = data.experience_years !== null && data.experience_years !== undefined 
          ? data.experience_years 
          : 0;

        const profileData = {
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: userEmail || "",
          employee_id: data.employee_id ? String(data.employee_id) : "",
          designation: data.designation || "",
          experience_years: String(expVal),
          interests: data.interests || [],
          role: data.role || "user",
          company_id: data.company_id || undefined,
          team_id: data.team_id || undefined,
          manager_id: data.manager_id || undefined,
          assessment_seed: data.assessment_seed ? Number(data.assessment_seed) : undefined,
        };
        setProfile(profileData);
        if (typeof window !== "undefined") {
          CookieUtils.set("tie-user-profile", JSON.stringify(profileData));
        }
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

  const handleSessionExpired = async () => {
    try {
      if (typeof window !== "undefined") {
        CookieUtils.remove("tie-user-profile");
        CookieUtils.remove("tie-session-start");
        CookieUtils.clearAll();
        window.dispatchEvent(new Event("auth-change"));
      }
      setUser(null);
      setProfile(null);
      setLoading(false);
      supabasedb.auth.signOut().catch(() => {});
      router.push("/login?expired=true");
    } catch (err) {
      console.error("Error handling session expiration:", err);
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        CookieUtils.remove("tie-user-profile");
        CookieUtils.remove("tie-session-start");
        CookieUtils.clearAll();
      }
      setUser(null);
      setProfile(null);
      setLoading(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-change"));
      }

      // Trigger Supabase sign out in background without blocking UI navigation
      supabasedb.auth.signOut().catch((err) => {
        console.error("Background Supabase signOut error:", err);
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Helper to test if 1 hour has elapsed since session creation
  const checkIsSessionExpired = (): boolean => {
    if (typeof window === "undefined") return false;
    const sessionStart = CookieUtils.get("tie-session-start");
    if (!sessionStart) return false;
    const startTime = Number(sessionStart);
    if (isNaN(startTime)) return false;
    const ONE_HOUR_MS = 60 * 60 * 1000;
    return Date.now() - startTime >= ONE_HOUR_MS;
  };

  useEffect(() => {
    // Check if session has expired beyond 1 hour on initial mount
    if (checkIsSessionExpired()) {
      handleSessionExpired();
      return;
    }

    // Check if there is any Supabase session in cookies
    if (typeof window !== "undefined") {
      const hasSession = document.cookie ? document.cookie.includes("-auth-token") : false;
      
      // Load cached profile if it exists and session is valid
      const cached = CookieUtils.get("tie-user-profile");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setProfile(parsed);
          setLoading(false);
        } catch (e) {
          // ignore
        }
      } else if (!hasSession) {
        // If there is no session token at all, the user is guest (skip initial load delay)
        setLoading(false);
      }
    }

    // Periodic watchdog timer: check every 15 seconds if 1-hour session limit has been reached
    const sessionTimer = setInterval(() => {
      if (checkIsSessionExpired()) {
        handleSessionExpired();
      }
    }, 15000);

    // Listen for auth state changes (including the initial session retrieval on mount)
    const { data: { subscription } } = supabasedb.auth.onAuthStateChange(async (event, session) => {
      // Check session validity
      if (checkIsSessionExpired()) {
        await handleSessionExpired();
        return;
      }

      // Only set loading back to true for initial loads or explicit sign-ins to avoid background token refresh flashes
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        if (!CookieUtils.get("tie-user-profile")) {
          setLoading(true);
        }
      }

      if (session?.user) {
        // Record session start if not already established
        if (!CookieUtils.get("tie-session-start")) {
          CookieUtils.set("tie-session-start", String(Date.now()), 1);
        }

        setUser(session.user);
        // Safety timeout: Ensure fetchProfile never blocks auth loading for more than 3.5s
        await Promise.race([
          fetchProfile(session.user.id, session.user.email || ""),
          new Promise((resolve) => setTimeout(resolve, 3500))
        ]);
      } else {
        setUser(null);
        setProfile(null);
        if (typeof window !== "undefined") {
          CookieUtils.remove("tie-user-profile");
          CookieUtils.remove("tie-session-start");
        }
      }

      setLoading(false);
      window.dispatchEvent(new Event("auth-change"));
    });

    return () => {
      clearInterval(sessionTimer);
      subscription.unsubscribe();
    };
  }, []);



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
