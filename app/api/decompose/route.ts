import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'
import { DecomposeResponse } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { idea, geminiKey }: { idea: string; geminiKey?: string } = await req.json()

  const prompt = `You are a senior software engineer doing pre-build OSS research. A founder wants to build: "${idea}"

Break this idea into 4-6 independent technical components. For each component, generate exactly 2 targeted GitHub search queries that a senior engineer would actually use — specific, semantic, tool-aware. Not generic keywords.

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
