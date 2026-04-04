# Groundwork — Agent Context

You are building **Groundwork**, a pre-build OSS research tool. Read `BRIEF.md` first — it contains the full product spec, API contracts, stack decisions, and design direction. Everything in this file is operational guidance for how to work on this project.

---

## Project State

> **Update this section at the start of every session.**

**Current state:** Pipeline rebuilt with scout-first architecture. UI polished. Two features planned but not yet implemented — see TODO section below.

**Last completed:** Scout-first pipeline (whole-product search before decompose), complexity-aware decomposition, UI copy fixes, static analysis counter placeholder, AccessGate notify-me form.

**Next task:** See TODO section.

---

## TODO

Two features are planned. Do not start either without reading the full context below first.

---

### TODO 1 — Multi-provider BYOK (provider + model picker in AccessGate)

**What the user wants:** When a user hits the API key gate, instead of a hardcoded Gemini key input, they should be able to: (1) pick a provider from a list, (2) pick a model within that provider, (3) paste their key. All from the AccessGate UI. The goal is flexibility — not everyone wants Gemini.

**Current state:**
- `lib/llm.ts` uses `@google/generative-ai` SDK, hardcoded to `gemini-2.5-flash`
- `lib/access.ts` stores `geminiKey` and `githubToken` in localStorage
- `AccessGate.tsx` has a single Gemini key input + optional GitHub token input
- All API routes accept an optional `geminiKey` param and pass it to `callLLM()`

**Scope of change:**
1. **`lib/llm.ts`** — `callLLM(prompt, apiKey, provider?, model?)` needs to branch on provider. Gemini uses `@google/generative-ai`. OpenRouter + DeepSeek use the OpenAI-compatible API (`fetch` to `https://openrouter.ai/api/v1/chat/completions` or `https://api.deepseek.com/chat/completions`). Ollama uses `http://localhost:11434/api/generate` — local only, no key needed.
2. **`lib/access.ts`** — extend `UsageState` and `StoredState` to include `provider: string` and `model: string` alongside the key. Update `saveBYOKKeys`, `getBYOKKeys`.
3. **`lib/types.ts`** — update `UsageState` accordingly.
4. **`AccessGate.tsx`** — add a provider selector (dropdown or pill buttons), a model selector that updates based on chosen provider, and relabel the key input placeholder per provider. Suggested providers + models to support:
   - Gemini: `gemini-2.5-flash`, `gemini-2.5-pro`
   - OpenRouter: `anthropic/claude-3-5-haiku`, `google/gemini-2.5-flash`, `deepseek/deepseek-chat-v3-0324` (free tier available)
   - DeepSeek: `deepseek-chat`
5. **All API routes** (`/api/scout`, `/api/decompose`, `/api/synthesise`) — currently accept `geminiKey`. Rename to `apiKey` and also accept `provider` + `model`, forwarding them to `callLLM`.
6. **`app/page.tsx`** — `getBYOKKeys()` result needs to include provider + model and pass them through all fetch calls.

**Key constraint:** `callLLM` signature change must be backward-compatible for the demo path (which passes no key at all and falls back to `process.env.GEMINI_API_KEY`).

---

### TODO 2 — Email capture backend + real analysis counter

**What the user wants:** (a) "Notify me" email submissions in both `AccessGate.tsx` and `PricingSection.tsx` should actually save the email somewhere the user can see it. (b) The "Join 50+ builders" counter on the hero should eventually be a real number from a backend.

**Current state:**
- `PricingSection.tsx` `handleInterest()` just sets `interestSent = true` locally — email goes nowhere
- `AccessGate.tsx` notify form similarly fires `setNotifySent(true)` only — email goes nowhere
- Hero counter is a hardcoded static string: `"Join 50+ builders who've already done their groundwork"` in `components/landing/HeroSection.tsx`
- `lib/access.ts` has `getTotalAnalysisCount()` reading from localStorage `gw_total_analyses` and `recordAnalysis()` incrementing it — the per-device count works, but there's no global count

**What needs to be decided before building (ask the user):**
- What email tool to use? Options: Resend (free tier, API-first), Buttondown, ConvertKit, or just a simple `/api/notify` route that writes to a JSON file or calls a webhook. **Resend is recommended** — free for <3k emails/mo, dead simple API, emails land in a dashboard.
- For the counter: options are (a) a simple Vercel KV / Upstash Redis increment on every `recordAnalysis()` call, or (b) just read total from the email list length (not accurate). Upstash Redis free tier is the cleanest solution.

**Scope of change once decided:**
1. **`/api/notify` route (new)** — accepts `{ email: string }`, calls Resend (or chosen provider) to add to a list / send a notification email to the owner.
2. **`PricingSection.tsx` + `AccessGate.tsx`** — `handleInterest` / notify form `onSubmit` should POST to `/api/notify` instead of just setting local state.
3. **`/api/record` route (new, optional)** — if using Upstash, POST here on every completed analysis to increment a global counter. Return the new count.
4. **`app/page.tsx`** — after `recordAnalysis()`, also call `/api/record` and store the returned global count somewhere (could just be displayed on the results page or seeded into the hero on next load).
5. **`HeroSection.tsx`** — replace the static string with a count fetched from the backend (or just keep static and manually bump it periodically — acceptable for early stage).

---

## What Is Built

Every file is implemented. Nothing is a placeholder.

```
groundwork/
├── app/
│   ├── page.tsx                  # Landing page — idea input, demo trigger, progress tracker
│   ├── layout.tsx                # Root layout, dark mode script, fonts
│   ├── globals.css               # Tailwind + fadeSlideIn animation
│   ├── analyse/
│   │   └── page.tsx              # Results page — 3-zone layout (map / detail / sidebar)
│   └── api/
│       ├── scout/route.ts        # POST { idea } → { repos[], verdict, summary } — whole-product search first
│       ├── decompose/route.ts    # POST { idea, scoutVerdict } → { components[] } — skipped if scout verdict is 'exists'
│       ├── search/route.ts       # POST { components[] } → { results[] }
│       └── synthesise/route.ts   # POST { idea, results[], scoutRepos[], scoutVerdict } → full analysis
├── components/
│   ├── IdeaInput.tsx             # Textarea with typing simulation support
│   ├── ProgressTracker.tsx       # 4-step horizontal tracker (scouting/decomposing/searching/synthesising)
│   ├── ComponentMap.tsx          # Horizontal pipeline diagram with CSS arrows
│   ├── ComponentDetail.tsx       # Per-component repo list + USE/BUILD badge
│   ├── RepoCard.tsx              # Individual repo card (stars, recency dot, recommended badge)
│   ├── StrategyPanel.tsx         # Right sidebar — verdict, strategy, recommended repos, gap analysis
│   ├── ExportButton.tsx          # Large indigo CTA — downloads GROUNDWORK.md
│   └── ThemeToggle.tsx           # Sun/moon icon in nav — toggles dark/light, persists to localStorage
├── lib/
│   ├── llm.ts                    # Gemini 2.5 Pro wrapper — callLLM(prompt): Promise<string>
│   ├── github.ts                 # GitHub REST API — searchComponents(), deduplicates, top 5 by stars
│   ├── types.ts                  # All shared TS types — Component, Repo, SynthesiseResponse, etc.
│   └── demo.ts                   # Hardcoded demo data (voice memo → PRD) — bypasses all APIs
```

---

## Demo Mode

The demo is triggered by "See it in action" on the landing page. It:
1. Types the demo idea character-by-character into the textarea (28ms/char)
2. Pauses 800ms
3. Animates through all 3 phases with fake delays (2.5s / 4s / 3s)
4. Navigates to `/analyse` with `DEMO_RESULT` from `lib/demo.ts` in `sessionStorage`

**Demo data:** `lib/demo.ts` — hardcoded voice memo → PRD analysis. Real repos, real star counts. Includes `componentStrategies` with USE/BUILD decisions and the new agent-bootstrap `exportMarkdown`.

---

## Key Technical Rules

**API pipeline order is strict:** scout → (if exists: synthesise) / (if partial/gap: decompose → search → synthesise). Orchestrated in `app/page.tsx`. Scout runs first on every real analysis — it generates whole-product GitHub queries using `in:name`, `topic:`, `in:description` syntax, fetches top 15 results across 5 queries, and LLM-verdicts exists/partial/gap. If `exists`, decompose and search are skipped entirely.

**LLM calls:** All go through `lib/llm.ts` via `callLLM(prompt: string): Promise<string>`. Never import `@google/generative-ai` directly in a route. Always instruct the LLM to respond in pure JSON with no markdown fences. Strip fences before parsing. Wrap in try/catch.

**LLM Provider — current:** Gemini 2.5 Pro (`gemini-2.5-pro-latest`) via `@google/generative-ai` SDK. API key: `GEMINI_API_KEY`. Free tier: 25 req/day — sufficient for dev/testing.

**LLM Provider — swapping:** Update `lib/llm.ts` only. `callLLM` interface stays identical. Candidates: OpenRouter, DeepSeek V3, Ollama.

**GitHub search:** `GET https://api.github.com/search/repositories?q={query}&sort=stars&order=desc&per_page=10`. Auth: `Authorization: Bearer ${process.env.GITHUB_TOKEN}`. Top 2 queries per component, deduplicate by `fullName`, return top 5 by stars.

**Types:** All in `lib/types.ts`. Key addition: `ComponentStrategy` (name, action: 'use'|'build', reason, suggestedPath?) and `componentStrategies: ComponentStrategy[]` on `SynthesiseResponse`.

**State:** Stateless — all results stored in `sessionStorage` as `groundwork_result` (JSON of `AnalysisState`). No database.

**Export:** `synthesise.exportMarkdown` is a planner-agent bootstrap file (YAML frontmatter, git clone commands, scaffold tree, USE/BUILD table, build instructions per custom component, open questions). Downloaded as `GROUNDWORK.md`.

**Dark mode:** `darkMode: 'class'` in Tailwind. Inline script in `app/layout.tsx` reads `localStorage('gw-theme')` before paint. `ThemeToggle` toggles the `dark` class and persists. Default: dark.

**Environment variables:**
- `GEMINI_API_KEY` — decompose + synthesise routes
- `GITHUB_TOKEN` — search route (public token, no special scopes needed)

---

## Testing the Real Pipeline

**First time setup:**
1. Check `.env.local` exists with both keys set
2. Run `npm run dev`
3. Try a real idea — do NOT use "voice memo to PRD" (that's the demo)
4. Good test ideas: "a tool that monitors your competitors' pricing changes", "CLI tool to sync Notion pages to markdown files", "a Slack bot that summarises unread threads"

**What to check:**
- Decompose: returns 4-6 components with specific, semantic search queries (not generic keywords)
- Search: each component returns repos — if empty, the query was too niche; adjust the decompose prompt
- Synthesise: `componentStrategies` array must match component names exactly (the prompt enforces this)
- Export: downloaded GROUNDWORK.md should have clone commands, scaffold, and build instructions — not just a summary

**Common failure modes:**
- LLM returns markdown fences despite instructions → `lib/llm.ts` strips these, but check the raw output
- `componentStrategies` names don't match component names → prompt in synthesise/route.ts explicitly lists component names; if mismatch, tighten the prompt
- GitHub search returns 0 results → queries too specific or niche; loosen the decompose prompt for that type of idea
- Gemini 2.5 Pro free tier hit (25 req/day) → swap to a paid provider in `lib/llm.ts` — see LLM Provider section

---

## Design Direction

- **Dark default**, light mode available via nav toggle
- Fonts: Syne (display/headings), JetBrains Mono (metadata), Inter (body)
- Results page: 3-zone layout — component map (top), detail panel (left), strategy sidebar (right), export footer (sticky bottom)
- Component map nodes: indigo when selected, emerald/amber colour bar for USE/BUILD action
- ComponentDetail: USE badge (emerald, package icon) or BUILD badge (amber, wrench icon) at top
- RepoCard: prominent star count, recency dot (green/amber/red), coloured left border matching action
- StrategyPanel: text truncated, gap analysis collapsed by default, recommended repos as pill chips

---

## Deployment

Target: Vercel. `vercel --prod` from root. Set `GEMINI_API_KEY` and `GITHUB_TOKEN` in Vercel dashboard before deploying.

No special build config — standard Next.js 14 App Router. `npm run build` must pass cleanly before deploying.

---

## What Good Looks Like

- Any plain-language idea → structured analysis in under 30 seconds
- `componentStrategies` gives a clear USE/BUILD verdict for every component
- The exported `GROUNDWORK.md` is genuinely actionable — an agent can read it and start scaffolding
- Works without an account, loads fast, looks sharp in both dark and light mode
