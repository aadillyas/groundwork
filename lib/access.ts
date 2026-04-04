import { AccessTier, LLMProvider, UsageState } from '@/lib/types'

const STORAGE_KEY = 'gw_usage'
const TOTAL_COUNT_KEY = 'gw_total_analyses'
const FREE_ANALYSES_ALLOWED = 1
const DAILY_RESET_MS = 24 * 60 * 60 * 1000

interface StoredState extends UsageState {
  lastAnalysisAt?: number  // unix ms — used to reset daily free usage
  geminiKey?: string
}

const DEFAULT_BYOK_PROVIDER: LLMProvider = 'gemini'
const DEFAULT_BYOK_MODEL = 'gemini-2.5-flash'

function normaliseState(state: StoredState): StoredState {
  const apiKey = state.apiKey ?? state.geminiKey
  const provider = state.provider ?? (apiKey ? DEFAULT_BYOK_PROVIDER : undefined)
  const model = state.model ?? (provider === 'gemini' ? DEFAULT_BYOK_MODEL : undefined)
  return { ...state, apiKey, provider, model }
}

function readState(): StoredState {
  if (typeof window === 'undefined') return { analysesUsed: 0, tier: 'free' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { analysesUsed: 0, tier: 'free' }
    const parsed = normaliseState(JSON.parse(raw) as StoredState)
    // Reset free-tier counter if it's been more than 24h
    if (parsed.tier === 'free' && parsed.lastAnalysisAt) {
      if (Date.now() - parsed.lastAnalysisAt > DAILY_RESET_MS) {
        return { ...parsed, analysesUsed: 0, lastAnalysisAt: undefined }
      }
    }
    return parsed
  } catch {
    return { analysesUsed: 0, tier: 'free' }
  }
}

function writeState(state: StoredState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getUsageState(): UsageState {
  return readState()
}

export function canRunAnalysis(): boolean {
  const state = readState()
  if (state.tier === 'paid') return true
  if (state.tier === 'byok' && (state.provider === 'ollama' || !!state.apiKey)) return true
  return state.analysesUsed < FREE_ANALYSES_ALLOWED
}

export function recordAnalysis(): void {
  const state = readState()
  writeState({ ...state, analysesUsed: state.analysesUsed + 1, lastAnalysisAt: Date.now() })
  // Increment global total counter
  const prev = parseInt(localStorage.getItem(TOTAL_COUNT_KEY) ?? '0', 10)
  localStorage.setItem(TOTAL_COUNT_KEY, String(prev + 1))
}

export function getTotalAnalysisCount(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(TOTAL_COUNT_KEY) ?? '0', 10)
}

export function saveBYOKKeys(provider: LLMProvider, model: string, apiKey: string, githubToken: string): void {
  const state = readState()
  writeState({
    ...state,
    tier: 'byok',
    provider,
    model,
    apiKey: apiKey || undefined,
    githubToken: githubToken || undefined,
  })
}

export function getBYOKKeys(): { apiKey?: string; provider?: LLMProvider; model?: string; githubToken?: string } {
  const state = readState()
  return {
    apiKey: state.apiKey,
    provider: state.provider,
    model: state.model,
    githubToken: state.githubToken,
  }
}

export function clearBYOKKeys(): void {
  const state = readState()
  const { apiKey: _, provider: __, model: ___, githubToken: ____, geminiKey: _____, ...rest } = state
  writeState({ ...rest, tier: 'free' })
}
