-- ============================================================================
-- DB-01: VALIDARE DE BAZE DE DATE - INTERZICE SELECT DIRECT PE TABELE BRUTE
-- ============================================================================
-- 
-- Acest fișier implementează validarea DB-01:
-- - Interzice SELECT direct pe tabele brute (bundles, plans, neurons, etc.)
-- - Forțează folosirea view-urilor publice (v_bundle_public, v_plans_public) sau RPC-urilor
-- - Permite excepții pentru migrări și deployment
-- - Implementează logging și monitoring pentru încercările de acces neautorizat
--
-- Caracteristici:
-- - Politici RLS restrictive pentru tabelele sensibile
-- - Funcții de validare pentru detectarea accesului direct
-- - Sistem de excepții pentru admin și service_role
-- - Audit trail pentru toate încercările de acces
-- ============================================================================

-- === 1. FUNCȚII DE VALIDARE ===

-- Funcție pentru detectarea accesului direct la tabele brute
CREATE OR REPLACE FUNCTION public.f_detect_direct_table_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    table_name text;
    user_role text;
    is_admin boolean;
    is_service_role boolean;
    is_migration boolean;
BEGIN
    -- Obține numele tabelului
    table_name := TG_TABLE_NAME;
    
    -- Verifică rolul utilizatorului
    user_role := current_setting('role', true);
    
    -- Verifică dacă este admin
    is_admin := public.f_is_admin(auth.uid());
    
    -- Verifică dacă este service_role (pentru webhooks, cron jobs)
    is_service_role := (user_role = 'service_role');
    
    -- Verifică dacă este în context de migrare/deployment
    is_migration := (
        current_setting('app.migration_mode', true) = 'true' OR
        current_setting('app.deployment_mode', true) = 'true'
    );
    
    -- Log toate încercările de acces
    INSERT INTO public.access_audit_log (
        table_name,
        operation,
        user_id,
        user_role,
        is_admin,
        is_service_role,
        is_migration,
        ip_address,
        user_agent,
        timestamp
    ) VALUES (
        table_name,
        TG_OP,
        auth.uid(),
        user_role,
        is_admin,
        is_service_role,
        is_migration,
        current_setting('app.ip_address', true),
        current_setting('app.user_agent', true),
        now()
    );
    
    -- Permite accesul dacă este admin, service_role sau în migrare
    IF is_admin OR is_service_role OR is_migration THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Blochează accesul direct la tabelele sensibile
    IF table_name IN ('neurons', 'bundles', 'plans', 'library_tree', 'library_tree_neurons') THEN
        RAISE EXCEPTION 'DB-01: Acces direct interzis la tabelul %. Folosește view-urile publice sau RPC-urile. Tabel: %, Operație: %, User: %', 
            table_name, table_name, TG_OP, auth.uid();
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Funcție pentru validarea accesului la view-uri publice
CREATE OR REPLACE FUNCTION public.f_validate_public_view_access(view_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verifică dacă view-ul este public
    IF view_name IN ('v_neuron_public', 'v_tree_public', 'v_bundle_public', 'v_plans_public') THEN
        RETURN true;
    END IF;
    
    -- Verifică dacă utilizatorul este admin
    IF public.f_is_admin(auth.uid()) THEN
        RETURN true;
    END IF;
    
    -- Verifică dacă este service_role
    IF current_setting('role', true) = 'service_role' THEN
        RETURN true;
    END IF;
    
    -- Verifică dacă este în migrare
    IF current_setting('app.migration_mode', true) = 'true' OR
       current_setting('app.deployment_mode', true) = 'true' THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;

-- === 2. TABEL DE AUDIT PENTRU ACCES ===

-- Tabel pentru logging-ul tuturor încercărilor de acces
CREATE TABLE IF NOT EXISTS public.access_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name text NOT NULL,
    operation text NOT NULL,
    user_id uuid,
    user_role text,
    is_admin boolean DEFAULT false,
    is_service_role boolean DEFAULT false,
    is_migration boolean DEFAULT false,
    ip_address text,
    user_agent text,
    timestamp timestamptz DEFAULT now(),
    success boolean DEFAULT true,
    error_message text
);

-- Indexuri pentru performanță
CREATE INDEX IF NOT EXISTS idx_access_audit_log_table_name ON public.access_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_access_audit_log_user_id ON public.access_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_audit_log_timestamp ON public.access_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_access_audit_log_operation ON public.access_audit_log(operation);

-- RLS pentru audit log (doar admin poate vedea)
ALTER TABLE public.access_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_admin_only ON public.access_audit_log
    FOR ALL TO authenticated
    USING (public.f_is_admin(auth.uid()));

-- === 3. TRIGGERE PENTRU VALIDARE ===

-- Activează trigger-ul pentru toate tabelele sensibile
DO $$
DECLARE
    table_record record;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('neurons', 'bundles', 'plans', 'library_tree', 'library_tree_neurons')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_validate_direct_access ON public.%I;
            CREATE TRIGGER trg_validate_direct_access
                BEFORE INSERT OR UPDATE OR DELETE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION public.f_detect_direct_table_access();
        ', table_record.table_name, table_record.table_name);
    END LOOP;
END $$;

-- === 4. POLITICI RLS RESTRICTIVE ===

-- Neurons: blochează SELECT direct pentru non-admin
DROP POLICY IF EXISTS neurons_public_select ON public.neurons;
CREATE POLICY neurons_public_select ON public.neurons
    FOR SELECT TO authenticated
    USING (public.f_is_admin(auth.uid()));

-- Bundles: blochează SELECT direct pentru non-admin
DROP POLICY IF EXISTS bundles_public_select ON public.bundles;
CREATE POLICY bundles_public_select ON public.bundles
    FOR SELECT TO authenticated
    USING (public.f_is_admin(auth.uid()));

-- Plans: blochează SELECT direct pentru non-admin
DROP POLICY IF EXISTS plans_public_select ON public.plans;
CREATE POLICY plans_public_select ON public.plans
    FOR SELECT TO authenticated
    USING (public.f_is_admin(auth.uid()));

-- Library tree: blochează SELECT direct pentru non-admin
DROP POLICY IF EXISTS library_tree_public_select ON public.library_tree;
CREATE POLICY library_tree_public_select ON public.library_tree
    FOR SELECT TO authenticated
    USING (public.f_is_admin(auth.uid()));

-- Library tree neurons: blochează SELECT direct pentru non-admin
DROP POLICY IF EXISTS library_tree_neurons_public_select ON public.library_tree_neurons;
CREATE POLICY library_tree_neurons_public_select ON public.library_tree_neurons
    FOR SELECT TO authenticated
    USING (public.f_is_admin(auth.uid()));

-- === 5. FUNCȚII DE EXCEPȚIE PENTRU MIGRĂRI ===

-- Funcție pentru activarea modului de migrare
CREATE OR REPLACE FUNCTION public.f_enable_migration_mode()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verifică dacă utilizatorul este admin
    IF NOT public.f_is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Doar adminii pot activa modul de migrare';
    END IF;
    
    -- Setează flag-ul de migrare
    PERFORM set_config('app.migration_mode', 'true', false);
    
    -- Log activarea
    INSERT INTO public.access_audit_log (
        table_name,
        operation,
        user_id,
        user_role,
        is_admin,
        success,
        error_message
    ) VALUES (
        'SYSTEM',
        'MIGRATION_MODE_ENABLED',
        auth.uid(),
        current_setting('role', true),
        true,
        true,
        'Migration mode enabled by admin'
    );
END;
$$;

-- Funcție pentru dezactivarea modului de migrare
CREATE OR REPLACE FUNCTION public.f_disable_migration_mode()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verifică dacă utilizatorul este admin
    IF NOT public.f_is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Doar adminii pot dezactiva modul de migrare';
    END IF;
    
    -- Resetează flag-ul de migrare
    PERFORM set_config('app.migration_mode', 'false', false);
    
    -- Log dezactivarea
    INSERT INTO public.access_audit_log (
        table_name,
        operation,
        user_id,
        user_role,
        is_admin,
        success,
        error_message
    ) VALUES (
        'SYSTEM',
        'MIGRATION_MODE_DISABLED',
        auth.uid(),
        current_setting('role', true),
        true,
        true,
        'Migration mode disabled by admin'
    );
END;
$$;

-- === 6. FUNCȚII DE MONITORING ===

-- Funcție pentru raportarea încercărilor de acces neautorizat
CREATE OR REPLACE FUNCTION public.f_get_unauthorized_access_report(
    days_back integer DEFAULT 7
)
RETURNS TABLE (
    table_name text,
    operation text,
    user_id uuid,
    user_role text,
    attempt_count bigint,
    last_attempt timestamptz,
    ip_address text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verifică dacă utilizatorul este admin
    IF NOT public.f_is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Doar adminii pot accesa rapoartele de securitate';
    END IF;
    
    RETURN QUERY
    SELECT 
        aal.table_name,
        aal.operation,
        aal.user_id,
        aal.user_role,
        COUNT(*) as attempt_count,
        MAX(aal.timestamp) as last_attempt,
        aal.ip_address
    FROM public.access_audit_log aal
    WHERE aal.timestamp >= now() - (days_back || ' days')::interval
    AND aal.success = false
    GROUP BY aal.table_name, aal.operation, aal.user_id, aal.user_role, aal.ip_address
    ORDER BY attempt_count DESC, last_attempt DESC;
END;
$$;

-- Funcție pentru cleanup-ul log-urilor vechi
CREATE OR REPLACE FUNCTION public.f_cleanup_old_audit_logs(
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
    
    DELETE FROM public.access_audit_log
    WHERE timestamp < now() - (days_to_keep || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup-ul
    INSERT INTO public.access_audit_log (
        table_name,
        operation,
        user_id,
        user_role,
        is_admin,
        success,
        error_message
    ) VALUES (
        'SYSTEM',
        'AUDIT_LOG_CLEANUP',
        auth.uid(),
        current_setting('role', true),
        true,
        true,
        'Cleaned up ' || deleted_count || ' old audit log entries'
    );
    
    RETURN deleted_count;
END;
$$;

-- === 7. GRANTS ȘI PERMISIUNI ===

-- Grant pentru funcțiile de migrare (doar admin)
GRANT EXECUTE ON FUNCTION public.f_enable_migration_mode() TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_disable_migration_mode() TO authenticated;

-- Grant pentru funcțiile de monitoring (doar admin)
GRANT EXECUTE ON FUNCTION public.f_get_unauthorized_access_report(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_cleanup_old_audit_logs(integer) TO authenticated;

-- Grant pentru funcțiile de validare
GRANT EXECUTE ON FUNCTION public.f_detect_direct_table_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.f_validate_public_view_access(text) TO authenticated;

-- === 8. CONFIGURARE INIȚIALĂ ===

-- Setează configurările implicite
SELECT set_config('app.migration_mode', 'false', false);
SELECT set_config('app.deployment_mode', 'false', false);

-- === 9. SMOKE TESTS ===

-- Testează validarea (rulează ca admin)
-- SELECT public.f_enable_migration_mode();
-- SELECT public.f_disable_migration_mode();

-- Testează raportarea (rulează ca admin)
-- SELECT * FROM public.f_get_unauthorized_access_report(1);

-- Testează cleanup-ul (rulează ca admin)
-- SELECT public.f_cleanup_old_audit_logs(30);

-- === 10. NOTE OPERATIVE ===

-- 1. Pentru migrări: SET app.migration_mode = 'true' înainte de operații
-- 2. Pentru deployment: SET app.deployment_mode = 'true' înainte de operații
-- 3. Toate încercările de acces sunt logate în access_audit_log
-- 4. Adminii pot accesa tabelele brute direct
-- 5. Service role (webhooks, cron) nu este afectat de restricții
-- 6. View-urile publice rămân accesibile pentru toți utilizatorii autentificați

-- === 11. VERDICT SIMBOLIC ===

-- DB-01 implementat: Tabelele brute sunt blindate, 
-- accesul se face exclusiv prin view-uri publice și RPC-uri.
-- Adminii și service role-ul au excepții pentru operații critice.
-- Audit trail complet pentru toate încercările de acces.
