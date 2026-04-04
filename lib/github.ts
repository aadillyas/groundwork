import { Repo, ComponentResult } from './types'

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

export async function searchComponents(
  components: { name: string; searchQueries: string[] }[],
  githubToken?: string
): Promise<ComponentResult[]> {
  const results: ComponentResult[] = []

  for (const component of components) {
    const queries = component.searchQueries.slice(0, 2)
    const repoSets = await Promise.all(queries.map(q => searchRepos(q, githubToken)))

    // Merge and deduplicate by fullName, keep highest star count seen
    const byFullName = new Map<string, Repo>()
    for (const repos of repoSets) {
      for (const repo of repos) {
        const existing = byFullName.get(repo.fullName)
        if (!existing || repo.stars > existing.stars) {
          byFullName.set(repo.fullName, repo)
        }
      }
    }

    // Top 5 by stars
    const top5 = Array.from(byFullName.values())
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 5)

    results.push({ component: component.name, repos: top5 })
  }

  return results
}
