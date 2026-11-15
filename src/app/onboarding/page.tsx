"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, type Focus, type Income, type PayFreq } from "@/lib/store";
import { requestMic } from "@/lib/speech";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Icon, type IconName } from "@/components/Icon";
import { Button, ListenButton, OptionPill, Screen, TopBar, cx } from "@/components/ui";
import type { StringKey } from "@/lib/i18n";

type Step = "lang" | "promise" | "mic" | "q1" | "q2" | "q3";
const ORDER: Step[] = ["lang", "promise", "mic", "q1", "q2", "q3"];

export default function Onboarding() {
  const { s, set, t } = useApp();
  const router = useRouter();
  const [step, setStep] = useState<Step>("lang");
  const go = (d: 1 | -1) => setStep(ORDER[Math.max(0, ORDER.indexOf(step) + d)]);

  if (step === "lang")
    return (
      <Screen className="pt-14" footer={<Button className="w-full" iconRight="arrowRight" onClick={() => go(1)}>{t("continue")}</Button>}>
        <LanguagePicker />
      </Screen>
    );

  if (step === "promise") {
    const items: [IconName, StringKey][] = [
      ["lock", "promise1"],
      ["shieldX", "promise2"],
      ["check", "promise3"],
      ["phone", "promise4"],
      ["help", "promise5"],
    ];
    const all = items.map(([, k]) => t(k)).join(" ");
    return (
      <Screen className="pt-14" footer={<Button className="w-full" iconRight="arrowRight" onClick={() => go(1)}>{t("gotItContinue")}</Button>}>
        <h1 className="title text-[28px] font-bold">{t("ourPromise")}</h1>
        <ul className="mt-6 space-y-5">
          {items.map(([icon, k]) => (
            <li key={k} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-subtle text-primary-deep">
                <Icon name={icon} size={20} />
              </span>
              <span className="text-[17px] leading-relaxed">{t(k)}</span>
            </li>
          ))}
        </ul>
        <ListenButton text={all} className="mt-6 self-start" />
      </Screen>
    );
  }

  if (step === "mic")
    return (
      <Screen
        className="pt-16"
        footer={
          <div className="flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={async () => {
                const ok = await requestMic();
                set({ micAllowed: ok });
                go(1);
              }}
            >
              {t("turnOnMic")}
            </Button>
            <Button
              variant="link"
              className="w-full"
              onClick={() => {
                set({ micAllowed: false });
                go(1);
              }}
            >
              {t("typeInstead")}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center">
          <span className="grid h-36 w-36 place-items-center rounded-full bg-primary-subtle">
            <span className="grid h-28 w-28 place-items-center rounded-full bg-primary text-white">
              <Icon name="mic" size={40} />
            </span>
          </span>
          <h1 className="title mt-16 text-[22px] font-bold leading-snug">{t("micTitle")}</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{t("micBody")}</p>
        </div>
      </Screen>
    );

  // 3 quick questions
  const qIndex = ["q1", "q2", "q3"].indexOf(step);
  const header = (
    <>
      <TopBar title={t("quickQuestions")} onBack={() => go(-1)} />
      <div className="flex gap-2 px-4 pt-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cx("h-1.5 flex-1 rounded-full", i <= qIndex ? "bg-primary" : "bg-line")} />
        ))}
      </div>
    </>
  );

  if (step === "q1") {
    const opts: [PayFreq, StringKey][] = [
      ["daily", "daily"],
      ["weekly", "weekly"],
      ["monthly", "monthly"],
      ["sometimes", "sometimes"],
    ];
    return (
      <>
        {header}
        <Screen className="pt-6" footer={<Button className="w-full" iconRight="arrowRight" onClick={() => go(1)}>{t("next")}</Button>}>
          <h2 className="title text-[22px] font-bold">{t("howPaid")}</h2>
          <div className="mt-4 flex flex-col gap-3">
            {opts.map(([v, k]) => (
              <OptionPill key={v} selected={s.payFreq === v} onClick={() => set({ payFreq: v })}>
                {t(k)}
              </OptionPill>
            ))}
          </div>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{t("howPaidHelp")}</p>
        </Screen>
      </>
    );
  }

  if (step === "q2") {
    const opts: [Income, StringKey][] = [
      ["under10", "under10"],
      ["10to15", "r10to15"],
      ["15to25", "r15to25"],
      ["over25", "over25"],
    ];
    return (
      <>
        {header}
        <Screen className="pt-6" footer={<Button className="w-full" iconRight="arrowRight" onClick={() => go(1)}>{t("next")}</Button>}>
          <h2 className="title text-[22px] font-bold">{t("howMuchEarn")}</h2>
          <div className="mt-4 flex flex-col gap-3">
            {opts.map(([v, k]) => (
              <OptionPill key={v} selected={s.income === v} onClick={() => set({ income: v })}>
                <span className="num">{t(k)}</span>
              </OptionPill>
            ))}
          </div>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{t("howMuchEarnHelp")}</p>
        </Screen>
      </>
    );
  }

  const opts: [Focus, StringKey, string][] = [
    ["savings", "focusSavings", "/home"],
    ["scams", "focusScams", "/check"],
    ["schemes", "focusSchemes", "/schemes"],
    ["goal", "focusGoal", "/money/savings"],
  ];
  return (
    <>
      {header}
      <Screen
        className="pt-6"
        footer={
          <Button
            className="w-full"
            iconRight="arrowRight"
            onClick={() => {
              const goal = { under10: 2000, "10to15": 3000, "15to25": 5000, over25: 8000 }[s.income];
              set((p) => ({ onboarded: true, savings: { ...p.savings, goal } }));
              router.replace(opts.find((o) => o[0] === s.focus)?.[2] ?? "/home");
            }}
          >
            {t("getStarted")}
          </Button>
        }
      >
        <h2 className="title text-[22px] font-bold">{t("helpFirst")}</h2>
        <div className="mt-4 flex flex-col gap-3">
          {opts.map(([v, k]) => (
            <OptionPill key={v} selected={s.focus === v} onClick={() => set({ focus: v })}>
              {t(k)}
            </OptionPill>
          ))}
        </div>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{t("helpFirstHelp")}</p>
      </Screen>
    </>
  );
}
