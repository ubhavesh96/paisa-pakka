"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Button, Screen } from "@/components/ui";

// M/02b Language (from any screen)
export default function LanguagePage() {
  const { t } = useApp();
  const router = useRouter();
  return (
    <Screen className="pt-14" footer={<Button className="w-full" iconRight="arrowRight" onClick={() => router.back()}>{t("continue")}</Button>}>
      <LanguagePicker />
    </Screen>
  );
}
