import { NextRequest, NextResponse } from 'next/server'
import { searchComponents } from '@/lib/github'
import { Component } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { components, githubToken }: { components: Component[]; githubToken?: string } = await req.json()

  try {
    const results = await searchComponents(components, githubToken)
    return NextResponse.json({ results })
  } catch (err) {
    console.error('search error:', err)
    return NextResponse.json({ error: 'Failed to search GitHub' }, { status: 500 })
  }
}
