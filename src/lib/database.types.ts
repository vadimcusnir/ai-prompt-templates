export interface Database {
  public: {
    Tables: {
      prompts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          category: 'deep_analysis' | 'meaning_engineering' | 'cognitive_frameworks' | 'consciousness_mapping' | 'advanced_systems';
          difficulty: 'foundation' | 'advanced' | 'expert' | 'architect';
          access_tier: 'explorer' | 'architect' | 'initiate' | 'master';
          preview_content: string;
          full_content: string;
          implementation_guide: string;
          use_cases: string[];
          meta_tags: string[];
          cognitive_depth_score: number;
          pattern_complexity: number;
          meaning_layers: string[];
          price_cents: number;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prompts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['prompts']['Insert']>;
      };
      user_purchases: {
        Row: {
          id: string;
          user_id: string;
          prompt_id: string;
          stripe_payment_id: string;
          amount_cents: number;
          purchased_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_purchases']['Row'], 'id' | 'purchased_at'>;
        Update: Partial<Database['public']['Tables']['user_purchases']['Insert']>;
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: 'explorer' | 'architect' | 'initiate' | 'master';
          stripe_subscription_id: string;
          status: 'active' | 'canceled' | 'past_due';
          current_period_start: string;
          current_period_end: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_subscriptions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_subscriptions']['Insert']>;
      };
    };
  };
}