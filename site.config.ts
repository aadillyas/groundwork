/**
 * site.config.ts
 *
 * If you forked Groundwork and want to run your own instance:
 * Edit this file to customise the branding and personal info.
 * Everything else (API routes, analysis logic) stays the same.
 *
 * Then set your environment variables in .env.local (see README).
 */

const siteConfig = {
  // ── Branding ──────────────────────────────────────────────────────────────
  siteName: 'Groundwork',
  tagline: 'Pre-build OSS research',
  metaDescription:
    'Describe your idea and get a structured analysis of what already exists, what\'s missing, and what to build vs what to use.',

  // ── Author / About section ────────────────────────────────────────────────
  author: {
    name: 'Aadil Illyas',
    tagline: 'Builder, not engineer — shipping things anyway',
    bio: 'I build products, explore ideas, and constantly ship things that are slightly above my technical comfort zone. Groundwork is one of them — built out of frustration, shipped out of stubbornness.',
    // Path relative to /public — e.g. '/avatar.jpg'. Set to null to show initials.
    avatar: '/IMG_1938.jpeg' as string | null,
    links: {
      linkedin: 'https://www.linkedin.com/in/aadil-illyas',
      website: 'https://aadilillyas.com',
      github: 'https://github.com/aadillyas',
    },
  },

  // ── GitHub repo (used in pricing section fork instructions) ───────────────
  repoUrl: 'https://github.com/aadillyas/groundwork',
}

export default siteConfig
export type SiteConfig = typeof siteConfig
