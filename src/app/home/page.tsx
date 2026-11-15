"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { inr } from "@/lib/i18n";
import { Icon, type IconName } from "@/components/Icon";
import { Button, Card, IconBubble, ProgressBar, Screen, TopBar } from "@/components/ui";
import { useUI } from "@/components/AppShell";
import type { StringKey } from "@/lib/i18n";

// M/06 Home
export default function Home() {
  const { s, t, today, set, logSavings } = useApp();
  const ui = useUI();
  const { balance, goal, weeks, streak, tip } = s.savings;
  const pct = Math.round((balance / goal) * 100);
  const tipPending = s.tipHandledDay !== today;

  const tiles: [IconName, StringKey, string][] = [
    ["shieldCheck", "checkMessage", "/check"],
    ["rupee", "todaysEarnings", "/money"],
    ["file", "mySchemes", "/schemes"],
    ["phone", "help", "/me/help"],
  ];

  return (
    <>
      <TopBar brand />
      <Screen nav>
        <h1 className="title mt-1 text-[22px] font-bold leading-snug">
          {streak > 0 ? t("greeting", { n: streak }) : t("greetingNew")}
        </h1>

        <Link href="/money/savings">
          <Card className="mt-4 p-4">
            <div className="flex items-center gap-2 text-[16px] font-medium">
              <Icon name="wallet" size={20} className="text-primary-deep" />
              {t("emergencySavings")}
            </div>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="num text-[32px] font-bold">₹{inr(balance)}</span>
              <span className="num text-[18px] text-ink-2">/ ₹{inr(goal)}</span>
            </p>
            <ProgressBar value={balance / goal} className="mt-2" />
            <p className="mt-2 text-[13px] text-ink-2">{t("pctDone", { pct: Math.min(pct, 100), week: inr(weeks[3]) })}</p>
          </Card>
        </Link>

        {tipPending && (
          <Card className="mt-3 p-4">
            <div className="flex items-center gap-3">
              <IconBubble name="coins" tone="marigold" size={44} />
              <div>
                <p className="text-[14px] text-caution">{t("todaysTip")}</p>
                <p className="text-[16px] font-semibold">{t("putAside", { amt: tip })}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="subtle" className="min-h-[48px] px-6" onClick={() => logSavings(tip)}>
                {t("done")}
              </Button>
              <Button variant="secondary" className="min-h-[48px] px-6" onClick={() => set({ tipHandledDay: today })}>
                {t("notToday")}
              </Button>
            </div>
          </Card>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3">
          {tiles.map(([icon, key, href]) => (
            <Link key={key} href={href}>
              <Card className="flex h-full min-h-[60px] items-center gap-3 p-3 active:bg-muted">
                <IconBubble name={icon} size={36} />
                <span className="text-[16px] font-semibold leading-snug">{t(key)}</span>
              </Card>
            </Link>
          ))}
        </div>

        <Link href="/money/goals">
          <Card className="mt-3 flex items-center gap-3 p-4 active:bg-muted">
            <IconBubble name="sparkle" tone="marigold" size={44} />
            <span className="flex-1">
              <span className="block text-[16px] font-semibold">{t("myGoals")}</span>
              <span className="block text-[13px] leading-snug text-ink-2">
                {s.goals[0] ? t("goalSaved", { saved: inr(s.goals[0].saved), target: inr(s.goals[0].futureCost) }) + " · " + s.goals[0].title : t("chipEducation") + " · " + t("chipBusiness")}
              </span>
            </span>
            <Icon name="chevronRight" className="text-ink-2" />
          </Card>
        </Link>

        <button
          onClick={() => ui.openAssistant({ listen: true })}
          className="mt-6 flex h-16 w-full items-center gap-4 rounded-full bg-primary pr-6 pl-2 text-white shadow-e1 active:bg-primary-deep"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface text-primary-deep">
            <Icon name="mic" />
          </span>
          <span className="text-[17px] font-semibold">{t("tapAsk")}</span>
        </button>
      </Screen>
    </>
  );
}
