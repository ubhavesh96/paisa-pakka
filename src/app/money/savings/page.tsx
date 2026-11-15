"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { inr } from "@/lib/i18n";
import { Icon } from "@/components/Icon";
import { AmountField } from "@/components/AmountField";
import { Button, Card, ListenButton, ProgressBar, Screen, TopBar, cx } from "@/components/ui";
import { useUI } from "@/components/AppShell";

// M/15 Buffer · Progress, M/16 Approve goal
export default function SavingsPage() {
  const { s, t } = useApp();
  const ui = useUI();
  const { balance, goal, weeks, tip } = s.savings;
  const [editing, setEditing] = useState(false);
  const [newGoal, setNewGoal] = useState(String(goal));
  const max = Math.max(...weeks, 1);
  const pct = Math.round((balance / goal) * 100);
  const why = t("whyMattersBody", { goal: inr(goal) });

  const proposeGoal = () => {
    const g = Number(newGoal);
    if (!g || g === goal) return setEditing(false);
    ui.setProposal({
      kind: "set_savings_goal",
      summary: t("confirmGoal", { from: inr(goal), to: inr(g), tip }),
      params: { goal: g },
    });
    setEditing(false);
  };

  return (
    <>
      <TopBar title={t("emergencySavings")} />
      <Screen nav>
        {editing ? (
          <div className="mt-2">
            <AmountField id="goal" label={t("goalLabel")} value={newGoal} onChange={setNewGoal} hint={t("goalTip")} />
            <div className="mt-4 flex gap-3">
              <Button className="flex-1" onClick={proposeGoal}>
                {t("save")}
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)}>
                {t("no")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Card className="mt-1 p-4">
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
            <ListenButton
              text={`${t("emergencySavings")}: ₹${inr(balance)} / ₹${inr(goal)}. ${t("whyMatters")} ${why}`}
              className="mt-3 self-start"
            />
            <div className="mt-3 rounded-lg bg-primary-subtle p-4">
              <h2 className="text-[16px] font-semibold">{t("whyMatters")}</h2>
              <p className="mt-2 text-[16px] leading-relaxed">{why}</p>
            </div>

            <h2 className="mt-5 text-[16px] font-semibold">{t("last4Weeks")}</h2>
            <div className="mt-3 flex h-40 items-end justify-around">
              {weeks.map((w, i) => (
                <div key={i} className="flex w-16 flex-col items-center gap-1.5">
                  <span className="num text-[12px] text-ink-2">₹{inr(w)}</span>
                  <span className={cx("w-10 rounded-md", i === 3 ? "bg-primary" : "bg-primary-subtle")} style={{ height: `${Math.max(6, (w / max) * 90)}px` }} />
                  <span className="text-[13px] text-ink-2">{i === 3 ? t("thisWeek") : t("week", { n: i + 1 })}</span>
                </div>
              ))}
            </div>
            <Button variant="secondary" className="mt-5 w-full" onClick={() => setEditing(true)}>
              {t("changeGoal")}
            </Button>
          </>
        )}
      </Screen>
    </>
  );
}
