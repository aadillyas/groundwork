import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'
import { Repo, ScoutResponse, ExistenceVerdict, LLMProvider } from '@/lib/types'

const GITHUB_API = 'https://api.github.com/search/repositories'

async function searchRepos(query: string, githubToken?: string): Promise<Repo[]> {
  const url = `${GITHUB_API}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`
  const token = githubToken ?? process.env.GITHUB_TOKEN
  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.items ?? []).map((item: any): Repo => ({
    name: item.name,
    fullName: item.full_name,
    description: item.description ?? '',
    stars: item.stargazers_count,
    language: item.language,
    license: item.license?.spdx_id ?? null,
    lastCommit: item.pushed_at,
    url: item.html_url,
    topics: item.topics ?? [],
  }))
}

export async function POST(req: NextRequest) {
  const {
    idea,
    apiKey,
    provider,
    model,
    githubToken,
  }: {
    idea: string
    apiKey?: string
    provider?: LLMProvider
    model?: string
    githubToken?: string
  } = await req.json()

  // Step 1: generate whole-product search queries
  const queryPrompt = `You are a senior engineer doing pre-build research. A founder wants to build: "${idea}"

Generate 5 GitHub search queries that would find a complete, ready-to-use open source project that already does exactly this — not libraries or components, but the finished product itself.

Use GitHub's search syntax to maximise precision:
- "in:name" to match repo names (e.g. "reminders menubar in:name")
- "in:description" to match descriptions
- "topic:" to match repository topics (e.g. "topic:macos topic:menubar")
- Combine terms that describe the finished product, not the tech stack

Example — for "a macOS menu bar app for reminders":
- "reminders menubar in:name,description"
- "topic:macos topic:reminders menubar"
- "macos menu bar reminders app in:name"
- "reminders-menubar"
- "topic:menubar reminders macos"

Think: what name would the author give this repo? What topics would they tag it with?

Respond in pure JSON with no markdown fences:
{ "queries": ["query one", "query two", "query three", "query four", "query five"] }`

  let queries: string[] = []
  try {
    const raw = await callLLM(queryPrompt, apiKey, provider, model)
    const parsed = JSON.parse(raw)
    queries = parsed.queries ?? []
  } catch {
    return NextResponse.json({ error: 'Failed to generate scout queries' }, { status: 500 })
  }

  // Step 2: run all queries, merge and deduplicate by fullName
  const repoSets = await Promise.all(queries.map(q => searchRepos(q, githubToken)))
  const byFullName = new Map<string, Repo>()
  for (const repos of repoSets) {
    for (const repo of repos) {
      const existing = byFullName.get(repo.fullName)
      if (!existing || repo.stars > existing.stars) {
        byFullName.set(repo.fullName, repo)
      }
    }
  }
  const top15 = Array.from(byFullName.values())
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 15)

  // Step 3: LLM judges whether a complete solution exists
  const repoList = top15.length > 0
    ? top15.map(r => `- ${r.fullName} (${r.stars.toLocaleString()} stars, last commit ${r.lastCommit.slice(0, 10)}) — ${r.description}`).join('\n')
    : '(no results found)'

  const verdictPrompt = `A founder wants to build: "${idea}"

These are the top GitHub results when searching for a complete, existing solution:
${repoList}

Does a complete open source solution already exist for this exact idea?

- "exists": one of these repos clearly does the full job. Star count does not matter — a 50-star repo that perfectly matches is still "exists". Focus on whether the repo's name/description matches the idea, not on popularity.
- "partial": something covers the core use case but is missing a meaningful feature or is clearly abandoned (no commits in 2+ years).
- "gap": nothing closely matches the idea.

Respond in pure JSON with no markdown fences:
{
  "verdict": "exists" | "partial" | "gap",
  "summary": "1-2 sentences. Name the specific repo if verdict is exists or partial, explain what it does and what is missing if partial."
}`

  try {
    const raw = await callLLM(verdictPrompt, apiKey, provider, model)
    const parsed = JSON.parse(raw)
    const response: ScoutResponse = {
      queries,
      repos: top15,
      verdict: parsed.verdict as ExistenceVerdict,
      summary: parsed.summary,
    }
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Failed to evaluate scout results' }, { status: 500 })
  }
}
