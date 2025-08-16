import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client
export const createClientSideClient = () => createClientComponentClient()

// For server-side operations with service role (use only in server components or API routes)
export const createServiceClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
          cognitive_depth_score: number
          pattern_complexity: number
          meaning_layers: string[]
          anti_surface_features: string[]
          price_cents: number
          digital_root: number
          view_count: number
          download_count: number
          created_at: string
          average_rating: number
          total_ratings: number
          total_downloads: number
        }
        Insert: {
          title: string
          slug: string
          cognitive_category: 'deep_analysis' | 'meaning_engineering' | 'cognitive_frameworks' | 'consciousness_mapping' | 'advanced_systems'
          difficulty_tier: 'foundation' | 'advanced' | 'expert' | 'architect'
          required_tier?: 'explorer' | 'architect' | 'initiate' | 'master'
          preview_content: string
          full_content: string
          implementation_guide?: string
          use_cases?: any
          cognitive_depth_score: number
          pattern_complexity: number
          meaning_layers?: string[]
          anti_surface_features?: string[]
          price_cents: number
          digital_root?: number
          view_count?: number
          download_count?: number
          average_rating?: number
          total_ratings?: number
          total_downloads?: number
        }
        Update: {
          title?: string
          slug?: string
          cognitive_category?: 'deep_analysis' | 'meaning_engineering' | 'cognitive_frameworks' | 'consciousness_mapping' | 'advanced_systems'
          difficulty_tier?: 'foundation' | 'advanced' | 'expert' | 'architect'
          required_tier?: 'explorer' | 'architect' | 'initiate' | 'master'
          preview_content?: string
          full_content?: string
          implementation_guide?: string
          use_cases?: any
          cognitive_depth_score?: number
          pattern_complexity?: number
          meaning_layers?: string[]
          anti_surface_features?: string[]
          price_cents?: number
          digital_root?: number
          view_count?: number
          download_count?: number
          average_rating?: number
          total_ratings?: number
          total_downloads?: number
        }
      }
      bundles: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          prompt_ids: string[]
          category_filter: string | null
          tier_filter: string | null
          price_cents: number
          original_price_cents: number | null
          discount_percentage: number
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          title: string
          slug: string
          description?: string
          prompt_ids?: string[]
          category_filter?: string
          tier_filter?: string
          price_cents: number
          original_price_cents?: number
          discount_percentage?: number
          is_active?: boolean
        }
        Update: {
          title?: string
          slug?: string
          description?: string
          prompt_ids?: string[]
          category_filter?: string
          tier_filter?: string
          price_cents?: number
          original_price_cents?: number
          discount_percentage?: number
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
          user_id: string
          tier: 'explorer' | 'architect' | 'initiate' | 'master'
          stripe_subscription_id?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          status?: 'active' | 'canceled' | 'past_due' | 'incomplete'
          current_period_start?: string
          current_period_end?: string
        }
        Update: {
          tier?: 'explorer' | 'architect' | 'initiate' | 'master'
          stripe_subscription_id?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          status?: 'active' | 'canceled' | 'past_due' | 'incomplete'
          current_period_start?: string
          current_period_end?: string
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
          user_id: string
          item_type: 'prompt' | 'bundle'
          item_id: string
          stripe_payment_intent_id?: string
          stripe_customer_id?: string
          amount_cents: number
          currency?: string
          status?: 'succeeded' | 'pending' | 'failed'
        }
        Update: {
          stripe_payment_intent_id?: string
          stripe_customer_id?: string
          amount_cents?: number
          currency?: string
          status?: 'succeeded' | 'pending' | 'failed'
          updated_at?: string
        }
      }
    }
  }
}