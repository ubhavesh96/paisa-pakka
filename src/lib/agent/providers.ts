import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./prompt";
import { runTool, TOOLS, webSearchTool, type ToolCtx } from "./tools";
import type { AgentAction, AgentStep } from "./types";

export type Turn = { role: "user" | "assistant"; text: string };
export type RunResult = { reply: string; actions: AgentAction[]; steps: AgentStep[]; sources: string[] };
export type ProviderId = "anthropic" | "gemini" | "groq" | "openrouter";

const MAX_TURNS = 7;

/** Errors worth trying the next provider for (limits, outages, bad model id). */
export class ProviderError extends Error {
  constructor(
    message: string,
    public retryable: boolean,
    public status?: number,
  ) {
    super(message);
  }
}

// ---------- Claude (paid) ----------

let anthropic: Anthropic | null = null;

export async function runAnthropic(history: Turn[], toolLang: "hi" | "en"): Promise<RunResult> {
  anthropic ??= new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.text }));
  const actions: AgentAction[] = [];
  const steps = new Set<AgentStep>();
  const sources = new Set<string>();
  let useWebSearch = process.env.PP_DISABLE_WEB_SEARCH !== "1";
  const ctx: ToolCtx = {};

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      let response: Anthropic.Beta.BetaMessage;
      try {
        response = await anthropic.beta.messages.create({
          model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
          max_tokens: 8000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "low" },
          cache_control: { type: "ephemeral" },
          system: SYSTEM_PROMPT,
          tools: useWebSearch ? [...TOOLS, webSearchTool] : TOOLS,
          messages,
        });
      } catch (e) {
        if (useWebSearch && e instanceof Anthropic.BadRequestError) {
          useWebSearch = false; // web search may be disabled for the org
          turn--;
          continue;
        }
        throw e;
      }
      if (response.stop_reason === "refusal") throw new ProviderError("refused", false);

      for (const block of response.content) {
        if (block.type === "server_tool_use" && block.name === "web_search") steps.add("search");
        if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
          for (const r of block.content) {
            try {
              sources.add(new URL(r.url).hostname.replace(/^www\./, ""));
            } catch {
              /* ignore */
            }
          }
        }
      }
      if (response.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: response.content });
        continue;
      }
      const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
        const reply = response.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
          .map((b) => b.text)
          .join(" ")
          .trim();
        return { reply, actions, steps: [...steps], sources: [...sources] };
      }
      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: toolUses.map((tu) => {
          const out = runTool(tu.name, tu.input, toolLang, ctx);
          if (out.action) actions.push(out.action);
          if (out.step) steps.add(out.step);
          return { type: "tool_result" as const, tool_use_id: tu.id, content: out.result, is_error: out.isError || undefined };
        }),
      });
    }
    return { reply: "", actions, steps: [...steps], sources: [...sources] };
  } catch (e) {
    if (e instanceof ProviderError) throw e;
    if (e instanceof Anthropic.RateLimitError) throw new ProviderError("rate limited", true, 429);
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw new ProviderError("bad key", true, 401);
    if (e instanceof Anthropic.APIError) throw new ProviderError(`API error ${e.status}`, (e.status ?? 500) >= 500, e.status);
    throw e;
  }
}

// ---------- OpenAI-compatible free tiers (Gemini, Groq, OpenRouter) ----------

type CompatConfig = { id: ProviderId; baseURL: string; key: string | undefined; models: string[] };

export function compatConfig(id: Exclude<ProviderId, "anthropic">): CompatConfig {
  const list = (v: string | undefined, d: string[]) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : d);
  switch (id) {
    case "gemini":
      return {
        id,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        key: process.env.GEMINI_API_KEY,
        // Free-tier models (measured Nov 2026: flash-lite ~1.5s/step, 3.6-flash ~8s, 3.8-flash 30s+).
        // Tried in order; override with GEMINI_MODELS.
        models: list(process.env.GEMINI_MODELS, ["gemini-3.5-flash-lite", "gemini-3.6-flash"]),
      };
    case "groq":
      return {
        id,
        baseURL: "https://api.groq.com/openai/v1",
        key: process.env.GROQ_API_KEY,
        models: list(process.env.GROQ_MODELS, ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]),
      };
    case "openrouter":
      return {
        id,
        baseURL: "https://openrouter.ai/api/v1",
        key: process.env.OPENROUTER_API_KEY,
        models: list(process.env.OPENROUTER_MODELS, ["openai/gpt-oss-120b:free"]),
      };
  }
}

/** Gemini/Groq accept a stricter JSON-schema subset: no type arrays, no null enums. */
function sanitizeSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitizeSchema);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (k === "type" && Array.isArray(v)) out.type = v.find((x) => x !== "null") ?? "string";
    else if (k === "enum" && Array.isArray(v)) out.enum = v.filter((x) => x !== null);
    else out[k] = sanitizeSchema(v);
  }
  return out;
}

const COMPAT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = TOOLS.filter(
  (t): t is Anthropic.Beta.BetaTool => "input_schema" in t,
).map((t) => ({
  type: "function",
  function: {
    name: t.name,
    description: t.description ?? "",
    parameters: sanitizeSchema(t.input_schema) as Record<string, unknown>,
  },
}));

const COMPAT_PROMPT =
  SYSTEM_PROMPT +
  `

Tool-use rules for this model:
- Call tools through the function-calling interface only. Never write tool calls or JSON in your spoken reply.
- Numbers (costs, savings, loan cost) must come from tools, never from your own arithmetic.
- Write every text field (title, summary, steps, share_text) in the same language and script as your reply: language "hi" means Devanagari only, "hinglish" means Roman script only. Never mix scripts.
- web_search is not available here: rely on check_scam_patterns and say "not sure" when it isn't decisive.`;

const clients = new Map<string, OpenAI>();

async function runCompatModel(cfg: CompatConfig, model: string, history: Turn[], toolLang: "hi" | "en"): Promise<RunResult> {
  let client = clients.get(cfg.id);
  if (!client) {
    client = new OpenAI({ apiKey: cfg.key, baseURL: cfg.baseURL, maxRetries: 0, timeout: 20_000 });
    clients.set(cfg.id, client);
  }
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: COMPAT_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.text })),
  ];
  const actions: AgentAction[] = [];
  const steps = new Set<AgentStep>();
  const seen = new Set<string>(); // avoid duplicate UI actions if a model repeats a call
  const ctx: ToolCtx = {};
  let toolChoice: "auto" | "required" = "auto";
  let usedTools = false;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    let res: OpenAI.Chat.Completions.ChatCompletion;
    try {
      res = await client.chat.completions.create({ model, messages, tools: COMPAT_TOOLS, tool_choice: toolChoice, temperature: 0.3 });
      toolChoice = "auto";
    } catch (e) {
      if (e instanceof OpenAI.APIError) {
        const st = e.status ?? 500;
        throw new ProviderError(`${cfg.id}/${model}: ${st} ${e.message}`, st === 429 || st === 404 || st === 400 || st >= 500 || st === 401 || st === 403, st);
      }
      throw new ProviderError(`${cfg.id}/${model}: ${(e as Error).message}`, true);
    }
    const msg = res.choices[0]?.message;
    if (!msg) throw new ProviderError(`${cfg.id}/${model}: empty response`, true);
    const calls = (msg.tool_calls ?? []).filter(
      (c): c is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall => c.type === "function",
    );
    if (calls.length === 0) {
      const reply = (msg.content ?? "").trim();
      // Guardrail: money figures without any tool call are guesses. Redo the turn with tools.
      if (!usedTools && /₹\s?\d/.test(reply) && turn === 0) {
        toolChoice = "required";
        continue;
      }
      return { reply, actions, steps: [...steps], sources: [] };
    }
    usedTools = true;
    messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: calls });
    for (const call of calls) {
      let args: unknown = {};
      let content: string;
      try {
        args = JSON.parse(call.function.arguments || "{}");
        const key = call.function.name + call.function.arguments;
        const out = runTool(call.function.name, args, toolLang, ctx);
        if (out.action && !seen.has(key)) actions.push(out.action);
        seen.add(key);
        if (out.step) steps.add(out.step);
        content = out.isError ? `ERROR: ${out.result}` : out.result;
      } catch {
        content = "ERROR: arguments were not valid JSON. Call the tool again with valid JSON.";
      }
      messages.push({ role: "tool", tool_call_id: call.id, content });
    }
  }
  return { reply: "", actions, steps: [...steps], sources: [] };
}

export async function runCompat(cfg: CompatConfig, history: Turn[], toolLang: "hi" | "en"): Promise<RunResult> {
  let last: ProviderError | null = null;
  for (const model of cfg.models) {
    try {
      return await runCompatModel(cfg, model, history, toolLang);
    } catch (e) {
      if (!(e instanceof ProviderError) || !e.retryable) throw e;
      console.warn(e.message);
      last = e;
      if (e.status === 401 || e.status === 403) break; // bad key: other models won't help
    }
  }
  throw last ?? new ProviderError(`${cfg.id}: no models configured`, true);
}

/** Which providers have keys, in preference order. AI_PROVIDER pins the first choice. */
export function availableProviders(): ProviderId[] {
  const has: Record<ProviderId, boolean> = {
    anthropic: !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
    gemini: !!process.env.GEMINI_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
  };
  const order: ProviderId[] = ["anthropic", "gemini", "groq", "openrouter"];
  const pinned = process.env.AI_PROVIDER as ProviderId | undefined;
  const list = order.filter((p) => has[p]);
  return pinned && has[pinned] ? [pinned, ...list.filter((p) => p !== pinned)] : list;
}

export async function runAgent(history: Turn[], toolLang: "hi" | "en") {
  const providers = availableProviders();
  let lastErr: unknown = null;
  for (const p of providers) {
    try {
      const r = p === "anthropic" ? await runAnthropic(history, toolLang) : await runCompat(compatConfig(p), history, toolLang);
      return { ...r, provider: p };
    } catch (e) {
      lastErr = e;
      if (e instanceof ProviderError && !e.retryable) throw e;
      console.warn(`provider ${p} failed, trying next`, (e as Error).message);
    }
  }
  throw lastErr ?? new ProviderError("no provider", false);
}
