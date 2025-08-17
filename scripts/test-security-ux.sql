-- test-security-ux.sql
-- Testing + Smoke Tests pentru toate componentele de Security & UX
-- Rulează în ordine: 16 → 17 → 18 → 27 → 28
-- Context: Supabase production/staging environment

-- === A. TESTING RLS COMPLET (16_rls_user_owned.sql) ===

-- Test 1: Public poate citi views, nu tabele brute
\echo '=== TESTING RLS COMPLET ==='

-- 1.1 Views publice funcționează (anon)
\echo 'Testing public views access...'
SELECT COUNT(*) AS neurons_public FROM public.v_neuron_public;
SELECT COUNT(*) AS bundles_public FROM public.v_bundle_public;
SELECT COUNT(*) AS plans_public FROM public.v_plans_public;
SELECT COUNT(*) AS tree_public FROM public.v_tree_public;

-- 1.2 Tabele brute sunt blocate (anon)
\echo 'Testing table access blocking...'
-- Acestea ar trebui să eșueze cu "permission denied"
-- SELECT COUNT(*) FROM public.neurons;
-- SELECT COUNT(*) FROM public.bundles;
-- SELECT COUNT(*) FROM public.plans;

-- Test 2: Auth user vede doar propriile date
\echo 'Testing authenticated user isolation...'
-- (asumă că ești logat ca un user real)
-- SELECT COUNT(*) AS my_subscriptions FROM public.user_subscriptions WHERE user_id = auth.uid();
-- SELECT COUNT(*) AS my_purchases FROM public.user_purchases WHERE user_id = auth.uid();
-- SELECT COUNT(*) AS my_entitlements FROM public.user_entitlements WHERE user_id = auth.uid();

-- === B. TESTING ADMIN ROLES (17_admin_roles_policies.sql) ===

\echo '=== TESTING ADMIN ROLES ==='

-- Test 1: Verifică existența tabelei user_roles
\echo 'Testing admin role table...'
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'user_roles'
) AS user_roles_exists;

-- Test 2: Verifică funcțiile admin
\echo 'Testing admin functions...'
SELECT EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_name = 'f_is_admin'
) AS f_is_admin_exists;

-- Test 3: Verifică RLS pe tabele adminabile
\echo 'Testing RLS on admin tables...'
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('neurons', 'bundles', 'plans', 'tier_access_pool')
ORDER BY tablename;

-- === C. TESTING STRIPE EVENTS (18_stripe_events_dlq.sql) ===

\echo '=== TESTING STRIPE EVENTS ==='

-- Test 1: Verifică existența tabelelor Stripe
\echo 'Testing Stripe tables...'
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'stripe_events'
) AS stripe_events_exists;

SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'webhook_failures'
) AS webhook_failures_exists;

-- Test 2: Verifică funcțiile Stripe
\echo 'Testing Stripe functions...'
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%stripe%'
ORDER BY routine_name;

-- === D. TESTING SLUG DISCIPLINE (27_slug_ci_and_validation.sql) ===

\echo '=== TESTING SLUG DISCIPLINE ==='

-- Test 1: Verifică funcțiile slug
\echo 'Testing slug functions...'
SELECT 
  public.f_slugify('AI / Prompt—Engineering! 101') AS slug_example,
  public.f_is_valid_slug('ai-prompt-engineering-101') AS valid_slug,
  public.f_is_valid_slug('Invalid Slug!') AS invalid_slug;

-- Test 2: Verifică triggerele slug
\echo 'Testing slug triggers...'
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name LIKE '%slug%'
ORDER BY trigger_name;

-- Test 3: Verifică indexurile case-insensitive
\echo 'Testing case-insensitive indexes...'
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE '%slug_ci%'
ORDER BY indexname;

-- === E. TESTING SEARCH ROBUST (28_search_unaccent_tsv.sql) ===

\echo '=== TESTING SEARCH ROBUST ==='

-- Test 1: Verifică extensia unaccent
\echo 'Testing unaccent extension...'
SELECT EXISTS (
  SELECT 1 FROM pg_extension WHERE extname = 'unaccent'
) AS unaccent_exists;

-- Test 2: Verifică coloana tsvector generată
\echo 'Testing generated tsvector column...'
SELECT 
  column_name,
  data_type,
  is_generated,
  generation_expression
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'neurons' 
  AND column_name = 'tsv';

-- Test 3: Verifică indexul GIN
\echo 'Testing GIN index...'
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'neurons' 
  AND indexname LIKE '%tsv%';

-- Test 4: Verifică funcția de căutare
\echo 'Testing search function...'
SELECT EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_name = 'rpc_search_neurons'
) AS search_function_exists;

-- === F. INTEGRATION TESTS ===

\echo '=== INTEGRATION TESTS ==='

-- Test 1: Căutare end-to-end
\echo 'Testing end-to-end search...'
-- SELECT COUNT(*) AS search_results 
-- FROM public.rpc_search_neurons('ai', 10, 0);

-- Test 2: Slug normalization end-to-end
\echo 'Testing slug normalization...'
-- Testează cu un neuron real din baza ta
-- SELECT 
--   title,
--   slug,
--   public.f_slugify(title) AS normalized_slug,
--   public.f_is_valid_slug(public.f_slugify(title)) AS is_valid
-- FROM public.neurons 
-- LIMIT 3;

-- Test 3: Admin access simulation
\echo 'Testing admin access simulation...'
-- (opțional) Simulează un user admin
-- INSERT INTO public.user_roles(user_id, role) 
-- VALUES ('test-admin-uuid', 'admin') 
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- === G. PERFORMANCE TESTS ===

\echo '=== PERFORMANCE TESTS ==='

-- Test 1: Search performance
\echo 'Testing search performance...'
-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT * FROM public.rpc_search_neurons('cognitive', 20, 0);

-- Test 2: Slug validation performance
\echo 'Testing slug validation performance...'
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT COUNT(*) FROM public.neurons 
-- WHERE public.f_is_valid_slug(slug);

-- === H. SECURITY VALIDATION ===

\echo '=== SECURITY VALIDATION ==='

-- Test 1: Verifică privilegiile pe funcții
\echo 'Testing function privileges...'
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('rpc_search_neurons', 'rpc_get_neuron_full')
ORDER BY routine_name;

-- Test 2: Verifică RLS policies
\echo 'Testing RLS policies...'
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('neurons', 'user_subscriptions', 'user_purchases')
ORDER BY tablename, policyname;

-- === I. SUMMARY REPORT ===

\echo '=== SECURITY & UX TESTING SUMMARY ==='

-- RLS Status
SELECT 'RLS Status' AS category, 
       COUNT(*) AS tables_with_rls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;

-- Views Status
SELECT 'Public Views' AS category,
       COUNT(*) AS public_views
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE 'v_%';

-- Functions Status
SELECT 'Security Functions' AS category,
       COUNT(*) AS security_functions
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%admin%' 
   OR routine_name LIKE '%search%'
   OR routine_name LIKE '%slug%';

-- Indexes Status
SELECT 'Security Indexes' AS category,
       COUNT(*) AS security_indexes
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (indexname LIKE '%slug_ci%' 
    OR indexname LIKE '%tsv%'
    OR indexname LIKE '%rls%');

\echo '=== TESTING COMPLETED ==='
\echo 'Verifică rezultatele de mai sus pentru a confirma că toate componentele funcționează corect.'
\echo 'Dacă apar erori, revizuiește migrările și rulează din nou.'
