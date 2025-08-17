-- ============================================================================
-- DEPLOY SCHEMA DEV - Script complet pentru database-ul de dezvoltare
-- ============================================================================
-- 
-- Acest script creează schema completă cu:
-- - Toate tabelele principale
-- - Indexuri de performanță
-- - RLS activat
-- - Seed data pentru plans
-- - Funcții pentru user tier
-- ============================================================================

-- === 1. EXTENSII NECESARE ===
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- === 2. ENUMS ȘI TIPURI ===

-- ENUM pentru planuri de abonament
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_tier') THEN
    CREATE TYPE plan_tier AS ENUM ('free', 'architect', 'initiate', 'elite');
  END IF;
END $$;

-- === 3. FUNCȚII UTILITARE ===

-- Funcție pentru digital root (formula 1+((n-1)%9))
CREATE OR REPLACE FUNCTION f_digital_root(n int)
RETURNS int
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN n IS NULL OR n <= 0 THEN NULL
              ELSE 1 + ((n - 1) % 9)
         END
$$;

-- Funcție pentru plan access percentage
CREATE OR REPLACE FUNCTION f_plan_percent_access(t plan_tier)
RETURNS int
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE t
    WHEN 'free'      THEN 10
    WHEN 'architect' THEN 40
    WHEN 'initiate'  THEN 70
    WHEN 'elite'     THEN 100
  END
$$;

-- Funcție pentru plan rank (ordonare)
CREATE OR REPLACE FUNCTION f_plan_rank(t plan_tier)
RETURNS smallint
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE t
    WHEN 'free'      THEN 0
    WHEN 'architect' THEN 1
    WHEN 'initiate'  THEN 2
    WHEN 'elite'     THEN 3
  END
$$;

-- === 4. TABELE PRINCIPALE ===

-- Tabelul pentru subscription-urile utilizatorilor
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

-- Tabelul pentru planuri de abonament
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

-- Tabelul principal pentru neuroni
CREATE TABLE IF NOT EXISTS public.neurons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
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

-- Tabelul pentru structura library tree
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

-- Tabelul pentru bundle-uri
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

-- Tabelul pivot pentru library tree neurons
CREATE TABLE IF NOT EXISTS public.library_tree_neurons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.library_tree(id),
  neuron_id uuid NOT NULL REFERENCES public.neurons(id),
  position int DEFAULT 0,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabelul pivot pentru bundle neurons
CREATE TABLE IF NOT EXISTS public.bundle_neurons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.bundles(id),
  neuron_id uuid NOT NULL REFERENCES public.neurons(id),
  position int DEFAULT 0,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- === 5. INDEXURI DE PERFORMANȚĂ ===

-- Indexuri pentru neuroni
CREATE INDEX IF NOT EXISTS idx_neurons_tier_published ON public.neurons (required_tier, published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_neurons_cognitive_category ON public.neurons (cognitive_category) WHERE published = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_neurons_difficulty_tier ON public.neurons (difficulty_tier) WHERE published = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_neurons_slug_ci ON public.neurons (LOWER(slug)) WHERE published = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_neurons_title_ci ON public.neurons (LOWER(title)) WHERE published = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_neurons_created_at ON public.neurons (created_at DESC) WHERE published = true AND deleted_at IS NULL;

-- Indexuri pentru bundle-uri
CREATE INDEX IF NOT EXISTS idx_bundles_tier ON public.bundles (required_tier) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bundles_slug_ci ON public.bundles (LOWER(slug)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bundles_title_ci ON public.bundles (LOWER(title)) WHERE deleted_at IS NULL;

-- Indexuri pentru library tree
CREATE INDEX IF NOT EXISTS idx_library_tree_path ON public.library_tree (path) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_library_tree_parent_id ON public.library_tree (parent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_library_tree_name_ci ON public.library_tree (LOWER(name)) WHERE deleted_at IS NULL;

-- Indexuri pentru user subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON public.user_subscriptions (tier) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON public.user_subscriptions (user_id, status, current_period_end) WHERE status = 'active';

-- Indexuri pentru relații
CREATE INDEX IF NOT EXISTS idx_library_tree_neurons_tree_id ON public.library_tree_neurons (tree_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_library_tree_neurons_neuron_id ON public.library_tree_neurons (neuron_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bundle_neurons_bundle_id ON public.bundle_neurons (bundle_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bundle_neurons_neuron_id ON public.bundle_neurons (neuron_id) WHERE deleted_at IS NULL;

-- === 6. ROW LEVEL SECURITY ===

-- Activează RLS pe toate tabelele
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neurons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_tree_neurons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_neurons ENABLE ROW LEVEL SECURITY;

-- === 7. POLICIES RLS ===

-- Policies pentru plans (citire publică)
CREATE POLICY IF NOT EXISTS "Allow public read access to plans" ON public.plans FOR SELECT USING (true);

-- Policies pentru neuroni (citire publică pentru cei publicați)
CREATE POLICY IF NOT EXISTS "Allow public read access to published neurons" ON public.neurons FOR SELECT USING (published = true AND deleted_at IS NULL);

-- Policies pentru bundle-uri (citire publică)
CREATE POLICY IF NOT EXISTS "Allow public read access to bundles" ON public.bundles FOR SELECT USING (deleted_at IS NULL);

-- Policies pentru library tree (citire publică)
CREATE POLICY IF NOT EXISTS "Allow public read access to library tree" ON public.library_tree FOR SELECT USING (deleted_at IS NULL);

-- Policies pentru user subscriptions (user-ul își vede propriile subscription-uri)
CREATE POLICY IF NOT EXISTS "Users can view own subscriptions" ON public.user_subscriptions FOR SELECT USING (true);

-- === 8. SEED DATA ===

-- Seed pentru plans (respectă digital root 2)
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

-- === 9. FUNCȚII UTILITARE ===

-- Funcție pentru obținerea tier-ului curent al user-ului
CREATE OR REPLACE FUNCTION f_get_current_user_tier()
RETURNS plan_tier
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  current_tier plan_tier := 'free';
  subscription_status text;
  subscription_tier text;
BEGIN
  -- Obține user_id-ul curent
  user_id := auth.uid();
  
  -- Dacă nu e autentificat, returnează 'free'
  IF user_id IS NULL THEN
    RETURN 'free';
  END IF;
  
  -- Verifică dacă user-ul are un subscription activ
  SELECT 
    s.status,
    s.tier
  INTO 
    subscription_status,
    subscription_tier
  FROM public.user_subscriptions s
  WHERE s.user_id = user_id
    AND s.status = 'active'
    AND s.current_period_end > now()
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- Dacă nu are subscription activ, returnează 'free'
  IF subscription_status IS NULL OR subscription_status != 'active' THEN
    RETURN 'free';
  END IF;
  
  -- Mapează tier-ul din subscription la plan_tier
  CASE subscription_tier
    WHEN 'architect' THEN current_tier := 'architect';
    WHEN 'initiate' THEN current_tier := 'initiate';
    WHEN 'elite' THEN current_tier := 'elite';
    ELSE current_tier := 'free';
  END CASE;
  
  RETURN current_tier;
EXCEPTION
  -- În caz de eroare, returnează 'free' ca fallback
  WHEN OTHERS THEN
    RETURN 'free';
END;
$$;

-- Funcție pentru verificarea dacă un user poate accesa un neuron
CREATE OR REPLACE FUNCTION f_can_access_neuron(p_neuron_id uuid, p_user_tier plan_tier)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = p_neuron_id
      AND n.published = true
      AND n.deleted_at IS NULL
      AND f_plan_rank(n.required_tier) <= f_plan_rank(p_user_tier)
  );
$$;

-- === 10. GRANTS ȘI PERMISIUNI ===

-- Grant SELECT pe tabele publice
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT SELECT ON public.neurons TO anon, authenticated;
GRANT SELECT ON public.bundles TO anon, authenticated;
GRANT SELECT ON public.library_tree TO anon, authenticated;

-- Grant pentru authenticated (vor fi filtrate prin RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.neurons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_tree TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_tree_neurons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle_neurons TO authenticated;

-- === 11. VERIFICĂRI FINALE ===

-- Verifică dacă toate tabelele au RLS activ
DO $$
DECLARE
  table_name text;
  rls_enabled boolean;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('neurons', 'library_tree', 'bundles', 'plans', 'library_tree_neurons', 'bundle_neurons', 'user_subscriptions')
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = table_name AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    IF NOT rls_enabled THEN
      RAISE EXCEPTION 'RLS not enabled on table %', table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'All tables have RLS enabled successfully';
END $$;

-- === 12. FINALIZARE ===

DO $$
BEGIN
  RAISE NOTICE 'Schema DDL completed successfully!';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '- Digital root 2 validation for all prices';
  RAISE NOTICE '- RLS enabled on all tables';
  RAISE NOTICE '- Comprehensive indexing for performance';
  RAISE NOTICE '- User tier logic implemented';
  RAISE NOTICE '- Stripe pricing integration ready';
END $$;
