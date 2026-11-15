import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { loanCost, splitEarning } from "../calc";
import { goalOption, planGoal } from "../goals";
import { matchPatterns } from "../scams";
import { INCOME_MID, matchSchemes } from "../schemes";
import { SCREENS, type AgentAction, type AgentStep } from "./types";

type Tool = Anthropic.Beta.BetaToolUnion;

// Official domains the web search may read. Keeps answers grounded in
// government / regulator sources, as the brand promises.
export const OFFICIAL_DOMAINS = [
  "gov.in",
  "nic.in",
  "rbi.org.in",
  "npci.org.in",
  "maandhan.in",
  "pmjay.gov.in",
  "sachet.rbi.org.in",
  "npscra.nsdl.co.in",
];

export const webSearchTool: Tool = {
  type: "web_search_20260209",
  name: "web_search",
  max_uses: 2,
  allowed_domains: OFFICIAL_DOMAINS,
  user_location: { type: "approximate", country: "IN" },
};

// ---- Tool definitions ----

export const TOOLS: Tool[] = [
  {
    name: "check_scam_patterns",
    description:
      "Match a suspicious call, SMS, WhatsApp message, link or offer against known Indian fraud patterns (fake scheme fees, lottery/KBC, OTP/KYC, UPI collect, task jobs, loan apps, digital arrest, free phone links). Returns matching patterns with red flags, advice and official sources. Call this first for any 'is it real?' question.",
    input_schema: {
      type: "object",
      properties: { text: { type: "string", description: "The message or a description of the call, in any language." } },
      required: ["text"],
    },
  },
  {
    name: "find_schemes",
    description:
      "List government welfare schemes the user likely qualifies for (e-Shram, PM-SYM pension, PMSBY accident insurance, PMJJBY life insurance, Atal Pension, Ayushman Bharat), with the reason. Uses age, monthly income and bank account.",
    input_schema: {
      type: "object",
      properties: {
        age: { type: "integer" },
        monthly_income: { type: "integer", description: "Approximate monthly income in rupees." },
        has_bank_account: { type: "boolean" },
        informal_worker: { type: "boolean", description: "True for gig, delivery, domestic, security, shop, daily-wage work without EPFO/ESIC." },
      },
      required: ["age", "monthly_income", "has_bank_account", "informal_worker"],
    },
  },
  {
    name: "loan_cost",
    description: "Compute the real cost of a loan: extra paid, extra per ₹100, and the approximate yearly rate.",
    input_schema: {
      type: "object",
      properties: {
        principal: { type: "number", description: "Amount received, in rupees." },
        total_repay: { type: "number", description: "Total of all repayments, in rupees." },
        weeks: { type: "number", description: "Repayment period in weeks." },
      },
      required: ["principal", "total_repay", "weeks"],
    },
  },
  {
    name: "suggest_split",
    description: "Suggest how to split one day's or one payment's earnings into emergency savings, home expenses, fuel/fare and a goal.",
    input_schema: {
      type: "object",
      properties: { amount: { type: "number", description: "Amount earned, in rupees." } },
      required: ["amount"],
    },
  },
  {
    name: "plan_goal",
    description:
      "Calculate a savings plan for a life goal (child's education, daughter's or son's marriage, starting a business, home, vehicle, health). Returns future cost with price rise, monthly and daily saving needed, whether it's affordable, and the right government options (Sukanya Samriddhi for a daughter under 10, Post Office RD/PPF, Mudra/PMEGP/Stand-Up India for business, scholarships, life cover). Always use this for the numbers; never compute them yourself.",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["education", "marriage", "business", "home", "vehicle", "health", "other"] },
        target_today: { type: "number", description: "Rough cost in today's rupees. If the user doesn't know: education ₹5,00,000; marriage ₹3,00,000; business ₹1,00,000." },
        years: { type: "number", description: "Years until the money is needed." },
        already_saved: { type: "number", description: "Rupees already saved for this goal (0 if none)." },
        monthly_income: { type: "number", description: "Approximate monthly income (use approx_monthly_income from app_state)." },
        for_daughter: { type: "boolean", description: "True if the goal is for a daughter." },
        child_age: { type: "number", description: "Child's current age, if the goal is for a child. Omit otherwise." },
      },
      required: ["type", "target_today", "years", "already_saved", "monthly_income", "for_daughter"],
    },
  },
  {
    name: "show_plan",
    description:
      "Show the goal plan screen after plan_goal. Copy the numbers from plan_goal exactly. Write title, summary and steps in the user's language.",
    input_schema: {
      type: "object",
      properties: {
        goal_type: { type: "string", enum: ["education", "marriage", "business", "home", "vehicle", "health", "other"] },
        title: { type: "string", description: "Short goal name, e.g. 'Beti ki padhai' / 'बेटी की पढ़ाई' / 'Son's shop'." },
        summary: { type: "string", description: "1–2 sentences: how much, by when, how much per day." },
        steps: {
          type: "array",
          items: { type: "string" },
          description:
            "4–6 end-to-end steps in order, each one short and concrete: e.g. keep emergency savings going; open the account (where + documents); save ₹X daily / ₹Y monthly by auto-debit; apply for the loan/scholarship (where); protect with life cover; review every year.",
        },
        option_ids: { type: "array", items: { type: "string" }, description: "ids of options from plan_goal, best first." },
        target_today: { type: "number" },
        future_cost: { type: "number" },
        years: { type: "number" },
        monthly_saving: { type: "number" },
        daily_saving: { type: "number" },
        already_saved: { type: "number" },
        legal_note: { type: "string", description: "Copy plan_goal's legal_note if present, translated to the user's language." },
      },
      required: ["goal_type", "title", "summary", "steps", "option_ids", "target_today", "future_cost", "years", "monthly_saving", "daily_saving", "already_saved"],
    },
  },
  {
    name: "show_verdict",
    description:
      "Show the scam-check result screen to the user. Call exactly once at the end of any 'is this real/safe/scam?' question.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["scam", "real", "unsure"] },
        title: { type: "string", description: "Very short headline, e.g. 'This is a scam' / 'यह धोखा है'." },
        summary: { type: "string", description: "1–2 short sentences explaining why." },
        steps: { type: "array", items: { type: "string" }, description: "Exactly 3 short next actions." },
        sources: { type: "array", items: { type: "string" }, description: "Bare domains relied on, e.g. 'cybercrime.gov.in'." },
        share_text: { type: "string", description: "WhatsApp-ready 1–2 sentence message for friends. No personal details." },
        scheme_id: {
          type: ["string", "null"],
          enum: ["eshram", "pmsym", "pmsby", "pmjjby", "ayushman", "apy", null],
          description: "If the question was about a real scheme in our list, its id.",
        },
      },
      required: ["kind", "title", "summary", "steps", "sources", "share_text"],
    },
  },
  {
    name: "propose_change",
    description:
      "Ask the user to confirm a change in the app. Nothing changes unless they tap Yes. Use for: log_savings {amount}, set_savings_goal {goal}, set_reminder {on, time like '7 PM'}, set_pay_frequency {freq: daily|weekly|monthly|sometimes}, start_application {scheme_id}, complete_application_step {scheme_id, step (number of steps done)}, set_read_aloud {on}.",
    input_schema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["log_savings", "set_savings_goal", "set_reminder", "set_pay_frequency", "start_application", "complete_application_step", "set_read_aloud"],
        },
        summary: { type: "string", description: "One sentence in the user's language describing exactly what will change, e.g. 'Add ₹50 to your emergency savings?'" },
        amount: { type: "number" },
        goal: { type: "number" },
        on: { type: "boolean" },
        time: { type: "string" },
        freq: { type: "string", enum: ["daily", "weekly", "monthly", "sometimes"] },
        scheme_id: { type: "string", enum: ["eshram", "pmsym", "pmsby", "pmjjby", "ayushman", "apy"] },
        step: { type: "integer" },
      },
      required: ["kind", "summary"],
    },
  },
  {
    name: "open_screen",
    description: "Navigate the app to a screen.",
    input_schema: {
      type: "object",
      properties: {
        screen: { type: "string", enum: [...SCREENS] },
        scheme_id: { type: ["string", "null"], description: "For schemes: open this scheme's detail page." },
      },
      required: ["screen"],
    },
  },
];

// ---- Validation + execution ----

const V = {
  check_scam_patterns: z.object({ text: z.string() }),
  find_schemes: z.object({ age: z.number(), monthly_income: z.number(), has_bank_account: z.boolean(), informal_worker: z.boolean() }),
  loan_cost: z.object({ principal: z.number(), total_repay: z.number(), weeks: z.number() }),
  suggest_split: z.object({ amount: z.number().positive() }),
  plan_goal: z.object({
    type: z.enum(["education", "marriage", "business", "home", "vehicle", "health", "other"]),
    target_today: z.number().positive(),
    years: z.number().positive(),
    already_saved: z.number().min(0).default(0),
    monthly_income: z.number().min(0).default(0),
    for_daughter: z.boolean().default(false),
    child_age: z.number().nullable().optional(),
  }),
  show_plan: z.object({
    goal_type: z.string(),
    title: z.string(),
    summary: z.string(),
    steps: z.array(z.string()).min(1),
    option_ids: z.array(z.string()).default([]),
    target_today: z.number(),
    future_cost: z.number(),
    years: z.number(),
    monthly_saving: z.number(),
    daily_saving: z.number(),
    already_saved: z.number().default(0),
    legal_note: z.string().nullable().optional(),
  }),
  show_verdict: z.object({
    kind: z.enum(["scam", "real", "unsure"]),
    title: z.string(),
    summary: z.string(),
    steps: z.array(z.string()).min(1),
    sources: z.array(z.string()),
    share_text: z.string(),
    scheme_id: z.string().nullable().optional(),
  }),
  propose_change: z.object({
    kind: z.enum(["log_savings", "set_savings_goal", "set_reminder", "set_pay_frequency", "start_application", "complete_application_step", "set_read_aloud"]),
    summary: z.string(),
    amount: z.number().optional(),
    goal: z.number().optional(),
    on: z.boolean().optional(),
    time: z.string().optional(),
    freq: z.enum(["daily", "weekly", "monthly", "sometimes"]).optional(),
    scheme_id: z.string().optional(),
    step: z.number().optional(),
  }),
  open_screen: z.object({ screen: z.enum(SCREENS), scheme_id: z.string().nullable().optional() }),
};

export type ToolOutcome = { result: string; isError?: boolean; action?: AgentAction; step?: AgentStep };

/** Per-request memory shared between tool calls (keeps plan numbers authoritative). */
export type ToolCtx = { lastPlan?: ReturnType<typeof planGoal> };

export function runTool(name: string, input: unknown, lang: "hi" | "en", ctx: ToolCtx = {}): ToolOutcome {
  const err = (m: string): ToolOutcome => ({ result: m, isError: true });
  switch (name) {
    case "check_scam_patterns": {
      const p = V.check_scam_patterns.safeParse(input);
      if (!p.success) return err("Invalid input: " + p.error.message);
      const matches = matchPatterns(p.data.text);
      return {
        step: "patterns",
        result: JSON.stringify(
          matches.length
            ? { matches }
            : { matches: [], note: "No known pattern matched. Not a proof of safety: verify with an official source or say 'unsure'." },
        ),
      };
    }
    case "find_schemes": {
      const p = V.find_schemes.safeParse(input);
      if (!p.success) return err("Invalid input: " + p.error.message);
      const list = matchSchemes({
        age: p.data.age,
        monthlyIncome: p.data.monthly_income,
        hasBank: p.data.has_bank_account,
        informal: p.data.informal_worker,
      });
      return {
        step: "schemes",
        result: JSON.stringify(
          list.map((m) => ({
            id: m.scheme.id,
            name: m.scheme.name[lang],
            status: m.status === "yes" ? "qualifies" : "needs_checking",
            why: m.why[lang],
            benefit: m.scheme.short[lang],
            apply_at: m.scheme.site,
            helpline: m.scheme.helpline,
          })),
        ),
      };
    }
    case "loan_cost": {
      const p = V.loan_cost.safeParse(input);
      if (!p.success) return err("Invalid input: " + p.error.message);
      const c = loanCost(p.data.principal, p.data.total_repay, p.data.weeks);
      return {
        step: "loan",
        result: JSON.stringify({
          ...c,
          context: "Banks and self-help groups usually charge far less (roughly 10–26% a year). Check the lender is RBI-registered on sachet.rbi.org.in.",
        }),
      };
    }
    case "suggest_split": {
      const p = V.suggest_split.safeParse(input);
      if (!p.success) return err("Invalid input: " + p.error.message);
      return { step: "split", result: JSON.stringify({ amount: p.data.amount, ...splitEarning(p.data.amount) }) };
    }
    case "plan_goal": {
      const p = V.plan_goal.safeParse(input);
      if (!p.success) return err("Invalid input: " + p.error.message);
      ctx.lastPlan = planGoal(p.data);
      return { step: "goal", result: JSON.stringify(ctx.lastPlan) };
    }
    case "show_plan": {
      const p = V.show_plan.safeParse(input);
      if (!p.success) return err("Invalid input: " + p.error.message);
      const lp = ctx.lastPlan;
      if (!lp) return err("Call plan_goal first, then show_plan with its numbers.");
      // Numbers always come from the calculator, never from the model's text.
      const useComfortable = !lp.affordable && lp.comfortable_monthly_saving != null;
      const plan = {
        ...p.data,
        goal_type: lp.type,
        target_today: lp.target_today,
        future_cost: lp.future_cost,
        years: lp.years,
        already_saved: lp.already_saved,
        monthly_saving: useComfortable ? lp.comfortable_monthly_saving! : lp.monthly_saving,
        daily_saving: useComfortable ? lp.comfortable_daily_saving! : lp.daily_saving,
        legal_note: lp.legal_note ? p.data.legal_note || lp.legal_note : null,
        option_ids: (p.data.option_ids.length ? p.data.option_ids : lp.options.map((o) => o.id)).filter((id) => goalOption(id)),
      };
      return {
        action: { type: "plan", plan },
        result: "The plan screen is now showing. Give a short spoken summary: the daily amount and the very first step.",
      };
    }
    case "show_verdict": {
      const p = V.show_verdict.safeParse(input);
      if (!p.success) return err("Invalid input: " + p.error.message);
      const v = p.data;
      return {
        action: {
          type: "verdict",
          verdict: { ...v, scheme_id: v.kind === "real" ? v.scheme_id ?? null : null, steps: v.steps.slice(0, 3), sources: v.sources.map((s) => s.replace(/^https?:\/\//, "").replace(/\/.*$/, "")) },
        },
        result: "The result screen is now showing this verdict to the user. Now give your short spoken answer.",
      };
    }
    case "propose_change": {
      const p = V.propose_change.safeParse(input);
      if (!p.success) return err("Invalid input: " + p.error.message);
      const d = p.data;
      let proposal: AgentAction | null = null;
      const mk = (x: object) => ({ type: "proposal", proposal: { summary: d.summary, ...x } }) as AgentAction;
      switch (d.kind) {
        case "log_savings":
          if (d.amount && d.amount > 0) proposal = mk({ kind: "log_savings", params: { amount: Math.round(d.amount) } });
          break;
        case "set_savings_goal":
          if (d.goal && d.goal > 0) proposal = mk({ kind: "set_savings_goal", params: { goal: Math.round(d.goal) } });
          break;
        case "set_reminder":
          if (typeof d.on === "boolean") proposal = mk({ kind: "set_reminder", params: { on: d.on, time: d.time } });
          break;
        case "set_pay_frequency":
          if (d.freq) proposal = mk({ kind: "set_pay_frequency", params: { freq: d.freq } });
          break;
        case "start_application":
          if (d.scheme_id) proposal = mk({ kind: "start_application", params: { schemeId: d.scheme_id } });
          break;
        case "complete_application_step":
          if (d.scheme_id && typeof d.step === "number")
            proposal = mk({ kind: "complete_application_step", params: { schemeId: d.scheme_id, step: d.step } });
          break;
        case "set_read_aloud":
          if (typeof d.on === "boolean") proposal = mk({ kind: "set_read_aloud", params: { on: d.on } });
          break;
      }
      if (!proposal) return err(`Missing the field needed for ${d.kind}.`);
      return {
        action: proposal,
        result:
          "A confirmation sheet is now shown. The change is NOT applied unless the user taps Yes; silence means no. Tell the user what you proposed and ask them to confirm on screen. Do not say it is done.",
      };
    }
    case "open_screen": {
      const p = V.open_screen.safeParse(input);
      if (!p.success) return err("Invalid input: " + p.error.message);
      return { action: { type: "navigate", screen: p.data.screen, scheme_id: p.data.scheme_id ?? null }, result: `Opened ${p.data.screen}.` };
    }
  }
  return err(`Unknown tool ${name}`);
}

export const incomeFromBucket = (b: unknown) => INCOME_MID[String(b)] ?? 12500;
