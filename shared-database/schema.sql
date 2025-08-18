-- Multi-Brand AI Platform Database Schema
-- Suport pentru ai-prompt-templates și 8vultus

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Brands table
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  theme_config JSONB NOT NULL DEFAULT '{}',
  features TEXT[] NOT NULL DEFAULT '{}',
  stripe_account_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with brand association
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  encrypted_password VARCHAR(255),
  tier VARCHAR(50) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, email)
);

-- Prompts table with brand association
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  cognitive_category VARCHAR(100) NOT NULL,
  difficulty_tier VARCHAR(50) NOT NULL,
  required_tier VARCHAR(50) NOT NULL DEFAULT 'free',
  preview_content TEXT NOT NULL,
  full_content TEXT NOT NULL,
  implementation_guide TEXT,
  use_cases JSONB,
  meta_tags TEXT[] DEFAULT '{}',
  cognitive_depth_score INTEGER NOT NULL DEFAULT 1,
  pattern_complexity INTEGER NOT NULL DEFAULT 1,
  meaning_layers TEXT[] DEFAULT '{}',
  anti_surface_features TEXT[] DEFAULT '{}',
  base_price_cents INTEGER NOT NULL DEFAULT 0,
  digital_root INTEGER,
  meta_title VARCHAR(255),
  meta_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  quality_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(brand_id, slug)
);

-- Bundles table with brand association
CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User prompts access tracking
CREATE TABLE user_prompt_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  access_type VARCHAR(50) DEFAULT 'view', -- view, download, favorite
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prompt_id, access_type)
);

-- Stripe events log
CREATE TABLE stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search index for prompts
CREATE TABLE prompts_search (
  id UUID PRIMARY KEY REFERENCES prompts(id) ON DELETE CASCADE,
  search_vector tsvector,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_users_brand_id ON users(brand_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);

CREATE INDEX idx_prompts_brand_id ON prompts(brand_id);
CREATE INDEX idx_prompts_slug ON prompts(slug);
CREATE INDEX idx_prompts_category ON prompts(cognitive_category);
CREATE INDEX idx_prompts_tier ON prompts(required_tier);
CREATE INDEX idx_prompts_published ON prompts(is_published, published_at);
CREATE INDEX idx_prompts_created_at ON prompts(created_at);

CREATE INDEX idx_bundles_brand_id ON bundles(brand_id);
CREATE INDEX idx_bundles_active ON bundles(is_active);

CREATE INDEX idx_user_prompt_access_user_id ON user_prompt_access(user_id);
CREATE INDEX idx_user_prompt_access_prompt_id ON user_prompt_access(prompt_id);

CREATE INDEX idx_stripe_events_brand_id ON stripe_events(brand_id);
CREATE INDEX idx_stripe_events_type ON stripe_events(event_type);
CREATE INDEX idx_stripe_events_processed ON stripe_events(processed);

CREATE INDEX idx_analytics_events_brand_id ON analytics_events(brand_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

CREATE INDEX idx_prompts_search_brand_id ON prompts_search(brand_id);
CREATE INDEX idx_prompts_search_vector ON prompts_search USING gin(search_vector);

-- Create search vector trigger function
CREATE OR REPLACE FUNCTION update_prompts_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.preview_content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.meta_tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector updates
CREATE TRIGGER prompts_search_vector_update
  BEFORE INSERT OR UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_prompts_search_vector();

-- Insert initial brand data
INSERT INTO brands (id, name, domain, theme_config, features) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'AI Prompt Templates', 'ai-prompt-templates.com', 
   '{"primary": "#3B82F6", "secondary": "#1E40AF", "accent": "#60A5FA"}',
   ARRAY['cognitive_frameworks', 'meaning_engineering', 'deep_analysis', 'consciousness_mapping']),
  ('550e8400-e29b-41d4-a716-446655440001', '8Vultus', '8vultus.com',
   '{"primary": "#8B5CF6", "secondary": "#7C3AED", "accent": "#A78BFA"}',
   ARRAY['consciousness_mapping', 'advanced_systems', 'expert_tier', 'deep_analysis']);

-- Create function to set brand context for RLS
CREATE OR REPLACE FUNCTION set_brand_context(brand_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.brand_id', brand_id::text, false);
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompt_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts_search ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can only access their brand's users" ON users
  FOR ALL USING (brand_id = current_setting('app.brand_id')::UUID);

-- RLS Policies for prompts
CREATE POLICY "Users can only access their brand's prompts" ON prompts
  FOR ALL USING (brand_id = current_setting('app.brand_id')::UUID);

-- RLS Policies for bundles
CREATE POLICY "Users can only access their brand's bundles" ON bundles
  FOR ALL USING (brand_id = current_setting('app.brand_id')::UUID);

-- RLS Policies for user_prompt_access
CREATE POLICY "Users can only access their brand's prompt access records" ON user_prompt_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM prompts p 
      WHERE p.id = user_prompt_access.prompt_id 
      AND p.brand_id = current_setting('app.brand_id')::UUID
    )
  );

-- RLS Policies for stripe_events
CREATE POLICY "Users can only access their brand's stripe events" ON stripe_events
  FOR ALL USING (brand_id = current_setting('app.brand_id')::UUID);

-- RLS Policies for analytics_events
CREATE POLICY "Users can only access their brand's analytics events" ON analytics_events
  FOR ALL USING (brand_id = current_setting('app.brand_id')::UUID);

-- RLS Policies for prompts_search
CREATE POLICY "Users can only access their brand's search index" ON prompts_search
  FOR ALL USING (brand_id = current_setting('app.brand_id')::UUID);

-- Create function to get brand ID from domain
CREATE OR REPLACE FUNCTION get_brand_id_from_domain(domain_name TEXT)
RETURNS UUID AS $$
DECLARE
  brand_uuid UUID;
BEGIN
  SELECT id INTO brand_uuid FROM brands WHERE domain = domain_name;
  RETURN brand_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has access to prompt
CREATE OR REPLACE FUNCTION check_prompt_access(user_uuid UUID, prompt_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  required_tier TEXT;
BEGIN
  -- Get user tier
  SELECT tier INTO user_tier FROM users WHERE id = user_uuid;
  
  -- Get required tier for prompt
  SELECT required_tier INTO required_tier FROM prompts WHERE id = prompt_uuid;
  
  -- Check access based on tier hierarchy
  RETURN CASE 
    WHEN user_tier = 'elite' THEN true
    WHEN user_tier = 'initiate' AND required_tier IN ('free', 'architect', 'initiate') THEN true
    WHEN user_tier = 'architect' AND required_tier IN ('free', 'architect') THEN true
    WHEN user_tier = 'free' AND required_tier = 'free' THEN true
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql;
