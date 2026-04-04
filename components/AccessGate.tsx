'use client'

import { useState } from 'react'
import { saveBYOKKeys } from '@/lib/access'

interface AccessGateProps {
  onUnlocked: () => void
  onClose: () => void
}

export default function AccessGate({ onUnlocked, onClose }: AccessGateProps) {
  const [geminiKey, setGeminiKey] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifySent, setNotifySent] = useState(false)

  function handleSave() {
    if (!geminiKey.trim()) { setError('Gemini API key is required'); return }
    setSaving(true)
    saveBYOKKeys(geminiKey.trim(), githubToken.trim())
    setSaving(false)
    onUnlocked()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
                You&rsquo;ve used your free analysis
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Choose how to continue &mdash; no account required for the BYOK option.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-none text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors mt-0.5"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4">

          {/* BYOK option */}
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Bring your own keys</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Use your Gemini + GitHub tokens. Free forever.</div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Free
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="password"
                placeholder="Gemini API key (required)"
                value={geminiKey}
                onChange={e => { setGeminiKey(e.target.value); setError('') }}
                className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <input
                type="password"
                placeholder="GitHub token (optional — avoids rate limits)"
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Your keys are used for this request only and are never stored on our servers.
            </p>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-white transition-colors disabled:opacity-50"
            >
              Save & continue
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
            <span className="text-xs text-zinc-400 dark:text-zinc-600">or</span>
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          </div>

          {/* Pro option — coming soon */}
          <div className="border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex flex-col gap-3 bg-indigo-50/50 dark:bg-indigo-950/20">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pro — coming soon</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Unlimited analyses, our API keys, no setup. $3/mo.
                </div>
              </div>
              <span className="flex-none text-xs font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Soon
              </span>
            </div>
            {notifySent ? (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4.5 7L6 8.5L9.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Got it — I&rsquo;ll reach out when it&rsquo;s ready.
              </div>
            ) : (
              <form
                onSubmit={e => { e.preventDefault(); setNotifySent(true) }}
                className="flex gap-2"
              >
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={notifyEmail}
                  onChange={e => setNotifyEmail(e.target.value)}
                  className="flex-1 min-w-0 text-xs px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <button
                  type="submit"
                  className="flex-none px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  Notify me
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
