-- 17_admin_roles_policies.sql
-- Admin Role System: user_roles + f_is_admin() + politici RLS complete pentru /studio
-- Context: Postgres + Supabase (roles: anon, authenticated, service_role)
-- service_role ocolește RLS by design (webhook-uri, workers)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- === 1. ENUM + tabel roluri ===
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin','member');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles(
  user_id    uuid      PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       app_role  NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- === 2. Helper: f_is_admin(user) + variantă pentru current user ===
CREATE OR REPLACE FUNCTION public.f_is_admin(p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user AND role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.f_is_admin_current_user()
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT public.f_is_admin(auth.uid())
$$;

COMMENT ON FUNCTION public.f_is_admin(uuid) IS 'True dacă user_id are rol app admin';
COMMENT ON FUNCTION public.f_is_admin_current_user() IS 'True dacă auth.uid() are rol app admin';

-- === 3. GRANTS: permite acces pe tabele adminabile doar rolului "authenticated" ===
-- RLS va filtra mai jos: numai cei cu user_roles.role='admin' pot trece
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.neurons,
  public.library_tree,
  public.library_tree_neurons,
  public.bundles,
  public.bundle_neurons,
  public.plans,
  public.tier_access_pool,
  public.pricing_rules,
  public.settings,
  public.system_alerts
TO authenticated;

-- === 4. Activează RLS pe toate tabelele administrabile ===
ALTER TABLE public.neurons                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_tree            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_tree_neurons    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_neurons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_access_pool        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts           ENABLE ROW LEVEL SECURITY;

-- === 5. Politici ADMIN "ALL" (SELECT/INSERT/UPDATE/DELETE) ===
-- USING → controlează SELECT/UPDATE/DELETE
-- WITH CHECK → controlează INSERT/UPDATE
-- TO authenticated → doar userii logați; condiția ține doar adminii reali
-- service_role ocolește integral RLS (webhooks, CRON, etc)

-- neurons (tabelul-sursă al previewului / content_full; admin are full control)
DROP POLICY IF EXISTS neurons_admin_all ON public.neurons;
CREATE POLICY neurons_admin_all
  ON public.neurons
  FOR ALL
  TO authenticated
  USING (public.f_is_admin(auth.uid()))
  WITH CHECK (public.f_is_admin(auth.uid()));

-- library_tree (sidebar ierarhic) + pivot
DROP POLICY IF EXISTS library_tree_admin_all ON public.library_tree;
CREATE POLICY library_tree_admin_all
  ON public.library_tree
  FOR ALL
  TO authenticated
  USING (public.f_is_admin(auth.uid()))
  WITH CHECK (public.f_is_admin(auth.uid()));

DROP POLICY IF EXISTS library_tree_neurons_admin_all ON public.library_tree_neurons;
CREATE POLICY library_tree_neurons_admin_all
  ON public.library_tree_neurons
  FOR ALL
  TO authenticated
  USING (public.f_is_admin(auth.uid()))
  WITH CHECK (public.f_is_admin(auth.uid()));

-- bundles + pivot
DROP POLICY IF EXISTS bundles_admin_all ON public.bundles;
CREATE POLICY bundles_admin_all
  ON public.bundles
  FOR ALL
  TO authenticated
  USING (public.f_is_admin(auth.uid()))
  WITH CHECK (public.f_is_admin(auth.uid()));

DROP POLICY IF EXISTS bundle_neurons_admin_all ON public.bundle_neurons;
CREATE POLICY bundle_neurons_admin_all
  ON public.bundle_neurons
  FOR ALL
  TO authenticated
  USING (public.f_is_admin(auth.uid()))
  WITH CHECK (public.f_is_admin(auth.uid()));

-- plans (definitor al 10/40/70/100 + root=2 pe prețuri non-free)
DROP POLICY IF EXISTS plans_admin_all ON public.plans;
CREATE POLICY plans_admin_all
  ON public.plans
  FOR ALL
  TO authenticated
  USING (public.f_is_admin(auth.uid()))
  WITH CHECK (public.f_is_admin(auth.uid()));

-- tier_access_pool (pool-ul zilnic; selecție deterministă)
DROP POLICY IF EXISTS tap_admin_all ON public.tier_access_pool;
CREATE POLICY tap_admin_all
  ON public.tier_access_pool
  FOR ALL
  TO authenticated
  USING (public.f_is_admin(auth.uid()))
  WITH CHECK (public.f_is_admin(auth.uid()));

-- pricing_rules + settings (cap 9.974€, root=2 config) + system_alerts (audit)
DROP POLICY IF EXISTS pricing_rules_admin_all ON public.pricing_rules;
CREATE POLICY pricing_rules_admin_all
  ON public.pricing_rules
  FOR ALL
  TO authenticated
  USING (public.f_is_admin(auth.uid()))
  WITH CHECK (public.f_is_admin(auth.uid()));

DROP POLICY IF EXISTS settings_admin_all ON public.settings;
CREATE POLICY settings_admin_all
  ON public.settings
  FOR ALL
  TO authenticated
  USING (public.f_is_admin(auth.uid()))
  WITH CHECK (public.f_is_admin(auth.uid()));

DROP POLICY IF EXISTS system_alerts_admin_all ON public.system_alerts;
CREATE POLICY system_alerts_admin_all
  ON public.system_alerts
  FOR ALL
  TO authenticated
  USING (public.f_is_admin(auth.uid()))
  WITH CHECK (public.f_is_admin(auth.uid()));

-- === 6. Seed & operare (exemple reale) ===

-- 1) Promovează un user la admin (înlocuiește cu UUID-ul real)
-- INSERT INTO public.user_roles(user_id, role)
-- VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','admin')
-- ON CONFLICT (user_id) DO UPDATE SET role='admin';

-- 2) Verifică
-- SELECT public.f_is_admin('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') AS is_admin;

-- === 7. Compatibilitate cu restul securității ===

-- Public/UI consumă doar v_neuron_public, v_tree_public, v_bundle_public, v_plans_public; 
-- tabelele brute rămân nevizibile pentru public/"member" (RLS + lipsa politicilor).

-- Full content iese exclusiv prin rpc_get_neuron_full (policy-gate + watermark + analytics); 
-- admin poate modifica neurons, dar livrarea către clienți rămâne filtrată. 

-- service_role (webhook Stripe, joburi cron) ocolește RLS → fluxurile financiare și cronurile rămân neafectate.

-- === 8. Smoke checklist (operabil în staging) ===

-- INSERT … user_roles(role='admin') → admin vede/editează în /studio/*. 

-- User "member" nu poate face SELECT direct pe neurons, bundles, plans, etc.; 
-- UI-ul lui folosește doar view-urile publice. 

-- pricing_rules/settings modificabile doar de admin; 
-- cap 9.974€ și root=2 rămân monitorizate. 

-- === 9. Verdict simbolic ===

-- Definește cine conduce și blindează unde conduce: 
-- adminul scrie direct în creier, publicul vede doar vitrina.
