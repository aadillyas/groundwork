import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'
import { searchWholeProduct } from '@/lib/github'
import {
  ConfidenceReport,
  ExistenceVerdict,
  LLMProvider,
  NormalizedIdea,
  PipelineWarning,
  ScoutResponse,
} from '@/lib/types'
import {
  buildConfidenceReport,
  buildCoverageMatrix,
  buildWholeProductQueryFamilies,
  createWarning,
  deterministicVerdict,
  sanitizeNormalizedIdea,
} from '@/lib/intelligence'
import { writeTraceArtifact } from '@/lib/tracing'

function safeJsonParse<T>(raw: string): T {
  return JSON.parse(raw) as T
}

function fallbackSummary(verdict: ExistenceVerdict, bestRepo?: string): string {
  if (verdict === 'exists') return `A strong whole-product OSS match already exists${bestRepo ? ` in ${bestRepo}` : ''}.`
  if (verdict === 'partial') return `Open source gets meaningfully close${bestRepo ? `, with ${bestRepo} as the strongest lead` : ''}, but important gaps remain.`
  return 'No strong whole-product OSS match surfaced from GitHub evidence, so this still looks like a real gap.'
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

  const warnings: PipelineWarning[] = []
  let normalizedIdea: NormalizedIdea

  try {
    const prompt = `You are normalising a startup idea for an OSS-research pipeline.

Idea: "${idea}"

Return pure JSON with no markdown fences:
{
  "normalizedIdea": {
    "summary": "one sentence",
    "user": "who this is for",
    "jobToBeDone": "one sentence",
    "platform": "primary platform or environment",
    "coreWorkflow": ["3-5 ordered workflow steps"],
    "mustHaveCapabilities": ["capability"],
    "niceToHaveCapabilities": ["capability"],
    "nonGoals": ["explicit non-goal"],
    "complexity": "simple" | "medium" | "complex",
    "capabilities": [
      {
        "name": "Capability name",
        "description": "why it matters",
        "importance": "critical" | "supporting" | "optional",
        "signals": ["keywords or synonyms to look for in OSS repos"]
      }
    ]
  }
}`

    const raw = await callLLM(prompt, apiKey, provider, model)
    normalizedIdea = sanitizeNormalizedIdea(idea, safeJsonParse<{ normalizedIdea?: Partial<NormalizedIdea> }>(raw).normalizedIdea)
  } catch (err) {
    if (err instanceof Error && err.message === 'RATE_LIMITED') {
      return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }
    normalizedIdea = sanitizeNormalizedIdea(idea, undefined)
    warnings.push(createWarning('normalization_fallback', 'Used fallback idea normalization because the model response could not be parsed.'))
  }

  const queryFamilies = buildWholeProductQueryFamilies(idea, normalizedIdea)
  const queries = queryFamilies.flatMap(family => family.queries)
  const search = await searchWholeProduct(idea, queryFamilies, githubToken)

  const pseudoMatrix = buildCoverageMatrix(normalizedIdea, [], [], search.repos)
  const verdict = deterministicVerdict(pseudoMatrix.wholeProductCoverage, [])
  const confidence: ConfidenceReport = buildConfidenceReport([], pseudoMatrix, warnings)

  let summary = fallbackSummary(verdict, pseudoMatrix.wholeProductCoverage.bestRepo)
  try {
    const summaryPrompt = `You are explaining a scout-stage verdict for an OSS research tool.

Idea: "${idea}"
Normalized idea summary: ${normalizedIdea.summary}
Whole-product candidates:
${search.repos.map(repo => `- ${repo.fullName} | evidenceScore=${repo.evidenceScore} | recency=${repo.recencyBucket} | description=${repo.description}`).join('\n') || '(none)'}

Verdict (must preserve exactly): ${verdict}
Best repo: ${pseudoMatrix.wholeProductCoverage.bestRepo ?? 'none'}
Confidence: ${confidence.overall}

Respond in pure JSON:
{ "summary": "2 short sentences max. Explain the verdict using the repo evidence only." }`

    const raw = await callLLM(summaryPrompt, apiKey, provider, model)
    summary = safeJsonParse<{ summary?: string }>(raw).summary?.trim() || summary
  } catch (err) {
    if (err instanceof Error && err.message === 'RATE_LIMITED') {
      return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }
    warnings.push(createWarning('scout_summary_fallback', 'Used fallback scout summary because the explanation model response could not be parsed.'))
  }

  const response: ScoutResponse = {
    queries,
    queryFamilies,
    repos: search.repos,
    verdict,
    summary,
    normalizedIdea,
    wholeProductCoverage: pseudoMatrix.wholeProductCoverage,
    confidence,
    warnings,
  }

  await writeTraceArtifact('scout', {
    idea,
    provider: provider ?? 'gemini',
    model: model ?? null,
    normalizedIdea,
    queries,
    repos: search.repos,
    wholeProductCoverage: pseudoMatrix.wholeProductCoverage,
    verdict,
    confidence,
    warnings,
  })

  return NextResponse.json(response)
}
