import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Client-side client (for components)
export const createClientSideClient = () => createClientComponentClient()

// For server-side operations with service role (use only in server components or API routes)
export const createServiceClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Database types
export type Database = {
  public: {
    Tables: {
      prompts: {
        Row: {
          id: string
          title: string
          slug: string
          cognitive_category: 'deep_analysis' | 'meaning_engineering' | 'cognitive_frameworks' | 'consciousness_mapping' | 'advanced_systems'
          difficulty_tier: 'foundation' | 'advanced' | 'expert' | 'architect'
          required_tier: 'explorer' | 'architect' | 'initiate' | 'master'
          preview_content: string
          full_content: string
          implementation_guide: string | null
          use_cases: any
          meta_tags: string[]
          cognitive_depth_score: number
          pattern_complexity: number
          meaning_layers: string[]
          anti_surface_features: string[]
          base_price_cents: number
          digital_root: number
          meta_title: string | null
          meta_description: string | null
          keywords: string[]
          created_at: string
          updated_at: string
          published_at: string | null
          is_published: boolean
          quality_score: number
        }
        Insert: {
          id?: string
          title: string
          slug: string
          cognitive_category: 'deep_analysis' | 'meaning_engineering' | 'cognitive_frameworks' | 'consciousness_mapping' | 'advanced_systems'
          difficulty_tier: 'foundation' | 'advanced' | 'expert' | 'architect'
          required_tier?: 'explorer' | 'architect' | 'initiate' | 'master'
          preview_content: string
          full_content: string
          implementation_guide?: string | null
          use_cases?: any
          meta_tags?: string[]
          cognitive_depth_score: number
          pattern_complexity: number
          meaning_layers?: string[]
          anti_surface_features?: string[]
          base_price_cents: number
          digital_root?: number
          meta_title?: string | null
          meta_description?: string | null
          keywords?: string[]
          created_at?: string
          updated_at?: string
          published_at?: string | null
          is_published?: boolean
          quality_score?: number
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          cognitive_category?: 'deep_analysis' | 'meaning_engineering' | 'cognitive_frameworks' | 'consciousness_mapping' | 'advanced_systems'
          difficulty_tier?: 'foundation' | 'advanced' | 'expert' | 'architect'
          required_tier?: 'explorer' | 'architect' | 'initiate' | 'master'
          preview_content?: string
          full_content?: string
          implementation_guide?: string | null
          use_cases?: any
          meta_tags?: string[]
          cognitive_depth_score?: number
          pattern_complexity?: number
          meaning_layers?: string[]
          anti_surface_features?: string[]
          base_price_cents?: number
          digital_root?: number
          meta_title?: string | null
          meta_description?: string | null
          keywords?: string[]
          created_at?: string
          updated_at?: string
          published_at?: string | null
          is_published?: boolean
          quality_score?: number
        }
      }
      bundles: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          prompt_ids: string[]
          category_filter: 'deep_analysis' | 'meaning_engineering' | 'cognitive_frameworks' | 'consciousness_mapping' | 'advanced_systems' | null
          tier_filter: 'foundation' | 'advanced' | 'expert' | 'architect' | null
          price_cents: number
          original_price_cents: number | null
          discount_percentage: number
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          prompt_ids?: string[]
          category_filter?: 'deep_analysis' | 'meaning_engineering' | 'cognitive_frameworks' | 'consciousness_mapping' | 'advanced_systems' | null
          tier_filter?: 'foundation' | 'advanced' | 'expert' | 'architect' | null
          price_cents: number
          original_price_cents?: number | null
          discount_percentage?: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          prompt_ids?: string[]
          category_filter?: 'deep_analysis' | 'meaning_engineering' | 'cognitive_frameworks' | 'consciousness_mapping' | 'advanced_systems' | null
          tier_filter?: 'foundation' | 'advanced' | 'expert' | 'architect' | null
          price_cents?: number
          original_price_cents?: number | null
          discount_percentage?: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: 'explorer' | 'architect' | 'initiate' | 'master'
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          status: 'active' | 'canceled' | 'past_due' | 'incomplete'
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier: 'explorer' | 'architect' | 'initiate' | 'master'
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          status: 'active' | 'canceled' | 'past_due' | 'incomplete'
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: 'explorer' | 'architect' | 'initiate' | 'master'
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'incomplete'
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_purchases: {
        Row: {
          id: string
          user_id: string
          item_type: 'prompt' | 'bundle'
          item_id: string
          stripe_payment_intent_id: string | null
          stripe_customer_id: string | null
          amount_cents: number
          currency: string
          status: 'succeeded' | 'pending' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: 'prompt' | 'bundle'
          item_id: string
          stripe_payment_intent_id?: string | null
          stripe_customer_id?: string | null
          amount_cents: number
          currency?: string
          status: 'succeeded' | 'pending' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: 'prompt' | 'bundle'
          item_id?: string
          stripe_payment_intent_id?: string | null
          stripe_customer_id?: string | null
          amount_cents?: number
          currency?: string
          status?: 'succeeded' | 'pending' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}