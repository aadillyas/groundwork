'use client'

import { useState, useEffect, useRef } from 'react'

interface IdeaInputProps {
  onSubmit: (idea: string) => void
  onDemo: () => void
  disabled?: boolean
  simulateText?: string
  onTypingComplete?: (text: string) => void
  textareaId?: string
}

export default function IdeaInput({ onSubmit, onDemo, disabled, simulateText, onTypingComplete, textareaId }: IdeaInputProps) {
  const [idea, setIdea] = useState('')
  const isTyping = !!simulateText
  const indexRef = useRef(0)

  useEffect(() => {
    if (!simulateText) return
    indexRef.current = 0
    setIdea('')

    const interval = setInterval(() => {
      indexRef.current += 1
      const current = simulateText.slice(0, indexRef.current)
      setIdea(current)
      if (indexRef.current >= simulateText.length) {
        clearInterval(interval)
        onTypingComplete?.(current)
      }
    }, 28)

    return () => clearInterval(interval)
  }, [simulateText, onTypingComplete])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = idea.trim()
    if (trimmed) onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
      <textarea
        id={textareaId}
        value={idea}
        onChange={e => !isTyping && setIdea(e.target.value)}
        disabled={disabled && !isTyping}
        readOnly={isTyping}
        placeholder="Describe what you want to build..."
        rows={4}
        className={`w-full bg-zinc-50 dark:bg-zinc-950 border rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-base resize-none focus:outline-none transition-all ${
          isTyping
            ? 'border-indigo-400 dark:border-indigo-600 ring-1 ring-indigo-300 dark:ring-indigo-800'
            : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600'
        } disabled:opacity-50`}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as any)
        }}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled || isTyping || !idea.trim()}
          className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-semibold rounded-lg text-sm disabled:opacity-40 hover:bg-zinc-700 dark:hover:bg-white transition-colors"
        >
          Analyse
        </button>
        <button
          type="button"
          onClick={onDemo}
          disabled={disabled || isTyping}
          className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium rounded-lg text-sm disabled:opacity-40 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          See it in action
        </button>
      </div>
    </form>
  )
}
