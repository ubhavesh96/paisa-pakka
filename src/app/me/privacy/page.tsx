"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Icon, type IconName } from "@/components/Icon";
import { Button, Card, IconBubble, Screen, TopBar } from "@/components/ui";
import type { StringKey } from "@/lib/i18n";

// M/23 Privacy & Data, M/23b Delete confirm
export default function PrivacyPage() {
  const { t, deleteAll } = useApp();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);

  const keep: [IconName, StringKey, StringKey][] = [
    ["clock", "whenYouGetPaid", "toGiveTips"],
    ["wallet", "savingsRecord", "whatYouTell"],
    ["shieldCheck", "pastChecks", "deleted30"],
  ];
  const never: StringKey[] = ["nameOrNumber", "otpPin", "voiceRecordings"];

  return (
    <>
      <TopBar title={t("privacyData")} />
      <Screen
        footer={
          <div>
            <Button variant="danger" className="w-full" onClick={() => setConfirm(true)}>
              {t("deleteAll")}
            </Button>
            <p className="mt-2 text-[13px] text-ink-2">{t("askOnceMore")}</p>
          </div>
        }
      >
        <h2 className="mt-1 text-[16px] font-semibold">{t("whatWeKeep")}</h2>
        <Card className="mt-3 px-4">
          {keep.map(([icon, a, b]) => (
            <div key={a} className="flex items-start gap-4 py-3">
              <Icon name={icon} size={22} className="mt-0.5 text-primary-deep" />
              <div>
                <p className="text-[16px] font-semibold">{t(a)}</p>
                <p className="text-[13px] text-ink-2">{t(b)}</p>
              </div>
            </div>
          ))}
        </Card>
        <h2 className="mt-5 text-[16px] font-semibold">{t("whatNeverKeep")}</h2>
        <div className="mt-3 rounded-lg bg-real-subtle px-4">
          {never.map((k) => (
            <div key={k} className="flex items-center gap-4 py-3.5 text-[16px] font-medium">
              <Icon name="check" size={20} className="text-primary-deep" />
              {t(k)}
            </div>
          ))}
        </div>
      </Screen>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 px-6" role="alertdialog" aria-modal="true">
          <div className="sheet-in w-full max-w-[340px] rounded-[24px] bg-surface p-5">
            <IconBubble name="alert" tone="scam" size={48} />
            <h2 className="title mt-3 text-[22px] font-bold">{t("deleteTitle")}</h2>
            <p className="mt-2 text-[17px] leading-relaxed text-ink-2">{t("deleteBody")}</p>
            <p className="mt-3 text-[16px] text-real">{t("bankSafe")}</p>
            <div className="mt-4 flex flex-col gap-3">
              <Button
                variant="danger"
                onClick={() => {
                  deleteAll();
                  setConfirm(false);
                  router.push("/home");
                }}
              >
                {t("yesDelete")}
              </Button>
              <Button variant="secondary" onClick={() => setConfirm(false)}>
                {t("noKeep")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
