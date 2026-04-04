import { ComponentCoverage, CoverageMatrix, ProjectScores, ScoreEntry, ScoreFactors, WholeProductCoverage } from '@/lib/types'

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function labelFor(metric: 'originality' | 'reliance' | 'buildability', score: number): string {
  if (metric === 'originality') {
    if (score < 40) return 'Crowded space'
    if (score < 60) return 'Iterative'
    if (score < 80) return 'Novel'
    return 'Pioneering'
  }

  if (metric === 'reliance') {
    if (score < 40) return 'Build everything'
    if (score < 60) return 'Half custom'
    if (score < 80) return 'Mostly OSS'
    return 'Plug-and-play'
  }

  if (score < 40) return 'Hard slog'
  if (score < 60) return 'Ship in months'
  if (score < 80) return 'Ship in weeks'
  return 'Ship in days'
}

function entry(
  metric: 'originality' | 'reliance' | 'buildability',
  score: number,
  confidence: number,
  factors: ScoreFactors
): ScoreEntry {
  const rounded = Math.round(clamp(score))
  return {
    score: rounded,
    label: labelFor(metric, rounded),
    confidence: Number(confidence.toFixed(2)),
    factors,
  }
}

function averageCoverage(componentCoverage: ComponentCoverage[]): number {
  if (componentCoverage.length === 0) return 0
  return componentCoverage.reduce((sum, entry) => sum + entry.coverageScore, 0) / componentCoverage.length
}

export function calculateScores(
  coverageMatrix: CoverageMatrix,
  complexityWeight: number
): ProjectScores {
  const whole = coverageMatrix.wholeProductCoverage
  const avgCoverage = averageCoverage(coverageMatrix.componentCoverage)
  const strongMatches = whole.supportingRepos.length
  const marketSaturation = whole.marketSaturation
  const originalityScore = clamp(
    100 - whole.bestScore * 0.55 - marketSaturation * 0.25 - strongMatches * 8
  )

  const originalityFactors: ScoreFactors = {
    inputs: {
      best_full_product_match: whole.bestScore,
      market_saturation: marketSaturation,
      strong_repo_matches: strongMatches,
    },
    explanation: [
      'Originality falls as whole-product matches become stronger.',
      'Crowded repo space reduces originality even if no single repo is perfect.',
    ],
  }

  const relianceScore = clamp(
    avgCoverage * 0.72 + Math.min(100, strongMatches * 12) * 0.18 + (100 - complexityWeight) * 0.1
  )
  const relianceFactors: ScoreFactors = {
    inputs: {
      component_coverage: Math.round(avgCoverage),
      reusable_repo_count: strongMatches,
      implementation_complexity_penalty: complexityWeight,
    },
    explanation: [
      'Reliance increases when more component capabilities are covered by reusable OSS.',
      'Higher complexity reduces the amount of assembly available off the shelf.',
    ],
  }

  const simplicity = clamp(100 - complexityWeight)
  const integrationRisk = clamp(100 - avgCoverage)
  const maintenanceRisk = clamp(100 - whole.confidence * 100)
  const buildabilityScore = clamp(
    relianceScore * 0.45 + simplicity * 0.3 - integrationRisk * 0.15 - maintenanceRisk * 0.1
  )
  const buildabilityFactors: ScoreFactors = {
    inputs: {
      reliance: Math.round(relianceScore),
      simplicity,
      integration_risk: integrationRisk,
      maintenance_risk: maintenanceRisk,
    },
    explanation: [
      'Buildability combines reuse potential with the remaining implementation burden.',
      'Low-confidence or stale ecosystem evidence drags the score down.',
    ],
  }

  const confidence = Math.min(0.95, Math.max(0.35, whole.confidence))

  return {
    originality: entry('originality', originalityScore, confidence, originalityFactors),
    reliance: entry('reliance', relianceScore, confidence, relianceFactors),
    buildability: entry('buildability', buildabilityScore, confidence, buildabilityFactors),
  }
}

export function complexityPenaltyFromCount(componentCount: number): number {
  if (componentCount <= 2) return 20
  if (componentCount <= 4) return 45
  return 70
}
