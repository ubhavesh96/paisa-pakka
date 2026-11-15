"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, type ActivityItem } from "@/lib/store";
import { fmtTime, inr } from "@/lib/i18n";
import { Icon, type IconName } from "@/components/Icon";
import { Button, Card, Chip, Screen, StateBlock, TopBar } from "@/components/ui";

const ICON: Record<NonNullable<ActivityItem["icon"]>, IconName> = {
  scam: "shieldX",
  real: "shieldCheck",
  unsure: "help",
  savings: "coins",
  form: "file",
  loan: "rupee",
};

// M/21 Activity, S/06 Empty
export default function ActivityPage() {
  const { s, t, set } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "check" | "savings">("all");

  const weekAgo = Date.now() - 7 * 86400_000;
  const week = s.activity.filter((a) => a.at > weekAgo);
  const saved = week.filter((a) => a.type === "savings").reduce((n, a) => n + (Number(a.title.match(/₹(\d+)/)?.[1]) || 0), 0);
  const scams = week.filter((a) => a.icon === "scam").length;
  const forms = week.filter((a) => a.type === "form").length;

  const items = s.activity.filter((a) => filter === "all" || a.type === filter);
  const startToday = new Date().setHours(0, 0, 0, 0);
  const groups: [string, ActivityItem[]][] = [
    [t("today"), items.filter((a) => a.at >= startToday)],
    [t("yesterday"), items.filter((a) => a.at < startToday && a.at >= startToday - 86400_000)],
    [t("earlier"), items.filter((a) => a.at < startToday - 86400_000)],
  ];

  if (s.activity.length === 0)
    return (
      <>
        <TopBar title={t("activity")} />
        <Screen nav>
          <StateBlock icon="shieldCheck" title={t("emptyTitle")} body={t("emptyBody")}>
            <Button href="/check">{t("checkSomething")}</Button>
          </StateBlock>
        </Screen>
      </>
    );

  return (
    <>
      <TopBar title={t("activity")} />
      <Screen nav>
        <Card className="mt-1 p-4">
          <p className="text-[14px] text-ink-2">{t("thisWeekYou")}</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              [`₹${inr(saved)}`, t("savedLbl")],
              [String(scams), t("scamCaught")],
              [String(forms), t("formMoved")],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="num text-[30px] font-bold">{n}</p>
                <p className="text-[13px] leading-snug text-ink-2">{l}</p>
              </div>
            ))}
          </div>
        </Card>
        <div className="mt-3 flex gap-2">
          <Chip selected={filter === "all"} onClick={() => setFilter("all")}>{t("all")}</Chip>
          <Chip selected={filter === "check"} onClick={() => setFilter("check")}>{t("navCheck")}</Chip>
          <Chip selected={filter === "savings"} onClick={() => setFilter("savings")}>{t("savingsTab")}</Chip>
        </div>
        {groups.map(([label, list]) =>
          list.length ? (
            <section key={label}>
              <h2 className="mt-4 mb-2 text-[15px] text-ink-2">{label}</h2>
              <Card className="px-4">
                {list.map((a) => (
                  <button
                    key={a.id}
                    disabled={!a.verdictId}
                    onClick={() => {
                      set({ viewVerdictId: a.verdictId! });
                      router.push("/check/result");
                    }}
                    className="flex w-full items-start gap-4 py-3 text-left"
                  >
                    <Icon name={ICON[a.icon ?? "form"]} size={22} className="mt-0.5 shrink-0 text-primary-deep" />
                    <span>
                      <span className="block text-[16px] font-semibold">{a.title}</span>
                      <span className="block text-[13px] text-ink-2">
                        {a.sub} · {fmtTime(a.at, s.lang)}
                      </span>
                    </span>
                  </button>
                ))}
              </Card>
            </section>
          ) : null,
        )}
      </Screen>
    </>
  );
}
