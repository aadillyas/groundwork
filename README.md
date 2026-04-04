# Groundwork

**Pre-build OSS research — know what's been built before you build.**

Describe your idea in plain English. Groundwork breaks it into components, systematically scans GitHub for the best existing repos for each, and produces a structured analysis: what to **USE** (fork/integrate), what to **BUILD** (your actual IP), and three scores — Originality, Reliance on OSS, and Buildability.

The final output is a `GROUNDWORK.md` bootstrap file you drop into a project folder and hand to any AI agent to start scaffolding.

→ **[Try it live](https://groundwork.aadilillyas.com)**

---

## How it works

1. **Decompose** — an LLM breaks your idea into 4–6 independent technical components, each with targeted GitHub search queries
2. **Scan** — the GitHub API is queried for each component, results deduplicated and ranked by stars and recency
3. **Synthesise** — an LLM analyses all results and produces a USE/BUILD verdict per component, three scores, and a full bootstrap file

All stateless. No database. Results live in `sessionStorage`.

---

## Stack

- **Next.js 14** App Router (TypeScript)
- **Gemini 2.5 Flash** via `@google/generative-ai`
- **GitHub REST API** for repo search
- **Tailwind CSS** — dark mode default, light mode toggle
- Fonts: Syne (display), JetBrains Mono (mono), Inter (body)

---

## Running locally

```bash
git clone https://github.com/aadillyas/groundwork
cd groundwork
npm install
```

Create `.env.local` in the project root:

```
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here
```

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Getting your API keys

| Key | Where to get it | Notes |
|-----|----------------|-------|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API key | Free tier: 25 req/day — enough for dev/testing |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) | No special scopes needed — public repo access only |

---

## Fork & run your own instance

Groundwork is open in spirit. If you want your own unlimited instance with your own branding:

### 1. Fork this repo

Click **Fork** on GitHub, or:

```bash
gh repo fork aadillyas/groundwork --clone
cd groundwork
```

### 2. Add your environment variables

Create `.env.local` in the project root:

```
GEMINI_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
```

These are **never committed** — `.env*.local` is in `.gitignore`.

### 3. Customise the branding

Edit **`site.config.ts`** in the project root — this is the only file you need to touch:

```ts
const siteConfig = {
  siteName: 'Groundwork',
  author: {
    name: 'Your Name',
    tagline: 'Your tagline here',
    bio: 'A short bio...',
    avatar: '/avatar.jpg',   // drop your photo in /public, or set to null
    links: {
      linkedin: 'https://linkedin.com/in/yourhandle',
      website: 'https://yoursite.com',
      github: 'https://github.com/yourusername',
    },
  },
  repoUrl: 'https://github.com/yourusername/groundwork',
}
```

All personal info (name, links, photo, repo URL) flows from this one file into the About section, pricing section fork instructions, and footer. Nothing else needs to change.

### 4. Swap your avatar

Drop your profile photo into `/public/` (e.g. `/public/avatar.jpg`) and update `avatar: '/avatar.jpg'` in `site.config.ts`. The existing `/public/IMG_1938.jpeg` can be deleted.

### 5. Deploy

See [Deploying to Vercel](#deploying-to-vercel) below.

---

## Deploying to Vercel

### First-time setup

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Vercel auto-detects Next.js — no build config changes needed
4. **Before clicking Deploy**, add environment variables:

   **Project → Settings → Environment Variables**

   | Name | Value | Environments |
   |------|-------|-------------|
   | `GEMINI_API_KEY` | your Gemini API key | Production, Preview, Development |
   | `GITHUB_TOKEN` | your GitHub personal access token | Production, Preview, Development |

5. Click **Deploy**

### Subsequent deploys

```bash
git add .
git commit -m "description"
git push
```

Vercel picks up every push to `main` and redeploys automatically.

### Custom domain

Vercel Dashboard → Project → **Domains** → add your domain → follow the DNS instructions (usually a CNAME or A record).

---

## Project structure

```
groundwork/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout, dark mode, fonts
│   ├── globals.css               # Tailwind + scroll animations
│   ├── analyse/
│   │   └── page.tsx              # Results — 4-step narrative flow
│   └── api/
│       ├── decompose/route.ts    # POST { idea } → { components[] }
│       ├── search/route.ts       # POST { components[] } → { results[] }
│       └── synthesise/route.ts   # POST { idea, results[] } → full analysis
├── components/
│   ├── landing/                  # Landing page sections
│   │   ├── HeroSection.tsx
│   │   ├── FeatureWalkthrough.tsx
│   │   ├── ScoreShowcase.tsx
│   │   ├── WhySection.tsx
│   │   ├── PricingSection.tsx
│   │   └── AboutSection.tsx
│   ├── ScoreBar.tsx              # Animated ring gauge (0–100)
│   ├── ScoreTrio.tsx             # Three scores side by side
│   ├── ComponentDetail.tsx       # Per-component repo list + verdict
│   ├── RepoCard.tsx              # Individual repo card
│   ├── ExportButton.tsx          # Downloads GROUNDWORK.md
│   └── AccessGate.tsx            # BYOK / subscription modal
├── lib/
│   ├── llm.ts                    # Gemini wrapper — callLLM(prompt, apiKey?)
│   ├── github.ts                 # GitHub search — searchComponents()
│   ├── access.ts                 # Free tier / BYOK / daily limit logic
│   ├── types.ts                  # All shared TypeScript types
│   └── demo.ts                   # Hardcoded demo data (voice memo → PRD)
├── public/                       # Static assets — swap avatar here
└── site.config.ts                # ← Edit this to personalise your fork
```

---

## Usage tiers

| Tier | Gate | How it works |
|------|------|-------------|
| **Free** | 1 analysis per day | `localStorage` counter, resets after 24h. Easy to bypass — that's intentional. |
| **BYOK** | Unlimited | User enters Gemini + GitHub keys in the UI. Keys travel in the request body over HTTPS, never stored server-side. |
| **Pro** | Unlimited | Coming soon — subscribe to use hosted API keys with no setup. |

---

## Swapping the LLM

All LLM calls go through `lib/llm.ts`. To switch providers, only edit that file:

```ts
// lib/llm.ts
export async function callLLM(prompt: string, apiKey?: string): Promise<string>
```

The interface is stable — every route passes through this function. Candidates: OpenRouter, DeepSeek V3, Ollama (local).

---

## License

MIT. Do whatever you want with it.

Built by [Aadil Illyas](https://aadilillyas.com).
