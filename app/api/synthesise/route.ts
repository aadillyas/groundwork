import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'
import { ComponentResult, Repo, SynthesiseResponse } from '@/lib/types'

export async function POST(req: NextRequest) {
  const {
    idea,
    results,
    scoutRepos,
    scoutVerdict,
    geminiKey,
  }: {
    idea: string
    results: ComponentResult[]
    scoutRepos?: Repo[]
    scoutVerdict?: string
    geminiKey?: string
  } = await req.json()

  const componentNames = results.map(r => r.component)

  const repoSummary = results
    .map(r => {
      const repos = r.repos.length > 0
        ? r.repos.map(repo => `    - ${repo.fullName} (${repo.stars.toLocaleString()} stars, last commit ${repo.lastCommit.slice(0, 10)}, ${repo.license ?? 'no license'}) — ${repo.description}`).join('\n')
        : '    (no repos found)'
      return `  ${r.component}:\n${repos}`
    })
    .join('\n\n')

  const scoutSection = scoutRepos && scoutRepos.length > 0
    ? `\nComplete-product search results (repos that may already do the whole job):\n${scoutRepos.map(r => `  - ${r.fullName} (${r.stars.toLocaleString()} stars, last commit ${r.lastCommit.slice(0, 10)}) — ${r.description}`).join('\n')}\nInitial scout verdict: ${scoutVerdict ?? 'unknown'}\n`
    : ''

  const prompt = `You are an expert technical advisor helping a founder decide whether to build, fork, or combine existing OSS for their idea.

Idea: "${idea}"
${scoutSection}
GitHub search results by component:
${repoSummary}

Produce an opinionated analysis. Be direct. Tell the founder exactly what to do.

If a complete product already exists in the scout results, the existenceCheck verdict must be "exists" and the strategy should be "fork-one" pointing at that repo — do not recommend rebuilding what already exists.

For each component, decide:
- "use": a strong OSS library exists (well-maintained, >500 stars, active commits). Tell them which one and why.
- "build": nothing good enough exists, or the component is the core IP. Tell them what to build and where it should live.

Respond in pure JSON with no markdown fences. Format:
{
  "existenceCheck": {
    "verdict": "exists" | "partial" | "gap",
    "summary": "2-3 sentences max. Does this idea already exist as a complete solution? Name the specific repo if so."
  },
  "gapAnalysis": "3-5 sentences. What is genuinely missing? Be specific.",
  "strategy": {
    "recommendation": "build-from-scratch" | "fork-one" | "combine-multiple",
    "reasoning": "2-3 sentences. Which repos to use, what to build custom, where the differentiation is.",
    "repos": ["owner/repo"]
  },
  "componentStrategies": [
    {
      "name": "exact component name from the list",
      "action": "use" | "build",
      "reason": "One sentence. Why use this library, or why build it yourself.",
      "suggestedPath": "src/folder/file.ext (only include if action is build)"
    }
  ],
  "scores": {
    "originality": {
      "score": 72,
      "label": "Novel"
    },
    "reliance": {
      "score": 85,
      "label": "Mostly OSS"
    },
    "buildability": {
      "score": 68,
      "label": "Ship in weeks"
    }
  },
  "exportMarkdown": "A planner agent bootstrap file. Structure it exactly like this:\\n\\n---\\nidea: ${idea}\\nstrategy: [recommendation]\\n---\\n\\n## Agent Instructions\\nYou are a senior engineer bootstrapping a new project. Read this file carefully. Clone the repos listed below, create the scaffold structure, and build the components marked as 'build'. Do not reinvent components marked as 'use' — integrate the cloned repos instead.\\n\\n## Clone These Repos\\n\`\`\`bash\\n[git clone commands for each recommended repo]\\n\`\`\`\\n\\n## Project Scaffold\\n\`\`\`\\n[directory tree showing which folder uses which repo or custom build]\\n\`\`\`\\n\\n## Components: Use vs Build\\n[For each component: name, action (USE/BUILD), reason, path if building]\\n\\n## Build Instructions\\n[For each BUILD component: what it receives as input, what it outputs, where it lives, key implementation notes]\\n\\n## Open Questions\\n[3-5 questions the founder must answer before starting, e.g. self-host vs API, target latency, etc.]"
}

The componentStrategies array must include exactly these components in this order: ${componentNames.map(n => `"${n}"`).join(', ')}

For the scores, reason as follows before producing the numbers:
- originality: How novel is the idea vs what already exists fully built? 0 = already fully solved, 100 = genuinely pioneering. Labels: 0-39 = "Crowded space", 40-59 = "Iterative", 60-79 = "Novel", 80-100 = "Pioneering"
- reliance: What fraction of the build can use existing OSS repos rather than custom code? 0 = build everything, 100 = almost entirely assembly. Labels: 0-39 = "Build everything", 40-59 = "Half custom", 60-79 = "Mostly OSS", 80-100 = "Plug-and-play"
- buildability: Overall ease of shipping this idea given the above two factors. Labels: 0-39 = "Hard slog", 40-59 = "Ship in months", 60-79 = "Ship in weeks", 80-100 = "Ship in days"

Produce integer scores only. Use the label that matches the score range exactly.`

  try {
    const raw = await callLLM(prompt, geminiKey)
    const parsed: SynthesiseResponse = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('synthesise error:', err)
    return NextResponse.json({ error: 'Failed to synthesise results' }, { status: 500 })
  }
}
