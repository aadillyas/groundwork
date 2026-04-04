import { AccessTier, UsageState } from '@/lib/types'

const STORAGE_KEY = 'gw_usage'
const FREE_ANALYSES_ALLOWED = 1
const DAILY_RESET_MS = 24 * 60 * 60 * 1000

interface StoredState extends UsageState {
  lastAnalysisAt?: number  // unix ms — used to reset daily free usage
}

function readState(): StoredState {
  if (typeof window === 'undefined') return { analysesUsed: 0, tier: 'free' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { analysesUsed: 0, tier: 'free' }
    const parsed = JSON.parse(raw) as StoredState
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
  if (state.tier === 'byok' && state.geminiKey) return true
  return state.analysesUsed < FREE_ANALYSES_ALLOWED
}

export function recordAnalysis(): void {
  const state = readState()
  writeState({ ...state, analysesUsed: state.analysesUsed + 1, lastAnalysisAt: Date.now() })
}

export function saveBYOKKeys(geminiKey: string, githubToken: string): void {
  const state = readState()
  writeState({ ...state, tier: 'byok', geminiKey, githubToken })
}

export function getBYOKKeys(): { geminiKey?: string; githubToken?: string } {
  const state = readState()
  return { geminiKey: state.geminiKey, githubToken: state.githubToken }
}

export function clearBYOKKeys(): void {
  const state = readState()
  const { geminiKey: _, githubToken: __, ...rest } = state
  writeState({ ...rest, tier: 'free' })
}
