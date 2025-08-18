-- ============================================================================
-- SMOKE TEST: CRON-01 VALIDARE CRON
-- ============================================================================
-- 
-- Acest script testează implementarea validării CRON-01:
-- - Verifică că apelarea directă a funcțiilor de business prin pg_cron este blocată
-- - Confirmă că wrapper-ele f_cron_run_* sunt funcționale
-- - Testează sistemul de audit pentru job-uri cron
-- - Validează funcționalitatea de monitoring
--
-- RULEAZĂ CA ADMIN pentru teste complete
-- ============================================================================

-- === 1. SETUP INIȚIAL ===

-- Verifică dacă utilizatorul este admin
SELECT 
    auth.uid() as current_user_id,
    public.f_is_admin(auth.uid()) as is_admin,
    current_setting('role', true) as current_role;

-- Verifică dacă pg_cron este disponibil
SELECT 
    'pg_cron extension' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
        ) THEN 'PASS' 
        ELSE 'FAIL' 
    END as status;

-- === 2. TEST FUNCȚII WRAPPER (AR TREBUI SĂ FUNCȚIONEAZE) ===

-- Test f_cron_run_refresh_tier_access_pool
DO $$
BEGIN
    SELECT public.f_cron_run_refresh_tier_access_pool();
    RAISE NOTICE 'SUCCESS: f_cron_run_refresh_tier_access_pool executed';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: f_cron_run_refresh_tier_access_pool failed: %', SQLERRM;
END $$;

-- Test f_cron_run_check_library_cap
DO $$
BEGIN
    SELECT public.f_cron_run_check_library_cap();
    RAISE NOTICE 'SUCCESS: f_cron_run_check_library_cap executed';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: f_cron_run_check_library_cap failed: %', SQLERRM;
END $$;

-- Test f_cron_run_preview_audit
DO $$
BEGIN
    SELECT public.f_cron_run_preview_audit();
    RAISE NOTICE 'SUCCESS: f_cron_run_preview_audit executed';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: f_cron_run_preview_audit failed: %', SQLERRM;
END $$;

-- Test f_cron_run_bundle_consistency
DO $$
BEGIN
    SELECT public.f_cron_run_bundle_consistency();
    RAISE NOTICE 'SUCCESS: f_cron_run_bundle_consistency executed';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: f_cron_run_bundle_consistency failed: %', SQLERRM;
END $$;

-- Test f_cron_run_custom_job cu funcție permisă
DO $$
BEGIN
    SELECT public.f_cron_run_custom_job('cleanup_old_logs', 'Cleanup old logs');
    RAISE NOTICE 'SUCCESS: f_cron_run_custom_job executed with allowed function';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: f_cron_run_custom_job failed: %', SQLERRM;
END $$;

-- Test f_cron_run_custom_job cu funcție nepermisă (ar trebui să eșueze)
DO $$
BEGIN
    SELECT public.f_cron_run_custom_job('unauthorized_function', 'Unauthorized function');
    RAISE NOTICE 'ERROR: f_cron_run_custom_job should have failed with unauthorized function';
EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%CRON-01%' THEN
        RAISE NOTICE 'SUCCESS: f_cron_run_custom_job correctly blocked unauthorized function';
    ELSE
        RAISE NOTICE 'ERROR: Unexpected error: %', SQLERRM;
    END IF;
END $$;

-- === 3. TEST VALIDARE CRON JOB ===

-- Test validare job valid
SELECT 
    'Valid job validation' as test_name,
    public.f_validate_cron_job(
        'test-valid-job',
        '0 0 * * *',
        'SELECT public.f_cron_run_refresh_tier_access_pool()'
    ) as is_valid;

-- Test validare job invalid (fără wrapper)
SELECT 
    'Invalid job validation (no wrapper)' as test_name,
    public.f_validate_cron_job(
        'test-invalid-job',
        '0 0 * * *',
        'SELECT refresh_tier_access_pool_all()'
    ) as is_valid;

-- Test validare job invalid (funcție de business directă)
SELECT 
    'Invalid job validation (direct business function)' as test_name,
    public.f_validate_cron_job(
        'test-business-job',
        '*/15 * * * *',
        'SELECT check_library_cap_and_alert()'
    ) as is_valid;

-- === 4. TEST DETECTARE VIOLĂRI ===

-- Test detectarea violărilor (dacă există job-uri cron)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cron' AND table_name = 'job') THEN
        RAISE NOTICE 'Testing cron violations detection...';
        SELECT * FROM public.f_detect_cron_violations();
        RAISE NOTICE 'SUCCESS: Cron violations detection executed';
    ELSE
        RAISE NOTICE 'SKIP: cron.job table does not exist (no pg_cron jobs)';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Cron violations detection failed: %', SQLERRM;
END $$;

-- === 5. TEST AUDIT LOG ===

-- Verifică dacă tabelul de audit există
SELECT 
    'job_audit table exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'job_audit'
        ) THEN 'PASS' 
        ELSE 'FAIL' 
    END as status;

-- Verifică înregistrările din audit log
SELECT 
    'job_audit records' as check_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN success = true THEN 1 END) as successful_jobs,
    COUNT(CASE WHEN success = false THEN 1 END) as failed_jobs
FROM public.job_audit;

-- Verifică job-urile cu wrapper valid
SELECT 
    'Valid wrapper jobs' as check_name,
    COUNT(*) as count
FROM public.job_audit
WHERE is_wrapper_valid = true;

-- Verifică job-urile fără wrapper valid
SELECT 
    'Invalid wrapper jobs' as check_name,
    COUNT(*) as count
FROM public.job_audit
WHERE is_wrapper_valid = false;

-- === 6. TEST FUNCȚII DE MONITORING ===

-- Test raportarea job-urilor cron
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cron' AND table_name = 'job') THEN
        RAISE NOTICE 'Testing cron jobs report...';
        SELECT * FROM public.f_get_cron_jobs_report();
        RAISE NOTICE 'SUCCESS: Cron jobs report generated';
    ELSE
        RAISE NOTICE 'SKIP: cron.job table does not exist (no pg_cron jobs)';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Cron jobs report failed: %', SQLERRM;
END $$;

-- Test raportarea violărilor
DO $$
BEGIN
    RAISE NOTICE 'Testing cron violations report...';
    SELECT * FROM public.f_get_cron_violations_report(7);
    RAISE NOTICE 'SUCCESS: Cron violations report generated';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Cron violations report failed: %', SQLERRM;
END $$;

-- === 7. TEST CRON.SCHEDULE COMPLIANT ===

-- Test crearea job-ului cron compliant (ar trebui să funcționeze)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cron' AND table_name = 'job') THEN
        -- Încearcă să creeze un job cron compliant
        PERFORM cron.schedule(
            'test-compliant-job',
            '0 0 * * *',
            'SELECT public.f_cron_run_refresh_tier_access_pool()'
        );
        RAISE NOTICE 'SUCCESS: Compliant cron job created';
        
        -- Șterge job-ul de test
        PERFORM cron.unschedule('test-compliant-job');
        RAISE NOTICE 'SUCCESS: Test cron job removed';
    ELSE
        RAISE NOTICE 'SKIP: cron.job table does not exist (no pg_cron jobs)';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Compliant cron job creation failed: %', SQLERRM;
END $$;

-- === 8. TEST CRON.SCHEDULE NON-COMPLIANT ===

-- Test crearea job-ului cron non-compliant (ar trebui să eșueze)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cron' AND table_name = 'job') THEN
        BEGIN
            -- Încearcă să creeze un job cron non-compliant
            PERFORM cron.schedule(
                'test-non-compliant-job',
                '0 0 * * *',
                'SELECT refresh_tier_access_pool_all()'
            );
            RAISE NOTICE 'ERROR: Non-compliant cron job should have been blocked';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%CRON-01%' THEN
                RAISE NOTICE 'SUCCESS: Non-compliant cron job correctly blocked';
            ELSE
                RAISE NOTICE 'ERROR: Unexpected error: %', SQLERRM;
            END IF;
        END;
    ELSE
        RAISE NOTICE 'SKIP: cron.job table does not exist (no pg_cron jobs)';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Non-compliant cron job test failed: %', SQLERRM;
END $$;

-- === 9. TEST CLEANUP LOGS ===

-- Test cleanup-ul log-urilor vechi
DO $$
DECLARE
    deleted_count integer;
BEGIN
    RAISE NOTICE 'Testing cleanup of old cron logs...';
    SELECT public.f_cleanup_old_cron_logs(90) INTO deleted_count;
    RAISE NOTICE 'SUCCESS: Cleaned up % old cron log entries', deleted_count;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Cleanup of old cron logs failed: %', SQLERRM;
END $$;

-- === 10. VERIFICARE FINALĂ ===

-- Rezumat al testelor
SELECT 
    'CRON-01 VALIDATION SUMMARY' as test_suite,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'job_audit'
        ) THEN 'PASS' 
        ELSE 'FAIL' 
    END as audit_log_created,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name LIKE 'f_cron_run_%'
        ) THEN 'PASS' 
        ELSE 'FAIL' 
    END as wrapper_functions_created,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'f_validate_cron_job'
        ) THEN 'PASS' 
        ELSE 'FAIL' 
    END as validation_function_created,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'f_detect_cron_violations'
        ) THEN 'PASS' 
        ELSE 'FAIL' 
    END as violations_detection_created;

-- === 11. RECOMANDĂRI ===

-- Dacă toate testele au trecut:
-- 1. CRON-01 este implementat corect
-- 2. Wrapper-ele pentru job-uri cron sunt funcționale
-- 3. Validarea job-urilor cron funcționează
-- 4. Sistemul de audit este activ
-- 5. Funcțiile de monitoring sunt operaționale

-- Dacă testele au eșuat:
-- 1. Verifică că fișierul 30_cron_validation_policies.sql a fost rulat
-- 2. Verifică că utilizatorul are drepturi de admin
-- 3. Verifică că pg_cron este instalat și configurat
-- 4. Verifică că funcțiile wrapper sunt create corect

-- === 12. EXEMPLE DE UTILIZARE COMPLIANT ===

-- Job-uri cron compliant:
-- SELECT cron.schedule('refresh-tier-access-pool', '0 0 * * *', 'SELECT public.f_cron_run_refresh_tier_access_pool()');
-- SELECT cron.schedule('check-library-cap', '*/15 * * * *', 'SELECT public.f_cron_run_check_library_cap()');
-- SELECT cron.schedule('preview-audit', '0 2 * * *', 'SELECT public.f_cron_run_preview_audit()');
-- SELECT cron.schedule('bundle-consistency', '0 4 * * *', 'SELECT public.f_cron_run_bundle_consistency()');

-- Job-uri cron personalizate:
-- SELECT cron.schedule('cleanup-logs', '0 3 * * *', 'SELECT public.f_cron_run_custom_job(''cleanup_old_logs'', ''Cleanup old logs'')');
-- SELECT cron.schedule('refresh-views', '0 5 * * *', 'SELECT public.f_cron_run_custom_job(''refresh_materialized_views'', ''Refresh materialized views'')');

-- === 13. MONITORING OPERAȚIONAL ===

-- Verifică job-urile cron active:
-- SELECT * FROM public.f_get_cron_jobs_report();

-- Verifică violările CRON-01:
-- SELECT * FROM public.f_get_cron_violations_report(7);

-- Verifică audit log-ul:
-- SELECT 
--     job_name,
--     cron_expression,
--     wrapper_used,
--     is_wrapper_valid,
--     success,
--     timestamp
-- FROM public.job_audit
-- ORDER BY timestamp DESC
-- LIMIT 20;
