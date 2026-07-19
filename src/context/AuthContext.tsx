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
              localStorage.setItem("tie-user-profile", JSON.stringify(profileData));
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
          localStorage.setItem("tie-user-profile", JSON.stringify(profileData));
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

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("tie-user-profile");
      }
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
    // Check if there is any Supabase session in localStorage
    if (typeof window !== "undefined") {
      let hasSession = false;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes("-auth-token")) {
          hasSession = true;
          break;
        }
      }
      
      // Load cached profile if it exists
      const cached = localStorage.getItem("tie-user-profile");
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

    // Listen for auth state changes (including the initial session retrieval on mount)
    const { data: { subscription } } = supabasedb.auth.onAuthStateChange(async (event, session) => {
      // Only set loading back to true for initial loads or explicit sign-ins to avoid background token refresh flashes
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        // Only trigger loading block if we don't have a cached profile to avoid layout redraw flashes
        if (!localStorage.getItem("tie-user-profile")) {
          setLoading(true);
        }
      }

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email || "");
      } else {
        setUser(null);
        setProfile(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("tie-user-profile");
        }
      }

      setLoading(false);
      window.dispatchEvent(new Event("auth-change"));
    });

    return () => {
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
