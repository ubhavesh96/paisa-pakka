# Paisa Pakka: agentic prototype

A voice-first money companion for first-time earners in India: scam checks (Shield), payday split and emergency savings (Money), and government scheme enrolment (Entitlements). It's built from the Paisa Pakka Figma file, in Hindi, Hinglish and English.

## Run locally

```bash
npm install
cp .env.example .env.local   # paste a free GEMINI_API_KEY (and optionally GROQ_API_KEY)
npm run dev                  # http://localhost:3000
```

- Demo link that skips onboarding: `http://localhost:3000/home?demo&lang=en` (`lang=hi` for Hindi).
- Voice input and read-aloud use the browser's Web Speech API. Chrome on Android and desktop works best, and Hindi uses `hi-IN`.
- All user data stays in the browser (localStorage), as the privacy promise says. **Me → Privacy → Delete all my data** clears it and shows the empty states.

## AI providers (free or paid)

`src/lib/agent/providers.ts` runs the same tools on whichever provider has a key. It falls back automatically on rate limits or outages:

1. **Claude** (`ANTHROPIC_API_KEY`, paid, best quality, adds a government-only web search)
2. **Gemini** (`GEMINI_API_KEY`, free tier at aistudio.google.com/apikey; tries several free Flash models in turn)
3. **Groq** (`GROQ_API_KEY`, free tier at console.groq.com)
4. **OpenRouter** (`OPENROUTER_API_KEY`, free `:free` models)

Free tiers have daily limits and can change. On Gemini's free tier, Google may use the data to improve its products. All money maths is done in code (`src/lib/calc.ts`, `src/lib/goals.ts`), never by the model.

## How the agent works

`POST /api/agent` runs a tool-use loop:

| Tool | Runs on | What it does |
|---|---|---|
| `check_scam_patterns` | server | Matches known Indian fraud patterns (`src/lib/scams.ts`) |
| `web_search` | Anthropic | Searches only official domains (gov.in, nic.in, rbi.org.in, npci.org.in…) |
| `find_schemes` | server | Eligibility for e-Shram, PM-SYM, PMSBY, PMJJBY, APY, Ayushman (`src/lib/schemes.ts`) |
| `loan_cost` / `suggest_split` | server | Real loan cost; payday split (`src/lib/calc.ts`) |
| `plan_goal` | server | Life goals (education, marriage, business, home): price rise, monthly/daily saving, affordability, Sukanya Samriddhi / RD / PPF / Mudra / PMEGP / scholarships (`src/lib/goals.ts`) |
| `show_plan` | app | Opens the step-by-step goal plan screen |
| `show_verdict` | app | Opens the Scam / Real / Not sure result screen |
| `propose_change` | app | Shows the confirm sheet (Flow D): spoken + written summary, Yes / No, silence = no, saved to an audit log |
| `open_screen` | app | Navigates |

The agent can never change data itself. Every change goes through `propose_change` and the user's "yes".

Other details:
- Server-side refusal fallback is on (`fallbacks: "default"`).
- Effort is set to `low` so voice replies come back quickly.
- The system prompt is prompt-cached.
- If web search is disabled for your Anthropic org, the route retries without it. Set `PP_DISABLE_WEB_SEARCH=1` to turn it off.

## Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel link
vercel env add GEMINI_API_KEY      # paste key, select Production + Preview
vercel --prod
```

## Screen map (Figma → route)

M01 `/` · M02–M05c `/onboarding` · M02b `/language` · M06 `/home` · M07/M07b/S01–S05 `/check` · M08–M10 `/check/result` · M08b `/check/share` · M11 `/check/loan` · M12 `/money` · M13 `/money/split` · M14 `/money/done` · M15/M16 `/money/savings` · M17/S07 `/schemes` · M18 `/schemes/detail` · M19 `/schemes/form` · M20 `/schemes/applications` · M21/S06 `/me/activity` · M22 `/me` · M22b `/me/reminders` · M23/M23b `/me/privacy` · M24 `/me/help` · Goals (new) `/money/goals`, `/money/goals/plan`

Scheme facts are prototype data summarised from official sites. Re-verify them before any public launch.
