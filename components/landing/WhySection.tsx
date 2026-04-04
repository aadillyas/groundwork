export default function WhySection() {
  return (
    <section id="why" className="w-full max-w-4xl mx-auto px-6 py-20 scroll-mt-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* Left — the story */}
        <div className="flex flex-col gap-6 reveal">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">Why Groundwork exists</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
              Built by a non-tech builder<br />who got tired of flying blind.
            </h2>
          </div>

          <div className="flex flex-col gap-4 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <p>
              I&rsquo;m not a software engineer. I&rsquo;m someone who constantly wants to build and ship things — but I know my limits. Every time I had an idea, I&rsquo;d ask an LLM to help me figure out what already exists. The problem? LLMs are opinionated, outdated, and sometimes just wrong about what&rsquo;s out there.
            </p>
            <p>
              So I&rsquo;d go to GitHub. And feel completely lost. I didn&rsquo;t know how to search properly, couldn&rsquo;t tell a maintained repo from an abandoned one, and certainly didn&rsquo;t know when to fork vs when to rebuild. Hours of research for a 10-minute decision.
            </p>
            <p>
              After months of building things the hard way, I realised I needed a tool that did this research <em>systematically</em> — not just a search, but a structured breakdown of what exists, what&rsquo;s trustworthy, and what&rsquo;s genuinely missing.
            </p>
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              And here&rsquo;s the thing I want to be clear about: Groundwork is not about telling you whether to build. Build it anyway — you&rsquo;ll learn more from building than from researching. The point is to build <em>faster</em> and <em>better</em>, standing on what&rsquo;s already been done.
            </p>
          </div>
        </div>

        {/* Right — the cards */}
        <div className="flex flex-col gap-4 reveal" style={{ animationDelay: '120ms' }}>

          {[
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-amber-500">
                  <path d="M9 2L11.09 7.26L17 7.64L12.88 11.12L14.18 17L9 13.77L3.82 17L5.12 11.12L1 7.64L6.91 7.26L9 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
              ),
              label: 'The old way',
              text: 'Ask an LLM → get confident but outdated answers. Search GitHub → get overwhelmed. Make a guess and hope for the best.',
              tone: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20',
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-emerald-500">
                  <path d="M3 9L7 13L15 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              label: 'The Groundwork way',
              text: 'Describe your idea → get a structured breakdown of every component → see exactly what exists, what\'s trustworthy, and what you actually need to build.',
              tone: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20',
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-indigo-500">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M9 6V9.5L11.5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              ),
              label: 'Build anyway — just faster',
              text: 'This is not a tool to talk you out of building. It\'s a tool to help you skip the foundation work and get to the parts that are actually yours to create.',
              tone: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20',
            },
          ].map(card => (
            <div key={card.label} className={`border rounded-xl p-4 flex gap-3 ${card.tone}`}>
              <div className="flex-none mt-0.5">{card.icon}</div>
              <div className="flex flex-col gap-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">{card.label}</div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{card.text}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
