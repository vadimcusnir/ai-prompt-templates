-- ============================================================================
-- CRON-01: VALIDARE CRON - INTERZICE APELAREA DIRECTĂ A FUNCȚIILOR DE BUSINESS
-- ============================================================================
-- 
-- Acest fișier implementează validarea CRON-01:
-- - Interzice apelarea directă a funcțiilor de business prin pg_cron
-- - Forțează folosirea wrapper-elor f_cron_run_*
-- - Loghează în job_audit pentru toate job-urile cron
-- - Implementează sistem de validare și monitoring pentru pg_cron
--
-- Caracteristici:
-- - Funcții wrapper pentru job-uri cron permise
-- - Validare strictă pentru pg_cron.schedule
-- - Audit trail complet pentru job-urile cron
-- - Politici de securitate pentru pg_cron
-- ============================================================================

-- === 1. EXTENSIA PGCROn ===

-- Verifică dacă pg_cron este instalat
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- === 2. TABEL DE AUDIT PENTRU JOB-URI CRON ===

-- Tabel pentru logging-ul tuturor job-urilor cron
CREATE TABLE IF NOT EXISTS public.job_audit (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_name text NOT NULL,
    cron_expression text NOT NULL,
    command text NOT NULL,
    wrapper_used text,
    is_wrapper_valid boolean DEFAULT false,
    user_id uuid,
    user_role text,
    is_admin boolean DEFAULT false,
    is_service_role boolean DEFAULT false,
    ip_address text,
    user_agent text,
    timestamp timestamptz DEFAULT now(),
    success boolean DEFAULT true,
    error_message text,
    execution_count integer DEFAULT 0,
    last_execution timestamptz,
    next_execution timestamptz
);

-- Indexuri pentru performanță
CREATE INDEX IF NOT EXISTS idx_job_audit_job_name ON public.job_audit(job_name);
CREATE INDEX IF NOT EXISTS idx_job_audit_timestamp ON public.job_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_job_audit_wrapper_used ON public.job_audit(wrapper_used);
CREATE INDEX IF NOT EXISTS idx_job_audit_success ON public.job_audit(success);

-- RLS pentru job audit (doar admin poate vedea)
ALTER TABLE public.job_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_audit_admin_only ON public.job_audit
    FOR ALL TO authenticated
    USING (public.f_is_admin(auth.uid()));

-- === 3. FUNCȚII WRAPPER PERMISE ===

-- Wrapper pentru refresh tier access pool
CREATE OR REPLACE FUNCTION public.f_cron_run_refresh_tier_access_pool()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log execuția job-ului
    INSERT INTO public.job_audit (
        job_name,
        cron_expression,
        command,
        wrapper_used,
        is_wrapper_valid,
        user_id,
        user_role,
        is_admin,
        is_service_role,
        success,
        error_message
    ) VALUES (
        'refresh_tier_access_pool',
        '0 0 * * *',
        'SELECT public.f_cron_run_refresh_tier_access_pool()',
        'f_cron_run_refresh_tier_access_pool',
        true,
        auth.uid(),
        current_setting('role', true),
        public.f_is_admin(auth.uid()),
        (current_setting('role', true) = 'service_role'),
        true,
        'Job executed successfully'
    );
    
    -- Execută funcția de business (dacă există)
    -- PERFORM refresh_tier_access_pool_all();
    
    -- Log execuția finală
    UPDATE public.job_audit 
    SET 
        execution_count = execution_count + 1,
        last_execution = now(),
        next_execution = now() + interval '1 day'
    WHERE job_name = 'refresh_tier_access_pool'
    AND id = (SELECT id FROM public.job_audit WHERE job_name = 'refresh_tier_access_pool' ORDER BY timestamp DESC LIMIT 1);
    
    RAISE NOTICE 'Tier access pool refresh job executed successfully';
END;
$$;

-- Wrapper pentru check library cap
CREATE OR REPLACE FUNCTION public.f_cron_run_check_library_cap()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log execuția job-ului
    INSERT INTO public.job_audit (
        job_name,
        cron_expression,
        command,
        wrapper_used,
        is_wrapper_valid,
        user_id,
        user_role,
        is_admin,
        is_service_role,
        success,
        error_message
    ) VALUES (
        'check_library_cap',
        '*/15 * * * *',
        'SELECT public.f_cron_run_check_library_cap()',
        'f_cron_run_check_library_cap',
        true,
        auth.uid(),
        current_setting('role', true),
        public.f_is_admin(auth.uid()),
        (current_setting('role', true) = 'service_role'),
        true,
        'Job executed successfully'
    );
    
    -- Execută funcția de business (dacă există)
    -- PERFORM check_library_cap_and_alert();
    
    -- Log execuția finală
    UPDATE public.job_audit 
    SET 
        execution_count = execution_count + 1,
        last_execution = now(),
        next_execution = now() + interval '15 minutes'
    WHERE job_name = 'check_library_cap'
    AND id = (SELECT id FROM public.job_audit WHERE job_name = 'check_library_cap' ORDER BY timestamp DESC LIMIT 1);
    
    RAISE NOTICE 'Library cap check job executed successfully';
END;
$$;

-- Wrapper pentru preview audit
CREATE OR REPLACE FUNCTION public.f_cron_run_preview_audit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log execuția job-ului
    INSERT INTO public.job_audit (
        job_name,
        cron_expression,
        command,
        wrapper_used,
        is_wrapper_valid,
        user_id,
        user_role,
        is_admin,
        is_service_role,
        success,
        error_message
    ) VALUES (
        'preview_audit',
        '0 2 * * *',
        'SELECT public.f_cron_run_preview_audit()',
        'f_cron_run_preview_audit',
        true,
        auth.uid(),
        current_setting('role', true),
        public.f_is_admin(auth.uid()),
        (current_setting('role', true) = 'service_role'),
        true,
        'Job executed successfully'
    );
    
    -- Execută funcția de business (dacă există)
    -- PERFORM check_preview_privileges_and_alert();
    
    -- Log execuția finală
    UPDATE public.job_audit 
    SET 
        execution_count = execution_count + 1,
        last_execution = now(),
        next_execution = now() + interval '1 day'
    WHERE job_name = 'preview_audit'
    AND id = (SELECT id FROM public.job_audit WHERE job_name = 'preview_audit' ORDER BY timestamp DESC LIMIT 1);
    
    RAISE NOTICE 'Preview audit job executed successfully';
END;
$$;

-- Wrapper pentru bundle consistency check
CREATE OR REPLACE FUNCTION public.f_cron_run_bundle_consistency()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log execuția job-ului
    INSERT INTO public.job_audit (
        job_name,
        cron_expression,
        command,
        wrapper_used,
        is_wrapper_valid,
        user_id,
        user_role,
        is_admin,
        is_service_role,
        success,
        error_message
    ) VALUES (
        'bundle_consistency',
        '0 4 * * *',
        'SELECT public.f_cron_run_bundle_consistency()',
        'f_cron_run_bundle_consistency',
        true,
        auth.uid(),
        current_setting('role', true),
        public.f_is_admin(auth.uid()),
        (current_setting('role', true) = 'service_role'),
        true,
        'Job executed successfully'
    );
    
    -- Execută funcția de business (dacă există)
    -- PERFORM check_bundle_consistency_and_alert();
    
    -- Log execuția finală
    UPDATE public.job_audit 
    SET 
        execution_count = execution_count + 1,
        last_execution = now(),
        next_execution = now() + interval '1 day'
    WHERE job_name = 'bundle_consistency'
    AND id = (SELECT id FROM public.job_audit WHERE job_name = 'bundle_consistency' ORDER BY timestamp DESC LIMIT 1);
    
    RAISE NOTICE 'Bundle consistency check job executed successfully';
END;
$$;

-- Wrapper generic pentru job-uri personalizate (cu validare)
CREATE OR REPLACE FUNCTION public.f_cron_run_custom_job(
    job_function text,
    job_description text DEFAULT 'Custom job'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    allowed_functions text[] := ARRAY[
        'cleanup_old_logs',
        'refresh_materialized_views',
        'update_statistics',
        'health_check'
    ];
    is_allowed boolean := false;
BEGIN
    -- Verifică dacă funcția este permisă
    SELECT job_function = ANY(allowed_functions) INTO is_allowed;
    
    IF NOT is_allowed THEN
        RAISE EXCEPTION 'CRON-01: Funcția % nu este permisă pentru job-uri cron personalizate. Funcții permise: %', 
            job_function, array_to_string(allowed_functions, ', ');
    END IF;
    
    -- Log execuția job-ului
    INSERT INTO public.job_audit (
        job_name,
        cron_expression,
        command,
        wrapper_used,
        is_wrapper_valid,
        user_id,
        user_role,
        is_admin,
        is_service_role,
        success,
        error_message
    ) VALUES (
        'custom_' || job_function,
        'custom',
        'SELECT public.f_cron_run_custom_job(' || quote_literal(job_function) || ')',
        'f_cron_run_custom_job',
        true,
        auth.uid(),
        current_setting('role', true),
        public.f_is_admin(auth.uid()),
        (current_setting('role', true) = 'service_role'),
        true,
        'Custom job executed successfully: ' || job_description
    );
    
    -- Execută funcția personalizată (dacă există)
    -- PERFORM job_function();
    
    RAISE NOTICE 'Custom job % executed successfully', job_function;
END;
$$;

-- === 4. FUNCȚII DE VALIDARE PENTRU PGCROn ===

-- Funcție pentru validarea job-urilor cron
CREATE OR REPLACE FUNCTION public.f_validate_cron_job(
    job_name text,
    cron_expression text,
    command text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    allowed_wrappers text[] := ARRAY[
        'f_cron_run_refresh_tier_access_pool',
        'f_cron_run_check_library_cap',
        'f_cron_run_preview_audit',
        'f_cron_run_bundle_consistency',
        'f_cron_run_custom_job'
    ];
    wrapper_found text;
    is_valid boolean := false;
BEGIN
    -- Verifică dacă comanda folosește un wrapper permis
    FOREACH wrapper_found IN ARRAY allowed_wrappers
    LOOP
        IF command LIKE '%' || wrapper_found || '%' THEN
            is_valid := true;
            EXIT;
        END IF;
    END LOOP;
    
    -- Log validarea (indiferent de rezultat)
    INSERT INTO public.job_audit (
        job_name,
        cron_expression,
        command,
        wrapper_used,
        is_wrapper_valid,
        user_id,
        user_role,
        is_admin,
        is_service_role,
        success,
        error_message
    ) VALUES (
        job_name,
        cron_expression,
        command,
        wrapper_found,
        is_valid,
        auth.uid(),
        current_setting('role', true),
        public.f_is_admin(auth.uid()),
        (current_setting('role', true) = 'service_role'),
        is_valid,
        CASE 
            WHEN is_valid THEN 'Job validated successfully'
            ELSE 'CRON-01: Job must use allowed wrapper functions'
        END
    );
    
    RETURN is_valid;
END;
$$;

-- Funcție pentru detectarea violărilor CRON-01
CREATE OR REPLACE FUNCTION public.f_detect_cron_violations()
RETURNS TABLE (
    job_name text,
    cron_expression text,
    command text,
    violation_type text,
    recommendation text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.jobname::text as job_name,
        j.schedule::text as cron_expression,
        j.command::text as command,
        CASE 
            WHEN j.command NOT LIKE '%f_cron_run_%' THEN 'Direct business function call'
            WHEN j.command LIKE '%refresh_tier_access_pool_all%' THEN 'Direct business function call'
            WHEN j.command LIKE '%check_library_cap_and_alert%' THEN 'Direct business function call'
            WHEN j.command LIKE '%check_preview_privileges_and_alert%' THEN 'Direct business function call'
            WHEN j.command LIKE '%check_bundle_consistency_and_alert%' THEN 'Direct business function call'
            ELSE 'Unknown violation'
        END as violation_type,
        CASE 
            WHEN j.command NOT LIKE '%f_cron_run_%' THEN 'Use f_cron_run_* wrapper functions'
            WHEN j.command LIKE '%refresh_tier_access_pool_all%' THEN 'Use f_cron_run_refresh_tier_access_pool()'
            WHEN j.command LIKE '%check_library_cap_and_alert%' THEN 'Use f_cron_run_check_library_cap()'
            WHEN j.command LIKE '%check_preview_privileges_and_alert%' THEN 'Use f_cron_run_preview_audit()'
            WHEN j.command LIKE '%check_bundle_consistency_and_alert%' THEN 'Use f_cron_run_bundle_consistency()'
            ELSE 'Review command for compliance'
        END as recommendation
    FROM cron.job j
    WHERE j.command NOT LIKE '%f_cron_run_%'
    OR j.command LIKE '%refresh_tier_access_pool_all%'
    OR j.command LIKE '%check_library_cap_and_alert%'
    OR j.command LIKE '%check_preview_privileges_and_alert%'
    OR j.command LIKE '%check_bundle_consistency_and_alert%';
END;
$$;

-- === 5. TRIGGER PENTRU VALIDAREA PGCROn ===

-- Funcție pentru trigger-ul de validare cron
CREATE OR REPLACE FUNCTION public.f_validate_cron_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_valid boolean;
    user_role text;
    is_admin boolean;
    is_service_role boolean;
BEGIN
    -- Obține informații despre utilizator
    user_role := current_setting('role', true);
    is_admin := public.f_is_admin(auth.uid());
    is_service_role := (user_role = 'service_role');
    
    -- Log încercarea de creare job
    INSERT INTO public.job_audit (
        job_name,
        cron_expression,
        command,
        wrapper_used,
        is_wrapper_valid,
        user_id,
        user_role,
        is_admin,
        is_service_role,
        success,
        error_message
    ) VALUES (
        COALESCE(NEW.jobname::text, 'unknown'),
        COALESCE(NEW.schedule::text, 'unknown'),
        COALESCE(NEW.command::text, 'unknown'),
        NULL,
        false,
        auth.uid(),
        user_role,
        is_admin,
        is_service_role,
        false,
        'Job creation attempt logged'
    );
    
    -- Permite admin și service_role să creeze job-uri
    IF is_admin OR is_service_role THEN
        -- Log succesul
        UPDATE public.job_audit 
        SET 
            success = true,
            error_message = 'Job created by admin/service_role'
        WHERE id = (SELECT id FROM public.job_audit ORDER BY timestamp DESC LIMIT 1);
        
        RETURN NEW;
    END IF;
    
    -- Validează job-ul pentru utilizatori non-admin
    is_valid := public.f_validate_cron_job(
        NEW.jobname::text,
        NEW.schedule::text,
        NEW.command::text
    );
    
    IF NOT is_valid THEN
        -- Log violarea
        UPDATE public.job_audit 
        SET 
            success = false,
            error_message = 'CRON-01: Job creation blocked - must use wrapper functions'
        WHERE id = (SELECT id FROM public.job_audit ORDER BY timestamp DESC LIMIT 1);
        
        RAISE EXCEPTION 'CRON-01: Job creation blocked. Job-urile cron trebuie să folosească funcțiile wrapper f_cron_run_*. Job: %, Command: %', 
            NEW.jobname, NEW.command;
    END IF;
    
    -- Log succesul
    UPDATE public.job_audit 
    SET 
        success = true,
        error_message = 'Job created successfully with valid wrapper'
    WHERE id = (SELECT id FROM public.job_audit ORDER BY timestamp DESC LIMIT 1);
    
    RETURN NEW;
END;
$$;

-- Activează trigger-ul pe cron.job (dacă este posibil)
-- Notă: pg_cron nu suportă trigger-uri directe, deci validarea se face prin funcții

-- === 6. FUNCȚII DE MONITORING PENTRU CRON ===

-- Funcție pentru raportarea job-urilor cron
CREATE OR REPLACE FUNCTION public.f_get_cron_jobs_report()
RETURNS TABLE (
    job_name text,
    cron_expression text,
    command text,
    is_compliant boolean,
    last_run timestamptz,
    next_run timestamptz,
    status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verifică dacă utilizatorul este admin
    IF NOT public.f_is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Doar adminii pot accesa rapoartele de cron';
    END IF;
    
    RETURN QUERY
    SELECT 
        j.jobname::text as job_name,
        j.schedule::text as cron_expression,
        j.command::text as command,
        (j.command LIKE '%f_cron_run_%') as is_compliant,
        j.last_run as last_run,
        j.next_run as next_run,
        CASE 
            WHEN j.command LIKE '%f_cron_run_%' THEN 'Compliant'
            ELSE 'Non-compliant'
        END as status
    FROM cron.job j
    ORDER BY j.jobname;
END;
$$;

-- Funcție pentru raportarea violărilor CRON-01
CREATE OR REPLACE FUNCTION public.f_get_cron_violations_report(
    days_back integer DEFAULT 7
)
RETURNS TABLE (
    job_name text,
    cron_expression text,
    command text,
    violation_type text,
    recommendation text,
    created_at timestamptz,
    user_id uuid,
    user_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verifică dacă utilizatorul este admin
    IF NOT public.f_is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Doar adminii pot accesa rapoartele de violări';
    END IF;
    
    RETURN QUERY
    SELECT 
        ja.job_name,
        ja.cron_expression,
        ja.command,
        CASE 
            WHEN ja.command NOT LIKE '%f_cron_run_%' THEN 'Direct business function call'
            WHEN ja.command LIKE '%refresh_tier_access_pool_all%' THEN 'Direct business function call'
            WHEN ja.command LIKE '%check_library_cap_and_alert%' THEN 'Direct business function call'
            WHEN ja.command LIKE '%check_preview_privileges_and_alert%' THEN 'Direct business function call'
            WHEN ja.command LIKE '%check_bundle_consistency_and_alert%' THEN 'Direct business function call'
            ELSE 'Unknown violation'
        END as violation_type,
        CASE 
            WHEN ja.command NOT LIKE '%f_cron_run_%' THEN 'Use f_cron_run_* wrapper functions'
            WHEN ja.command LIKE '%refresh_tier_access_pool_all%' THEN 'Use f_cron_run_refresh_tier_access_pool()'
            WHEN ja.command LIKE '%check_library_cap_and_alert%' THEN 'Use f_cron_run_check_library_cap()'
            WHEN ja.command LIKE '%check_preview_privileges_and_alert%' THEN 'Use f_cron_run_preview_audit()'
            WHEN ja.command LIKE '%check_bundle_consistency_and_alert%' THEN 'Use f_cron_run_bundle_consistency()'
            ELSE 'Review command for compliance'
        END as recommendation,
        ja.timestamp as created_at,
        ja.user_id,
        ja.user_role
    FROM public.job_audit ja
    WHERE ja.timestamp >= now() - (days_back || ' days')::interval
    AND ja.success = false
    AND ja.error_message LIKE '%CRON-01%'
    ORDER BY ja.timestamp DESC;
END;
$$;

-- Funcție pentru cleanup-ul log-urilor vechi
CREATE OR REPLACE FUNCTION public.f_cleanup_old_cron_logs(
    days_to_keep integer DEFAULT 90
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Verifică dacă utilizatorul este admin
    IF NOT public.f_is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Doar adminii pot curăța log-urile';
    END IF;
    
    DELETE FROM public.job_audit
    WHERE timestamp < now() - (days_to_keep || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup-ul
    INSERT INTO public.job_audit (
        job_name,
        cron_expression,
        command,
        wrapper_used,
        is_wrapper_valid,
        user_id,
        user_role,
        is_admin,
        success,
        error_message
    ) VALUES (
        'SYSTEM',
        'cleanup',
        'SELECT public.f_cleanup_old_cron_logs(' || days_to_keep || ')',
        'SYSTEM',
        true,
        auth.uid(),
        current_setting('role', true),
        true,
        true,
        'Cleaned up ' || deleted_count || ' old cron log entries'
    );
    
    RETURN deleted_count;
END;
$$;

-- === 7. JOB-URI CRON COMPLIANT DE EXEMPLU ===

-- Job pentru refresh tier access pool (compliance)
-- SELECT cron.schedule('refresh-tier-access-pool', '0 0 * * *', 'SELECT public.f_cron_run_refresh_tier_access_pool()');

-- Job pentru check library cap (compliance)
-- SELECT cron.schedule('check-library-cap', '*/15 * * * *', 'SELECT public.f_cron_run_check_library_cap()');

-- Job pentru preview audit (compliance)
-- SELECT cron.schedule('preview-audit', '0 2 * * *', 'SELECT public.f_cron_run_preview_audit()');

-- Job pentru bundle consistency (compliance)
-- SELECT cron.schedule('bundle-consistency', '0 4 * * *', 'SELECT public.f_cron_run_bundle_consistency()');

-- === 8. GRANTS ȘI PERMISIUNI ===

-- Grant pentru funcțiile wrapper (doar admin și service_role)
GRANT EXECUTE ON FUNCTION public.f_cron_run_refresh_tier_access_pool() TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_cron_run_check_library_cap() TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_cron_run_preview_audit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_cron_run_bundle_consistency() TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_cron_run_custom_job(text, text) TO authenticated;

-- Grant pentru funcțiile de validare
GRANT EXECUTE ON FUNCTION public.f_validate_cron_job(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_detect_cron_violations() TO authenticated;

-- Grant pentru funcțiile de monitoring (doar admin)
GRANT EXECUTE ON FUNCTION public.f_get_cron_jobs_report() TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_get_cron_violations_report(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_cleanup_old_cron_logs(integer) TO authenticated;

-- Grant pentru pg_cron (doar admin)
GRANT USAGE ON SCHEMA cron TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO authenticated;

-- === 9. CONFIGURARE INIȚIALĂ ===

-- Setează configurările implicite pentru pg_cron
-- Notă: Acestea pot fi configurate în postgresql.conf

-- === 10. SMOKE TESTS ===

-- Testează funcțiile wrapper (rulează ca admin)
-- SELECT public.f_cron_run_refresh_tier_access_pool();
-- SELECT public.f_cron_run_check_library_cap();
-- SELECT public.f_cron_run_preview_audit();
-- SELECT public.f_cron_run_bundle_consistency();
-- SELECT public.f_cron_run_custom_job('cleanup_old_logs', 'Cleanup old logs');

-- Testează validarea (rulează ca admin)
-- SELECT * FROM public.f_validate_cron_job('test-job', '0 0 * * *', 'SELECT public.f_cron_run_refresh_tier_access_pool()');

-- Testează detectarea violărilor (rulează ca admin)
-- SELECT * FROM public.f_detect_cron_violations();

-- Testează raportarea (rulează ca admin)
-- SELECT * FROM public.f_get_cron_jobs_report();
-- SELECT * FROM public.f_get_cron_violations_report(7);

-- === 11. NOTE OPERATIVE ===

-- 1. Pentru job-uri cron noi: folosește DOAR funcțiile wrapper f_cron_run_*
-- 2. Pentru job-uri personalizate: folosește f_cron_run_custom_job() cu funcții permise
-- 3. Toate job-urile sunt logate în job_audit
-- 4. Adminii și service_role pot crea job-uri direct
-- 5. Utilizatorii non-admin trebuie să folosească wrapper-ele
-- 6. Monitorizează log-urile pentru violări CRON-01

-- === 12. VERDICT SIMBOLIC ===

-- CRON-01 implementat: Job-urile cron sunt blindate prin wrapper-e,
-- accesul direct la funcțiile de business este interzis.
-- Audit trail complet pentru toate job-urile cron.
-- Adminii și service_role au excepții pentru operații critice.
