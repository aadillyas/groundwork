import fs from 'fs/promises'
import path from 'path'

const root = process.cwd()
const fixturePath = path.join(root, 'data', 'eval-fixtures', 'fixtures.json')

function inRange(value, [min, max]) {
  return value >= min && value <= max
}

async function loadFixtures() {
  const raw = await fs.readFile(fixturePath, 'utf8')
  return JSON.parse(raw)
}

async function runLive(fixtures) {
  const baseUrl = process.env.GROUNDWORK_BASE_URL ?? 'http://localhost:3000'
  const results = []

  for (const fixture of fixtures) {
    const scoutRes = await fetch(`${baseUrl}/api/scout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: fixture.idea }),
    })

    if (!scoutRes.ok) {
      results.push({ idea: fixture.idea, ok: false, reason: `scout failed (${scoutRes.status})` })
      continue
    }

    const scout = await scoutRes.json()
    const decomposeRes = await fetch(`${baseUrl}/api/decompose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: fixture.idea, normalizedIdea: scout.normalizedIdea, scoutVerdict: scout.verdict }),
    })

    if (!decomposeRes.ok) {
      results.push({ idea: fixture.idea, ok: false, reason: `decompose failed (${decomposeRes.status})` })
      continue
    }

    const decompose = await decomposeRes.json()
    const searchRes = await fetch(`${baseUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ components: decompose.components }),
    })

    if (!searchRes.ok) {
      results.push({ idea: fixture.idea, ok: false, reason: `search failed (${searchRes.status})` })
      continue
    }

    const search = await searchRes.json()
    const synthRes = await fetch(`${baseUrl}/api/synthesise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea: fixture.idea,
        normalizedIdea: decompose.normalizedIdea,
        components: decompose.components,
        results: search.results,
        retrievalEvidence: search.evidence,
        scoutRepos: scout.repos,
        scoutVerdict: scout.verdict,
      }),
    })

    if (!synthRes.ok) {
      results.push({ idea: fixture.idea, ok: false, reason: `synthesise failed (${synthRes.status})` })
      continue
    }

    const synthesise = await synthRes.json()
    const verdictOk = fixture.expectedVerdictBand.includes(synthesise.existenceCheck.verdict)
    const scoreOk = Object.entries(fixture.expectedScoreRanges).every(([metric, range]) =>
      inRange(synthesise.scores[metric].score, range)
    )
    const repoOk = fixture.knownRepos.length === 0 || fixture.knownRepos.some(repo =>
      scout.repos.some(candidate => candidate.fullName === repo) ||
      search.results.some(result => result.repos.some(candidate => candidate.fullName === repo))
    )

    results.push({
      idea: fixture.idea,
      ok: verdictOk && scoreOk && repoOk,
      verdict: synthesise.existenceCheck.verdict,
      verdictOk,
      scoreOk,
      repoOk,
    })
  }

  return results
}

async function main() {
  const fixtures = await loadFixtures()
  const schemaIssues = fixtures.filter(fixture =>
    !fixture.idea ||
    !fixture.bucket ||
    !Array.isArray(fixture.expectedVerdictBand) ||
    !fixture.expectedScoreRanges
  )

  if (schemaIssues.length > 0) {
    console.error(`Fixture schema invalid for ${schemaIssues.length} case(s).`)
    process.exit(1)
  }

  console.log(`Loaded ${fixtures.length} fixtures from ${fixturePath}`)

  if (process.env.LIVE_EVAL !== '1') {
    console.log('Schema check passed. Set LIVE_EVAL=1 to run the local API evaluation loop.')
    return
  }

  const results = await runLive(fixtures)
  const failed = results.filter(result => !result.ok)
  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'}: ${result.idea}`)
    if (!result.ok) {
      console.log(`  ${result.reason ?? `verdictOk=${result.verdictOk} scoreOk=${result.scoreOk} repoOk=${result.repoOk}`}`)
    }
  }

  if (failed.length > 0) {
    process.exit(1)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
