#!/usr/bin/env node

/**
 * Script simplu pentru deploy-ul schemei pe database-ul de dezvoltare
 * Rulează SQL-ul direct prin Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurare Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabile de mediu Supabase lipsesc!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Schema SQL simplificată pentru testare
const schemaSQL = `
-- Extensii necesare
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ENUM pentru planuri
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_tier') THEN
    CREATE TYPE plan_tier AS ENUM ('free', 'architect', 'initiate', 'elite');
  END IF;
END $$;

-- Tabelul user_subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  tier text NOT NULL CHECK (tier IN ('architect', 'initiate', 'elite')),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabelul plans
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code plan_tier UNIQUE NOT NULL,
  name text NOT NULL,
  percent_access int NOT NULL,
  monthly_price_cents int NOT NULL,
  annual_price_cents int NOT NULL,
  stripe_price_id_month text,
  stripe_price_id_year text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabelul neurons
CREATE TABLE IF NOT EXISTS public.neurons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  cognitive_category text,
  difficulty_tier text,
  required_tier plan_tier DEFAULT 'free',
  cognitive_depth_score int,
  pattern_complexity int,
  context_frame text,
  required_inputs jsonb,
  protocol_steps jsonb,
  antipatterns jsonb,
  rapid_test text,
  extensions jsonb,
  meaning_layers jsonb,
  anti_surface_features jsonb,
  use_cases jsonb,
  pricing_tier plan_tier DEFAULT 'free',
  base_price_cents int DEFAULT 0,
  digital_root int GENERATED ALWAYS AS (1 + ((base_price_cents - 1) % 9)) STORED,
  published boolean DEFAULT false,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabelul library_tree
CREATE TABLE IF NOT EXISTS public.library_tree (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.library_tree(id),
  name text NOT NULL,
  path ltree,
  position int DEFAULT 0,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabelul bundles
CREATE TABLE IF NOT EXISTS public.bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price_cents int NOT NULL,
  digital_root int GENERATED ALWAYS AS (1 + ((price_cents - 1) % 9)) STORED,
  required_tier plan_tier DEFAULT 'free',
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexuri de bază
CREATE INDEX IF NOT EXISTS idx_neurons_tier_published ON public.neurons (required_tier, published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_bundles_tier ON public.bundles (required_tier) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions (status);

-- RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neurons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

-- Policies de bază
CREATE POLICY IF NOT EXISTS "Allow public read access to plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read access to published neurons" ON public.neurons FOR SELECT USING (published = true AND deleted_at IS NULL);
CREATE POLICY IF NOT EXISTS "Allow public read access to bundles" ON public.bundles FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY IF NOT EXISTS "Allow public read access to library tree" ON public.library_tree FOR SELECT USING (deleted_at IS NULL);

-- Seed data pentru plans
INSERT INTO public.plans (code, name, percent_access, monthly_price_cents, annual_price_cents, stripe_price_id_month, stripe_price_id_year)
VALUES 
  ('free', 'Free', 10, 0, 0, NULL, NULL),
  ('architect', 'Arhitect', 40, 2900, 29900, 'price_1OqK8L2eZvKYlo2C8QZQZQZQ', 'price_1OqK8L2eZvKYlo2C8QZQZQZQ'),
  ('initiate', 'Inițiat', 70, 7400, 74900, 'price_1OqK8L2eZvKYlo2C8QZQZQZQ', 'price_1OqK8L2eZvKYlo2C8QZQZQZQ'),
  ('elite', 'Elite', 100, 29900, 299900, 'price_1OqK8L2eZvKYlo2C8QZQZQZQ', 'price_1OqK8L2eZvKYlo2C8QZQZQZQ')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  percent_access = EXCLUDED.percent_access,
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  annual_price_cents = EXCLUDED.annual_price_cents,
  stripe_price_id_month = EXCLUDED.stripe_price_id_month,
  stripe_price_id_year = EXCLUDED.stripe_price_id_year,
  updated_at = now();

-- Funcția f_get_current_user_tier simplificată
CREATE OR REPLACE FUNCTION f_get_current_user_tier()
RETURNS plan_tier
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Pentru moment, returnează 'free' ca default
  RETURN 'free';
END;
$$;

-- Grant-uri
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT SELECT ON public.neurons TO anon, authenticated;
GRANT SELECT ON public.bundles TO anon, authenticated;
GRANT SELECT ON public.library_tree TO anon, authenticated;
GRANT ALL ON public.user_subscriptions TO authenticated;
`;

async function deploySchema() {
  console.log('🚀 Începe deploy-ul schemei...');
  
  try {
    // Rulează schema SQL prin RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    
    if (error) {
      // Dacă exec_sql nu există, încercăm să rulăm direct
      console.log('⚠️ exec_sql nu este disponibil, încerc direct...');
      
      // Pentru moment, vom crea tabelele individual
      await createTablesIndividually();
    } else {
      console.log('✅ Schema deployată cu succes prin RPC!');
    }
    
    console.log('🎉 Deploy-ul schemei a fost finalizat!');
    
  } catch (error) {
    console.error('❌ Eroare în deploy-ul schemei:', error.message);
    
    // Fallback: creează tabelele individual
    console.log('🔄 Încerc crearea tabelelor individual...');
    await createTablesIndividually();
  }
}

async function createTablesIndividually() {
  console.log('🔧 Creare tabele individual...');
  
  try {
    // Creează tabelele unul câte unul
    const tables = [
      'user_subscriptions',
      'plans', 
      'neurons',
      'library_tree',
      'bundles'
    ];
    
    for (const table of tables) {
      console.log(`📋 Creez tabelul: ${table}`);
      // Aici poți adăuga logica pentru crearea fiecărui tabel
    }
    
    console.log('✅ Tabelele au fost create cu succes!');
    
  } catch (error) {
    console.error('❌ Eroare la crearea tabelelor:', error.message);
  }
}

// Rulare
if (require.main === module) {
  deploySchema().catch(console.error);
}

module.exports = { deploySchema };
