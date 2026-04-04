'use client'

import { useState } from 'react'
import { SynthesiseResponse } from '@/lib/types'

const VERDICT_CONFIG = {
  exists: { label: 'Already exists', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900' },
  partial: { label: 'Partially exists', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' },
  gap: { label: 'Clear gap in the market', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900' },
}

const STRATEGY_LABELS = {
  'build-from-scratch': 'Build from scratch',
  'fork-one': 'Fork one repo',
  'combine-multiple': 'Combine multiple',
}

// Truncate to first N sentences
function truncateSentences(text: string, n: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text]
  return sentences.slice(0, n).join(' ').trim()
}

interface StrategyPanelProps {
  synthesise: SynthesiseResponse
}

export default function StrategyPanel({ synthesise }: StrategyPanelProps) {
  const [gapOpen, setGapOpen] = useState(false)
  const { existenceCheck, gapAnalysis, strategy } = synthesise
  const verdict = VERDICT_CONFIG[existenceCheck.verdict]

  // Split gap analysis into bullet points on sentence boundaries
  const gapPoints = (gapAnalysis.match(/[^.!?]+[.!?]+/g) ?? [gapAnalysis]).slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        Our recommendation
      </div>

      {/* Verdict */}
      <div className={`border rounded-xl px-4 py-4 ${verdict.bg}`}>
        <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${verdict.color}`}>
          {verdict.label}
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {truncateSentences(existenceCheck.summary, 2)}
        </p>
      </div>

      {/* Strategy */}
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">Strategy</div>
        <div className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          {STRATEGY_LABELS[strategy.recommendation]}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed">
          {truncateSentences(strategy.reasoning, 2)}
        </p>
      </div>

      {/* Recommended repos as pill chips */}
      {strategy.repos.length > 0 && (
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">Use these repos</div>
          <div className="flex flex-wrap gap-2">
            {strategy.repos.map(fullName => (
              <a
                key={fullName}
                href={`https://github.com/${fullName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-mono hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-none" />
                {fullName.split('/')[1]}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Gap analysis — collapsible, rendered as checklist bullets */}
      <div>
        <button
          onClick={() => setGapOpen(o => !o)}
          className="flex items-center gap-2 w-full text-left group"
        >
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            className={`flex-none transition-transform duration-200 ${gapOpen ? 'rotate-90' : ''} text-zinc-400 dark:text-zinc-600`}
          >
            <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
            Gap analysis
          </span>
        </button>

        {gapOpen && (
          <div className="mt-3 flex flex-col gap-2 pl-4">
            {gapPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-none mt-0.5 text-zinc-400 dark:text-zinc-600">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4.5 7L6 8.5L9.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">{point.trim()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
