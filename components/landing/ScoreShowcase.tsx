import ScoreTrio from '@/components/ScoreTrio'
import { ProjectScores } from '@/lib/types'

const DEMO_SCORES: ProjectScores = {
  originality: { score: 72, label: 'Novel' },
  reliance: { score: 85, label: 'Mostly OSS' },
  buildability: { score: 71, label: 'Ship in weeks' },
}

export default function ScoreShowcase() {
  return (
    <section className="w-full max-w-4xl mx-auto px-6 py-20 reveal">
      <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">The output</div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            A quick read on whether your idea is already solved, mostly reusable, or still yours to build.
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 max-w-lg leading-relaxed">
            These scores are there to help you make a faster decision: how original the idea looks, how much open source can carry the build, and how realistic it is to ship quickly.
          </p>
        </div>

        {/* Score display */}
        <div className="px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <ScoreTrio scores={DEMO_SCORES} size="lg" />

          <div className="flex flex-col gap-4 max-w-xs">
            {[
              { label: 'Originality', desc: 'How much of the idea feels genuinely new compared with what already seems fully built.' },
              { label: 'Reliance on OSS', desc: 'How much of the work can probably be covered by existing repos and reusable building blocks.' },
              { label: 'Buildability', desc: 'A quick sense of how practical this looks to ship once those two signals are combined.' },
            ].map(item => (
              <div key={item.label} className="flex flex-col gap-0.5">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{item.label}</span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400 leading-snug">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="px-8 pb-6">
          <p className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">
            Example scores from a real analysis &mdash; &ldquo;Record a voice memo and turn it into a structured PRD&rdquo;
          </p>
        </div>

      </div>
    </section>
  )
}
