import { availableProviders, ProviderError, runAgent } from "@/lib/agent/providers";
import { incomeFromBucket } from "@/lib/agent/tools";
import type { AgentRequest, AgentResponse } from "@/lib/agent/types";

export const maxDuration = 60;

function json(body: AgentResponse, status = 200) {
  return Response.json(body, { status });
}

/** Volatile per-request context goes in the user turn, after the cached system prompt. */
function stateBlock(req: AgentRequest) {
  const s = req.state ?? {};
  return `<app_state>
language: ${req.lang}
mode: ${req.mode}
today: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
profile: ${JSON.stringify(s.profile ?? {})}
approx_monthly_income: ${incomeFromBucket(s.income)}
pay_frequency: ${s.payFreq ?? "daily"}
savings: ${JSON.stringify(s.savings ?? {})}
goals: ${JSON.stringify(s.goals ?? [])}
applications_steps_done: ${JSON.stringify(s.applications ?? {})}
reminders: ${JSON.stringify(s.reminders ?? {})}
</app_state>`;
}

export async function POST(request: Request) {
  if (availableProviders().length === 0) {
    return json({ ok: false, code: "no_key", message: "Add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY to .env.local / Vercel env vars" }, 503);
  }
  let body: AgentRequest;
  try {
    body = (await request.json()) as AgentRequest;
  } catch {
    return json({ ok: false, code: "error", message: "Bad request" }, 400);
  }
  const history = (body.messages ?? [])
    .filter((m) => m.text?.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, text: m.text.slice(0, 4000) }));
  if (!history.length || history[history.length - 1].role !== "user") {
    return json({ ok: false, code: "error", message: "Last message must be from the user" }, 400);
  }
  const last = history[history.length - 1];
  last.text = `${stateBlock(body)}\n\n${last.text}`;

  try {
    const r = await runAgent(history, body.lang === "en" ? "en" : "hi");
    console.log(`agent: ${r.provider} · steps=${r.steps.join(",")} · actions=${r.actions.map((a) => a.type).join(",")}`);
    return json({ ok: true, reply: r.reply, actions: r.actions, steps: r.steps, sources: r.sources });
  } catch (e) {
    if (e instanceof ProviderError) {
      console.error(e.message);
      if (e.message === "refused") return json({ ok: false, code: "refused", message: "Request declined" });
      if (e.status === 429) return json({ ok: false, code: "rate_limited", message: "All AI providers are busy" }, 429);
      if (e.status === 401 || e.status === 403) return json({ ok: false, code: "no_key", message: "API key invalid" }, 503);
      return json({ ok: false, code: "error", message: e.message }, 502);
    }
    console.error(e);
    return json({ ok: false, code: "error", message: "Unexpected error" }, 500);
  }
}
