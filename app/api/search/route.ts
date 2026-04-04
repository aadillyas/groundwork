import { NextRequest, NextResponse } from 'next/server'
import { searchComponents } from '@/lib/github'
import { Component } from '@/lib/types'
import { writeTraceArtifact } from '@/lib/tracing'

export async function POST(req: NextRequest) {
  const { components, githubToken }: { components: Component[]; githubToken?: string } = await req.json()

  try {
    const { results, evidence } = await searchComponents(components, githubToken)
    const warnings = results
      .filter(result => result.repos.length === 0)
      .map(result => ({
        code: 'search_empty_component',
        message: `No strong GitHub matches found for ${result.component}.`,
      }))

    await writeTraceArtifact('search', {
      components,
      evidence,
      warnings,
    })

    return NextResponse.json({ results, evidence, warnings })
  } catch (err) {
    console.error('search error:', err)
    return NextResponse.json({ error: 'Failed to search GitHub' }, { status: 500 })
  }
}
