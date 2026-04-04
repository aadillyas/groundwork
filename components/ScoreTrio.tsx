'use client'

import { ProjectScores } from '@/lib/types'
import ScoreBar from '@/components/ScoreBar'

interface ScoreTrioProps {
  scores: ProjectScores
  size?: 'sm' | 'lg'
}

export default function ScoreTrio({ scores, size = 'sm' }: ScoreTrioProps) {
  return (
    <div className="flex items-center gap-6 lg:gap-10">
      <ScoreBar title="Originality" entry={scores.originality} size={size} />
      <div className="w-px self-stretch bg-zinc-200 dark:bg-zinc-800" />
      <ScoreBar title="Reliance on OSS" entry={scores.reliance} size={size} />
      <div className="w-px self-stretch bg-zinc-200 dark:bg-zinc-800" />
      <ScoreBar title="Buildability" entry={scores.buildability} size={size} />
    </div>
  )
}
