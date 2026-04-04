'use client'

import { AnalysisPhase } from '@/lib/types'

const PHASES: { phase: AnalysisPhase; label: string; detail: string }[] = [
  { phase: 'scouting', label: 'Scouting', detail: 'Searching for existing solutions' },
  { phase: 'decomposing', label: 'Decomposing', detail: 'Breaking your idea into components' },
  { phase: 'searching', label: 'Searching GitHub', detail: 'Finding relevant OSS repos' },
  { phase: 'synthesising', label: 'Synthesising', detail: 'Building your recommendation' },
]

const PHASE_ORDER: AnalysisPhase[] = ['scouting', 'decomposing', 'searching', 'synthesising', 'complete']

interface ProgressTrackerProps {
  phase: AnalysisPhase
}

export default function ProgressTracker({ phase }: ProgressTrackerProps) {
  const currentIndex = PHASE_ORDER.indexOf(phase)

  return (
    <div className="flex items-start gap-0 w-full max-w-xl">
      {PHASES.map(({ phase: p, label, detail }, i) => {
        const isDone = currentIndex > i + 1 || phase === 'complete'
        const isActive = PHASE_ORDER[currentIndex] === p
        const isPending = !isDone && !isActive

        return (
          <div key={p} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full border text-xs font-mono transition-all ${
                isDone
                  ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-zinc-100 dark:text-zinc-900'
                  : isActive
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 bg-transparent'
              }`}>
                {isDone ? (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : isActive ? (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                ) : (
                  <span>{String(i + 1).padStart(2, '0')}</span>
                )}
              </div>
              <div className="text-center px-1">
                <div className={`text-xs font-medium ${
                  isPending ? 'text-zinc-400 dark:text-zinc-600' : isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'
                }`}>
                  {label}
                </div>
                {isActive && (
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{detail}</div>
                )}
              </div>
            </div>

            {i < PHASES.length - 1 && (
              <div className={`h-px w-8 flex-none mt-[-20px] transition-colors ${
                isDone ? 'bg-zinc-400 dark:bg-zinc-500' : 'bg-zinc-200 dark:bg-zinc-800'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
