import {
  Capability,
  CapabilityCoverageCell,
  Component,
  ComponentCoverage,
  ComponentRationale,
  ComponentValidation,
  ConfidenceReport,
  CoverageLevel,
  CoverageMatrix,
  ExistenceVerdict,
  NormalizedIdea,
  PipelineWarning,
  QueryFamily,
  RepoEvidence,
  RetrievalEvidence,
  WholeProductCoverage,
} from '@/lib/types'

const STOPWORDS = new Set([
  'a', 'an', 'and', 'app', 'application', 'assistant', 'be', 'build', 'for', 'from', 'in', 'into', 'of', 'on',
  'or', 'platform', 'product', 'service', 'system', 'that', 'the', 'to', 'tool', 'with', 'your',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length > 2 && !STOPWORDS.has(token))
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items))
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function createWarning(code: string, message: string): PipelineWarning {
  return { code, message }
}

export function fallbackNormalizeIdea(idea: string): NormalizedIdea {
  const tokens = tokenize(idea)
  const summary = idea.trim()
  const mustHave = unique(tokens.slice(0, 6))

  const capabilities: Capability[] = mustHave.slice(0, 4).map((token, index) => ({
    name: titleCase(token),
    description: `Support ${token} in the core workflow.`,
    importance: index < 2 ? 'critical' : 'supporting',
    signals: [token],
  }))

  return {
    summary,
    user: 'Founders and engineers evaluating an implementation path',
    jobToBeDone: summary,
    platform: 'web',
    coreWorkflow: [
      `Interpret the idea: ${summary}`,
      'Identify the workflow and reusable building blocks',
      'Recommend what to reuse and what to build',
    ],
    mustHaveCapabilities: mustHave,
    niceToHaveCapabilities: [],
    nonGoals: [],
    complexity: mustHave.length <= 3 ? 'simple' : mustHave.length <= 6 ? 'medium' : 'complex',
    capabilities,
  }
}

export function sanitizeNormalizedIdea(
  idea: string,
  normalized: Partial<NormalizedIdea> | undefined
): NormalizedIdea {
  const fallback = fallbackNormalizeIdea(idea)
  const capabilities = (normalized?.capabilities ?? fallback.capabilities)
    .filter(cap => cap?.name && cap?.description)
    .map((cap, index) => ({
      name: cap.name.trim(),
      description: cap.description.trim(),
      importance: cap.importance ?? (index < 2 ? 'critical' : 'supporting'),
      signals: unique([...(cap.signals ?? []), ...tokenize(`${cap.name} ${cap.description}`)]).slice(0, 8),
    }))

  return {
    summary: normalized?.summary?.trim() || fallback.summary,
    user: normalized?.user?.trim() || fallback.user,
    jobToBeDone: normalized?.jobToBeDone?.trim() || fallback.jobToBeDone,
    platform: normalized?.platform?.trim() || fallback.platform,
    coreWorkflow: (normalized?.coreWorkflow ?? fallback.coreWorkflow).filter(Boolean).slice(0, 6),
    mustHaveCapabilities: unique((normalized?.mustHaveCapabilities ?? fallback.mustHaveCapabilities).filter(Boolean)).slice(0, 8),
    niceToHaveCapabilities: unique((normalized?.niceToHaveCapabilities ?? []).filter(Boolean)).slice(0, 8),
    nonGoals: unique((normalized?.nonGoals ?? []).filter(Boolean)).slice(0, 8),
    complexity: normalized?.complexity ?? fallback.complexity,
    capabilities: capabilities.length > 0 ? capabilities : fallback.capabilities,
  }
}

export function buildWholeProductQueryFamilies(idea: string, normalized: NormalizedIdea): QueryFamily[] {
  const baseTerms = unique([
    ...tokenize(idea).slice(0, 4),
    ...normalized.mustHaveCapabilities.flatMap(tokenize).slice(0, 5),
  ]).slice(0, 5)

  const joined = baseTerms.join(' ')
  const platform = tokenize(normalized.platform).join(' ')

  return [
    {
      type: 'product',
      label: 'Exact product phrasing',
      queries: unique([
        `${joined} in:name,description`,
        `${joined.replace(/\s+/g, '-')}`,
      ]).slice(0, 2),
    },
    {
      type: 'integration',
      label: 'Workflow phrasing',
      queries: unique([
        `${normalized.jobToBeDone} in:description`,
        `${normalized.coreWorkflow[0] ?? joined} ${platform}`.trim(),
      ]).slice(0, 2),
    },
    {
      type: 'ui',
      label: 'Platform and topic signals',
      queries: unique([
        `${platform} ${joined} in:name`,
        tokenize(normalized.platform).length > 0 ? `topic:${tokenize(normalized.platform)[0]} ${joined}` : joined,
      ]).slice(0, 2),
    },
  ]
}

export function buildComponentQueryFamilies(component: Component, normalizedIdea: NormalizedIdea): QueryFamily[] {
  const componentTerms = unique([
    ...tokenize(component.name),
    ...tokenize(component.description),
    ...(component.capabilities ?? []).flatMap(cap => cap.signals),
  ]).slice(0, 5)

  const platformTerms = tokenize(normalizedIdea.platform).slice(0, 2).join(' ')
  const seed = componentTerms.join(' ')
  const queries = unique([
    ...component.searchQueries,
    `${seed} ${platformTerms}`.trim(),
    `${seed} in:name,description`,
    tokenize(component.name).length > 0 ? `topic:${tokenize(component.name)[0]} ${seed}` : seed,
  ]).filter(Boolean)

  return [
    { type: 'library' as const, label: 'Exact component phrasing', queries: queries.slice(0, 2) },
    { type: 'integration' as const, label: 'Workflow phrasing', queries: queries.slice(2, 4) },
    { type: 'infra' as const, label: 'Topic / platform phrasing', queries: queries.slice(4, 6) },
  ].filter(family => family.queries.length > 0)
}

export function validateComponents(
  components: Component[],
  normalizedIdea: NormalizedIdea
): { components: Component[]; warnings: PipelineWarning[] } {
  const warnings: PipelineWarning[] = []
  const capabilityNames = normalizedIdea.capabilities.map(cap => cap.name.toLowerCase())

  const enriched = components.map(component => {
    const issues: string[] = []
    const queryFamilies = component.queryFamilies && component.queryFamilies.length > 0
      ? component.queryFamilies
      : buildComponentQueryFamilies(component, normalizedIdea)
    const queryCount = queryFamilies.flatMap(family => family.queries).filter(Boolean).length
    const genericName = ['backend', 'frontend', 'database', 'api'].includes(component.name.trim().toLowerCase())
    const matchingCapabilities = normalizedIdea.capabilities.filter(cap => {
      const haystack = `${component.name} ${component.description}`.toLowerCase()
      return haystack.includes(cap.name.toLowerCase()) || cap.signals.some(signal => haystack.includes(signal))
    })

    if (genericName) issues.push('Generic label without a distinct responsibility')
    if (queryCount < 3) issues.push('Fewer than 3 meaningful queries generated')
    if (matchingCapabilities.length === 0 && capabilityNames.length > 0) issues.push('Does not clearly map to the normalized idea capabilities')

    const validation: ComponentValidation = {
      valid: issues.length === 0,
      coverage: matchingCapabilities.length > 0 ? 'complete' : 'partial',
      issues,
    }

    if (issues.length > 0) {
      warnings.push(createWarning('component_validation', `${component.name}: ${issues.join('; ')}`))
    }

    return {
      ...component,
      confidence: component.confidence ?? (validation.valid ? 0.76 : 0.42),
      queryFamilies,
      validation,
      capabilities: component.capabilities ?? matchingCapabilities,
    }
  })

  return { components: enriched, warnings }
}

function repoText(repo: RepoEvidence): string {
  return `${repo.name} ${repo.fullName} ${repo.description} ${repo.topics.join(' ')} ${repo.readmeSnippet ?? ''}`.toLowerCase()
}

function overlapScore(needles: string[], haystack: string): number {
  if (needles.length === 0) return 0
  const matches = needles.filter(needle => haystack.includes(needle.toLowerCase())).length
  return matches / needles.length
}

export function assessCapabilityCoverage(
  capability: Capability,
  repo: RepoEvidence
): CapabilityCoverageCell {
  const evidence: string[] = []
  const text = repoText(repo)
  const needles = unique([capability.name.toLowerCase(), ...capability.signals.map(signal => signal.toLowerCase())])
  const overlap = overlapScore(needles, text)
  let level: CoverageLevel = 'none'
  let score = Math.round(overlap * 100)

  if (overlap >= 0.66) level = 'full'
  else if (overlap >= 0.3) level = 'partial'
  else if (repo.readmeSnippet) level = 'unknown'

  if (repo.name.toLowerCase().includes(capability.name.toLowerCase())) evidence.push('Repo name matches capability')
  if (repo.description.toLowerCase().includes(capability.name.toLowerCase())) evidence.push('Description mentions capability')
  if ((repo.readmeSnippet ?? '').toLowerCase().includes(capability.name.toLowerCase())) evidence.push('README mentions capability')
  if (repo.topics.some(topic => needles.includes(topic.toLowerCase()))) evidence.push('Topic tag aligns with capability')

  if (level === 'unknown' && evidence.length === 0) {
    evidence.push('Limited explicit evidence in metadata')
  }

  return {
    capability: capability.name,
    repoFullName: repo.fullName,
    level,
    score,
    evidence: evidence.slice(0, 3),
  }
}

function componentCoverageFor(
  component: Component,
  repos: RepoEvidence[],
  capabilityCells: CapabilityCoverageCell[]
): ComponentCoverage {
  const componentCapabilities = component.capabilities && component.capabilities.length > 0
    ? component.capabilities
    : []

  const relevantCaps = componentCapabilities.length > 0
    ? componentCapabilities.map(cap => cap.name)
    : [component.name]

  const cells = capabilityCells.filter(cell => relevantCaps.includes(cell.capability))
  const byRepo = new Map<string, number>()
  for (const cell of cells) {
    const weight = cell.level === 'full' ? 1 : cell.level === 'partial' ? 0.55 : cell.level === 'unknown' ? 0.25 : 0
    byRepo.set(cell.repoFullName, (byRepo.get(cell.repoFullName) ?? 0) + weight)
  }

  const sorted = Array.from(byRepo.entries()).sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 2).map(([fullName]) => fullName)
  const maxPossible = Math.max(relevantCaps.length, 1)
  const topScore = sorted[0]?.[1] ?? 0
  const coverageScore = Math.round(Math.min(1, topScore / maxPossible) * 100)
  const confidence = Math.min(0.95, 0.35 + cells.filter(cell => cell.level !== 'unknown').length / Math.max(cells.length, 1) * 0.6)

  return {
    component: component.name,
    coverageScore,
    supportingRepos: top,
    confidence: Number(confidence.toFixed(2)),
  }
}

export function buildCoverageMatrix(
  normalizedIdea: NormalizedIdea,
  components: Component[],
  retrievalEvidence: RetrievalEvidence[],
  scoutRepos: RepoEvidence[]
): CoverageMatrix {
  const candidateRepos = unique([
    ...scoutRepos.map(repo => repo.fullName),
    ...retrievalEvidence.flatMap(entry => entry.topRepos.map(repo => repo.fullName)),
  ])

  const repoMap = new Map<string, RepoEvidence>()
  for (const repo of scoutRepos) repoMap.set(repo.fullName, repo)
  for (const entry of retrievalEvidence) {
    for (const repo of entry.topRepos) repoMap.set(repo.fullName, repo)
  }

  const cells: CapabilityCoverageCell[] = []
  for (const capability of normalizedIdea.capabilities) {
    for (const repoFullName of candidateRepos) {
      const repo = repoMap.get(repoFullName)
      if (!repo) continue
      cells.push(assessCapabilityCoverage(capability, repo))
    }
  }

  const componentCoverage = components.map(component =>
    componentCoverageFor(component, retrievalEvidence.find(entry => entry.component === component.name)?.topRepos ?? [], cells)
  )

  const criticalCaps = normalizedIdea.capabilities.filter(cap => cap.importance === 'critical')
  const wholeProductScores = scoutRepos.map(repo => {
    const repoCells = cells.filter(cell => cell.repoFullName === repo.fullName && criticalCaps.some(cap => cap.name === cell.capability))
    const weighted = repoCells.reduce((sum, cell) => {
      return sum + (cell.level === 'full' ? 1 : cell.level === 'partial' ? 0.55 : cell.level === 'unknown' ? 0.15 : 0)
    }, 0)
    const score = Math.round((weighted / Math.max(criticalCaps.length, 1)) * 100)
    return { repo: repo.fullName, score }
  }).sort((a, b) => b.score - a.score)

  const bestRepo = wholeProductScores[0]
  const confidence = Math.min(
    0.95,
    0.3 + wholeProductScores.filter(entry => entry.score > 30).length / Math.max(scoutRepos.length, 1) * 0.5
  )

  const wholeProductCoverage: WholeProductCoverage = {
    bestRepo: bestRepo?.repo,
    bestScore: bestRepo?.score ?? 0,
    supportingRepos: wholeProductScores.filter(entry => entry.score >= 35).slice(0, 3).map(entry => entry.repo),
    marketSaturation: Math.min(100, wholeProductScores.filter(entry => entry.score >= 55).length * 20),
    confidence: Number(confidence.toFixed(2)),
  }

  return {
    capabilities: normalizedIdea.capabilities.map(cap => cap.name),
    repos: candidateRepos,
    cells,
    componentCoverage,
    wholeProductCoverage,
  }
}

export function buildConfidenceReport(
  retrievalEvidence: RetrievalEvidence[],
  coverageMatrix: CoverageMatrix,
  warnings: PipelineWarning[]
): ConfidenceReport {
  const retrieval = retrievalEvidence.length === 0
    ? 0.2
    : retrievalEvidence.reduce((sum, entry) => sum + entry.confidence, 0) / retrievalEvidence.length
  const coverage = coverageMatrix.componentCoverage.length === 0
    ? 0.2
    : coverageMatrix.componentCoverage.reduce((sum, entry) => sum + entry.confidence, 0) / coverageMatrix.componentCoverage.length
  const warningPenalty = Math.min(0.35, warnings.length * 0.05)
  const judgment = Math.max(0.2, (coverageMatrix.wholeProductCoverage.confidence + coverage) / 2 - warningPenalty)
  const overall = Math.max(0.2, ((retrieval + coverage + judgment) / 3) - warningPenalty)

  return {
    overall: Number(overall.toFixed(2)),
    retrieval: Number(retrieval.toFixed(2)),
    coverage: Number(coverage.toFixed(2)),
    judgment: Number(judgment.toFixed(2)),
    notes: warnings.slice(0, 4).map(warning => warning.message),
  }
}

export function deterministicVerdict(
  wholeProductCoverage: WholeProductCoverage,
  componentCoverage: ComponentCoverage[]
): ExistenceVerdict {
  const avgComponentCoverage = componentCoverage.length === 0
    ? 0
    : componentCoverage.reduce((sum, entry) => sum + entry.coverageScore, 0) / componentCoverage.length

  if (wholeProductCoverage.bestScore >= 78) return 'exists'
  if (wholeProductCoverage.bestScore >= 42 || avgComponentCoverage >= 45) return 'partial'
  return 'gap'
}

export function defaultComponentRationales(components: Component[]): ComponentRationale[] {
  return components.map(component => ({
    name: component.name,
    rationale: component.rationale ?? component.description,
    inputs: component.inputs ?? [],
    outputs: component.outputs ?? [],
    dependencies: component.dependencies ?? [],
    userVisible: component.userVisible ?? false,
    confidence: component.confidence ?? 0.6,
    validation: component.validation,
  }))
}
