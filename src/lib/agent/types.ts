import type { Lang } from "../i18n";
import type { Proposal, VerdictKind } from "../store";

export const SCREENS = [
  "home",
  "goals",
  "check",
  "loan",
  "earnings",
  "buffer",
  "schemes",
  "applications",
  "activity",
  "me",
  "reminders",
  "privacy",
  "help",
] as const;
export type Screen = (typeof SCREENS)[number];

export const SCREEN_PATHS: Record<Screen, string> = {
  home: "/home",
  goals: "/money/goals",
  check: "/check",
  loan: "/check/loan",
  earnings: "/money",
  buffer: "/money/savings",
  schemes: "/schemes",
  applications: "/schemes/applications",
  activity: "/me/activity",
  me: "/me",
  reminders: "/me/reminders",
  privacy: "/me/privacy",
  help: "/me/help",
};

export type VerdictPayload = {
  kind: VerdictKind;
  title: string;
  summary: string;
  steps: string[];
  sources: string[];
  share_text: string;
  scheme_id?: string | null;
};

export type PlanPayload = {
  goal_type: string;
  title: string;
  summary: string;
  steps: string[];
  option_ids: string[];
  target_today: number;
  future_cost: number;
  years: number;
  monthly_saving: number;
  daily_saving: number;
  already_saved: number;
  legal_note?: string | null;
};

export type AgentAction =
  | { type: "verdict"; verdict: VerdictPayload }
  | { type: "plan"; plan: PlanPayload }
  | { type: "proposal"; proposal: Proposal }
  | { type: "navigate"; screen: Screen; scheme_id?: string | null };

export type AgentStep = "patterns" | "search" | "schemes" | "loan" | "split" | "goal";

export type AgentRequest = {
  mode: "check" | "chat";
  lang: Lang;
  messages: { role: "user" | "assistant"; text: string }[];
  state: Record<string, unknown>;
};

export type AgentResponse =
  | { ok: true; reply: string; actions: AgentAction[]; steps: AgentStep[]; sources: string[] }
  | { ok: false; code: "no_key" | "rate_limited" | "refused" | "error"; message: string };

export type AgentRequestWithProvider = AgentRequest & { provider?: string };
