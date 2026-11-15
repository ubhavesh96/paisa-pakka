"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { LogoMark } from "@/components/Icon";

// M/01 Splash
export default function Splash() {
  const { s, t } = useApp();
  const router = useRouter();
  useEffect(() => {
    const id = setTimeout(() => router.replace(s.onboarded ? "/home" : "/onboarding"), 1200);
    return () => clearTimeout(id);
  }, [router, s.onboarded]);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-primary px-6 text-center text-white">
      <LogoMark size={88} tone="white" />
      <p className="title mt-4 text-[22px] font-bold">Paisa Pakka</p>
      <p className="mt-3 text-[18px]">{t("tagline")}</p>
    </div>
  );
}
