-- AI-PROMPT-TEMPLATES: SCHEMA COMPLET ACTUALIZAT
-- Conform planului de implementare

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums pentru categorii și tiers
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
  digital_root INTEGER CHECK (digital_root BETWEEN 2 AND 2),
  
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

-- Indexes pentru performance
CREATE INDEX idx_prompts_category ON prompts(cognitive_category);
CREATE INDEX idx_prompts_tier ON prompts(difficulty_tier, required_tier);
CREATE INDEX idx_prompts_published ON prompts(is_published, published_at);
CREATE INDEX idx_prompts_search ON prompts USING GIN (to_tsvector('english', title || ' ' || preview_content));

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);

CREATE INDEX idx_user_purchases_user ON user_purchases(user_id);
CREATE INDEX idx_user_purchases_item ON user_purchases(item_type, item_id);

-- RLS policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- Public read access for prompts and bundles
CREATE POLICY "Public prompts read" ON prompts FOR SELECT USING (is_published = true);
CREATE POLICY "Public bundles read" ON bundles FOR SELECT USING (is_active = true);

-- Users can only see their own purchases and subscriptions
CREATE POLICY "Users own subscriptions" ON user_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own purchases" ON user_purchases FOR ALL USING (auth.uid() = user_id);

-- Admin access (service role)
CREATE POLICY "Admin full access" ON prompts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access" ON bundles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access" ON user_subscriptions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access" ON user_purchases FOR ALL USING (auth.role() = 'service_role');
