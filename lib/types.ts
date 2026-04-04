// ─── Search ───────────────────────────────────────────────────────────────────

export interface Repo {
  name: string
  fullName: string
  description: string
  stars: number
  language: string | null
  license: string | null
  lastCommit: string
  url: string
  topics: string[]
}

export interface ComponentResult {
  component: string
  repos: Repo[]
}

export interface SearchResponse {
  results: ComponentResult[]
}

// ─── Synthesise ───────────────────────────────────────────────────────────────

export type StrategyType = 'build-from-scratch' | 'fork-one' | 'combine-multiple'

export type ExistenceVerdict = 'exists' | 'partial' | 'gap'

export type ComponentAction = 'use' | 'build'

export interface ComponentStrategy {
  name: string          // matches Component.name
  action: ComponentAction
  reason: string        // one sentence
  suggestedPath?: string // e.g. "src/prompts/voice_to_prd.py" — only for build
}

export interface SynthesiseResponse {
  existenceCheck: {
    verdict: ExistenceVerdict
    summary: string
  }
  gapAnalysis: string
  strategy: {
    recommendation: StrategyType
    reasoning: string
    repos: string[] // fullName references
  }
  componentStrategies: ComponentStrategy[]
  scores: ProjectScores
  exportMarkdown: string
}

// ─── Scout ────────────────────────────────────────────────────────────────────

export interface ScoutResponse {
  queries: string[]           // whole-product queries used
  repos: Repo[]               // top results across all queries
  verdict: ExistenceVerdict   // 'exists' | 'partial' | 'gap'
  summary: string             // 1-2 sentence reasoning
}

// ─── Decompose ────────────────────────────────────────────────────────────────

export interface Component {
  name: string
  description: string
  searchQueries: string[]
}

export interface DecomposeResponse {
  components: Component[]
}

// ─── Scores ───────────────────────────────────────────────────────────────────

export interface ScoreEntry {
  score: number   // 0–100
  label: string   // e.g. "Novel", "Mostly OSS", "Ship in weeks"
}

export interface ProjectScores {
  originality: ScoreEntry
  reliance: ScoreEntry
  buildability: ScoreEntry
}

// ─── Access ───────────────────────────────────────────────────────────────────

export type AccessTier = 'free' | 'byok' | 'paid'

export interface UsageState {
  analysesUsed: number
  tier: AccessTier
  geminiKey?: string
  githubToken?: string
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export type AnalysisPhase =
  | 'idle'
  | 'scouting'
  | 'decomposing'
  | 'searching'
  | 'synthesising'
  | 'complete'
  | 'error'

export interface AnalysisState {
  phase: AnalysisPhase
  idea: string
  scout?: ScoutResponse
  decompose?: DecomposeResponse
  search?: SearchResponse
  synthesise?: SynthesiseResponse
  error?: string
}
