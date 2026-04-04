'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnalysisState, ComponentAction, ComponentStrategy } from '@/lib/types'
import ComponentDetail from '@/components/ComponentDetail'
import ExportButton from '@/components/ExportButton'
import ThemeToggle from '@/components/ThemeToggle'
import ScoreBar from '@/components/ScoreBar'

// ─── Shared config ────────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  exists: { label: 'Already exists', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900' },
  partial: { label: 'Partially exists', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' },
  gap: { label: 'Clear gap in the market', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900' },
}

const STRATEGY_LABELS = {
  'build-from-scratch': 'Build from scratch',
  'fork-one': 'Fork one repo',
  'combine-multiple': 'Combine multiple repos',
}

const ACTION_BAR: Record<ComponentAction, string> = {
  use: 'bg-emerald-500',
  build: 'bg-amber-500',
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">
        Step {n} of 4 — {label}
      </p>
    </div>
  )
}

function ContinueButton({ onClick, label = 'Continue →' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-900/20 animate-fade-slide-in"
    >
      {label}
    </button>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-none text-zinc-400 dark:text-zinc-600 mt-0.5">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 7L6 8.5L9.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnalysePage() {
  const router = useRouter()
  const [state, setState] = useState<AnalysisState | null>(null)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [componentIndex, setComponentIndex] = useState(0)
  const [visibleNodeCount, setVisibleNodeCount] = useState(0)
  const [scoresRevealed, setScoresRevealed] = useState(false)

  // Load from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('groundwork_result')
    if (!raw) { router.replace('/'); return }
    try {
      setState(JSON.parse(raw))
    } catch {
      router.replace('/')
    }
  }, [router])

  // Step 1 — stagger component nodes in one at a time
  useEffect(() => {
    if (step !== 1 || !state?.decompose) return
    setVisibleNodeCount(0)
    const total = state.decompose.components.length
    let count = 0
    const interval = setInterval(() => {
      count += 1
      setVisibleNodeCount(count)
      if (count >= total) clearInterval(interval)
    }, 160)
    return () => clearInterval(interval)
  }, [step, state])

  // Step 3 — trigger score ring animation after paint
  useEffect(() => {
    if (step !== 3) return
    setScoresRevealed(false)
    const t = setTimeout(() => setScoresRevealed(true), 80)
    return () => clearTimeout(t)
  }, [step])

  if (!state || !state.decompose || !state.search || !state.synthesise) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm font-mono">Loading…</div>
      </div>
    )
  }

  const { idea, decompose, search, synthesise } = state
  const recommendedSet = new Set(synthesise.strategy.repos)

  const strategyByComponent: Record<string, ComponentStrategy> = {}
  for (const cs of synthesise.componentStrategies ?? []) {
    strategyByComponent[cs.name] = cs
  }

  const componentData = decompose.components.map(comp => ({
    component: comp,
    repos: search.results.find(r => r.component === comp.name)?.repos ?? [],
    strategy: strategyByComponent[comp.name],
  }))

  const selected = componentData[componentIndex]
  const verdict = VERDICT_CONFIG[synthesise.existenceCheck.verdict]
  const gapPoints = (synthesise.gapAnalysis.match(/[^.!?]+[.!?]+/g) ?? [synthesise.gapAnalysis]).slice(0, 5)

  function goToStep(n: 1 | 2 | 3 | 4) {
    setComponentIndex(0)
    setStep(n)
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">

      {/* Header */}
      <header className="flex-none sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="font-mono text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors flex-none"
          >
            ← New analysis
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{idea}</p>
          </div>
          {/* Step progress pills */}
          <div className="hidden sm:flex items-center gap-1.5 flex-none">
            {([1, 2, 3, 4] as const).map(n => (
              <div
                key={n}
                className={`rounded-full transition-all duration-300 ${
                  n === step
                    ? 'w-6 h-2 bg-indigo-500'
                    : n < step
                    ? 'w-2 h-2 bg-indigo-300 dark:bg-indigo-700'
                    : 'w-2 h-2 bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            ))}
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Step 1: Decomposition ──────────────────────────────────────────── */}
      {step === 1 && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-12">
          <div className="text-center animate-fade-slide-in flex flex-col gap-3">
            <StepLabel n={1} label="Decomposition" />
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Your idea breaks into<br />{decompose.components.length} components
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Each component maps to a distinct concern — something that needs to be either found in the wild or built from scratch.
            </p>
          </div>

          {/* Staggered node pipeline */}
          <div className="w-full max-w-5xl overflow-x-auto">
            <div className="flex items-stretch min-w-max gap-0 mx-auto px-2">
              {decompose.components.map((comp, i) => {
                const action = componentData[i].strategy?.action
                const isVisible = i < visibleNodeCount
                return (
                  <div key={comp.name} className="flex items-center">
                    <div className={`transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                      <div className="relative flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden w-44 shadow-sm">
                        {action && <div className={`h-1 w-full ${ACTION_BAR[action]}`} />}
                        <div className="px-4 pt-3 pb-4 flex flex-col gap-2">
                          <span className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                            {comp.name}
                          </span>
                          {action && (
                            <span className={`text-xs font-semibold ${action === 'use' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {action === 'use' ? 'USE' : 'BUILD'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {i < decompose.components.length - 1 && (
                      <div className={`flex items-center w-8 flex-none transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-zinc-300 dark:border-l-zinc-600" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {visibleNodeCount >= decompose.components.length && (
            <ContinueButton onClick={() => goToStep(2)} />
          )}
        </main>
      )}

      {/* ── Step 2: Component Research ────────────────────────────────────── */}
      {step === 2 && (
        <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 max-w-3xl mx-auto w-full">
          <div className="w-full flex flex-col gap-4 animate-fade-slide-in">
            <div className="flex items-center justify-between">
              <StepLabel n={2} label="Component Research" />
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
                {componentIndex + 1} of {componentData.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-400"
                style={{ width: `${((componentIndex + 1) / componentData.length) * 100}%` }}
              />
            </div>

            {/* Dot nav */}
            <div className="flex items-center gap-2">
              {componentData.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setComponentIndex(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === componentIndex
                      ? 'w-5 h-2 bg-indigo-500'
                      : i < componentIndex
                      ? 'w-2 h-2 bg-indigo-300 dark:bg-indigo-700'
                      : 'w-2 h-2 bg-zinc-200 dark:bg-zinc-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Component detail — key forces remount + re-animation on change */}
          <div key={componentIndex} className="w-full animate-fade-slide-in">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-8 py-8 shadow-sm dark:shadow-none">
              <ComponentDetail
                component={selected.component}
                repos={selected.repos}
                recommendedRepos={recommendedSet}
                strategy={selected.strategy}
              />
            </div>
          </div>

          {/* Prev / Next / Continue */}
          <div className="w-full flex items-center justify-between gap-4">
            <button
              onClick={() => setComponentIndex(i => i - 1)}
              disabled={componentIndex === 0}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            {componentIndex < componentData.length - 1 ? (
              <button
                onClick={() => setComponentIndex(i => i + 1)}
                className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                Next →
              </button>
            ) : (
              <ContinueButton onClick={() => goToStep(3)} label="See the scores →" />
            )}
          </div>
        </main>
      )}

      {/* ── Step 3: Scoring ───────────────────────────────────────────────── */}
      {step === 3 && (
        <main className="flex-1 flex flex-col items-center px-6 py-16 gap-10 max-w-3xl mx-auto w-full">
          <div className="text-center animate-fade-slide-in flex flex-col gap-3">
            <StepLabel n={3} label="Scoring" />
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Here&rsquo;s how your idea scores
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Based on what exists in the OSS ecosystem today and the complexity of what&rsquo;s left to build.
            </p>
          </div>

          {/* Animated score rings */}
          {synthesise.scores && (
            <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-8 py-10 shadow-sm dark:shadow-none flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 animate-fade-slide-in">
              <ScoreBar title="Originality" entry={synthesise.scores.originality} size="lg" animated revealed={scoresRevealed} revealDelay={0} />
              <div className="w-px sm:self-stretch h-px sm:h-auto w-full sm:w-px bg-zinc-100 dark:bg-zinc-800" />
              <ScoreBar title="Reliance on OSS" entry={synthesise.scores.reliance} size="lg" animated revealed={scoresRevealed} revealDelay={350} />
              <div className="w-px sm:self-stretch h-px sm:h-auto w-full sm:w-px bg-zinc-100 dark:bg-zinc-800" />
              <ScoreBar title="Buildability" entry={synthesise.scores.buildability} size="lg" animated revealed={scoresRevealed} revealDelay={700} />
            </div>
          )}

          {/* Verdict + strategy card */}
          <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-8 py-8 shadow-sm dark:shadow-none flex flex-col gap-6 animate-fade-slide-in">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Our read</p>

            <div className={`border rounded-xl px-4 py-4 ${verdict.bg}`}>
              <div className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${verdict.color}`}>{verdict.label}</div>
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{synthesise.existenceCheck.summary}</p>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">Strategy</p>
              <div className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                {STRATEGY_LABELS[synthesise.strategy.recommendation]}
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{synthesise.strategy.reasoning}</p>
            </div>

            {gapPoints.length > 0 && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">Gap analysis</p>
                {gapPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckIcon />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{point.trim()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ContinueButton onClick={() => goToStep(4)} label="See your build plan →" />
        </main>
      )}

      {/* ── Step 4: Export ────────────────────────────────────────────────── */}
      {step === 4 && (
        <main className="flex-1 flex flex-col items-center px-6 py-16 gap-10 max-w-2xl mx-auto w-full">

          {/* Hero */}
          <div className="text-center animate-fade-slide-in flex flex-col gap-4">
            <StepLabel n={4} label="Your build plan" />
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 leading-[1.05]">
              Your Groundwork<br />is done.
            </h1>
            <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              You know what exists, what to build, and where to start. Here&rsquo;s your bootstrap file.
            </p>
          </div>

          {/* Primary CTA */}
          <div className="flex flex-col items-center gap-2 animate-fade-slide-in">
            <ExportButton markdown={synthesise.exportMarkdown} />
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
              Clone commands, scaffold &amp; build instructions inside
            </p>
          </div>

          {/* How to use it */}
          <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-8 py-8 shadow-sm dark:shadow-none animate-fade-slide-in">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-6">How to use it</p>
            <div className="flex flex-col gap-6">
              {[
                {
                  n: 1,
                  active: true,
                  title: 'Download GROUNDWORK.md',
                  body: 'The file contains clone commands, scaffold structure, USE vs BUILD decisions per component, and implementation notes.',
                  extra: null,
                },
                {
                  n: 2,
                  active: false,
                  title: 'Create a project folder and drop the file in',
                  body: null,
                  extra: (
                    <code className="text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg block">
                      mkdir my-project && mv GROUNDWORK.md my-project/
                    </code>
                  ),
                },
                {
                  n: 3,
                  active: false,
                  title: 'Open your AI agent and say:',
                  body: null,
                  extra: (
                    <div className="flex flex-col gap-1.5">
                      <code className="block text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-4 py-3 rounded-xl leading-relaxed">
                        &ldquo;Read GROUNDWORK.md and start building&rdquo;
                      </code>
                      <p className="text-xs text-zinc-400 dark:text-zinc-600">
                        Works with Claude Code, Cursor, Copilot Workspace, or any agent that reads files.
                      </p>
                    </div>
                  ),
                },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-4">
                  <div className={`flex-none w-8 h-8 rounded-xl flex items-center justify-center font-mono text-sm font-bold ${s.active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                    {s.n}
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.title}</div>
                    {s.body && <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{s.body}</p>}
                    {s.extra}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score summary — compact */}
          {synthesise.scores && (
            <div className="w-full bg-zinc-50 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-8 py-6 flex flex-col gap-4 animate-fade-slide-in">
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Score summary</p>
              <div className="flex items-center gap-6 sm:gap-10">
                <ScoreBar title="Originality" entry={synthesise.scores.originality} size="sm" />
                <div className="w-px self-stretch bg-zinc-200 dark:bg-zinc-800" />
                <ScoreBar title="Reliance" entry={synthesise.scores.reliance} size="sm" />
                <div className="w-px self-stretch bg-zinc-200 dark:bg-zinc-800" />
                <ScoreBar title="Buildability" entry={synthesise.scores.buildability} size="sm" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-4">
                {synthesise.existenceCheck.summary}
              </p>
            </div>
          )}

          <button
            onClick={() => router.push('/')}
            className="text-xs font-mono text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors underline underline-offset-2"
          >
            ← Analyse a different idea
          </button>

        </main>
      )}

    </div>
  )
}
