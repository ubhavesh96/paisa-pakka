"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { speechLang } from "./i18n";
import { speak } from "./speech";
import { uid, useApp, type Verdict } from "./store";
import { SCREEN_PATHS, type AgentAction, type AgentRequest, type AgentResponse, type AgentStep } from "./agent/types";
import { useUI } from "@/components/AppShell";

export type Phase = "idle" | "working" | "slow" | "offline" | "error" | "no_key";

const SLOW_MS = 25_000;
const HARD_MS = 70_000;

/** Runs one agent request and applies its actions to the app. */
export function useAgent() {
  const app = useApp();
  const ui = useUI();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setPhase("idle");
  }, []);

  const applyActions = useCallback(
    (actions: AgentAction[], question: string, sources: string[]) => {
      let navigated = false;
      for (const a of actions) {
        if (a.type === "verdict") {
          const v: Verdict = {
            id: uid(),
            kind: a.verdict.kind,
            question,
            title: a.verdict.title,
            summary: a.verdict.summary,
            steps: a.verdict.steps,
            sources: a.verdict.sources.length ? a.verdict.sources : a.verdict.kind === "unsure" ? [] : sources.slice(0, 2),
            shareText: a.verdict.share_text,
            schemeId: a.verdict.scheme_id ?? undefined,
            checkedAt: Date.now(),
          };
          app.addVerdict(v);
          router.push("/check/result");
          navigated = true;
        } else if (a.type === "plan") {
          const p = a.plan;
          app.set({
            viewPlan: {
              type: p.goal_type,
              title: p.title,
              summary: p.summary,
              steps: p.steps,
              optionIds: p.option_ids,
              targetToday: p.target_today,
              futureCost: p.future_cost,
              years: p.years,
              monthly: p.monthly_saving,
              daily: p.daily_saving,
              legalNote: p.legal_note ?? null,
            },
          });
          router.push("/money/goals/plan");
          navigated = true;
        } else if (a.type === "proposal") {
          ui.setProposal(a.proposal);
        } else if (a.type === "navigate" && !navigated) {
          if (a.screen === "schemes" && a.scheme_id) {
            app.set({ viewSchemeId: a.scheme_id });
            router.push("/schemes/detail");
          } else router.push(SCREEN_PATHS[a.screen]);
          navigated = true;
        }
      }
      return navigated;
    },
    [app, router, ui],
  );

  const run = useCallback(
    async (messages: AgentRequest["messages"], mode: AgentRequest["mode"]) => {
      const question = messages[messages.length - 1]?.text ?? "";
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        app.set({ pendingQuestion: question });
        setPhase("offline");
        return null;
      }
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setPhase("working");
      setSteps([]);
      const slow = setTimeout(() => setPhase((p) => (p === "working" ? "slow" : p)), SLOW_MS);
      const hard = setTimeout(() => ctrl.abort(), HARD_MS);
      const { s } = app;
      const body: AgentRequest = {
        mode,
        lang: s.lang,
        messages,
        state: {
          profile: { age: s.profile.age, work: s.profile.work, state: s.profile.state, hasBank: s.profile.hasBank },
          income: s.income,
          payFreq: s.payFreq,
          savings: s.savings,
          applications: s.applications,
          goals: s.goals.map((g) => ({ title: g.title, type: g.type, saved: g.saved, target: g.futureCost, years: g.years })),
          reminders: s.reminders,
        },
      };
      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        const data = (await res.json()) as AgentResponse;
        if (!data.ok) {
          setPhase(data.code === "no_key" ? "no_key" : "error");
          return null;
        }
        setSteps(data.steps);
        setPhase("idle");
        if (data.reply && s.readAloud) speak(data.reply, speechLang(s.lang));
        const navigated = applyActions(data.actions, question, data.sources);
        return { ...data, navigated };
      } catch (e) {
        if ((e as Error).name === "AbortError" && ctrl !== abortRef.current) return null; // superseded
        setPhase(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
        if (!navigator.onLine) app.set({ pendingQuestion: question });
        return null;
      } finally {
        clearTimeout(slow);
        clearTimeout(hard);
      }
    },
    [app, applyActions],
  );

  return { run, phase, setPhase, steps, cancel };
}
