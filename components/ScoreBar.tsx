'use client'

import { ScoreEntry } from '@/lib/types'

const COLOR = (score: number) => {
  if (score >= 80) return { ring: 'text-emerald-500', label: 'text-emerald-600 dark:text-emerald-400' }
  if (score >= 60) return { ring: 'text-indigo-500', label: 'text-indigo-600 dark:text-indigo-400' }
  if (score >= 40) return { ring: 'text-amber-500', label: 'text-amber-600 dark:text-amber-400' }
  return { ring: 'text-red-500', label: 'text-red-600 dark:text-red-400' }
}

interface ScoreBarProps {
  title: string
  entry: ScoreEntry
  size?: 'sm' | 'lg'
  // Animated ring fill — ring draws from 0 to value when revealed flips to true
  animated?: boolean
  revealed?: boolean
  revealDelay?: number
}

export default function ScoreBar({ title, entry, size = 'sm', animated, revealed, revealDelay = 0 }: ScoreBarProps) {
  const { score, label } = entry
  const color = COLOR(score)
  const r = size === 'lg' ? 28 : 20
  const stroke = size === 'lg' ? 4 : 3
  const dim = (r + stroke) * 2
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ

  const fillStyle = animated
    ? {
        strokeDasharray: revealed ? `${filled} ${circ}` : `0 ${circ}`,
        transition: `stroke-dasharray 900ms cubic-bezier(0.16, 1, 0.3, 1) ${revealDelay}ms`,
      }
    : undefined

  return (
    <div className={`flex flex-col items-center ${size === 'lg' ? 'gap-2' : 'gap-1'}`}>
      <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
        {title}
      </div>

      {/* Ring gauge */}
      <div className="relative flex items-center justify-center">
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="-rotate-90">
          {/* Track */}
          <circle
            cx={dim / 2} cy={dim / 2} r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-zinc-200 dark:text-zinc-800"
          />
          {/* Fill */}
          <circle
            cx={dim / 2} cy={dim / 2} r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={color.ring}
            style={fillStyle ?? { strokeDasharray: `${filled} ${circ}` }}
          />
        </svg>
        <span className={`absolute font-display font-bold tabular-nums ${size === 'lg' ? 'text-2xl' : 'text-base'} text-zinc-900 dark:text-zinc-100`}>
          {score}
        </span>
      </div>

      <div className={`font-medium whitespace-nowrap ${size === 'lg' ? 'text-sm' : 'text-xs'} ${color.label}`}>
        {label}
      </div>
    </div>
  )
}
