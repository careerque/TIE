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
    if (!user) return;

    // Subscribe to realtime session broadcasts for this user to enforce single-device session
    const channel = supabasedb.channel(`user_sessions_${user.id}`);
    
    channel
      .on("broadcast", { event: "force_logout" }, (payload) => {
        if (payload.payload?.senderId !== sessionInstanceId) {
          console.log("Force logout broadcast received from another session. Signing out...");
          logout();
          router.push("/login");
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
