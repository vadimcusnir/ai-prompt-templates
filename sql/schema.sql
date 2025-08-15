-- AI-PROMPTS TABLES

-- Prompts table
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT CHECK (category IN ('deep_analysis', 'meaning_engineering', 'cognitive_frameworks', 'consciousness_mapping', 'advanced_systems')) NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('foundation', 'advanced', 'expert', 'architect')) NOT NULL,
  access_tier TEXT CHECK (access_tier IN ('explorer', 'architect', 'initiate', 'master')) NOT NULL,
  preview_content TEXT NOT NULL,
  full_content TEXT NOT NULL,
  implementation_guide TEXT NOT NULL,
  use_cases TEXT[] DEFAULT '{}',
  meta_tags TEXT[] DEFAULT '{}',
  cognitive_depth_score INTEGER CHECK (cognitive_depth_score >= 1 AND cognitive_depth_score <= 10) NOT NULL,
  pattern_complexity INTEGER CHECK (pattern_complexity >= 1 AND pattern_complexity <= 5) NOT NULL,
  meaning_layers TEXT[] DEFAULT '{}',
  price_cents INTEGER NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User purchases table  
CREATE TABLE user_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  stripe_payment_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT CHECK (tier IN ('explorer', 'architect', 'initiate', 'master')) NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due')) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_difficulty ON prompts(difficulty);
CREATE INDEX idx_prompts_access_tier ON prompts(access_tier);
CREATE INDEX idx_prompts_slug ON prompts(slug);
CREATE INDEX idx_prompts_featured ON prompts(is_featured);
CREATE INDEX idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- GIN index for text search
CREATE INDEX idx_prompts_search ON prompts USING GIN (
  to_tsvector('english', title || ' ' || preview_content || ' ' || array_to_string(meta_tags, ' '))
);

-- RLS policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read access for prompts
CREATE POLICY "Public prompts read" ON prompts FOR SELECT USING (true);

-- Users can only see their own purchases and subscriptions
CREATE POLICY "Users own purchases" ON user_purchases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own subscriptions" ON user_subscriptions FOR ALL USING (auth.uid() = user_id);