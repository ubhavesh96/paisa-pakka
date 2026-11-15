"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Icon, LogoMark } from "@/components/Icon";
import { Button, Card, Screen, TopBar, cx } from "@/components/ui";

// M/08b Verdict · Share card
export default function SharePage() {
  const { s, t } = useApp();
  const [copied, setCopied] = useState(false);
  const v = s.verdicts.find((x) => x.id === s.viewVerdictId) ?? s.verdicts[0];
  if (!v) return null;

  const head = v.kind === "scam" ? t("scamAlert") : v.kind === "real" ? t("realAlert") : t("unsureAlert");
  const src = v.sources.length ? ` · ${t("source")}: ${v.sources[0]}` : "";
  const message = `${v.kind === "scam" ? "🚨" : v.kind === "real" ? "✅" : "⚠️"} ${head}\n\n${v.shareText}${
    v.kind !== "real" ? `\n${t("lostMoney")}` : ""
  }\n\n${t("checkedWith")}${src}`;

  return (
    <>
      <TopBar title={t("shareTitle")} />
      <Screen
        footer={
          <div className="flex flex-col gap-2">
            <Button className="w-full" href={`https://wa.me/?text=${encodeURIComponent(message)}`}>
              {t("sendWhatsApp")}
            </Button>
            <Button
              variant="link"
              className="w-full"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message);
                  setCopied(true);
                } catch {
                  /* ignore */
                }
              }}
            >
              {copied ? t("copied") : t("copyMessage")}
            </Button>
          </div>
        }
      >
        <p className="mt-1 text-[18px] text-ink-2">{t("shareIntro")}</p>
        <Card className="mt-4 overflow-hidden">
          <div
            className={cx(
              "flex items-center gap-3 px-4 py-4 text-[18px] font-semibold",
              v.kind === "scam" ? "bg-scam text-white" : v.kind === "real" ? "bg-real text-white" : "bg-caution-subtle text-caution",
            )}
          >
            <Icon name={v.kind === "scam" ? "shieldX" : v.kind === "real" ? "shieldCheck" : "help"} />
            {head}
          </div>
          <div className="p-4">
            <p className="text-[18px] leading-relaxed">{v.shareText}</p>
            {v.kind !== "real" && <p className="mt-3 text-[16px] font-semibold text-scam">{t("lostMoney")}</p>}
          </div>
          <div className="flex items-center gap-2 bg-muted px-4 py-2.5 text-[13px] text-ink-2">
            <LogoMark size={18} />
            <span className="truncate">
              {t("checkedWith")}
              {src}
            </span>
          </div>
        </Card>
        <p className="mt-4 flex items-center gap-2 text-[14px] text-ink-2">
          <Icon name="lock" size={18} />
          {t("noNameIncluded")}
        </p>
      </Screen>
    </>
  );
}
