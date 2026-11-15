"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useApp } from "@/lib/store";
import { AmountField } from "@/components/AmountField";
import { Button, Chip, Screen, TopBar } from "@/components/ui";

// M/12 Payday · How much?
export default function EarningsPage() {
  const { s, t, set } = useApp();
  const router = useRouter();
  const [amt, setAmt] = useState(s.lastEarning ? String(s.lastEarning) : "650");
  const n = Number(amt) || 0;

  return (
    <>
      <TopBar title={t("todaysEarnings")} />
      <Screen
        nav
        footer={
          <Button
            className="w-full"
            iconRight="arrowRight"
            disabled={n <= 0}
            onClick={() => {
              set({ lastEarning: n });
              router.push("/money/split");
            }}
          >
            {t("seeSplit")}
          </Button>
        }
      >
        <h1 className="title mt-2 text-[28px] font-bold">{t("howMuchToday")}</h1>
        <p className="mt-2 text-[18px] text-ink-2">{t("speakOrType")}</p>
        <div className="mt-6">
          <AmountField id="earn" label={t("todaysEarnings")} value={amt} onChange={setAmt} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[300, 500, 800, 1000].map((v) => (
            <Chip key={v} selected={n === v} onClick={() => setAmt(String(v))}>
              <span className="num">₹{v}</span>
            </Chip>
          ))}
        </div>
        <Link href="/money/goals" className="mt-6 flex items-center justify-between rounded-lg bg-surface p-4 shadow-e1">
          <span className="flex items-center gap-3 text-[16px] font-semibold">
            <Icon name="sparkle" className="text-caution" />
            {t("myGoals")}
          </span>
          <Icon name="chevronRight" className="text-ink-2" />
        </Link>
        <Link href="/money/savings" className="mt-3 flex items-center justify-between rounded-lg bg-surface p-4 shadow-e1">
          <span className="flex items-center gap-3 text-[16px] font-semibold">
            <Icon name="wallet" className="text-primary-deep" />
            {t("emergencySavings")}
          </span>
          <Icon name="chevronRight" className="text-ink-2" />
        </Link>
      </Screen>
    </>
  );
}
