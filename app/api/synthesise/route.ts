import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'
import {
  buildConfidenceReport,
  buildCoverageMatrix,
  createWarning,
  defaultComponentRationales,
  deterministicVerdict,
  sanitizeNormalizedIdea,
} from '@/lib/intelligence'
import { calculateScores, complexityPenaltyFromCount } from '@/lib/scoring'
import { writeTraceArtifact } from '@/lib/tracing'
import {
  Component,
  ComponentResult,
  ComponentStrategy,
  CoverageMatrix,
  LLMProvider,
  NormalizedIdea,
  PipelineWarning,
  RepoEvidence,
  RetrievalEvidence,
  StrategyType,
  SynthesiseResponse,
} from '@/lib/types'

function safeJsonParse<T>(raw: string): T {
  return JSON.parse(raw) as T
}

function recommendationFor(verdict: 'exists' | 'partial' | 'gap', averageCoverage: number): StrategyType {
  if (verdict === 'exists') return 'fork-one'
  if (averageCoverage >= 62) return 'combine-multiple'
  return 'build-from-scratch'
}

function fallbackGapAnalysis(verdict: 'exists' | 'partial' | 'gap', coverageMatrix: CoverageMatrix): string {
  const weakComponents = coverageMatrix.componentCoverage
    .filter(entry => entry.coverageScore < 55)
    .map(entry => `${entry.component} lacks high-confidence OSS coverage`)

  if (verdict === 'exists') {
    return 'The main gap is not product existence but differentiation. The strongest OSS match already covers the core workflow, so the remaining work is adaptation, polish, and positioning.'
  }

  if (weakComponents.length === 0) {
    return 'Most capabilities have usable OSS support, but there is no single repo that cleanly ships the entire workflow end to end. The challenge is integration quality, not raw implementation.'
  }

  return `${weakComponents.join('. ')}. Those weak spots are where custom implementation or tighter composition will be required.`
}

function chooseSupportingRepos(retrievalEvidence: RetrievalEvidence[], scoutRepos: RepoEvidence[]): string[] {
  const repos = new Set<string>()
  if (scoutRepos[0]?.fullName) repos.add(scoutRepos[0].fullName)
  for (const entry of retrievalEvidence) {
    const top = entry.topRepos[0]?.fullName
    if (top) repos.add(top)
  }
  return Array.from(repos).slice(0, 5)
}

export async function POST(req: NextRequest) {
  const {
    idea,
    normalizedIdea: inputNormalizedIdea,
    components = [],
    results,
    scoutRepos = [],
    scoutVerdict,
    retrievalEvidence: inputRetrievalEvidence,
    apiKey,
    provider,
    model,
  }: {
    idea: string
    normalizedIdea?: Partial<NormalizedIdea>
    components?: Component[]
    results: ComponentResult[]
    scoutRepos?: RepoEvidence[]
    scoutVerdict?: string
    retrievalEvidence?: RetrievalEvidence[]
    apiKey?: string
    provider?: LLMProvider
    model?: string
  } = await req.json()

  const warnings: PipelineWarning[] = []
  const normalizedIdea = sanitizeNormalizedIdea(idea, inputNormalizedIdea)
  const retrievalEvidence: RetrievalEvidence[] = inputRetrievalEvidence ?? results.map(result => ({
    component: result.component,
    topRepos: result.repos,
    queries: [],
    coverageScore: result.coverageScore ?? 0,
    confidence: result.confidence ?? 0.4,
  }))

  const resolvedComponents = components.length > 0
    ? components
    : results.map(result => ({
        name: result.component,
        description: `Research track for ${result.component}`,
        searchQueries: [],
      }))

  const coverageMatrix = buildCoverageMatrix(normalizedIdea, resolvedComponents, retrievalEvidence, scoutRepos)
  const verdict = deterministicVerdict(coverageMatrix.wholeProductCoverage, coverageMatrix.componentCoverage)
  const averageCoverage = coverageMatrix.componentCoverage.length === 0
    ? 0
    : coverageMatrix.componentCoverage.reduce((sum, entry) => sum + entry.coverageScore, 0) / coverageMatrix.componentCoverage.length
  const recommendation = recommendationFor(verdict, averageCoverage)
  const recommendedRepos = verdict === 'exists'
    ? coverageMatrix.wholeProductCoverage.supportingRepos.slice(0, 1)
    : chooseSupportingRepos(retrievalEvidence, scoutRepos)
  const scores = calculateScores(coverageMatrix, complexityPenaltyFromCount(resolvedComponents.length))
  const confidence = buildConfidenceReport(retrievalEvidence, coverageMatrix, warnings)

  if (scoutVerdict && scoutVerdict !== verdict) {
    warnings.push(createWarning('verdict_shift', `Final rubric-based verdict changed from scout=${scoutVerdict} to synthesis=${verdict}.`))
  }

  let componentStrategies: ComponentStrategy[] = coverageMatrix.componentCoverage.map(entry => ({
    name: entry.component,
    action: entry.coverageScore >= 60 ? 'use' : 'build',
    reason: entry.coverageScore >= 60
      ? 'There is enough OSS coverage here that integration is lower risk than reimplementation.'
      : 'Existing OSS coverage is too thin or uncertain, so this should stay custom.',
    suggestedPath: entry.coverageScore >= 60 ? undefined : `src/${entry.component.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    confidence: entry.confidence,
    supportingRepos: entry.supportingRepos,
  }))

  let existenceSummary = verdict === 'exists'
    ? `A complete OSS solution likely already exists${coverageMatrix.wholeProductCoverage.bestRepo ? ` in ${coverageMatrix.wholeProductCoverage.bestRepo}` : ''}.`
    : verdict === 'partial'
    ? 'Open source covers a meaningful portion of the workflow, but not enough to call the problem solved.'
    : 'The OSS ecosystem does not appear to cover the core workflow end to end.'
  let gapAnalysis = fallbackGapAnalysis(verdict, coverageMatrix)
  let strategyReasoning = recommendation === 'fork-one'
    ? `Start from ${recommendedRepos[0] ?? 'the strongest whole-product repo'} and differentiate above it.`
    : recommendation === 'combine-multiple'
    ? 'Combine the strongest repos per component and keep the glue code plus product differentiation custom.'
    : 'Treat OSS as reference material and build the core workflow yourself.'
  let exportMarkdown = `---
idea: ${idea}
strategy: ${recommendation}
---

## Agent Instructions
Read this file carefully. Reuse OSS where marked as USE, and implement the BUILD items yourself.

## Clone These Repos
\`\`\`bash
${recommendedRepos.map(repo => `git clone https://github.com/${repo}.git`).join('\n')}
\`\`\`

## Components: Use vs Build
${componentStrategies.map(strategy => `- ${strategy.name}: ${strategy.action.toUpperCase()} — ${strategy.reason}${strategy.suggestedPath ? ` (${strategy.suggestedPath})` : ''}`).join('\n')}

## Open Questions
- What is the exact target user?
- What is the acceptable latency / interaction model?
- What platform constraints matter first?
`

  try {
    const prompt = `You are explaining a deterministic OSS-research decision.

Idea: "${idea}"
Normalized idea:
${JSON.stringify(normalizedIdea, null, 2)}

Coverage matrix summary:
${JSON.stringify(coverageMatrix, null, 2)}

Deterministic decision:
${JSON.stringify({
  verdict,
  recommendation,
  recommendedRepos,
  scores,
  confidence,
  warnings,
  componentStrategies,
}, null, 2)}

Respond in pure JSON:
{
  "existenceSummary": "2-3 sentences. Explain the verdict using evidence only.",
  "gapAnalysis": "3-5 sentences. Explain what remains missing.",
  "strategyReasoning": "2-3 sentences. Explain exactly how to proceed.",
  "componentStrategies": [
    {
      "name": "exact component name",
      "reason": "one sentence grounded in the evidence",
      "supportingRepos": ["owner/repo"]
    }
  ],
  "exportMarkdown": "Full bootstrap markdown"
}

Do not change verdicts, recommended repos, or action choices.`

    const raw = await callLLM(prompt, apiKey, provider, model)
    const parsed = safeJsonParse<{
      existenceSummary?: string
      gapAnalysis?: string
      strategyReasoning?: string
      componentStrategies?: Array<{ name: string; reason?: string; supportingRepos?: string[] }>
      exportMarkdown?: string
    }>(raw)

    existenceSummary = parsed.existenceSummary?.trim() || existenceSummary
    gapAnalysis = parsed.gapAnalysis?.trim() || gapAnalysis
    strategyReasoning = parsed.strategyReasoning?.trim() || strategyReasoning
    exportMarkdown = parsed.exportMarkdown?.trim() || exportMarkdown
    componentStrategies = componentStrategies.map(strategy => {
      const match = parsed.componentStrategies?.find(candidate => candidate.name === strategy.name)
      return {
        ...strategy,
        reason: match?.reason?.trim() || strategy.reason,
        supportingRepos: match?.supportingRepos?.length ? match.supportingRepos : strategy.supportingRepos,
      }
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'RATE_LIMITED') {
      return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }
    console.error('synthesise explanation error:', err)
    warnings.push(createWarning('synthesise_explanation_fallback', 'Used deterministic fallback copy because the explanation model response could not be parsed.'))
  }

  const response: SynthesiseResponse = {
    existenceCheck: {
      verdict,
      summary: existenceSummary,
    },
    gapAnalysis,
    strategy: {
      recommendation,
      reasoning: strategyReasoning,
      repos: recommendedRepos,
    },
    componentStrategies,
    scores,
    normalizedIdea,
    componentRationales: defaultComponentRationales(resolvedComponents),
    retrievalEvidence,
    coverageMatrix,
    confidence,
    warnings,
    exportMarkdown,
  }

  await writeTraceArtifact('synthesise', {
    idea,
    normalizedIdea,
    retrievalEvidence,
    coverageMatrix,
    scores,
    confidence,
    warnings,
    response,
  })

  return NextResponse.json(response)
}
