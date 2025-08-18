-- PLANS-01: Validare Planuri
-- Verifică că prețurile non-free au digital root = 2
-- Asigură că planurile non-free au Stripe price IDs
-- Validează cu f_assert_plans_sane()

-- 1. Verifică dacă funcția f_is_root2_eur_cents există
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'f_is_root2_eur_cents') THEN
    RAISE EXCEPTION 'Funcția f_is_root2_eur_cents nu există. Rulează mai întâi schema completă.';
  END IF;
END $$;

-- 2. Verifică dacă funcția f_plan_percent_access există
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'f_plan_percent_access') THEN
    RAISE EXCEPTION 'Funcția f_plan_percent_access nu există. Rulează mai întâi schema completă.';
  END IF;
END $$;

-- 3. Creează view-ul pentru validarea planurilor
CREATE OR REPLACE VIEW public.v_plans_sanity AS
SELECT
  p.code,
  p.name,
  p.percent_access,
  p.monthly_price_cents AS m,
  p.annual_price_cents  AS y,
  p.stripe_price_id_month AS sm,
  p.stripe_price_id_year  AS sy,
  -- validări
  (p.percent_access = public.f_plan_percent_access(p.code)) AS ok_percent,
  ( (p.code='free' AND p.m=0 AND p.y=0) OR (p.code<>'free' AND p.m>0 AND p.y>0) ) AS ok_free_vs_paid,
  ( p.code='free' OR (public.f_is_root2_eur_cents(p.m) AND public.f_is_root2_eur_cents(p.y)) ) AS ok_root2,
  ( (p.code='free' AND p.sm IS NULL AND p.sy IS NULL)
    OR (p.code<>'free' AND p.sm IS NOT NULL AND p.sy IS NOT NULL) ) AS ok_stripe
FROM public.plans p
WHERE NOT (
  (p.percent_access = public.f_plan_percent_access(p.code))
  AND ( (p.code='free' AND p.monthly_price_cents=0 AND p.annual_price_cents=0)
        OR (p.code<>'free' AND p.monthly_price_cents>0 AND p.annual_price_cents>0) )
  AND ( p.code='free' OR (public.f_is_root2_eur_cents(p.monthly_price_cents) AND public.f_is_root2_eur_cents(p.annual_price_cents)) )
  AND ( (p.code='free' AND p.stripe_price_id_month IS NULL AND p.stripe_price_id_year IS NULL)
        OR (p.code<>'free' AND p.stripe_price_id_month IS NOT NULL AND p.stripe_price_id_year IS NOT NULL) )
);

-- 4. Creează funcția de validare
CREATE OR REPLACE FUNCTION public.f_assert_plans_sane()
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE v_cnt int;
BEGIN
  SELECT COUNT(*) INTO v_cnt FROM public.v_plans_sanity;
  IF v_cnt > 0 THEN
    RAISE EXCEPTION 'Plans seed invalid: % issue(s). See v_plans_sanity.', v_cnt;
  END IF;
END $$;

-- 5. Creează view-ul public pentru planuri
CREATE OR REPLACE VIEW public.v_plans_public AS
SELECT
  code,
  name,
  percent_access,
  monthly_price_cents,
  annual_price_cents,
  -- Nu expune Stripe IDs în view-ul public
  created_at,
  updated_at
FROM public.plans
ORDER BY public.f_plan_rank(code);

-- 6. Grant permissions
GRANT SELECT ON public.v_plans_sanity TO authenticated;
GRANT SELECT ON public.v_plans_public TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_assert_plans_sane() TO authenticated;

-- 7. Testează validarea
SELECT 'Validare PLANS-01...' AS status;

-- Verifică view-ul de sanity
SELECT 'v_plans_sanity:' AS check_name, COUNT(*) AS issues FROM public.v_plans_sanity;

-- Verifică funcția de assert
SELECT 'f_assert_plans_sane:' AS check_name, 
       CASE WHEN public.f_assert_plans_sane() IS NULL THEN 'OK' ELSE 'FAILED' END AS result;

-- Verifică view-ul public
SELECT 'v_plans_public:' AS check_name, COUNT(*) AS plans FROM public.v_plans_public;

-- 8. Raport detaliat de validare
SELECT 
  'VALIDARE COMPLETĂ PLANS-01' AS test_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TOATE VALIDĂRILE AU TRECUT'
    ELSE '❌ ' || COUNT(*) || ' PROBLEME GĂSITE'
  END AS result
FROM public.v_plans_sanity;
