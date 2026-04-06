export default function WhySection() {
  return (
    <section id="why" className="w-full max-w-4xl mx-auto px-6 py-20 scroll-mt-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* Left — the story */}
        <div className="flex flex-col gap-6 reveal">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">Why Groundwork exists</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
              I kept having ideas. And every time, I&rsquo;d spend hours trying to figure out if someone had already built something like it &mdash; and never really got a clear answer.
            </h2>
          </div>

          <div className="flex flex-col gap-4 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <p>
              I&rsquo;m not a software engineer. I&rsquo;m just someone who likes having ideas and trying to ship them. Every time I got excited about something new, I&rsquo;d ask an LLM what already existed, then immediately wonder if the answer was outdated, incomplete, or just confidently wrong.
            </p>
            <p>
              Then I&rsquo;d open GitHub and feel completely lost. I didn&rsquo;t know the right search terms, couldn&rsquo;t tell a healthy repo from a dead one, and had no clear way to decide whether I should fork something, stitch a few tools together, or just build it myself.
            </p>
            <p>
              That&rsquo;s the gap Groundwork tries to close. You describe the thing you want to build, and it does the messy research step for you in a more systematic way: what exists, what looks trustworthy, and what still seems missing.
            </p>
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              If you&rsquo;ve ever had an idea, asked ChatGPT about it, and still felt unsure what was real, this is for you. Groundwork is not here to talk you out of building. It&rsquo;s here to help you start with better footing and waste less time on research.
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
              label: 'What usually happens',
              text: 'You ask an LLM, open ten tabs, skim GitHub for an hour, and still are not sure what is actually reusable versus what only sounds promising.',
              tone: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20',
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-emerald-500">
                  <path d="M3 9L7 13L15 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              label: 'What Groundwork does',
              text: 'It turns that fuzzy research phase into something concrete: describe the idea, see what exists, and get a clearer read on what to use, what to combine, and what to build.',
              tone: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20',
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-indigo-500">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M9 6V9.5L11.5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              ),
              label: 'The point',
              text: 'You should still build the thing. Groundwork just helps you spend less time reinventing foundations and more time on the parts that are actually yours.',
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
