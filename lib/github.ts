import { Component, ComponentResult, QueryFamily, RepoEvidence, RetrievalEvidence } from '@/lib/types'

const GITHUB_API = 'https://api.github.com'

interface SearchItem {
  name: string
  full_name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  language: string | null
  license: { spdx_id: string | null } | null
  pushed_at: string
  html_url: string
  topics?: string[]
  archived?: boolean
  fork?: boolean
  is_template?: boolean
}

function authHeaders(githubToken?: string): Record<string, string> {
  const token = githubToken ?? process.env.GITHUB_TOKEN
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    Accept: 'application/vnd.github+json',
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2)
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items))
}

function recencyBucket(lastCommit: string): 'active' | 'warm' | 'stale' {
  const ageMs = Date.now() - new Date(lastCommit).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  if (ageDays < 180) return 'active'
  if (ageDays < 540) return 'warm'
  return 'stale'
}

async function searchRepos(query: string, githubToken?: string, perPage = 8): Promise<SearchItem[]> {
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`
  const res = await fetch(url, { headers: authHeaders(githubToken) })
  if (!res.ok) return []
  const data = await res.json()
  return data.items ?? []
}

async function fetchReadmeSnippet(fullName: string, githubToken?: string): Promise<string> {
  const res = await fetch(`${GITHUB_API}/repos/${fullName}/readme`, {
    headers: authHeaders(githubToken),
  })

  if (!res.ok) return ''

  const data = await res.json()
  if (typeof data.content !== 'string') return ''

  try {
    const decoded = Buffer.from(data.content, 'base64').toString('utf8')
    return decoded
      .replace(/[#>*`-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 700)
  } catch {
    return ''
  }
}

async function enrichRepo(item: SearchItem, githubToken?: string): Promise<RepoEvidence> {
  const readmeSnippet = await fetchReadmeSnippet(item.full_name, githubToken)
  return {
    name: item.name,
    fullName: item.full_name,
    description: item.description ?? '',
    stars: item.stargazers_count,
    forks: item.forks_count,
    openIssues: item.open_issues_count,
    language: item.language,
    license: item.license?.spdx_id ?? null,
    lastCommit: item.pushed_at,
    url: item.html_url,
    topics: item.topics ?? [],
    archived: Boolean(item.archived),
    isFork: Boolean(item.fork),
    isTemplate: Boolean(item.is_template),
    readmeSnippet,
    recencyBucket: recencyBucket(item.pushed_at),
  }
}

function matchSignals(repo: RepoEvidence, target: string, queryMatches: string[]) {
  const targetTokens = tokenize(target)
  const haystack = `${repo.name} ${repo.fullName} ${repo.description} ${repo.topics.join(' ')} ${repo.readmeSnippet ?? ''}`.toLowerCase()
  const exactName = repo.name.toLowerCase() === target.toLowerCase() || repo.fullName.toLowerCase().includes(target.toLowerCase())
  const title = targetTokens.some(token => repo.name.toLowerCase().includes(token))
  const description = targetTokens.some(token => repo.description.toLowerCase().includes(token))
  const topics = targetTokens.some(token => repo.topics.map(topic => topic.toLowerCase()).includes(token))
  const readme = targetTokens.some(token => (repo.readmeSnippet ?? '').toLowerCase().includes(token))
  const overlap = targetTokens.length === 0 ? 0 : targetTokens.filter(token => haystack.includes(token)).length / targetTokens.length

  return {
    signals: { title, description, topics, readme, exactName },
    overlap,
    queryMatches,
  }
}

function rankRepo(repo: RepoEvidence, target: string, queryMatches: string[]): RepoEvidence {
  const { signals, overlap } = matchSignals(repo, target, queryMatches)
  const relevanceScore = Math.round(
    overlap * 55 +
    (signals.exactName ? 20 : 0) +
    (signals.title ? 10 : 0) +
    (signals.description ? 8 : 0) +
    (signals.topics ? 4 : 0) +
    (signals.readme ? 8 : 0)
  )
  const maintenanceScore = Math.max(
    0,
    Math.round(
      (repo.recencyBucket === 'active' ? 85 : repo.recencyBucket === 'warm' ? 55 : 20) -
      (repo.archived ? 45 : 0)
    )
  )
  const adoptionScore = Math.min(100, Math.round(Math.log10((repo.stars ?? 0) + 1) * 28 + Math.log10((repo.forks ?? 0) + 1) * 14))
  const licenseScore = repo.license && repo.license !== 'NOASSERTION' ? 100 : 45
  const fitScore = Math.round(
    relevanceScore * 0.65 +
    maintenanceScore * 0.2 +
    (signals.readme ? 10 : 0) +
    (repo.isFork ? -15 : 0) +
    (repo.isTemplate ? -10 : 0)
  )
  const evidenceScore = Math.round(
    relevanceScore * 0.45 +
    maintenanceScore * 0.25 +
    adoptionScore * 0.15 +
    licenseScore * 0.05 +
    fitScore * 0.1
  )

  const rankingReasons = [
    signals.exactName ? 'Exact or near-exact name match' : null,
    signals.description ? 'Description aligns with the target capability' : null,
    signals.readme ? 'README contains explicit supporting evidence' : 'README evidence is limited',
    repo.recencyBucket === 'active' ? 'Recently maintained' : repo.recencyBucket === 'warm' ? 'Moderately maintained' : 'Stale maintenance signal',
    repo.archived ? 'Archived repository penalty applied' : null,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    ...repo,
    queryMatches,
    matchSignals: signals,
    relevanceScore,
    maintenanceScore,
    adoptionScore,
    licenseScore,
    fitScore,
    evidenceScore,
    rankingReasons,
  }
}

function generateDarkHorse(target: string, repos: RepoEvidence[]): RepoEvidence | undefined {
  return repos
    .filter(repo => (repo.matchSignals?.exactName || repo.matchSignals?.title) && repo.stars < 250)
    .sort((a, b) => (b.evidenceScore ?? 0) - (a.evidenceScore ?? 0))[0]
}

async function searchWithFamilies(
  target: string,
  queryFamilies: QueryFamily[],
  githubToken?: string
): Promise<{ topRepos: RepoEvidence[]; darkHorse?: RepoEvidence; queries: QueryFamily[]; confidence: number }> {
  const byFullName = new Map<string, { item: SearchItem; queryMatches: string[] }>()

  for (const family of queryFamilies) {
    for (const query of family.queries.slice(0, 2)) {
      const results = await searchRepos(query, githubToken)
      for (const item of results) {
        const existing = byFullName.get(item.full_name)
        const queryMatches = unique([...(existing?.queryMatches ?? []), `${family.type}: ${query}`])
        byFullName.set(item.full_name, { item, queryMatches })
      }
    }
  }

  const initialCandidates = Array.from(byFullName.values())
    .sort((a, b) => b.item.stargazers_count - a.item.stargazers_count)
    .slice(0, 10)

  const enriched = await Promise.all(
    initialCandidates.map(async candidate => rankRepo(await enrichRepo(candidate.item, githubToken), target, candidate.queryMatches))
  )

  const ranked = enriched
    .filter(repo => !repo.isFork)
    .sort((a, b) => (b.evidenceScore ?? 0) - (a.evidenceScore ?? 0))

  const topRepos = ranked.slice(0, 5)
  const darkHorse = generateDarkHorse(target, ranked.filter(repo => !topRepos.some(entry => entry.fullName === repo.fullName)))
  const confidence = topRepos.length === 0
    ? 0.25
    : Math.min(0.95, 0.35 + topRepos.filter(repo => (repo.evidenceScore ?? 0) > 55).length * 0.12)

  return {
    topRepos: darkHorse && !topRepos.some(repo => repo.fullName === darkHorse.fullName)
      ? [...topRepos.slice(0, 4), darkHorse]
      : topRepos,
    darkHorse,
    queries: queryFamilies,
    confidence: Number(confidence.toFixed(2)),
  }
}

export async function searchComponents(
  components: Component[],
  githubToken?: string
): Promise<{ results: ComponentResult[]; evidence: RetrievalEvidence[] }> {
  const evidence = await Promise.all(
    components.map(async component => {
      const families = component.queryFamilies ?? []
      const search = await searchWithFamilies(component.name, families, githubToken)
      const coverageScore = Math.round(
        search.topRepos.length === 0
          ? 0
          : search.topRepos.reduce((sum, repo) => sum + (repo.fitScore ?? 0), 0) / search.topRepos.length
      )

      return {
        component: component.name,
        topRepos: search.topRepos,
        darkHorse: search.darkHorse,
        queries: search.queries,
        coverageScore,
        confidence: search.confidence,
      } satisfies RetrievalEvidence
    })
  )

  return {
    evidence,
    results: evidence.map(entry => ({
      component: entry.component,
      repos: entry.topRepos,
      coverageScore: entry.coverageScore,
      confidence: entry.confidence,
    })),
  }
}

export async function searchWholeProduct(
  target: string,
  queryFamilies: QueryFamily[],
  githubToken?: string
): Promise<{ repos: RepoEvidence[]; darkHorse?: RepoEvidence; confidence: number }> {
  const search = await searchWithFamilies(target, queryFamilies, githubToken)
  return { repos: search.topRepos, darkHorse: search.darkHorse, confidence: search.confidence }
}
