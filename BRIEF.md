# Groundwork — Project Brief

## Name & Tagline
**Groundwork** — *Know what's been built before you build.*

---

## Problem Statement
Builders waste time either reinventing solved problems or starting on weak foundations because pre-build OSS research is fragmented and manual. There is no structured way to go from "here's my idea" to "here's what exists, here's what I can leverage, here's my actual starting point." The research happens across GitHub search, Google, Product Hunt, Reddit — inconsistently, slowly, and incompletely.

---

## Solution
A web app where a user describes their idea in plain language. It runs a structured three-step analysis pipeline:

1. **Decompose** — LLM breaks the idea into 4–6 sub-components and generates targeted GitHub search queries per component
2. **Search** — GitHub REST API is queried per component, returning the most relevant repos with key metadata
3. **Synthesise** — LLM analyses the results and produces: an existence check, repo matches per component, a gap analysis, and a recommended starting strategy (build from scratch / fork one repo / combine multiple repos)

The user sees results as a clean, structured report with repo cards and can export the full analysis as a `GROUNDWORK.md` file.

---

## Core User Journey
1. User lands on the app — sees a single prominent input: *"Describe what you want to build"*
2. User types their idea in plain language (1 line to a paragraph)
3. Hits Analyse — a progress tracker shows each phase running in real time (Decomposing → Searching → Synthesising)
4. Results page loads with:
   - **Existence check** — does this already exist fully?
   - **Component breakdown** — what sub-problems make up this idea?
   - **Repo matches per component** — cards with name, stars, license, last commit, language, GitHub link
   - **Gap analysis** — what's missing from what exists?
   - **Recommended strategy** — build from scratch / fork one / combine multiple (with specific repo recommendations)
5. User can export the full analysis as `GROUNDWORK.md`
6. Optional: user can run a new analysis from the results page

---

## Feature Scope

### v1 IN
- Plain language idea input (single textarea)
- Three-step API pipeline: `/api/decompose` → `/api/search` → `/api/synthesise`
- Real-time progress indicator during analysis
- Repo cards with: name, description, stars, license, last commit date, primary language, GitHub URL
- Gap analysis section
- Strategy recommendation with reasoning
- Export full analysis as markdown file (`GROUNDWORK.md`)
- Responsive — works on mobile and desktop
- No login required

### v1 OUT
- User accounts or saved analysis history
- npm / PyPI / crates.io / other ecosystem search (GitHub only for v1)
- Monetisation or usage limits
- Direct fork or clone from the UI
- Browser extension
- API access for third parties

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Fast to build, Vercel-native, API routes included |
| Language | TypeScript | Type safety across API contracts |
| Styling | Tailwind CSS | Rapid UI, no separate CSS files |
| LLM | Gemini 2.5 Pro via Google Generative AI SDK (`gemini-2.5-pro-latest`) | Strong reasoning, free tier sufficient for dev/testing |
| LLM Layer | `lib/llm.ts` (provider-agnostic wrapper) | Swap providers by changing one file — see LLM Provider note below |
| Data | GitHub REST API | Primary OSS index, no extra DB needed |
| Deployment | Vercel | Zero-config, free tier sufficient for v1 |
| Database | None (v1) | Stateless — no persistence needed |
| Auth | None (v1) | Open access |

---

## API Route Contracts

### POST `/api/decompose`
**Input:**
```json
{ "idea": "string" }
```
**Output:**
```json
{
  "components": [
    {
      "name": "string",
      "description": "string",
      "searchQueries": ["string", "string"]
    }
  ]
}
```
*Uses `lib/llm.ts`. Prompt engineering here is the core of the product — search queries must be specific and semantic, not generic keywords.*

---

### POST `/api/search`
**Input:**
```json
{
  "components": [
    { "name": "string", "searchQueries": ["string"] }
  ]
}
```
**Output:**
```json
{
  "results": [
    {
      "component": "string",
      "repos": [
        {
          "name": "string",
          "fullName": "string",
          "description": "string",
          "stars": 0,
          "language": "string",
          "license": "string",
          "lastCommit": "string",
          "url": "string",
          "topics": ["string"]
        }
      ]
    }
  ]
}
```
*Uses GitHub REST API. Auth via `GITHUB_TOKEN` env var for higher rate limits. Run top 2 search queries per component, deduplicate results, return top 5 repos per component by stars.*

---

### POST `/api/synthesise`
**Input:**
```json
{
  "idea": "string",
  "results": [ /* same shape as /api/search output */ ]
}
```
**Output:**
```json
{
  "existenceCheck": {
    "verdict": "exists | partial | gap",
    "summary": "string"
  },
  "gapAnalysis": "string",
  "strategy": {
    "recommendation": "build-from-scratch | fork-one | combine-multiple",
    "reasoning": "string",
    "repos": ["fullName"]
  },
  "exportMarkdown": "string"
}
```
*Uses `lib/llm.ts`. This is the synthesis layer — it must be opinionated and actionable, not just a list of links.*

---

## Data / API Dependencies
- **Google Generative AI (Gemini)** — `GEMINI_API_KEY` env var — used in `/api/decompose` and `/api/synthesise`. Get a free key at [aistudio.google.com](https://aistudio.google.com). Free tier: 25 requests/day on Gemini 2.5 Pro (sufficient for dev and testing).
- **GitHub REST API** — `GITHUB_TOKEN` env var — used in `/api/search` — public token, no special scopes needed. Rate limit: 5,000 req/hour with auth (ample for v1)

---

## LLM Provider Note — Modularity is Required

The LLM layer **must** be abstracted behind `lib/llm.ts`. No route file should import a provider SDK directly. All LLM calls go through the wrapper.

This is intentional: the current provider (Gemini 2.5 Pro) may be swapped later for OpenRouter, DeepSeek, a local Ollama model, or Anthropic Claude without touching any route logic.

The wrapper must expose a single async function:

```ts
export async function callLLM(prompt: string): Promise<string>
```

Routes call `callLLM()` only. The provider, model name, SDK, and API key are all internal to `lib/llm.ts`.

**Current provider:** Gemini 2.5 Pro (`gemini-2.5-pro-latest`) via `@google/generative-ai` SDK.

**To swap provider later:** update `lib/llm.ts` only. Change the env var in `.env.local` and Vercel. Nothing else changes.

---

## Differentiator
Not a search engine. Not a "does this exist on Product Hunt" checker. The unique output is the **opinionated synthesis** — it tells the user *what to do* with what it finds, not just what it found. The fork/combine strategy recommendation is what no other tool produces.

---

## Content Angle (Substack article)
*"I built a tool that checks if your idea already exists — here's what I found when I ran my own ideas through it."*
The build diary and the self-referential angle (the tool was itself vetted using the pipeline that spawned it) make for a compelling first article.

---

## Success Metric
v1 works if: 5 ideas run through the tool produce results where at least 4 feel genuinely useful and save meaningful research time compared to doing it manually.

---

## Design Direction
- Aesthetic: editorial / utilitarian — feels like a serious research tool, not a toy
- Dark theme preferred
- Monospace accents for repo metadata (stars, language, last commit)
- Typography: distinctive display font for headings, clean sans for body
- No decorative noise — the results ARE the design
- Progress tracker during analysis is a key UX moment — make it feel alive
