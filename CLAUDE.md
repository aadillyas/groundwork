# Groundwork — Agent Context

You are building **Groundwork**, a pre-build OSS research tool. Read `BRIEF.md` first — it contains the full product spec, API contracts, stack decisions, and design direction. Everything in this file is operational guidance for how to work on this project.

---

## Project State

> **Update this section at the start of every session.**

**Current state:** Full application built and working. UI complete with demo mode. Ready for real pipeline testing.

**Last completed:** Full UI/UX redesign — landing page, results page 3-zone layout, demo typing simulation, light/dark mode, USE/BUILD per-component verdicts, agent-bootstrap export format.

**Next task:** Test the real analysis pipeline end-to-end with actual API keys. See TESTING section below.

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
│       ├── decompose/route.ts    # POST { idea } → { components[] }
│       ├── search/route.ts       # POST { components[] } → { results[] }
│       └── synthesise/route.ts   # POST { idea, results[] } → full analysis
├── components/
│   ├── IdeaInput.tsx             # Textarea with typing simulation support
│   ├── ProgressTracker.tsx       # 3-step horizontal tracker (decomposing/searching/synthesising)
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

**API pipeline order is strict:** decompose → search → synthesise. Orchestrated in `app/page.tsx`.

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
