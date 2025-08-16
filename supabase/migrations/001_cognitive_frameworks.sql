-- 📄 FIȘIER: supabase/migrations/001_cognitive_frameworks.sql
CREATE TABLE IF NOT EXISTS cognitive_frameworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cognitive_category TEXT NOT NULL,
  difficulty_tier TEXT NOT NULL,
  required_tier TEXT NOT NULL,
  cognitive_depth_score INTEGER NOT NULL CHECK (cognitive_depth_score >= 1 AND cognitive_depth_score <= 10),
  pattern_complexity INTEGER NOT NULL CHECK (pattern_complexity >= 1 AND pattern_complexity <= 5),
  context_frame TEXT NOT NULL,
  required_inputs JSONB NOT NULL,
  protocol_steps JSONB NOT NULL,
  antipatterns JSONB NOT NULL,
  rapid_test TEXT NOT NULL,
  extensions JSONB,
  meaning_layers JSONB,
  anti_surface_features JSONB,
  use_cases JSONB,
  pricing_tier TEXT NOT NULL,
  base_price_cents INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices pentru performance
CREATE INDEX IF NOT EXISTS idx_cognitive_frameworks_category ON cognitive_frameworks(cognitive_category);
CREATE INDEX IF NOT EXISTS idx_cognitive_frameworks_tier ON cognitive_frameworks(required_tier);
CREATE INDEX IF NOT EXISTS idx_cognitive_frameworks_difficulty ON cognitive_frameworks(difficulty_tier);

-- RLS pentru security
ALTER TABLE cognitive_frameworks ENABLE ROW LEVEL SECURITY;

-- Policy pentru public read
CREATE POLICY "Public can read frameworks" ON cognitive_frameworks
  FOR SELECT USING (true);

-- Policy pentru admin insert/update
CREATE POLICY "Admin can insert frameworks" ON cognitive_frameworks
  FOR INSERT WITH CHECK (true);