"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { supabasedb } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function LegacyHrAdminPage() {
  const router = useRouter();
  const { isLoggedIn, profile, loading } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }

      if (profile?.role !== "hr_admin" || !profile?.company_id) {
        router.push("/dashboard");
        return;
      }

      const redirect = async () => {
        const { data: comp } = await supabasedb
          .from("companies")
          .select("slug")
          .eq("id", profile.company_id)
          .single();

        if (comp) {
          router.replace(`/${comp.slug}/hr_admin`);
        } else {
          router.replace("/dashboard");
        }
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
          Redirecting to dynamic HR workspace...
        </span>
      </div>
    </main>
  );
}
