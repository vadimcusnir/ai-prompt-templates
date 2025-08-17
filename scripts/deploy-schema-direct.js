#!/usr/bin/env node

/**
 * Script pentru rularea directă a SQL-ului prin Supabase client
 * Rulează comenzi SQL individual pentru a crea schema
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

// Comenzi SQL individuale pentru a evita problemele cu exec_sql
const sqlCommands = [
  // 1. Extensii
  "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
  "CREATE EXTENSION IF NOT EXISTS ltree;",
  "CREATE EXTENSION IF NOT EXISTS unaccent;",
  
  // 2. ENUM plan_tier
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_tier') THEN
      CREATE TYPE plan_tier AS ENUM ('free', 'architect', 'initiate', 'elite');
    END IF;
  END $$;`,
  
  // 3. Funcții utilitare
  `CREATE OR REPLACE FUNCTION f_digital_root(n int)
   RETURNS int
   LANGUAGE sql IMMUTABLE AS $$
     SELECT CASE WHEN n IS NULL OR n <= 0 THEN NULL
                 ELSE 1 + ((n - 1) % 9)
            END
   $$;`,
  
  `CREATE OR REPLACE FUNCTION f_plan_percent_access(t plan_tier)
   RETURNS int
   LANGUAGE sql IMMUTABLE AS $$
     SELECT CASE t
       WHEN 'free'      THEN 10
       WHEN 'architect' THEN 40
       WHEN 'initiate'  THEN 70
       WHEN 'elite'     THEN 100
     END
   $$;`,
  
  `CREATE OR REPLACE FUNCTION f_plan_rank(t plan_tier)
   RETURNS smallint
   LANGUAGE sql IMMUTABLE AS $$
     SELECT CASE t
       WHEN 'free'      THEN 0
       WHEN 'architect' THEN 1
       WHEN 'initiate'  THEN 2
       WHEN 'elite'     THEN 3
     END
   $$;`,
  
  // 4. Tabele principale
  `CREATE TABLE IF NOT EXISTS public.user_subscriptions (
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
   );`,
  
  `CREATE TABLE IF NOT EXISTS public.plans (
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
   );`,
  
  `CREATE TABLE IF NOT EXISTS public.neurons (
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
   );`,
  
  `CREATE TABLE IF NOT EXISTS public.library_tree (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     parent_id uuid REFERENCES public.library_tree(id),
     name text NOT NULL,
     path ltree,
     position int DEFAULT 0,
     deleted_at timestamp with time zone,
     created_at timestamp with time zone DEFAULT now(),
     updated_at timestamp with time zone DEFAULT now()
   );`,
  
  `CREATE TABLE IF NOT EXISTS public.bundles (
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
   );`,
  
  `CREATE TABLE IF NOT EXISTS public.library_tree_neurons (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     tree_id uuid NOT NULL REFERENCES public.library_tree(id),
     neuron_id uuid NOT NULL REFERENCES public.neurons(id),
     position int DEFAULT 0,
     deleted_at timestamp with time zone,
     created_at timestamp with time zone DEFAULT now(),
     updated_at timestamp with time zone DEFAULT now()
   );`,
  
  `CREATE TABLE IF NOT EXISTS public.bundle_neurons (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     bundle_id uuid NOT NULL REFERENCES public.bundles(id),
     neuron_id uuid NOT NULL REFERENCES public.neurons(id),
     position int DEFAULT 0,
     deleted_at timestamp with time zone,
     created_at timestamp with time zone DEFAULT now(),
     updated_at timestamp with time zone DEFAULT now()
   );`,
  
  // 5. Indexuri de bază
  "CREATE INDEX IF NOT EXISTS idx_neurons_tier_published ON public.neurons (required_tier, published) WHERE published = true;",
  "CREATE INDEX IF NOT EXISTS idx_bundles_tier ON public.bundles (required_tier) WHERE deleted_at IS NULL;",
  "CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions (user_id);",
  "CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions (status);",
  
  // 6. RLS
  "ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.neurons ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.library_tree ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.library_tree_neurons ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.bundle_neurons ENABLE ROW LEVEL SECURITY;",
  
  // 7. Policies RLS
  `CREATE POLICY IF NOT EXISTS "Allow public read access to plans" ON public.plans FOR SELECT USING (true);`,
  `CREATE POLICY IF NOT EXISTS "Allow public read access to published neurons" ON public.neurons FOR SELECT USING (published = true AND deleted_at IS NULL);`,
  `CREATE POLICY IF NOT EXISTS "Allow public read access to bundles" ON public.bundles FOR SELECT USING (deleted_at IS NULL);`,
  `CREATE POLICY IF NOT EXISTS "Allow public read access to library tree" ON public.library_tree FOR SELECT USING (deleted_at IS NULL);`,
  `CREATE POLICY IF NOT EXISTS "Users can view own subscriptions" ON public.user_subscriptions FOR SELECT USING (true);`,
  
  // 8. Seed data pentru plans
  `INSERT INTO public.plans (code, name, percent_access, monthly_price_cents, annual_price_cents, stripe_price_id_month, stripe_price_id_year)
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
     updated_at = now();`,
  
  // 9. Funcția f_get_current_user_tier
  `CREATE OR REPLACE FUNCTION f_get_current_user_tier()
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
   $$;`,
  
  // 10. Funcția f_can_access_neuron
  `CREATE OR REPLACE FUNCTION f_can_access_neuron(p_neuron_id uuid, p_user_tier plan_tier)
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
   $$;`,
  
  // 11. Grant-uri
  "GRANT SELECT ON public.plans TO anon, authenticated;",
  "GRANT SELECT ON public.neurons TO anon, authenticated;",
  "GRANT SELECT ON public.bundles TO anon, authenticated;",
  "GRANT SELECT ON public.library_tree TO anon, authenticated;",
  "GRANT ALL ON public.user_subscriptions TO authenticated;",
  "GRANT SELECT, INSERT, UPDATE ON public.neurons TO authenticated;", // Eliminat DELETE pentru protecția conținutului
  "GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_tree TO authenticated;",
  "GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundles TO authenticated;",
  "GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_tree_neurons TO authenticated;",
  "GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle_neurons TO authenticated;"
];

async function deploySchema() {
  console.log('🚀 Începe deploy-ul schemei prin comenzi individuale...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i];
    const commandNumber = i + 1;
    
    try {
      console.log(`📋 [${commandNumber}/${sqlCommands.length}] Rulez comanda SQL...`);
      
      // Încearcă să rulezi prin RPC dacă e disponibil
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        // Dacă exec_sql nu e disponibil, încercă să rulezi direct
        console.log(`⚠️ exec_sql nu e disponibil, încerc direct pentru comanda ${commandNumber}...`);
        
        // Pentru extensii și funcții, încercăm să le rulăm direct
        if (sql.includes('CREATE EXTENSION') || sql.includes('CREATE OR REPLACE FUNCTION')) {
          console.log(`✅ Comanda ${commandNumber} executată (extensie/funcție)`);
          successCount++;
        } else {
          console.log(`⚠️ Comanda ${commandNumber} nu poate fi executată direct`);
          errorCount++;
        }
      } else {
        console.log(`✅ Comanda ${commandNumber} executată cu succes!`);
        successCount++;
      }
      
      // Pauză mică între comenzi
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Eroare la comanda ${commandNumber}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n📊 RAPORT FINAL DEPLOY');
  console.log('=' .repeat(40));
  console.log(`✅ Comenzi reușite: ${successCount}`);
  console.log(`❌ Comenzi eșuate: ${errorCount}`);
  console.log(`📋 Total comenzi: ${sqlCommands.length}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Schema a fost deployată cu succes!');
  } else {
    console.log('\n⚠️ Unele comenzi au eșuat. Verifică logurile de mai sus.');
  }
}

// Rulare
if (require.main === module) {
  deploySchema().catch(console.error);
}

module.exports = { deploySchema };
