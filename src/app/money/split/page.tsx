"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { inr, type StringKey } from "@/lib/i18n";
import { splitEarning } from "@/lib/calc";
import { Icon, type IconName } from "@/components/Icon";
import { Button, Card, ListenButton, Screen, TopBar, cx } from "@/components/ui";

type Key = "savings" | "home" | "fuel" | "goal";
const ROWS: { key: Key; label: StringKey; icon: IconName; color: string }[] = [
  { key: "savings", label: "emergencySavings", icon: "wallet", color: "bg-marigold" },
  { key: "home", label: "homeExpenses", icon: "home", color: "bg-primary" },
  { key: "fuel", label: "fuelFare", icon: "arrowRight", color: "bg-primary-subtle" },
  { key: "goal", label: "bikeGoal", icon: "coins", color: "bg-real" },
];

// M/13 Payday · Split
export default function SplitPage() {
  const { s, t, logSavings } = useApp();
  const router = useRouter();
  const amount = s.lastEarning ?? 650;
  const initial = useMemo(() => splitEarning(amount), [amount]);
  const [split, setSplit] = useState(initial);
  const [editing, setEditing] = useState(false);

  const freq = t(s.payFreq === "sometimes" ? "daily" : s.payFreq).toLowerCase();
  const nudge = (k: Key, d: number) =>
    setSplit((p) => {
      const nv = Math.max(0, p[k] + d);
      const diff = nv - p[k];
      if (k === "home") return { ...p, home: nv };
      if (p.home - diff < 0) return p;
      return { ...p, [k]: nv, home: p.home - diff };
    });

  const spoken = ROWS.map((r) => `${t(r.label)} ₹${split[r.key]}`).join(", ") + ". " + t("savingsFirst");

  return (
    <>
      <TopBar title={t("howToSplit", { amt: inr(amount) })} />
      <Screen
        nav
        footer={
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => {
                logSavings(split.savings);
                router.push(`/money/done?amt=${split.savings}`);
              }}
            >
              {t("ok")}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setEditing((e) => !e)}>
              {editing ? t("done") : t("change")}
            </Button>
          </div>
        }
      >
        <p className="mt-1 text-[16px] text-ink-2">{t("suggestedFor", { freq })}</p>
        <ListenButton text={spoken} className="mt-3 self-start" />
        <div className="mt-4 flex h-5 gap-1 overflow-hidden rounded" aria-hidden>
          {ROWS.map((r) => (
            <span key={r.key} className={cx("h-full rounded-sm", r.color)} style={{ flex: Math.max(split[r.key], 1) }} />
          ))}
        </div>
        <div className="mt-3 space-y-3">
          {ROWS.map((r) => (
            <Card key={r.key} className="flex items-center gap-3 p-4">
              <span className={cx("h-10 w-2.5 shrink-0 rounded-full", r.color)} />
              <Icon name={r.icon} size={22} />
              <span className="flex-1 text-[16px] font-semibold">{t(r.label)}</span>
              {editing ? (
                <span className="flex items-center gap-1">
                  <button aria-label="-10" onClick={() => nudge(r.key, -10)} className="grid h-9 w-9 place-items-center rounded-full bg-muted text-[20px]">
                    −
                  </button>
                  <span className="num w-14 text-center text-[18px] font-semibold">₹{split[r.key]}</span>
                  <button aria-label="+10" onClick={() => nudge(r.key, 10)} className="grid h-9 w-9 place-items-center rounded-full bg-muted text-[20px]">
                    +
                  </button>
                </span>
              ) : (
                <>
                  <span className="num text-[18px] font-semibold">₹{inr(split[r.key])}</span>
                  <button aria-label={t("change")} onClick={() => setEditing(true)} className="text-ink-2">
                    <Icon name="sliders" size={20} />
                  </button>
                </>
              )}
            </Card>
          ))}
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{t("savingsFirst")}</p>
      </Screen>
    </>
  );
}
