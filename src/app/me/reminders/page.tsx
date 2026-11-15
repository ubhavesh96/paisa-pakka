"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Icon } from "@/components/Icon";
import { Button, Card, Chip, Screen, TopBar, cx } from "@/components/ui";
import { useUI } from "@/components/AppShell";

// M/22b Reminders
export default function RemindersPage() {
  const { s, t, set } = useApp();
  const ui = useUI();
  const router = useRouter();
  const [on, setOn] = useState(s.reminders.on);
  const [time, setTime] = useState(s.reminders.time);

  return (
    <>
      <TopBar title={t("reminders")} />
      <Screen
        footer={
          <Button
            className="w-full"
            onClick={() => {
              set({ reminders: { on, time } });
              ui.showToast("✓ " + t("save"));
              router.back();
            }}
          >
            {t("save")}
          </Button>
        }
      >
        <Card className="mt-1 flex items-center gap-4 p-4">
          <div className="flex-1">
            <p className="text-[16px] font-semibold">{t("remindPayday")}</p>
            <p className="mt-1 text-[15px] text-ink-2">{t("remindPaydayBody")}</p>
          </div>
          <button
            role="switch"
            aria-checked={on}
            onClick={() => setOn(!on)}
            className={cx("relative h-8 w-14 shrink-0 rounded-full transition", on ? "bg-primary" : "bg-line-strong")}
          >
            <span className={cx("absolute top-1 h-6 w-6 rounded-full bg-white transition-all", on ? "left-7" : "left-1")} />
          </button>
        </Card>
        {on && (
          <>
            <h2 className="mt-5 text-[16px] font-semibold">{t("whatTime")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {["8 AM", "1 PM", "7 PM", "9 PM"].map((x) => (
                <Chip key={x} selected={time === x} onClick={() => setTime(x)}>
                  <span className="num">{x}</span>
                </Chip>
              ))}
            </div>
          </>
        )}
        <div className="mt-5 flex gap-3 rounded-lg bg-primary-subtle p-4 text-[16px]">
          <Icon name="shieldCheck" size={20} className="mt-0.5 shrink-0 text-primary-deep" />
          {t("atMostOne")}
        </div>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{t("neverAsk")}</p>
      </Screen>
    </>
  );
}
