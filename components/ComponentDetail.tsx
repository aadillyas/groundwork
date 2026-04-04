import { Component, RepoEvidence, ComponentStrategy } from '@/lib/types'
import RepoCard from './RepoCard'

interface ComponentDetailProps {
  component: Component
  repos: RepoEvidence[]
  recommendedRepos: Set<string>
  strategy?: ComponentStrategy
}

function PackageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )
}

export default function ComponentDetail({ component, repos, recommendedRepos, strategy }: ComponentDetailProps) {
  const sorted = [...repos].sort((a, b) => {
    const aRec = recommendedRepos.has(a.fullName) ? 1 : 0
    const bRec = recommendedRepos.has(b.fullName) ? 1 : 0
    if (bRec !== aRec) return bRec - aRec
    return (b.evidenceScore ?? b.stars) - (a.evidenceScore ?? a.stars)
  })

  const isUse = strategy?.action === 'use'
  const isBuild = strategy?.action === 'build'

  return (
    <div className="animate-fade-slide-in flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
          {component.name}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1.5 leading-relaxed">{component.description}</p>
      </div>

      {/* Action badge — USE or BUILD */}
      {strategy && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-4 ${
          isUse
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
        }`}>
          <div className={`flex-none mt-0.5 ${isUse ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {isUse ? <PackageIcon /> : <WrenchIcon />}
          </div>
          <div>
            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${
              isUse ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
            }`}>
              {isUse ? 'Use an existing library' : 'Build this yourself'}
            </div>
            <p className={`text-sm leading-relaxed ${
              isUse ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'
            }`}>
              {strategy.reason}
            </p>
            {isBuild && strategy.suggestedPath && (
              <div className="mt-2">
                <code className="font-mono text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                  {strategy.suggestedPath}
                </code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Repo list */}
      {sorted.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sorted.map(repo => (
            <RepoCard
              key={repo.fullName}
              repo={repo}
              recommended={recommendedRepos.has(repo.fullName)}
              actionColour={strategy?.action}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-zinc-400 dark:text-zinc-600 border border-zinc-100 dark:border-zinc-800 rounded-xl px-5 py-8 text-center">
          No matching repos found for this component.
        </div>
      )}
    </div>
  )
}
