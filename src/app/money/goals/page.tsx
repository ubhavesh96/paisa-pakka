"use client";

import { useApp } from "@/lib/store";
import { inr, type StringKey } from "@/lib/i18n";
import { Icon } from "@/components/Icon";
import { Button, Card, ProgressBar, Screen, TopBar } from "@/components/ui";
import { useUI } from "@/components/AppShell";

const CHIPS: [StringKey, { en: string; hi: string }][] = [
  ["chipEducation", { en: "I want to save for my daughter’s education", hi: "मुझे अपनी बेटी की पढ़ाई के लिए पैसे बचाने हैं" }],
  ["chipMarriage", { en: "I want to save for my daughter’s wedding", hi: "मुझे अपनी बेटी की शादी के लिए पैसे जोड़ने हैं" }],
  ["chipBusiness", { en: "I want to help my son set up a business", hi: "मुझे अपने बेटे का बिज़नेस शुरू करवाना है" }],
  ["chipHome", { en: "I want to save to buy our own home", hi: "मुझे अपना घर लेने के लिए बचत करनी है" }],
];

// My goals (new): life goals with end-to-end plans from the agent.
export default function GoalsPage() {
  const { s, t, set } = useApp();
  const ui = useUI();
  const L = s.lang === "en" ? "en" : "hi";

  return (
    <>
      <TopBar title={t("myGoals")} />
      <Screen nav>
        <p className="mt-1 text-[17px] leading-relaxed text-ink-2">{t("goalsIntro")}</p>

        <button
          onClick={() => ui.openAssistant({ listen: true })}
          className="mt-4 flex h-16 w-full items-center gap-4 rounded-full bg-primary pr-6 pl-2 text-white shadow-e1 active:bg-primary-deep"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface text-primary-deep">
            <Icon name="mic" />
          </span>
          <span className="text-[17px] font-semibold">{t("planNewGoal")}</span>
        </button>

        <p className="mt-4 text-[14px] text-ink-2">{t("goalChips")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CHIPS.map(([k, text]) => (
            <button
              key={k}
              onClick={() => ui.openAssistant({ text: text[L] })}
              className="h-11 rounded-full border-[1.5px] border-line-strong bg-surface px-4 text-[15px] font-semibold active:bg-muted"
            >
              {t(k)}
            </button>
          ))}
        </div>

        {s.goals.length > 0 && (
          <div className="mt-5 space-y-3">
            {s.goals.map((g) => (
              <Card key={g.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[17px] font-semibold">{g.title}</h2>
                  <span className="num shrink-0 text-[14px] text-ink-2">{t("needed", { n: g.years })}</span>
                </div>
                <p className="num mt-2 text-[15px] text-ink-2">{t("goalSaved", { saved: inr(g.saved), target: inr(g.futureCost) })}</p>
                <ProgressBar value={g.saved / g.futureCost} className="mt-2" />
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="subtle"
                    className="min-h-[44px] flex-1 px-3 text-[15px]"
                    onClick={() => {
                      set((p) => ({ goals: p.goals.map((x) => (x.id === g.id ? { ...x, saved: x.saved + x.daily } : x)) }));
                      ui.showToast(t("wellDone", { amt: inr(g.daily) }));
                    }}
                  >
                    {t("addToGoal", { amt: inr(g.daily) })}
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-[44px] px-4 text-[15px]"
                    href="/money/goals/plan"
                    onClick={() => set({ viewPlan: g })}
                  >
                    {t("goalPlan")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Screen>
    </>
  );
}
