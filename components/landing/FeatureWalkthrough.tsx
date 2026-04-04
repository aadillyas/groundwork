const STEPS = [
  {
    num: '01',
    title: 'Decompose',
    headline: 'Break your idea into precise components',
    body: 'Groundwork splits your idea into 4–6 independent technical components. Each gets targeted GitHub search queries — not "pdf extraction", but "pdf table extraction typescript unstructured".',
    accent: 'bg-indigo-500',
  },
  {
    num: '02',
    title: 'Scan GitHub',
    headline: 'Systematic search, not just the first result',
    body: 'Every component is independently searched across GitHub. We run multiple queries per component, deduplicate results, and surface the top repos ranked by stars, recency, and relevance.',
    accent: 'bg-violet-500',
  },
  {
    num: '03',
    title: 'Identify what\'s trustworthy',
    headline: 'Active, maintained, and worth forking',
    body: 'We filter for repos with recent commits, permissive licences, and meaningful star counts. Abandoned projects get filtered out. You only see repos worth actually building on.',
    accent: 'bg-sky-500',
  },
  {
    num: '04',
    title: 'Synthesise a strategy',
    headline: 'USE vs BUILD — for every component',
    body: 'You get a clear verdict per component: USE an existing repo (fork it, integrate it) or BUILD it yourself (your actual IP). Plus three scores that tell you how original the idea is, how much OSS covers it, and how fast you can ship.',
    accent: 'bg-emerald-500',
  },
]

export default function FeatureWalkthrough() {
  return (
    <section className="w-full max-w-4xl mx-auto px-6 py-20 scroll-mt-16">
      <div className="text-center mb-14">
        <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">How it works</div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          A systematic process,<br />not a lucky Google search
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className="relative bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-3 overflow-hidden reveal"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Accent stripe */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${step.accent}`} />

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-600">{step.num}</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{step.title}</span>
            </div>

            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
              {step.headline}
            </h3>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
