'use client'

import { useState } from 'react'
import IdeaInput from '@/components/IdeaInput'
import ProgressTracker from '@/components/ProgressTracker'
import { AnalysisPhase } from '@/lib/types'
import { DEMO_IDEA } from '@/lib/demo'

function AnalysisCounter() {
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-600 font-mono reveal">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Join 50+ builders who checked what existed before building
    </div>
  )
}

interface HeroSectionProps {
  onSubmit: (idea: string) => void
  onDemo: () => void
  busy: boolean
  phase: AnalysisPhase
  demoTyping: boolean
  onTypingComplete: () => void
  error: string | null
  usedFreeTier?: boolean
}

export default function HeroSection({ onSubmit, onDemo, busy, phase, demoTyping, onTypingComplete, error, usedFreeTier }: HeroSectionProps) {
  const [inputVisible, setInputVisible] = useState(false)

  function handleAnalyseClick() {
    setInputVisible(true)
    // Give the DOM a tick to render before scrolling
    setTimeout(() => {
      document.getElementById('hero-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      document.getElementById('hero-textarea')?.focus()
    }, 50)
  }

  function handleDemo() {
    setInputVisible(true)
    setTimeout(() => onDemo(), 100)
  }

  const isAnalysing = phase !== 'idle'

  return (
    <section id="home" className="w-full max-w-4xl mx-auto px-6 pt-24 pb-16 flex flex-col items-center text-center gap-10 scroll-mt-16">

      {/* Eyebrow */}
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 reveal">
        Free &middot; No sign-up &middot; Results in under 30 seconds
      </span>

      {/* Headline */}
      <div className="flex flex-col gap-5 reveal">
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 dark:text-zinc-100 leading-[1.05] tracking-tight">
          Before you build anything,<br />
          <span className="text-indigo-500">find out what&rsquo;s already out there.</span>
        </h1>
        <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          Describe your idea in plain English. Groundwork breaks it down, searches GitHub, and tells you what already exists, what you can reuse, and what&rsquo;s actually yours to build.
        </p>
      </div>

      {/* Pain points */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-sm text-zinc-400 dark:text-zinc-600 reveal">
        {[
          'Had an idea but weren\'t sure if it exists?',
          'Opened GitHub and didn\'t know where to start?',
          'Want to know what to build vs. what to just use?',
        ].map((pain, i, arr) => (
          <span key={pain} className="flex items-center gap-3">
            <span>{pain}</span>
            {i < arr.length - 1 && <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">/</span>}
          </span>
        ))}
      </div>

      {/* Soft prompt — shown when free tier has been used today, never blocks */}
      {usedFreeTier && !inputVisible && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 max-w-md text-center animate-fade-slide-in">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-none mt-0.5 text-amber-500">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span>
            You&rsquo;ve used today&rsquo;s free analysis. Come back tomorrow — or{' '}
            <button
              onClick={handleAnalyseClick}
              className="underline underline-offset-2 font-medium hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
            >
              add your own API keys
            </button>
            {' '}for unlimited use.
          </span>
        </div>
      )}

      {/* CTAs — shown when input is hidden */}
      {!inputVisible && (
        <div className="flex flex-col sm:flex-row items-center gap-3 reveal">
          <button
            onClick={handleAnalyseClick}
            disabled={busy}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            Analyse my idea &rarr;
          </button>
          <button
            onClick={handleDemo}
            disabled={busy}
            className="px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm transition-colors border border-zinc-200 dark:border-zinc-800 disabled:opacity-50"
          >
            See it in action
          </button>
        </div>
      )}

      {/* Inline input — slides in when CTA is clicked */}
      {inputVisible && (
        <div
          id="hero-input"
          className="w-full max-w-xl flex flex-col gap-4 animate-fade-slide-in"
        >
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm dark:shadow-none text-left">
            <IdeaInput
              onSubmit={onSubmit}
              onDemo={handleDemo}
              disabled={busy}
              simulateText={demoTyping ? DEMO_IDEA : undefined}
              onTypingComplete={onTypingComplete}
              textareaId="hero-textarea"
            />
          </div>

          {isAnalysing && (
            <div className="flex flex-col gap-4 px-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <p className="text-sm text-zinc-500">Analysing your idea&hellip;</p>
              </div>
              <ProgressTracker phase={phase} />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 bg-red-50 dark:bg-transparent text-left">
              {error}
            </div>
          )}

          {!busy && (
            <p className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">
              Uses GitHub search + routed LLM &middot; 1 free analysis per day
            </p>
          )}
        </div>
      )}

      {/* Usage counter */}
      <AnalysisCounter />

    </section>
  )
}
