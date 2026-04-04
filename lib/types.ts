// ─── Search ───────────────────────────────────────────────────────────────────

export interface Repo {
  name: string
  fullName: string
  description: string
  stars: number
  forks?: number
  openIssues?: number
  language: string | null
  license: string | null
  lastCommit: string
  url: string
  topics: string[]
  archived?: boolean
  isFork?: boolean
  isTemplate?: boolean
  readmeSnippet?: string
}

export interface ComponentResult {
  component: string
  repos: RepoEvidence[]
  coverageScore?: number
  confidence?: number
}

export interface SearchResponse {
  results: ComponentResult[]
  evidence?: RetrievalEvidence[]
  warnings?: PipelineWarning[]
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
  confidence?: number
  supportingRepos?: string[]
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
  normalizedIdea?: NormalizedIdea
  componentRationales?: ComponentRationale[]
  retrievalEvidence?: RetrievalEvidence[]
  coverageMatrix?: CoverageMatrix
  confidence?: ConfidenceReport
  warnings?: PipelineWarning[]
  exportMarkdown: string
}

// ─── Scout ────────────────────────────────────────────────────────────────────

export interface ScoutResponse {
  queries: string[]           // whole-product queries used
  queryFamilies?: QueryFamily[]
  repos: RepoEvidence[]       // top results across all queries
  verdict: ExistenceVerdict   // 'exists' | 'partial' | 'gap'
  summary: string             // 1-2 sentence reasoning
  normalizedIdea?: NormalizedIdea
  wholeProductCoverage?: WholeProductCoverage
  confidence?: ConfidenceReport
  warnings?: PipelineWarning[]
}

// ─── Decompose ────────────────────────────────────────────────────────────────

export interface Component {
  name: string
  description: string
  searchQueries: string[]
  rationale?: string
  inputs?: string[]
  outputs?: string[]
  dependencies?: string[]
  userVisible?: boolean
  confidence?: number
  validation?: ComponentValidation
  queryFamilies?: QueryFamily[]
  capabilities?: Capability[]
}

export interface DecomposeResponse {
  normalizedIdea?: NormalizedIdea
  capabilities?: Capability[]
  components: Component[]
  warnings?: PipelineWarning[]
}

// ─── Scores ───────────────────────────────────────────────────────────────────

export interface ScoreEntry {
  score: number   // 0–100
  label: string   // e.g. "Novel", "Mostly OSS", "Ship in weeks"
  confidence?: number
  factors?: ScoreFactors
}

export interface ProjectScores {
  originality: ScoreEntry
  reliance: ScoreEntry
  buildability: ScoreEntry
}

// ─── Access ───────────────────────────────────────────────────────────────────

export type AccessTier = 'free' | 'byok' | 'paid'

export type LLMProvider = 'gemini' | 'openrouter' | 'deepseek' | 'ollama'

export interface UsageState {
  analysesUsed: number
  tier: AccessTier
  apiKey?: string
  provider?: LLMProvider
  model?: string
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

// ─── Intelligence ────────────────────────────────────────────────────────────

export type CapabilityImportance = 'critical' | 'supporting' | 'optional'
export type IdeaComplexity = 'simple' | 'medium' | 'complex'
export type QueryType = 'product' | 'library' | 'integration' | 'protocol' | 'infra' | 'ui'
export type CoverageLevel = 'full' | 'partial' | 'none' | 'unknown'
export type RecencyBucket = 'active' | 'warm' | 'stale'

export interface Capability {
  name: string
  description: string
  importance: CapabilityImportance
  signals: string[]
}

export interface NormalizedIdea {
  summary: string
  user: string
  jobToBeDone: string
  platform: string
  coreWorkflow: string[]
  mustHaveCapabilities: string[]
  niceToHaveCapabilities: string[]
  nonGoals: string[]
  complexity: IdeaComplexity
  capabilities: Capability[]
}

export interface QueryFamily {
  type: QueryType
  label: string
  queries: string[]
}

export interface ComponentValidation {
  valid: boolean
  coverage: 'complete' | 'partial' | 'missing'
  issues: string[]
}

export interface ComponentRationale {
  name: string
  rationale: string
  inputs: string[]
  outputs: string[]
  dependencies: string[]
  userVisible: boolean
  confidence: number
  validation?: ComponentValidation
}

export interface MatchSignals {
  title: boolean
  description: boolean
  topics: boolean
  readme: boolean
  exactName: boolean
}

export interface RepoEvidence extends Repo {
  recencyBucket?: RecencyBucket
  queryMatches?: string[]
  rankingReasons?: string[]
  evidenceScore?: number
  relevanceScore?: number
  maintenanceScore?: number
  adoptionScore?: number
  licenseScore?: number
  fitScore?: number
  matchSignals?: MatchSignals
}

export interface RetrievalEvidence {
  component: string
  topRepos: RepoEvidence[]
  queries: QueryFamily[]
  darkHorse?: RepoEvidence
  coverageScore: number
  confidence: number
}

export interface CapabilityCoverageCell {
  capability: string
  repoFullName: string
  level: CoverageLevel
  score: number
  evidence: string[]
}

export interface ComponentCoverage {
  component: string
  coverageScore: number
  supportingRepos: string[]
  confidence: number
}

export interface WholeProductCoverage {
  bestRepo?: string
  bestScore: number
  supportingRepos: string[]
  marketSaturation: number
  confidence: number
}

export interface CoverageMatrix {
  capabilities: string[]
  repos: string[]
  cells: CapabilityCoverageCell[]
  componentCoverage: ComponentCoverage[]
  wholeProductCoverage: WholeProductCoverage
}

export interface ScoreFactors {
  inputs: Record<string, number>
  explanation: string[]
}

export interface ConfidenceReport {
  overall: number
  retrieval: number
  coverage: number
  judgment: number
  notes: string[]
}

export interface PipelineWarning {
  code: string
  message: string
}
