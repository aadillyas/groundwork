'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import AccessGate from '@/components/AccessGate'
import HeroSection from '@/components/landing/HeroSection'
import FeatureWalkthrough from '@/components/landing/FeatureWalkthrough'
import ScoreShowcase from '@/components/landing/ScoreShowcase'
import WhySection from '@/components/landing/WhySection'
import AboutSection from '@/components/landing/AboutSection'
import PricingSection from '@/components/landing/PricingSection'
import { AnalysisPhase, AnalysisState } from '@/lib/types'
import { DEMO_RESULT } from '@/lib/demo'
import { canRunAnalysis, recordAnalysis, getBYOKKeys, getUsageState } from '@/lib/access'
import siteConfig from '@/site.config'

const DEMO_PHASE_DELAYS: { phase: AnalysisPhase; ms: number }[] = [
  { phase: 'scouting', ms: 2000 },
  { phase: 'decomposing', ms: 2500 },
  { phase: 'searching', ms: 4000 },
  { phase: 'synthesising', ms: 3000 },
]

const NAV_LINKS = [
  { label: 'Why I built this', href: '#why' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
]

export default function HomePage() {
  const router = useRouter()

  const [phase, setPhase] = useState<AnalysisPhase>('idle')
  const [demoTyping, setDemoTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gateOpen, setGateOpen] = useState(false)
  const [pendingIdea, setPendingIdea] = useState<string | null>(null)
  // True when the free tier has been used today — shows a soft nudge, never blocks
  const [usedFreeTier, setUsedFreeTier] = useState(false)

  useEffect(() => {
    const usage = getUsageState()
    setUsedFreeTier(usage.tier === 'free' && !canRunAnalysis())
  }, [])

  // Scroll reveal observer
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  async function runDemo() {
    setError(null)
    await new Promise(r => setTimeout(r, 800))
    for (const { phase: p, ms } of DEMO_PHASE_DELAYS) {
      setPhase(p)
      await new Promise(r => setTimeout(r, ms))
    }
    setPhase('complete')
    sessionStorage.setItem('groundwork_result', JSON.stringify(DEMO_RESULT))
    router.push('/analyse')
  }

  function startDemo() {
    setDemoTyping(true)
  }

  function onTypingComplete() {
    setDemoTyping(false)
    runDemo()
  }

  async function runAnalysis(idea: string) {
    if (!canRunAnalysis()) {
      setPendingIdea(idea)
      setGateOpen(true)
      return
    }

    setError(null)
    const state: AnalysisState = { phase: 'idle', idea }
    const { apiKey, provider, model, githubToken } = getBYOKKeys()

    try {
      // Step 1: Scout — search for a complete existing solution first
      setPhase('scouting')
      const scoutRes = await fetch('/api/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, apiKey, provider, model, githubToken }),
      })
      if (!scoutRes.ok) throw new Error('Failed to scout for existing solutions')
      const scout = await scoutRes.json()
      state.scout = scout

      // If a complete solution exists, skip decompose+search and go straight to synthesise
      // with a stub component result so the results page renders correctly
      if (scout.verdict === 'exists') {
        const stubResults = [{ component: idea, repos: scout.repos.slice(0, 5) }]
        state.decompose = { components: [{ name: idea, description: 'Complete solution found — no decomposition needed.', searchQueries: [] }] }
        state.search = { results: stubResults }

        setPhase('synthesising')
        const synthesiseRes = await fetch('/api/synthesise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idea,
            normalizedIdea: scout.normalizedIdea,
            components: state.decompose.components,
            results: stubResults,
            retrievalEvidence: [{
              component: idea,
              topRepos: scout.repos.slice(0, 5),
              queries: scout.queryFamilies ?? [],
              coverageScore: scout.wholeProductCoverage?.bestScore ?? 0,
              confidence: scout.confidence?.overall ?? 0.5,
            }],
            scoutRepos: scout.repos,
            scoutVerdict: scout.verdict,
            apiKey,
            provider,
            model,
          }),
        })
        if (!synthesiseRes.ok) throw new Error('Failed to synthesise results')
        state.synthesise = await synthesiseRes.json()

        state.phase = 'complete'
        recordAnalysis()
        sessionStorage.setItem('groundwork_result', JSON.stringify(state))
        router.push('/analyse')
        return
      }

      // Step 2: Decompose — LLM judges complexity given scout context
      setPhase('decomposing')
      const decomposeRes = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, normalizedIdea: scout.normalizedIdea, scoutVerdict: scout.verdict, apiKey, provider, model }),
      })
      if (!decomposeRes.ok) throw new Error('Failed to decompose idea')
      const decompose = await decomposeRes.json()
      state.decompose = decompose

      // Step 3: Search per component
      setPhase('searching')
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: decompose.components, githubToken }),
      })
      if (!searchRes.ok) throw new Error('Failed to search GitHub')
      const search = await searchRes.json()
      state.search = search

      // Step 4: Synthesise with both scout + component results
      setPhase('synthesising')
      const synthesiseRes = await fetch('/api/synthesise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          normalizedIdea: decompose.normalizedIdea ?? scout.normalizedIdea,
          components: decompose.components,
          results: search.results,
          retrievalEvidence: search.evidence,
          scoutRepos: scout.repos,
          scoutVerdict: scout.verdict,
          apiKey,
          provider,
          model,
        }),
      })
      if (!synthesiseRes.ok) throw new Error('Failed to synthesise results')
      const synthesise = await synthesiseRes.json()
      state.synthesise = synthesise

      state.phase = 'complete'
      recordAnalysis()
      sessionStorage.setItem('groundwork_result', JSON.stringify(state))
      router.push('/analyse')
    } catch (err: any) {
      setPhase('idle')
      setError(err.message ?? 'Something went wrong')
    }
  }

  function handleGateUnlocked() {
    setGateOpen(false)
    if (pendingIdea) {
      setPendingIdea(null)
      runAnalysis(pendingIdea)
    }
  }

  const isBusy = phase !== 'idle' || demoTyping

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">

      {gateOpen && (
        <AccessGate
          onUnlocked={handleGateUnlocked}
          onClose={() => { setGateOpen(false); setPendingIdea(null) }}
        />
      )}

      {/* Nav */}
      <nav className="flex-none sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
          <a href="#home" className="font-display font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex-none">
            Groundwork
          </a>

          {/* Section anchors — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <ThemeToggle />
        </div>
      </nav>

      {/* Hero — owns the input, CTA, progress, and demo */}
      <div className="dot-grid">
        <HeroSection
          onSubmit={runAnalysis}
          onDemo={startDemo}
          busy={isBusy}
          phase={phase}
          demoTyping={demoTyping}
          onTypingComplete={onTypingComplete}
          error={error}
          usedFreeTier={usedFreeTier}
        />
      </div>

      {/* Why I built this */}
      <WhySection />

      {/* Feature walkthrough */}
      <div id="how-it-works" className="scroll-mt-16">
        <FeatureWalkthrough />
      </div>

      {/* Score showcase */}
      <ScoreShowcase />

      {/* Pricing */}
      <PricingSection onTryFree={() => {
        document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })
      }} />

      {/* About */}
      <AboutSection />

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-10 text-center flex flex-col items-center gap-3">
        <span className="font-display font-bold text-zinc-400 dark:text-zinc-600 tracking-tight">Groundwork</span>
        <p className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">
          Find out what exists before you build &mdash; by&nbsp;
          <a href={siteConfig.author.links.website} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors underline underline-offset-2">
            {siteConfig.author.name}
          </a>
        </p>
      </footer>

    </div>
  )
}
