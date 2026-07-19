"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { supabasedb } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function LegacyManagerPage() {
  const router = useRouter();
  const { isLoggedIn, profile, loading } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }

      if (profile?.role !== "manager" && profile?.role !== "hr_admin") {
        router.push("/dashboard");
        return;
      }

      const redirect = async () => {
        let companySlug = "none";
        let teamSlug = "none";

        if (profile?.company_id) {
          const { data: comp } = await supabasedb
            .from("companies")
            .select("slug")
            .eq("id", profile.company_id)
            .maybeSingle();
          if (comp) companySlug = comp.slug;
        }

        if (profile?.team_id) {
          const { data: tm } = await supabasedb
            .from("teams")
            .select("slug")
            .eq("id", profile.team_id)
            .maybeSingle();
          if (tm) teamSlug = tm.slug;
        }

        router.replace(`/${companySlug}/${teamSlug}/manager`);
      };

      redirect();
    }
  }, [isLoggedIn, profile, loading, router]);

  return (
    <main className="tie-container bg-mesh">
      <div className="tie-dot-grid" aria-hidden />
      <div className="tie-card" style={{ alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
        <div className="tie-card-top-bar" />
        <Loader2 className="animate-spin text-[#5BA4A4]" size={36} style={{ marginBottom: "1rem" }} />
        <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#627D98" }}>
          Redirecting to dynamic Manager dashboard...
        </span>
      </div>
    </main>
  );
}
