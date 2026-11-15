"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { translate, type Lang, type StringKey } from "./i18n";
import { SCHEMES } from "./schemes";

export type PayFreq = "daily" | "weekly" | "monthly" | "sometimes";
export type Income = "under10" | "10to15" | "15to25" | "over25";
export type Focus = "savings" | "scams" | "schemes" | "goal";
export type VerdictKind = "scam" | "real" | "unsure";

export type Verdict = {
  id: string;
  kind: VerdictKind;
  question: string;
  title: string;
  summary: string;
  steps: string[];
  sources: string[];
  shareText: string;
  schemeId?: string;
  checkedAt: number;
};

export type ActivityItem = {
  id: string;
  type: "check" | "savings" | "form" | "loan";
  title: string;
  sub: string;
  at: number;
  verdictId?: string;
  icon?: "scam" | "real" | "unsure" | "savings" | "form" | "loan";
};

export type AuditEntry = { id: string; at: number; summary: string; kind: string };

/** Every change the agent wants to make goes through a Proposal (Flow D). */
export type Proposal =
  | { kind: "set_savings_goal"; summary: string; params: { goal: number } }
  | { kind: "log_savings"; summary: string; params: { amount: number } }
  | { kind: "set_reminder"; summary: string; params: { on: boolean; time?: string } }
  | { kind: "set_pay_frequency"; summary: string; params: { freq: PayFreq } }
  | { kind: "start_application"; summary: string; params: { schemeId: string } }
  | { kind: "complete_application_step"; summary: string; params: { schemeId: string; step: number } }
  | { kind: "set_read_aloud"; summary: string; params: { on: boolean } };

export type Goal = {
  id: string;
  type: string;
  title: string;
  summary: string;
  steps: string[];
  optionIds: string[];
  targetToday: number;
  futureCost: number;
  years: number;
  monthly: number;
  daily: number;
  saved: number;
  legalNote?: string | null;
  createdAt: number;
};

export type Profile = {
  name: string;
  age: number;
  work: string;
  state: string;
  district: string;
  hasBank: boolean;
};

export type AppState = {
  lang: Lang;
  onboarded: boolean;
  micAllowed: boolean | null;
  payFreq: PayFreq;
  income: Income;
  focus: Focus;
  profile: Profile;
  savings: { balance: number; goal: number; weeks: number[]; streak: number; tip: number; lastSavedDay: string | null };
  tipHandledDay: string | null;
  verdicts: Verdict[];
  activity: ActivityItem[];
  applications: Record<string, number>; // schemeId -> steps completed
  audit: AuditEntry[];
  reminders: { on: boolean; time: string };
  readAloud: boolean;
  pendingQuestion: string | null;
  lastEarning: number | null;
  viewVerdictId: string | null;
  viewSchemeId: string | null;
  goals: Goal[];
  viewPlan: Omit<Goal, "id" | "createdAt" | "saved"> | null;
};

const HOUR = 3600_000;
const dayKey = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
export const uid = () => Math.random().toString(36).slice(2, 10);

function seedState(now = 0): AppState {
  const v1: Verdict = {
    id: "seed-scam",
    kind: "scam",
    question: "I got a call: deposit ₹1000 and get ₹6000 from a PM scheme. Is it real?",
    title: "This is a scam",
    summary: "No government scheme asks for a fee before paying you. Don’t send money or share OTP.",
    steps: ["Don’t send money or share OTP or UPI PIN", "Block the number", "Lost money? Call 1930 right away"],
    sources: ["pmkisan.gov.in", "cybercrime.gov.in"],
    shareText:
      "A call saying “deposit ₹1000 to get ₹6000 from a PM scheme” is a scam. No government scheme asks for money first.",
    checkedAt: now - 2 * HOUR,
  };
  const v2: Verdict = {
    id: "seed-real",
    kind: "real",
    question: "₹2 lakh insurance for ₹20. Is it real?",
    title: "This is real",
    summary: "PM Suraksha Bima gives ₹2 lakh accident cover for ₹20 a year.",
    steps: ["Fill the PMSBY form at your bank or post office", "₹20 is taken from your account every year", "Don’t pay any agent extra"],
    sources: ["jansuraksha.gov.in"],
    shareText: "PM Suraksha Bima is real: ₹2 lakh accident cover for ₹20 a year. Apply at your bank. Don’t pay any agent extra.",
    schemeId: "pmsby",
    checkedAt: now - 26 * HOUR,
  };
  return {
    lang: "hi",
    onboarded: false,
    micAllowed: null,
    payFreq: "daily",
    income: "10to15",
    focus: "savings",
    profile: { name: "Rahul Kumar", age: 24, work: "Delivery partner", state: "Haryana", district: "Gurugram", hasBank: true },
    savings: { balance: 1250, goal: 3000, weeks: [150, 300, 100, 200], streak: 4, tip: 50, lastSavedDay: null },
    tipHandledDay: null,
    verdicts: [v1, v2],
    activity: [
      { id: "seed-a1", type: "check", title: "“Deposit ₹1000” call", sub: "Scam caught", at: now - 2 * HOUR, verdictId: v1.id, icon: "scam" },
      { id: "seed-a2", type: "savings", title: "₹50 to savings", sub: "Payday tip", at: now - 3 * HOUR, icon: "savings" },
      { id: "seed-a3", type: "check", title: "PM Suraksha Bima", sub: "Turned out real", at: now - 26 * HOUR, verdictId: v2.id, icon: "real" },
      { id: "seed-a4", type: "form", title: "e-Shram form", sub: "Sent on government site", at: now - 28 * HOUR, icon: "form" },
      { id: "seed-a5", type: "loan", title: "Loan check: ₹10,000", sub: "Turned out very expensive", at: now - 30 * HOUR, icon: "loan" },
    ],
    applications: { eshram: 3, pmsym: 1 },
    audit: [],
    reminders: { on: true, time: "7 PM" },
    readAloud: true,
    pendingQuestion: null,
    lastEarning: null,
    viewVerdictId: v1.id,
    viewSchemeId: "eshram",
    goals: [],
    viewPlan: null,
  };
}

function emptyState(prev: AppState): AppState {
  const s = seedState(Date.now());
  return {
    ...s,
    lang: prev.lang,
    onboarded: true,
    micAllowed: prev.micAllowed,
    savings: { ...s.savings, balance: 0, weeks: [0, 0, 0, 0], streak: 0 },
    verdicts: [],
    activity: [],
    applications: {},
  };
}

const KEY = "paisa-pakka:v1";

type Ctx = {
  s: AppState;
  ready: boolean;
  set: (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  applyProposal: (p: Proposal) => void;
  addVerdict: (v: Verdict) => void;
  addActivity: (a: Omit<ActivityItem, "id" | "at">) => void;
  logSavings: (amount: number) => void;
  deleteAll: () => void;
  today: string;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<AppState>(() => seedState(0));
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState("");
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setS(raw ? { ...seedState(Date.now()), ...JSON.parse(raw) } : seedState(Date.now()));
    } catch {
      setS(seedState(Date.now())); // private mode etc.
    }
    setToday(dayKey());
    // Portfolio demo link: ?demo skips onboarding, ?lang=en|hi sets language.
    const q = new URLSearchParams(window.location.search);
    if (q.has("demo")) setS((p) => ({ ...p, onboarded: true }));
    const ql = q.get("lang");
    if (ql === "en" || ql === "hi" || ql === "hinglish") setS((p) => ({ ...p, lang: ql }));
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
    document.documentElement.lang = s.lang === "en" ? "en" : "hi";
  }, [s]);

  const set = useCallback<Ctx["set"]>((patch) => {
    setS((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);

  const t = useCallback<Ctx["t"]>((key, vars) => translate(s.lang, key, vars), [s.lang]);

  const addActivity = useCallback<Ctx["addActivity"]>((a) => {
    setS((prev) => ({ ...prev, activity: [{ ...a, id: uid(), at: Date.now() }, ...prev.activity] }));
  }, []);

  const logSavings = useCallback((amount: number) => {
    setS((prev) => {
      const today = dayKey();
      const already = prev.savings.lastSavedDay === today;
      const weeks = [...prev.savings.weeks];
      weeks[3] += amount;
      return {
        ...prev,
        tipHandledDay: today,
        savings: {
          ...prev.savings,
          balance: prev.savings.balance + amount,
          weeks,
          streak: already ? prev.savings.streak : prev.savings.streak + 1,
          lastSavedDay: today,
        },
        activity: [
          { id: uid(), type: "savings", title: `₹${amount} → savings`, sub: "Payday tip", at: Date.now(), icon: "savings" },
          ...prev.activity,
        ],
      };
    });
  }, []);

  const applyProposal = useCallback(
    (p: Proposal) => {
      const audit: AuditEntry = { id: uid(), at: Date.now(), summary: p.summary, kind: p.kind };
      if (p.kind === "log_savings") logSavings(p.params.amount);
      setS((prev) => {
        const next: AppState = { ...prev, audit: [audit, ...prev.audit] };
        switch (p.kind) {
          case "set_savings_goal":
            next.savings = { ...prev.savings, goal: Math.max(100, Math.round(p.params.goal)) };
            break;
          case "set_reminder":
            next.reminders = { on: p.params.on, time: p.params.time ?? prev.reminders.time };
            break;
          case "set_pay_frequency":
            next.payFreq = p.params.freq;
            break;
          case "start_application":
            next.applications = { ...prev.applications, [p.params.schemeId]: prev.applications[p.params.schemeId] ?? 0 };
            break;
          case "complete_application_step": {
            const total = SCHEMES.find((x) => x.id === p.params.schemeId)?.trackerSteps.length ?? 3;
            next.applications = { ...prev.applications, [p.params.schemeId]: Math.min(total, p.params.step) };
            break;
          }
          case "set_read_aloud":
            next.readAloud = p.params.on;
            break;
        }
        return next;
      });
    },
    [logSavings],
  );

  const addVerdict = useCallback((v: Verdict) => {
    setS((prev) => ({
      ...prev,
      viewVerdictId: v.id,
      verdicts: [v, ...prev.verdicts].slice(0, 50),
      activity: [
        {
          id: uid(),
          type: "check",
          title: v.question.length > 42 ? v.question.slice(0, 40) + "…" : v.question,
          sub: v.kind === "scam" ? "Scam caught" : v.kind === "real" ? "Turned out real" : "Not sure yet",
          at: Date.now(),
          verdictId: v.id,
          icon: v.kind,
        },
        ...prev.activity,
      ],
    }));
  }, []);

  const deleteAll = useCallback(() => setS((prev) => emptyState(prev)), []);

  const value = useMemo<Ctx>(
    () => ({ s, ready, set, t, applyProposal, addVerdict, addActivity, logSavings, deleteAll, today }),
    [s, ready, set, t, applyProposal, addVerdict, addActivity, logSavings, deleteAll, today],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}
