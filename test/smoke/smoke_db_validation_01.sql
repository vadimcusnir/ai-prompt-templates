-- ============================================================================
-- SMOKE TEST: DB-01 VALIDARE DE BAZE DE DATE
-- ============================================================================
-- 
-- Acest script testează implementarea validării DB-01:
-- - Verifică că SELECT direct pe tabele brute este blocat
-- - Confirmă că view-urile publice sunt accesibile
-- - Testează excepțiile pentru admin și service_role
-- - Validează funcționalitatea de audit
--
-- RULEAZĂ CA ADMIN pentru teste complete
-- ============================================================================

-- === 1. SETUP INIȚIAL ===

-- Verifică dacă utilizatorul este admin
SELECT 
    auth.uid() as current_user_id,
    public.f_is_admin(auth.uid()) as is_admin,
    current_setting('role', true) as current_role;

-- === 2. TEST VIEW-URI PUBLICE (AR TREBUI SĂ FUNCȚIONEAZE) ===

-- Test v_neuron_public
SELECT 'v_neuron_public' as view_name, COUNT(*) as record_count 
FROM public.v_neuron_public;

-- Test v_tree_public
SELECT 'v_tree_public' as view_name, COUNT(*) as record_count 
FROM public.v_tree_public;

-- Test v_bundle_public
SELECT 'v_bundle_public' as view_name, COUNT(*) as record_count 
FROM public.v_bundle_public;

-- Test v_plans_public
SELECT 'v_plans_public' as view_name, COUNT(*) as record_count 
FROM public.v_plans_public;

-- === 3. TEST ACCES DIRECT LA TABELE BRUTE (AR TREBUI SĂ EȘUEZE) ===

-- Test SELECT direct pe neurons (ar trebui să eșueze pentru non-admin)
DO $$
BEGIN
    BEGIN
        SELECT COUNT(*) FROM public.neurons;
        RAISE NOTICE 'ERROARE: SELECT direct pe neurons a funcționat (nu ar trebui)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: SELECT direct pe neurons a fost blocat: %', SQLERRM;
    END;
END $$;

-- Test SELECT direct pe bundles (ar trebui să eșueze pentru non-admin)
DO $$
BEGIN
    BEGIN
        SELECT COUNT(*) FROM public.bundles;
        RAISE NOTICE 'ERROARE: SELECT direct pe bundles a funcționat (nu ar trebui)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: SELECT direct pe bundles a fost blocat: %', SQLERRM;
    END;
END $$;

-- Test SELECT direct pe plans (ar trebui să eșueze pentru non-admin)
DO $$
BEGIN
    BEGIN
        SELECT COUNT(*) FROM public.plans;
        RAISE NOTICE 'ERROARE: SELECT direct pe plans a funcționat (nu ar trebui)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: SELECT direct pe plans a fost blocat: %', SQLERRM;
    END;
END $$;

-- Test SELECT direct pe library_tree (ar trebui să eșueze pentru non-admin)
DO $$
BEGIN
    BEGIN
        SELECT COUNT(*) FROM public.library_tree;
        RAISE NOTICE 'ERROARE: SELECT direct pe library_tree a funcționat (nu ar trebui)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: SELECT direct pe library_tree a fost blocat: %', SQLERRM;
    END;
END $$;

-- === 4. TEST FUNCȚII DE VALIDARE ===

-- Test f_validate_public_view_access
SELECT 
    'v_neuron_public' as view_name,
    public.f_validate_public_view_access('v_neuron_public') as is_valid;

SELECT 
    'v_tree_public' as view_name,
    public.f_validate_public_view_access('v_tree_public') as is_valid;

SELECT 
    'v_bundle_public' as view_name,
    public.f_validate_public_view_access('v_bundle_public') as is_valid;

SELECT 
    'v_plans_public' as view_name,
    public.f_validate_public_view_access('v_plans_public') as is_valid;

-- === 5. TEST FUNCȚII DE MIGRARE (ADMIN ONLY) ===

-- Test activarea modului de migrare
DO $$
BEGIN
    IF public.f_is_admin(auth.uid()) THEN
        SELECT public.f_enable_migration_mode();
        RAISE NOTICE 'SUCCESS: Migration mode enabled';
        
        -- Verifică că flag-ul este setat
        IF current_setting('app.migration_mode', true) = 'true' THEN
            RAISE NOTICE 'SUCCESS: Migration mode flag is set';
        ELSE
            RAISE NOTICE 'ERROARE: Migration mode flag not set';
        END IF;
        
        -- Dezactivează modul de migrare
        SELECT public.f_disable_migration_mode();
        RAISE NOTICE 'SUCCESS: Migration mode disabled';
    ELSE
        RAISE NOTICE 'SKIP: User is not admin, skipping migration mode tests';
    END IF;
END $$;

-- === 6. TEST FUNCȚII DE MONITORING (ADMIN ONLY) ===

-- Test raportarea accesului neautorizat
DO $$
BEGIN
    IF public.f_is_admin(auth.uid()) THEN
        RAISE NOTICE 'Testing unauthorized access report...';
        SELECT * FROM public.f_get_unauthorized_access_report(1);
        RAISE NOTICE 'SUCCESS: Unauthorized access report generated';
    ELSE
        RAISE NOTICE 'SKIP: User is not admin, skipping monitoring tests';
    END IF;
END $$;

-- === 7. TEST AUDIT LOG ===

-- Verifică dacă tabelul de audit există
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'access_audit_log'
    ) as audit_log_exists;

-- Verifică dacă trigger-urile sunt active
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%validate_direct_access%'
ORDER BY trigger_name;

-- === 8. TEST POLITICI RLS ===

-- Verifică politicile RLS pentru tabelele sensibile
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
AND tablename IN ('neurons', 'bundles', 'plans', 'library_tree', 'library_tree_neurons')
ORDER BY tablename, policyname;

-- === 9. TEST EXCEPȚII PENTRU SERVICE ROLE ===

-- Simulează context de service_role (pentru webhooks, cron jobs)
DO $$
BEGIN
    -- Setează rolul ca service_role
    PERFORM set_config('role', 'service_role', false);
    
    RAISE NOTICE 'Testing service_role access...';
    
    -- Test SELECT direct pe neurons ca service_role (ar trebui să funcționeze)
    BEGIN
        SELECT COUNT(*) FROM public.neurons;
        RAISE NOTICE 'SUCCESS: Service role can access neurons directly';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROARE: Service role cannot access neurons: %', SQLERRM;
    END;
    
    -- Resetează rolul
    PERFORM set_config('role', 'authenticated', false);
    RAISE NOTICE 'Role reset to authenticated';
END $$;

-- === 10. VERIFICARE FINALĂ ===

-- Rezumat al testelor
SELECT 
    'DB-01 VALIDATION SUMMARY' as test_suite,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'access_audit_log'
        ) THEN 'PASS' 
        ELSE 'FAIL' 
    END as audit_log_created,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_schema = 'public' 
            AND trigger_name LIKE '%validate_direct_access%'
        ) THEN 'PASS' 
        ELSE 'FAIL' 
    END as triggers_active,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename IN ('neurons', 'bundles', 'plans')
            AND policyname LIKE '%public_select%'
        ) THEN 'PASS' 
        ELSE 'FAIL' 
    END as rls_policies_active;

-- === 11. RECOMANDĂRI ===

-- Dacă toate testele au trecut:
-- 1. DB-01 este implementat corect
-- 2. Tabelele brute sunt protejate
-- 3. View-urile publice sunt accesibile
-- 4. Audit trail-ul funcționează
-- 5. Excepțiile pentru admin și service_role sunt active

-- Dacă testele au eșuat:
-- 1. Verifică că fișierul 29_db_validation_policies.sql a fost rulat
-- 2. Verifică că utilizatorul are drepturi de admin
-- 3. Verifică că RLS este activat pe tabele
-- 4. Verifică că trigger-urile sunt create corect
