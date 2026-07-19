"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function HrAdminRedirectPage() {
  const router = useRouter();
  const { company_slug } = useParams();

  useEffect(() => {
    if (company_slug) {
      router.replace(`/${company_slug}/hr_admin`);
    } else {
      router.replace("/dashboard");
    }
  }, [company_slug, router]);

  return null;
}
