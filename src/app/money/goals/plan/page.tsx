"use client";

import { useRouter } from "next/navigation";
import { uid, useApp } from "@/lib/store";
import { inr } from "@/lib/i18n";
import { goalOption } from "@/lib/goals";
import { Icon } from "@/components/Icon";
import { Button, Card, ListenButton, Screen, StateBlock, TopBar } from "@/components/ui";
import { useUI } from "@/components/AppShell";

// Goal plan (new): the agent's end-to-end plan, numbers computed in code.
export default function PlanPage() {
  const { s, t, set } = useApp();
  const ui = useUI();
  const router = useRouter();
  const L = s.lang === "en" ? "en" : "hi";
  const p = s.viewPlan;

  if (!p)
    return (
      <>
        <TopBar title={t("goalPlan")} />
        <Screen>
          <StateBlock icon="coins" title={t("noGoals")} body={t("goalsIntro")}>
            <Button href="/money/goals">{t("planNewGoal")}</Button>
          </StateBlock>
        </Screen>
      </>
    );

  const existing = s.goals.find((g) => g.title === p.title && g.futureCost === p.futureCost);
  const spoken = `${p.title}. ${p.summary} ${t("stepsTitle")}: ${p.steps.join(". ")}`;

  const start = () => {
    set((st) => ({ goals: [{ ...p, id: uid(), saved: 0, createdAt: Date.now() }, ...st.goals] }));
    ui.showToast(t("planStarted"));
    router.push("/money/goals");
  };

  return (
    <>
      <TopBar title={t("goalPlan")} />
      <Screen
        footer={
          existing ? (
            <Button variant="secondary" className="w-full" onClick={() => ui.openAssistant()}>
              {t("askAboutPlan")}
            </Button>
          ) : (
            <Button className="w-full" icon="check" onClick={start}>
              {t("startPlan")}
            </Button>
          )
        }
      >
        <div className="mt-1 rounded-lg bg-primary p-5 text-white">
          <p className="text-[14px] opacity-90">{t("needed", { n: p.years })}</p>
          <h1 className="title mt-1 text-[24px] font-bold leading-tight">{p.title}</h1>
          <p className="num mt-3 text-[34px] font-bold leading-none">₹{inr(p.futureCost)}</p>
          <p className="mt-1 text-[14px] opacity-90">{t("todayCost", { amt: inr(p.targetToday) })}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-white/15 p-3">
              <p className="num text-[24px] font-bold">₹{inr(p.daily)}</p>
              <p className="text-[13px]">{t("perDay")}</p>
            </div>
            <div className="rounded-md bg-white/15 p-3">
              <p className="num text-[24px] font-bold">₹{inr(p.monthly)}</p>
              <p className="text-[13px]">{t("perMonth")}</p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[17px] leading-relaxed">{p.summary}</p>
        <ListenButton text={spoken} className="mt-3 self-start" />

        {p.legalNote && (
          <div className="mt-4 flex gap-3 rounded-md bg-caution-subtle p-4 text-[15px] text-caution">
            <Icon name="alert" size={20} className="shrink-0" />
            {p.legalNote}
          </div>
        )}

        <Card className="mt-4 p-4">
          <h2 className="text-[16px] font-semibold">{t("stepsTitle")}</h2>
          <ol className="mt-3 space-y-3">
            {p.steps.map((st, i) => (
              <li key={i} className="flex gap-3 text-[16px] leading-relaxed">
                <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-subtle text-[14px] font-semibold text-primary-deep">{i + 1}</span>
                {st}
              </li>
            ))}
          </ol>
        </Card>

        {p.optionIds.length > 0 && (
          <>
            <h2 className="mt-5 text-[16px] font-semibold">{t("bestOptions")}</h2>
            <div className="mt-3 space-y-3">
              {p.optionIds.map((id) => {
                const o = goalOption(id);
                if (!o) return null;
                return (
                  <Card key={id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[16px] font-semibold leading-snug">{o.name[L]}</h3>
                      <a href={`https://${o.where}`} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-primary-deep">
                        {o.where}
                        <Icon name="arrowUpRight" size={16} />
                      </a>
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{o.what[L]}</p>
                  </Card>
                );
              })}
            </div>
          </>
        )}
        <p className="mt-4 text-[13px] leading-relaxed text-ink-2">{t("goalNote")}</p>
      </Screen>
    </>
  );
}
