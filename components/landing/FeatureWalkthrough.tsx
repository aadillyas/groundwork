const STEPS = [
  {
    num: '01',
    title: 'Describe it',
    headline: 'Tell Groundwork what you want to build',
    body: 'Write your idea the way you would explain it to another person. You do not need to know the right technical terms or how to search GitHub properly.',
    accent: 'bg-indigo-500',
  },
  {
    num: '02',
    title: 'Check what exists',
    headline: 'Groundwork searches GitHub so you don\'t have to',
    body: 'It breaks your idea into parts behind the scenes, runs focused searches, and surfaces relevant open-source projects instead of leaving you with a blank search box.',
    accent: 'bg-violet-500',
  },
  {
    num: '03',
    title: 'Separate signal from noise',
    headline: 'See what looks reusable and what still looks missing',
    body: 'Groundwork helps you spot which repos look active and worth building on, and which parts of your idea do not seem well covered yet.',
    accent: 'bg-sky-500',
  },
  {
    num: '04',
    title: 'Start smarter',
    headline: 'Get a practical starting plan',
    body: 'Instead of a pile of links, you get guidance on what to use, what to combine, what to build yourself, and how feasible the idea looks overall.',
    accent: 'bg-emerald-500',
  },
]

export default function FeatureWalkthrough() {
  return (
    <section className="w-full max-w-4xl mx-auto px-6 py-20 scroll-mt-16">
      <div className="text-center mb-14">
        <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">How it works</div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Here&rsquo;s what happens when you paste your idea in
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
