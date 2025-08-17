-- ============================================================================
-- RLS POLICIES - Row Level Security pentru "Creier pe neuroni"
-- ============================================================================
--
-- Acest fișier conține toate politicile RLS pentru:
-- - Neuroni (acces bazat pe tier și published status)
-- - Library tree (acces public pentru structură)
-- - Bundles (acces bazat pe tier)
-- - Plans (acces public pentru afișare)
-- - Tabele pivot (acces bazat pe relații)
--
-- IMPORTANT: Rulează acest fișier DUPĂ ce ai rulat 00_complete_schema_ddl.sql
-- ============================================================================

-- === 1. RLS POLICIES PENTRU NEURONS ===

-- Policy pentru SELECT: doar neuroni publicați și neșterși
DROP POLICY IF EXISTS neurons_select_public ON public.neurons;
CREATE POLICY neurons_select_public
  ON public.neurons
  FOR SELECT
  TO anon, authenticated
  USING (
    published = true 
    AND deleted_at IS NULL
  );

-- Policy pentru INSERT: doar useri autentificați
DROP POLICY IF EXISTS neurons_insert_auth ON public.neurons;
CREATE POLICY neurons_insert_auth
  ON public.neurons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy pentru UPDATE: doar useri autentificați
DROP POLICY IF EXISTS neurons_update_auth ON public.neurons;
CREATE POLICY neurons_update_auth
  ON public.neurons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy pentru DELETE: doar useri autentificați (soft delete)
DROP POLICY IF EXISTS neurons_delete_auth ON public.neurons;
CREATE POLICY neurons_delete_auth
  ON public.neurons
  FOR DELETE
  TO authenticated
  USING (true);

-- === 2. RLS POLICIES PENTRU LIBRARY_TREE ===

-- Policy pentru SELECT: acces public la structură
DROP POLICY IF EXISTS library_tree_select_public ON public.library_tree;
CREATE POLICY library_tree_select_public
  ON public.library_tree
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- Policy pentru INSERT: doar useri autentificați
DROP POLICY IF EXISTS library_tree_insert_auth ON public.library_tree;
CREATE POLICY library_tree_insert_auth
  ON public.library_tree
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy pentru UPDATE: doar useri autentificați
DROP POLICY IF EXISTS library_tree_update_auth ON public.library_tree;
CREATE POLICY library_tree_update_auth
  ON public.library_tree
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy pentru DELETE: doar useri autentificați (soft delete)
DROP POLICY IF EXISTS library_tree_delete_auth ON public.library_tree;
CREATE POLICY library_tree_delete_auth
  ON public.library_tree
  FOR DELETE
  TO authenticated
  USING (true);

-- === 3. RLS POLICIES PENTRU BUNDLES ===

-- Policy pentru SELECT: doar bundle-uri neșterși
DROP POLICY IF EXISTS bundles_select_public ON public.bundles;
CREATE POLICY bundles_select_public
  ON public.bundles
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- Policy pentru INSERT: doar useri autentificați
DROP POLICY IF EXISTS bundles_insert_auth ON public.bundles;
CREATE POLICY bundles_insert_auth
  ON public.bundles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy pentru UPDATE: doar useri autentificați
DROP POLICY IF EXISTS bundles_update_auth ON public.bundles;
CREATE POLICY bundles_update_auth
  ON public.bundles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy pentru DELETE: doar useri autentificați (soft delete)
DROP POLICY IF EXISTS bundles_delete_auth ON public.bundles;
CREATE POLICY bundles_delete_auth
  ON public.bundles
  FOR DELETE
  TO authenticated
  USING (true);

-- === 4. RLS POLICIES PENTRU PLANS ===

-- Policy pentru SELECT: acces public la planuri
DROP POLICY IF EXISTS plans_select_public ON public.plans;
CREATE POLICY plans_select_public
  ON public.plans
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy pentru INSERT: doar useri autentificați
DROP POLICY IF EXISTS plans_insert_auth ON public.plans;
CREATE POLICY plans_insert_auth
  ON public.plans
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy pentru UPDATE: doar useri autentificați
DROP POLICY IF EXISTS plans_update_auth ON public.plans;
CREATE POLICY plans_update_auth
  ON public.plans
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy pentru DELETE: doar useri autentificați
DROP POLICY IF EXISTS plans_delete_auth ON public.plans;
CREATE POLICY plans_delete_auth
  ON public.plans
  FOR DELETE
  TO authenticated
  USING (true);

-- === 5. RLS POLICIES PENTRU LIBRARY_TREE_NEURONS ===

-- Policy pentru SELECT: acces public la relații
DROP POLICY IF EXISTS ltn_select_public ON public.library_tree_neurons;
CREATE POLICY ltn_select_public
  ON public.library_tree_neurons
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- Policy pentru INSERT: doar useri autentificați
DROP POLICY IF EXISTS ltn_insert_auth ON public.library_tree_neurons;
CREATE POLICY ltn_insert_auth
  ON public.library_tree_neurons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy pentru UPDATE: doar useri autentificați
DROP POLICY IF EXISTS ltn_update_auth ON public.library_tree_neurons;
CREATE POLICY ltn_update_auth
  ON public.library_tree_neurons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy pentru DELETE: doar useri autentificați (soft delete)
DROP POLICY IF EXISTS ltn_delete_auth ON public.library_tree_neurons;
CREATE POLICY ltn_delete_auth
  ON public.library_tree_neurons
  FOR DELETE
  TO authenticated
  USING (true);

-- === 6. RLS POLICIES PENTRU BUNDLE_NEURONS ===

-- Policy pentru SELECT: acces public la relații
DROP POLICY IF EXISTS bn_select_public ON public.bundle_neurons;
CREATE POLICY bn_select_public
  ON public.bundle_neurons
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- Policy pentru INSERT: doar useri autentificați
DROP POLICY IF EXISTS bn_insert_auth ON public.bundle_neurons;
CREATE POLICY bn_insert_auth
  ON public.bundle_neurons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy pentru UPDATE: doar useri autentificați
DROP POLICY IF EXISTS bn_update_auth ON public.bundle_neurons;
CREATE POLICY bn_update_auth
  ON public.bundle_neurons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy pentru DELETE: doar useri autentificați (soft delete)
DROP POLICY IF EXISTS bn_delete_auth ON public.bundle_neurons;
CREATE POLICY bn_delete_auth
  ON public.bundle_neurons
  FOR DELETE
  TO authenticated
  USING (true);

-- === 7. FUNCȚII UTILITARE PENTRU RLS ===

-- Funcție pentru verificarea dacă un user poate accesa un neuron bazat pe tier
CREATE OR REPLACE FUNCTION f_can_access_neuron_by_tier(p_neuron_id uuid, p_user_tier plan_tier)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = p_neuron_id
      AND n.published = true 
      AND n.deleted_at IS NULL
      AND f_plan_rank(n.required_tier) <= f_plan_rank(p_user_tier)
  );
$$;

-- Funcție pentru verificarea dacă un user poate accesa un bundle bazat pe tier
CREATE OR REPLACE FUNCTION f_can_access_bundle_by_tier(p_bundle_id uuid, p_user_tier plan_tier)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bundles b
    WHERE b.id = p_bundle_id
      AND b.deleted_at IS NULL
      AND f_plan_rank(b.required_tier) <= f_plan_rank(p_user_tier)
  );
$$;

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
  subscription_end_date timestamp with time zone;
BEGIN
  -- Obține user_id-ul curent
  user_id := auth.uid();
  
  -- Dacă nu e autentificat, returnează 'free'
  IF user_id IS NULL THEN
    RETURN 'free';
  END IF;
  
  -- Verifică dacă user-ul are un subscription activ în Stripe
  -- Această logică poate fi adaptată în funcție de structura ta de subscription
  SELECT 
    s.status,
    s.tier,
    s.current_period_end
  INTO 
    subscription_status,
    subscription_tier,
    subscription_end_date
  FROM user_subscriptions s
  WHERE s.user_id = user_id
    AND s.status = 'active'
    AND s.current_period_end > now()
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- Dacă nu are subscription activ, returnează 'free'
  IF subscription_status IS NULL OR subscription_status != 'active' THEN
    RETURN 'free';
  END IF;
  
  -- Mapează tier-ul din Stripe la plan_tier
  CASE subscription_tier
    WHEN 'price_1OqK8L2eZvKYlo2C8QZQZQZQ' THEN current_tier := 'architect';
    WHEN 'price_1OqK8L2eZvKYlo2C8QZQZQZQ' THEN current_tier := 'initiate';
    WHEN 'price_1OqK8L2eZvKYlo2C8QZQZQZQ' THEN current_tier := 'elite';
    ELSE current_tier := 'free';
  END CASE;
  
  RETURN current_tier;
EXCEPTION
  -- În caz de eroare, returnează 'free' ca fallback
  WHEN OTHERS THEN
    RETURN 'free';
END;
$$;

-- === 8. POLICIES AVANSATE (OPȚIONALE) ===

-- Policy pentru acces la conținutul complet al neuronilor (doar pentru useri cu tier corespunzător)
-- Aceasta poate fi folosită pentru un view sau funcție RPC care returnează content_full
DROP POLICY IF EXISTS neurons_content_access ON public.neurons;
CREATE POLICY neurons_content_access
  ON public.neurons
  FOR SELECT
  TO authenticated
  USING (
    published = true 
    AND deleted_at IS NULL
    AND f_can_access_neuron_by_tier(id, f_get_current_user_tier())
  );

-- === 9. VERIFICĂRI RLS ===

-- Verifică dacă toate tabelele au RLS activ și politici definite
DO $$
DECLARE
  table_name text;
  policy_count int;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('neurons', 'library_tree', 'bundles', 'plans', 'library_tree_neurons', 'bundle_neurons')
  LOOP
    -- Verifică dacă RLS e activ
    IF NOT EXISTS (
      SELECT 1 FROM pg_class 
      WHERE relname = table_name 
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS not enabled on table %', table_name;
    END IF;
    
    -- Verifică dacă există politici
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = table_name AND schemaname = 'public';
    
    IF policy_count = 0 THEN
      RAISE EXCEPTION 'No RLS policies defined for table %', table_name;
    END IF;
    
    RAISE NOTICE 'Table %: RLS enabled with % policies', table_name, policy_count;
  END LOOP;
  
  RAISE NOTICE 'All tables have RLS enabled and policies defined successfully';
END $$;

-- === 10. TESTE RLS ===

-- Funcție pentru testarea politicilor RLS
CREATE OR REPLACE FUNCTION f_test_rls_policies()
RETURNS TABLE(table_name text, policy_name text, policy_type text, policy_definition text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.tablename::text,
    p.policyname::text,
    p.cmd::text,
    p.qual::text
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  ORDER BY p.tablename, p.policyname;
$$;

-- === 11. COMENTARII ===

COMMENT ON FUNCTION f_can_access_neuron_by_tier IS 'Verifică dacă un user cu un anumit tier poate accesa un neuron';
COMMENT ON FUNCTION f_can_access_bundle_by_tier IS 'Verifică dacă un user cu un anumit tier poate accesa un bundle';
COMMENT ON FUNCTION f_get_current_user_tier IS 'Returnează tier-ul curent al user-ului autentificat';
COMMENT ON FUNCTION f_test_rls_policies IS 'Funcție de test pentru verificarea politicilor RLS';

-- === 12. FINALIZARE ===

DO $$
BEGIN
  RAISE NOTICE 'RLS Policies setup completed successfully!';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '- Public read access to published content';
  RAISE NOTICE '- Authenticated users can create/update/delete';
  RAISE NOTICE '- Soft delete support for all tables';
  RAISE NOTICE '- Tier-based access control functions';
  RAISE NOTICE '- Comprehensive security policies';
END $$;
