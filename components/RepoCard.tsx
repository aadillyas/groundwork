import { RepoEvidence, ComponentAction } from '@/lib/types'

interface RepoCardProps {
  repo: RepoEvidence
  recommended?: boolean
  actionColour?: ComponentAction
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function recencyDot(iso: string): { color: string; label: string } {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 180) return { color: 'bg-emerald-500', label: `${Math.floor(diffDays / 30) || 1}mo ago` }
  if (diffDays < 540) return { color: 'bg-amber-400', label: `${Math.floor(diffDays / 30)}mo ago` }
  return { color: 'bg-red-400', label: `${Math.floor(diffDays / 365)}y ago` }
}

const LEFT_BORDER: Record<string, string> = {
  use: 'border-l-emerald-400',
  build: 'border-l-amber-400',
  default: 'border-l-transparent',
}

export default function RepoCard({ repo, recommended, actionColour }: RepoCardProps) {
  const { color: dotColor, label: dateLabel } = recencyDot(repo.lastCommit)
  const leftBorder = actionColour ? LEFT_BORDER[actionColour] : LEFT_BORDER.default
  const evidenceScore = repo.evidenceScore ? Math.round(repo.evidenceScore) : null

  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-xl border-l-4 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors group relative px-5 py-4 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none ${leftBorder} ${
        recommended ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 hover:border-emerald-300 dark:hover:border-emerald-700' : ''
      }`}
    >
      {recommended && (
        <span className="absolute top-4 right-4 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
          Recommended
        </span>
      )}

      {/* Top row: name + stars */}
      <div className="flex items-start gap-3 pr-24 mb-2">
        <span className={`font-mono text-sm font-semibold leading-tight group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors ${
          recommended ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-700 dark:text-zinc-300'
        }`}>
          {repo.fullName}
        </span>
      </div>

      {/* Stars — prominent */}
      <div className="flex items-center gap-3 mb-2.5 flex-wrap">
        {evidenceScore !== null && (
          <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-full px-2 py-0.5">
            Evidence {evidenceScore}
          </span>
        )}
        <span className="flex items-center gap-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
          {formatStars(repo.stars)}
        </span>
        {repo.language && (
          <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-indigo-400 flex-none" />
            {repo.language}
          </span>
        )}
        {repo.license && (
          <span className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">{repo.license}</span>
        )}
        <span className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600">
          <span className={`w-1.5 h-1.5 rounded-full flex-none ${dotColor}`} />
          {dateLabel}
        </span>
      </div>

      {repo.description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed line-clamp-2">{repo.description}</p>
      )}

      {repo.rankingReasons && repo.rankingReasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {repo.rankingReasons.slice(0, 3).map((reason: string) => (
            <span
              key={reason}
              className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full px-2 py-1"
            >
              {reason}
            </span>
          ))}
        </div>
      )}
    </a>
  )
}
