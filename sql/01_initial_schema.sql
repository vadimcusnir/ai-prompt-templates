-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums for categorization
CREATE TYPE cognitive_category AS ENUM (
  'deep_analysis',
  'meaning_engineering', 
  'cognitive_frameworks',
  'consciousness_mapping',
  'advanced_systems'
);

CREATE TYPE difficulty_tier AS ENUM ('foundation', 'advanced', 'expert', 'architect');
CREATE TYPE access_tier AS ENUM ('explorer', 'architect', 'initiate', 'master');

-- Main prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  -- Categorization
  cognitive_category cognitive_category NOT NULL,
  difficulty_tier difficulty_tier NOT NULL,
  required_tier access_tier DEFAULT 'explorer',
  
  -- Content
  preview_content TEXT NOT NULL,
  full_content TEXT NOT NULL,
  implementation_guide TEXT,
  use_cases JSONB DEFAULT '{}',
  meta_tags TEXT[] DEFAULT '{}',
  
  -- Cognitive metadata
  cognitive_depth_score INTEGER CHECK (cognitive_depth_score BETWEEN 1 AND 10),
  pattern_complexity INTEGER CHECK (pattern_complexity BETWEEN 1 AND 5),
  meaning_layers TEXT[] DEFAULT '{}',
  anti_surface_features TEXT[] DEFAULT '{}',
  
  -- Pricing
  base_price_cents INTEGER NOT NULL,
  digital_root INTEGER CHECK (digital_root = 2),
  
  -- SEO & Metadata
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  -- Status
  is_published BOOLEAN DEFAULT FALSE,
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10)
);

-- Bundles table
CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Bundle contents
  prompt_ids UUID[] DEFAULT '{}',
  category_filter cognitive_category,
  tier_filter difficulty_tier,
  
  -- Pricing
  price_cents INTEGER NOT NULL,
  original_price_cents INTEGER,
  discount_percentage INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- User subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier access_tier NOT NULL,
  
  -- Stripe data
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  
  -- Status
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User purchases (one-time)
CREATE TABLE user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Purchase type
  item_type TEXT CHECK (item_type IN ('prompt', 'bundle')),
  item_id UUID NOT NULL,
  
  -- Stripe data
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  
  -- Payment details
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT CHECK (status IN ('succeeded', 'pending', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_prompts_category ON prompts(cognitive_category);
CREATE INDEX idx_prompts_tier ON prompts(difficulty_tier, required_tier);
CREATE INDEX idx_prompts_published ON prompts(is_published, published_at);
CREATE INDEX idx_prompts_search ON prompts USING GIN (to_tsvector('english', title || ' ' || preview_content));
CREATE INDEX idx_prompts_price ON prompts(base_price_cents);

CREATE INDEX idx_bundles_active ON bundles(is_active);
CREATE INDEX idx_bundles_category ON bundles(category_filter);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

CREATE INDEX idx_user_purchases_user ON user_purchases(user_id);
CREATE INDEX idx_user_purchases_item ON user_purchases(item_type, item_id);
CREATE INDEX idx_user_purchases_status ON user_purchases(status);

-- Row Level Security (RLS) policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- Public read access for published prompts
CREATE POLICY "Anyone can view published prompts" ON prompts FOR SELECT USING (is_published = true);

-- Public read access for active bundles
CREATE POLICY "Anyone can view active bundles" ON bundles FOR SELECT USING (is_active = true);

-- Users can only view their own subscriptions and purchases
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own purchases" ON user_purchases FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role can manage prompts" ON prompts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage bundles" ON bundles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage purchases" ON user_purchases FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundles_updated_at BEFORE UPDATE ON bundles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_purchases_updated_at BEFORE UPDATE ON user_purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();