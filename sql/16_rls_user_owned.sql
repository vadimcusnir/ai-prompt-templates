-- 16_rls_user_owned.sql
-- Security & Access Control: RLS complet + Views publice + REVOKE pe tabele brute
-- Context: Postgres + Supabase (roles: anon, authenticated, service_role)
-- service_role ocolește RLS by design (webhook-uri, workers)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- === A. RLS "self-only" pe tabelele user-owned ===

-- user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS us_select_self ON public.user_subscriptions;
CREATE POLICY us_select_self
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- user_purchases
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS up_select_self ON public.user_purchases;
CREATE POLICY up_select_self
  ON public.user_purchases
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- user_entitlements
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ue_select_self ON public.user_entitlements;
CREATE POLICY ue_select_self
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- purchase_receipts
ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pr_select_self ON public.purchase_receipts;
CREATE POLICY pr_select_self
  ON public.purchase_receipts
  FOR SELECT
  TO authenticated
  USING (
    user_purchase_id IN (
      SELECT id FROM public.user_purchases WHERE user_id = auth.uid()
    )
  );

-- === B. Views publice (read-only) ===

-- 1) neuroni (preview)
CREATE OR REPLACE VIEW public.v_neuron_public AS
SELECT n.id, n.slug, n.title, n.summary, n.required_tier, n.price_cents
FROM public.neurons n
WHERE n.published = TRUE;

-- 2) tree (sidebar + copii din MV dacă există)
CREATE OR REPLACE VIEW public.v_tree_public AS
SELECT lt.path, lt.name,
       COALESCE(mv.children_count, 0) AS children_count
FROM public.library_tree lt
LEFT JOIN public.mv_tree_counts mv ON mv.id = lt.id;

-- 3) bundles (listă pentru /bundles și /bundles/:slug)
CREATE OR REPLACE VIEW public.v_bundle_public AS
SELECT b.id, b.slug, b.title, b.description, b.price_cents, b.required_tier,
       (SELECT COUNT(*) FROM public.bundle_neurons bn WHERE bn.bundle_id=b.id) AS items
FROM public.bundles b;

-- 4) plans (pentru /pricing; ordonat după rang)
CREATE OR REPLACE VIEW public.v_plans_public AS
SELECT code, name, percent_access, monthly_price_cents, annual_price_cents
FROM public.plans
ORDER BY CASE code WHEN 'free' THEN 0 WHEN 'architect' THEN 1 WHEN 'initiate' THEN 2 ELSE 3 END;

-- === C. GRANTS pe VIEWS (public) ===
GRANT SELECT ON public.v_neuron_public TO anon, authenticated;
GRANT SELECT ON public.v_tree_public   TO anon, authenticated;
GRANT SELECT ON public.v_bundle_public TO anon, authenticated;
GRANT SELECT ON public.v_plans_public  TO anon, authenticated;

-- === D. REVOKE pe tabele brute (client) ===

-- Neuroni: blochează acces direct (full text & content_full protejate); livrare doar prin view + RPC
REVOKE ALL ON public.neurons FROM anon, authenticated;

-- Librărie & pivot: livrare doar prin v_tree_public (și eventual RPC); blochează acces direct
REVOKE ALL ON public.library_tree         FROM anon, authenticated;
REVOKE ALL ON public.library_tree_neurons FROM anon, authenticated;

-- Bundles & plans: livrare doar prin views publice
REVOKE ALL ON public.bundles FROM anon, authenticated;
REVOKE ALL ON public.plans   FROM anon, authenticated;

-- === E. Smoke-tests (execută imediat după migrare) ===

-- 1) Public: poate citi views, nu tabele
-- SET ROLE anon;
-- SELECT * FROM public.v_neuron_public LIMIT 1;
-- SELECT * FROM public.v_tree_public   LIMIT 1;
-- SELECT * FROM public.v_bundle_public LIMIT 1;
-- SELECT * FROM public.v_plans_public  LIMIT 1;

-- ar trebui să EȘUEZE (permission denied):
-- SELECT * FROM public.neurons LIMIT 1;
-- SELECT * FROM public.library_tree LIMIT 1;
-- SELECT * FROM public.bundles LIMIT 1;
-- SELECT * FROM public.plans   LIMIT 1;
-- RESET ROLE;

-- 2) Auth user U: vede DOAR propriile subscriptions/purchases/entitlements/receipts
-- SET ROLE authenticated;
-- (asumă că tokenul setat în sesiune are auth.uid() = :uid)
-- SELECT COUNT(*) FROM public.user_subscriptions WHERE user_id = auth.uid();
-- SELECT COUNT(*) FROM public.user_purchases    WHERE user_id = auth.uid();
-- SELECT COUNT(*) FROM public.user_entitlements WHERE user_id = auth.uid();
-- SELECT COUNT(*) FROM public.purchase_receipts pr
-- WHERE pr.user_purchase_id IN (SELECT id FROM public.user_purchases WHERE user_id = auth.uid());

-- === F. Note operative (anti-regresie) ===

-- Nu acorda niciodată SELECT direct pe content_full (tabelul neurons). 
-- Conținutul complet iese doar prin rpc_get_neuron_full (RLS, OR-logic acces, watermark, logging). 

-- Stripe/webhooks rulează cu service_role → RLS nu îi afectează; 
-- clienții (anon/authenticated) calcă doar view-uri publice și tabele "self-only". 

-- /studio: folosește politicile admin de la §B pentru vizualizare completă (fără a slăbi publicul).

-- Verdict simbolic: Închide circuitul: user-owned = proprietar, public = vitrină (views), 
-- full = RPC sub RLS — arhitectura care vinde fără să expună nervul.
