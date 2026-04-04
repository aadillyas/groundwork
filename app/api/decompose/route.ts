import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'
import { buildComponentQueryFamilies, createWarning, sanitizeNormalizedIdea, validateComponents } from '@/lib/intelligence'
import { writeTraceArtifact } from '@/lib/tracing'
import { DecomposeResponse, ExistenceVerdict, LLMProvider, NormalizedIdea, Component } from '@/lib/types'

function safeJsonParse<T>(raw: string): T {
  return JSON.parse(raw) as T
}

export async function POST(req: NextRequest) {
  const {
    idea,
    normalizedIdea: inputNormalizedIdea,
    scoutVerdict,
    apiKey,
    provider,
    model,
  }: {
    idea: string
    normalizedIdea?: Partial<NormalizedIdea>
    scoutVerdict?: ExistenceVerdict
    apiKey?: string
    provider?: LLMProvider
    model?: string
  } = await req.json()

  const normalizedIdea = sanitizeNormalizedIdea(idea, inputNormalizedIdea)

  const prompt = `You are designing a defensible decomposition for an OSS-research pipeline.

Idea: "${idea}"
Normalized idea:
${JSON.stringify(normalizedIdea, null, 2)}
Scout verdict: ${scoutVerdict ?? 'unknown'}

Rules:
- Components must have distinct responsibilities.
- A valid component must be independently searchable on GitHub.
- Avoid generic labels like "backend" unless the idea truly revolves around infrastructure.
- First reason from capabilities, then cluster capabilities into components.
- Include at least 3 search queries per component.
- Keep count proportional to complexity: simple 1-2, medium 2-4, complex 4-6.

Return pure JSON:
{
  "capabilities": [
    {
      "name": "Capability",
      "description": "why it matters",
      "importance": "critical" | "supporting" | "optional",
      "signals": ["keyword"]
    }
  ],
  "components": [
    {
      "name": "Component name",
      "description": "what it does",
      "rationale": "why this is a separate component",
      "inputs": ["input"],
      "outputs": ["output"],
      "dependencies": ["another component"],
      "userVisible": true,
      "confidence": 0.82,
      "capabilities": ["capability name"],
      "searchQueries": ["query 1", "query 2", "query 3"]
    }
  ]
}`

  try {
    const raw = await callLLM(prompt, apiKey, provider, model)
    const parsed = safeJsonParse<{
      capabilities?: NormalizedIdea['capabilities']
      components?: Array<Component & { capabilities?: string[] }>
    }>(raw)

    const mergedNormalizedIdea = sanitizeNormalizedIdea(idea, {
      ...normalizedIdea,
      capabilities: parsed.capabilities ?? normalizedIdea.capabilities,
    })

    const components = (parsed.components ?? []).map(component => ({
      ...component,
      capabilities: mergedNormalizedIdea.capabilities.filter(capability =>
        (component.capabilities ?? []).includes(capability.name)
      ),
    }))

    const withQueries = components.map(component => ({
      ...component,
      searchQueries: component.searchQueries.slice(0, 6),
      queryFamilies: buildComponentQueryFamilies(component, mergedNormalizedIdea),
    }))

    const validated = validateComponents(withQueries, mergedNormalizedIdea)
    const warnings = [...validated.warnings]

    if (validated.components.length === 0) {
      warnings.push(createWarning('decompose_empty', 'The decomposition step returned no components.'))
    }

    const response: DecomposeResponse = {
      normalizedIdea: mergedNormalizedIdea,
      capabilities: mergedNormalizedIdea.capabilities,
      components: validated.components,
      warnings,
    }

    await writeTraceArtifact('decompose', {
      idea,
      normalizedIdea: mergedNormalizedIdea,
      scoutVerdict,
      components: validated.components,
      warnings,
    })

    return NextResponse.json(response)
  } catch (err) {
    console.error('decompose error:', err)
    return NextResponse.json({ error: 'Failed to decompose idea' }, { status: 500 })
  }
}
