import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'
import { Repo, ScoutResponse, ExistenceVerdict } from '@/lib/types'

const GITHUB_API = 'https://api.github.com/search/repositories'

async function searchRepos(query: string, githubToken?: string): Promise<Repo[]> {
  const url = `${GITHUB_API}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`
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
  const { idea, geminiKey, githubToken }: { idea: string; geminiKey?: string; githubToken?: string } = await req.json()

  // Step 1: generate whole-product search queries
  const queryPrompt = `You are a senior engineer doing pre-build research. A founder wants to build: "${idea}"

Generate 3 GitHub search queries that would find a complete, ready-to-use open source project that already does exactly this — not libraries or components, but the finished product itself.

Think: what would someone search for if they wanted to find and fork an existing tool rather than build from scratch?

Respond in pure JSON with no markdown fences:
{ "queries": ["query one", "query two", "query three"] }`

  let queries: string[] = []
  try {
    const raw = await callLLM(queryPrompt, geminiKey)
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
  const top8 = Array.from(byFullName.values())
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 8)

  // Step 3: LLM judges whether a complete solution exists
  const repoList = top8.length > 0
    ? top8.map(r => `- ${r.fullName} (${r.stars.toLocaleString()} stars, last commit ${r.lastCommit.slice(0, 10)}) — ${r.description}`).join('\n')
    : '(no results found)'

  const verdictPrompt = `A founder wants to build: "${idea}"

These are the top GitHub results when searching for a complete, existing solution:
${repoList}

Does a complete, production-ready open source solution already exist for this exact idea?

Be strict: "exists" only if one of these repos clearly does the full job with active maintenance (commits in last 12 months) and meaningful adoption (>200 stars). "partial" if something covers 60-80% of the idea. "gap" if nothing closely matches.

Respond in pure JSON with no markdown fences:
{
  "verdict": "exists" | "partial" | "gap",
  "summary": "1-2 sentences. Name the specific repo if verdict is exists or partial, explain what it does and what is missing if partial."
}`

  try {
    const raw = await callLLM(verdictPrompt, geminiKey)
    const parsed = JSON.parse(raw)
    const response: ScoutResponse = {
      queries,
      repos: top8,
      verdict: parsed.verdict as ExistenceVerdict,
      summary: parsed.summary,
    }
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Failed to evaluate scout results' }, { status: 500 })
  }
}
