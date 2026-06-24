"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabasedb
        .from("profiles")
        .select("first_name, last_name, employee_id, designation, experiense_years, interests, role")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile from Supabase:", error);
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
