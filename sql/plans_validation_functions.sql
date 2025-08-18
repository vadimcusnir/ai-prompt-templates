-- PLANS-01: Funcții de validare pentru planuri
-- Acest script implementează funcțiile necesare pentru validarea planurilor

-- 1. Funcția pentru verificarea digital root = 2
CREATE OR REPLACE FUNCTION public.f_is_root2_eur_cents(cents int)
RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE 
    WHEN cents IS NULL OR cents <= 0 THEN false
    ELSE (
      SELECT CASE 
        WHEN n IS NULL OR n <= 0 THEN false
        ELSE 1 + ((n - 1) % 9) = 2
      END
      FROM (SELECT cents / 100 AS n) AS sub
    )
  END
$$;

-- 2. View pentru validarea planurilor
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

-- 3. Funcția de validare principală
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

-- 4. View public pentru planuri
CREATE OR REPLACE VIEW public.v_plans_public AS
SELECT
  code,
  name,
  percent_access,
  monthly_price_cents,
  annual_price_cents,
  created_at,
  updated_at
FROM public.plans
ORDER BY public.f_plan_rank(code);

-- 5. Grant permissions
GRANT SELECT ON public.v_plans_sanity TO authenticated;
GRANT SELECT ON public.v_plans_public TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_assert_plans_sane() TO authenticated;

-- 6. Testează funcțiile
SELECT 'Testing f_is_root2_eur_cents...' AS test;
SELECT 
  public.f_is_root2_eur_cents(2900) AS architect_monthly,
  public.f_is_root2_eur_cents(29900) AS architect_annual,
  public.f_is_root2_eur_cents(7400) AS initiate_monthly,
  public.f_is_root2_eur_cents(74900) AS initiate_annual,
  public.f_is_root2_eur_cents(29900) AS elite_monthly,
  public.f_is_root2_eur_cents(299900) AS elite_annual;

SELECT 'Testing v_plans_sanity...' AS test;
SELECT COUNT(*) AS issues FROM public.v_plans_sanity;

SELECT 'Testing f_assert_plans_sane...' AS test;
SELECT public.f_assert_plans_sane();

SELECT 'Testing v_plans_public...' AS test;
SELECT COUNT(*) AS plans FROM public.v_plans_public;

-- 7. Raport final
SELECT 
  'VALIDARE COMPLETĂ PLANS-01' AS test_name,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.v_plans_sanity) = 0 THEN '✅ TOATE VALIDĂRILE AU TRECUT'
    ELSE '❌ ' || (SELECT COUNT(*) FROM public.v_plans_sanity) || ' PROBLEME GĂSITE'
  END AS result;
