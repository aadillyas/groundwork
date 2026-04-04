import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'
import { DecomposeResponse, ExistenceVerdict } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { idea, scoutVerdict, geminiKey }: { idea: string; scoutVerdict?: ExistenceVerdict; geminiKey?: string } = await req.json()

  const prompt = `You are a senior software engineer doing pre-build OSS research. A founder wants to build: "${idea}"

${scoutVerdict === 'partial' ? 'Note: a partial open source solution exists, so focus components on what is genuinely missing or custom.' : ''}

Break this idea into independent technical components. Use your judgment on complexity:
- Simple, focused tools (a CLI util, a menu bar app, a single-purpose bot): 1-2 components
- Moderately complex (a dashboard, a sync tool, a multi-step pipeline): 2-3 components
- Complex systems (a platform, a multi-service app, something with auth + data + UI + integrations): 3-5 components

Do not pad. If the whole idea maps to one component, use one. Only split when components are genuinely independent and would each warrant their own search.

For each component, generate exactly 2 targeted GitHub search queries that a senior engineer would actually use — specific, semantic, tool-aware. Not generic keywords.

Good query examples for "a tool to extract structured data from PDFs":
- "pdf table extraction typescript"
- "unstructured document parsing llm"

Bad query examples:
- "pdf extraction"
- "data extraction tool"

Respond in pure JSON with no markdown fences. Format:
{
  "components": [
    {
      "name": "Component Name",
      "description": "One sentence: what this component does and why it matters.",
      "searchQueries": ["specific query one", "specific query two"]
    }
  ]
}`

  try {
    const raw = await callLLM(prompt, geminiKey)
    const parsed: DecomposeResponse = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('decompose error:', err)
    return NextResponse.json({ error: 'Failed to decompose idea' }, { status: 500 })
  }
}
