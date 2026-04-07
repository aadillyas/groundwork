'use client'

import { useState } from 'react'

import siteConfig from '@/site.config'
const REPO_URL = siteConfig.repoUrl

interface PricingSectionProps {
  onTryFree: () => void
}

export default function PricingSection({ onTryFree }: PricingSectionProps) {
  const [forkExpanded, setForkExpanded] = useState(false)
  const [interestEmail, setInterestEmail] = useState('')
  const [interestSent, setInterestSent] = useState(false)

  function handleInterest(e: React.FormEvent) {
    e.preventDefault()
    // In Sprint 5 this will post to an endpoint. For now just mark as sent.
    setInterestSent(true)
  }

  return (
    <section id="pricing" className="w-full max-w-4xl mx-auto px-6 py-20 scroll-mt-16">
      <div className="text-center mb-12 reveal">
        <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">Pricing</div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Simple and honest
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-sm max-w-md mx-auto">
          Groundwork is open in spirit. Use it for free with your own compute. Subscribe only if you don&rsquo;t want the hassle.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 reveal">

        {/* ── Tier 1: Try it out ── */}
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">Try it out</div>
            <div className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Free</div>
            <div className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">Zero friction. No account, ever.</div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
            Jump straight in. No login, no API keys, no setup. One free analysis per day — come back tomorrow for another.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            {['1 analysis per day', 'Full results & export', 'No sign-up required'].map(f => (
              <li key={f} className="flex items-center gap-2"><CheckIcon />{f}</li>
            ))}
          </ul>
          <button
            onClick={onTryFree}
            className="mt-auto w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Try it now →
          </button>
        </div>

        {/* ── Tier 2: Open spirit / Fork it ── */}
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">Open spirit</div>
            <div className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">Free</div>
            <div className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">Your compute, your keys.</div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
            This isn&rsquo;t a closed platform. Fork the repo, add your own API keys, and run it entirely on your own compute — forever.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            {['Unlimited analyses', 'Your own API keys', 'Keys never leave your machine', 'No subscription'].map(f => (
              <li key={f} className="flex items-center gap-2"><CheckIcon />{f}</li>
            ))}
          </ul>

          {/* Fork instructions toggle */}
          <button
            onClick={() => setForkExpanded(o => !o)}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${forkExpanded ? 'rotate-90' : ''}`}>
              <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {forkExpanded ? 'Hide setup guide' : 'How to set it up →'}
          </button>

          {forkExpanded && (
            <div className="flex flex-col gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800 animate-fade-slide-in">
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Setup in 3 steps</p>
              {[
                {
                  n: '1',
                  label: 'Fork the repo',
                  code: null,
                  link: `${REPO_URL}/fork`,
                  linkLabel: 'Fork on GitHub →',
                },
                {
                  n: '2',
                  label: 'Create .env.local',
                  code: 'GEMINI_API_KEY=your_key\nGITHUB_TOKEN=your_token',
                  link: null,
                  linkLabel: null,
                },
                {
                  n: '3',
                  label: 'Run it',
                  code: 'npm install && npm run dev',
                  link: null,
                  linkLabel: null,
                },
              ].map(step => (
                <div key={step.n} className="flex items-start gap-2.5">
                  <span className="flex-none w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-mono font-bold flex items-center justify-center">
                    {step.n}
                  </span>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{step.label}</span>
                    {step.code && (
                      <code className="text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg whitespace-pre block leading-relaxed">
                        {step.code}
                      </code>
                    )}
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {step.linkLabel}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!forkExpanded && (
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-center"
            >
              View on GitHub →
            </a>
          )}
        </div>

        {/* ── Tier 3: Pro (WIP) ── */}
        <div className="relative border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 flex flex-col gap-4 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="absolute top-4 right-4">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Coming soon
            </span>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">Pro</div>
            <div className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">$3<span className="text-lg font-normal text-zinc-400">/mo</span></div>
            <div className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">or LKR 1,000 / month</div>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
            Don&rsquo;t want to manage API keys? Subscribe and use Groundwork directly — we handle the compute, you just build.
          </p>

          <ul className="flex flex-col gap-2 text-sm text-zinc-400 dark:text-zinc-600">
            {['Unlimited analyses', 'Our API keys — zero setup', 'Priority support', 'Cancel any time'].map(f => (
              <li key={f} className="flex items-center gap-2"><CheckIcon muted />{f}</li>
            ))}
          </ul>

          {/* Interest form */}
          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {interestSent ? (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4.5 7L6 8.5L9.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Got it — I&rsquo;ll reach out when it&rsquo;s ready.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  Interested? Drop your email — I&rsquo;ll reach out before launch to see if it&rsquo;s worth building.
                </p>
                <form onSubmit={handleInterest} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={interestEmail}
                    onChange={e => setInterestEmail(e.target.value)}
                    className="flex-1 min-w-0 text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  <button
                    type="submit"
                    className="flex-none px-3 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-700 dark:hover:bg-white transition-colors"
                  >
                    Notify me
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}

function CheckIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`flex-none ${muted ? 'text-zinc-300 dark:text-zinc-700' : 'text-emerald-500'}`}>
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4.5 7L6 8.5L9.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
