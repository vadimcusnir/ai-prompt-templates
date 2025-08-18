// Tipuri comune pentru admin content
export type CognitiveCategory = 'deep_analysis' | 'meaning_engineering' | 'cognitive_frameworks' | 'consciousness_mapping' | 'advanced_systems'
export type DifficultyTier = 'foundation' | 'advanced' | 'expert' | 'architect'

export interface Prompt {
  readonly id: string
  readonly title: string
  readonly cognitive_category: CognitiveCategory
  readonly difficulty_tier: DifficultyTier
  readonly cognitive_depth_score: number
  readonly pattern_complexity: number
  readonly price_cents: number
  readonly preview_content: string
  readonly meaning_layers: readonly string[]
  readonly anti_surface_features: readonly string[]
  readonly view_count: number
  readonly rating_avg: number
  readonly created_at: string
}

export interface NewPrompt {
  title: string
  cognitive_category: CognitiveCategory
  difficulty_tier: DifficultyTier
  cognitive_depth_score: number
  pattern_complexity: number
  price_cents: number
  preview_content: string
  meaning_layers: string[]
  anti_surface_features: string[]
}

// Cache state interface
export interface CacheState {
  prompts: Map<string, Prompt>
  lastFetch: number
  isStale: boolean
}
