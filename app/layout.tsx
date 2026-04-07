import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { Inter, JetBrains_Mono, Syne } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
const syne = Syne({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'Groundwork — Know what\'s been built before you build',
  description: 'Pre-build OSS research. Describe your idea and get a structured analysis of what already exists, what\'s missing, and what to do about it.',
}

// Inline script runs before paint — reads localStorage and sets dark/light class on <html>
// Prevents flash of wrong theme on reload
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('gw-theme');
    if (t === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${mono.variable} ${syne.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased transition-colors">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
