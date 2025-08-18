# CRON-01: VALIDARE CRON

## Descriere

**CRON-01** implementează validarea pentru job-urile cron care interzice apelarea directă a funcțiilor de business prin pg_cron și forțează folosirea wrapper-elor specializate. Această implementare asigură securitatea și controlul asupra job-urilor cron prin intermediul unui sistem de validare strict.

## Caracteristici Principale

### 🔒 Securitate Avansată
- **Interzice apelarea directă** a funcțiilor de business prin pg_cron
- **Forțează folosirea wrapper-elor** `f_cron_run_*` pentru toate job-urile
- **Implementează validare strictă** pentru comenzi cron
- **Audit trail complet** pentru toate job-urile cron

### 🚀 Funcții Wrapper Permise
- **`f_cron_run_refresh_tier_access_pool`** - Pentru refresh tier access pool
- **`f_cron_run_check_library_cap`** - Pentru verificarea library cap
- **`f_cron_run_preview_audit`** - Pentru audit preview privileges
- **`f_cron_run_bundle_consistency`** - Pentru verificarea bundle consistency
- **`f_cron_run_custom_job`** - Pentru job-uri personalizate cu validare

### 📊 Monitoring și Audit
- **Tabel de audit** (`job_audit`) pentru toate job-urile cron
- **Funcții de raportare** pentru job-uri și violări
- **Cleanup automat** pentru log-urile vechi
- **Tracking complet** pentru execuții și erori

## Implementare

### 1. Fișiere SQL

- **`sql/30_cron_validation_policies.sql`** - Schema principală cu toate funcțiile și politicile
- **`test/smoke/smoke_cron_validation_01.sql`** - Teste de validare și verificare

### 2. Script de Deployment

- **`scripts/deploy-cron-validation.sh`** - Script automatizat pentru implementare

### 3. Structura Implementării

```sql
-- Funcții wrapper pentru job-uri cron
public.f_cron_run_refresh_tier_access_pool()     -- Wrapper pentru refresh tier access
public.f_cron_run_check_library_cap()            -- Wrapper pentru check library cap
public.f_cron_run_preview_audit()                -- Wrapper pentru preview audit
public.f_cron_run_bundle_consistency()           -- Wrapper pentru bundle consistency
public.f_cron_run_custom_job()                   -- Wrapper generic pentru job-uri personalizate

-- Funcții de validare
public.f_validate_cron_job()                     -- Validează job-urile cron
public.f_detect_cron_violations()                -- Detectează violările CRON-01

-- Funcții de monitoring
public.f_get_cron_jobs_report()                  -- Raport job-uri cron
public.f_get_cron_violations_report()            -- Raport violări CRON-01
public.f_cleanup_old_cron_logs()                 -- Cleanup log-uri vechi

-- Tabel de audit
public.job_audit                                 -- Log complet al tuturor job-urilor cron
```

## Utilizare

### Deployment

```bash
# Development
./scripts/deploy-cron-validation.sh development

# Production cu URL specific
./scripts/deploy-cron-validation.sh production postgresql://user:pass@host:5432/db

# Ajutor
./scripts/deploy-cron-validation.sh --help
```

### Testare

```bash
# Rulează teste de validare
psql $DATABASE_URL -f test/smoke/smoke_cron_validation_01.sql
```

### Job-uri Cron Compliant

```sql
-- Job pentru refresh tier access pool
SELECT cron.schedule(
    'refresh-tier-access-pool', 
    '0 0 * * *', 
    'SELECT public.f_cron_run_refresh_tier_access_pool()'
);

-- Job pentru check library cap
SELECT cron.schedule(
    'check-library-cap', 
    '*/15 * * * *', 
    'SELECT public.f_cron_run_check_library_cap()'
);

-- Job pentru preview audit
SELECT cron.schedule(
    'preview-audit', 
    '0 2 * * *', 
    'SELECT public.f_cron_run_preview_audit()'
);

-- Job pentru bundle consistency
SELECT cron.schedule(
    'bundle-consistency', 
    '0 4 * * *', 
    'SELECT public.f_cron_run_bundle_consistency()'
);

-- Job personalizat cu funcție permisă
SELECT cron.schedule(
    'cleanup-logs', 
    '0 3 * * *', 
    'SELECT public.f_cron_run_custom_job(''cleanup_old_logs'', ''Cleanup old logs'')'
);
```

### Job-uri Cron Non-Compliant (BLOCHATE)

```sql
-- ❌ NU FUNCȚIONEAZĂ - Apelare directă a funcției de business
SELECT cron.schedule(
    'test-refresh', 
    '0 0 * * *', 
    'SELECT refresh_tier_access_pool_all()'
);

-- ❌ NU FUNCȚIONEAZĂ - Funcție de business directă
SELECT cron.schedule(
    'check-cap', 
    '*/15 * * * *', 
    'SELECT check_library_cap_and_alert()'
);

-- ❌ NU FUNCȚIONEAZĂ - Funcție de audit directă
SELECT cron.schedule(
    'preview-audit', 
    '0 2 * * *', 
    'SELECT check_preview_privileges_and_alert()'
);
```

## Funcții Wrapper

### `f_cron_run_refresh_tier_access_pool()`
```sql
-- Execută job-ul de refresh tier access pool
SELECT public.f_cron_run_refresh_tier_access_pool();

-- Caracteristici:
-- - Loghează execuția în job_audit
-- - Execută funcția de business (dacă există)
-- - Actualizează contoarele de execuție
-- - Returnează notificare de succes
```

### `f_cron_run_check_library_cap()`
```sql
-- Execută job-ul de verificare library cap
SELECT public.f_cron_run_check_library_cap();

-- Caracteristici:
-- - Rulează la fiecare 15 minute
-- - Loghează execuția în job_audit
-- - Verifică cap-ul bibliotecii
-- - Generează alerte dacă este necesar
```

### `f_cron_run_preview_audit()`
```sql
-- Execută job-ul de audit preview privileges
SELECT public.f_cron_run_preview_audit();

-- Caracteristici:
-- - Rulează zilnic la 2:00 AM
-- - Audit preview privileges
-- - Loghează rezultatele
-- - Generează rapoarte de securitate
```

### `f_cron_run_bundle_consistency()`
```sql
-- Execută job-ul de verificare bundle consistency
SELECT public.f_cron_run_bundle_consistency();

-- Caracteristici:
-- - Rulează zilnic la 4:00 AM
-- - Verifică consistența bundle-urilor
-- - Detectează inconsistențe
-- - Generează alerte pentru probleme
```

### `f_cron_run_custom_job()`
```sql
-- Execută job-uri personalizate cu validare
SELECT public.f_cron_run_custom_job('cleanup_old_logs', 'Cleanup old logs');

-- Funcții permise:
-- - cleanup_old_logs
-- - refresh_materialized_views
-- - update_statistics
-- - health_check

-- Caracteristici:
-- - Validare strictă a funcțiilor
-- - Logging complet în job_audit
-- - Execuție sigură cu verificări
-- - Mesaje de eroare descriptive
```

## Validare și Securitate

### Funcția de Validare
```sql
-- Validează un job cron
SELECT public.f_validate_cron_job(
    'job-name',
    '0 0 * * *',
    'SELECT public.f_cron_run_refresh_tier_access_pool()'
);

-- Returnează:
-- true  - Job valid (folosește wrapper permis)
-- false - Job invalid (nu folosește wrapper permis)
```

### Detectarea Violărilor
```sql
-- Detectează toate violările CRON-01
SELECT * FROM public.f_detect_cron_violations();

-- Returnează:
-- job_name, cron_expression, command, violation_type, recommendation
```

### Politici de Securitate
- **Admin și Service Role**: Pot crea job-uri cron direct
- **Utilizatori non-admin**: Trebuie să folosească wrapper-ele
- **Validare strictă**: Toate job-urile sunt validate înainte de execuție
- **Audit complet**: Toate operațiile sunt logate în job_audit

## Monitoring și Raportare

### Raport Job-uri Cron
```sql
-- Raport complet al job-urilor cron
SELECT * FROM public.f_get_cron_jobs_report();

-- Returnează:
-- job_name, cron_expression, command, is_compliant, last_run, next_run, status
```

### Raport Violări
```sql
-- Raport violări CRON-01 (ultimele 7 zile)
SELECT * FROM public.f_get_cron_violations_report(7);

-- Returnează:
-- job_name, cron_expression, command, violation_type, recommendation, created_at, user_id, user_role
```

### Audit Log
```sql
-- Verifică audit log-ul pentru job-uri cron
SELECT 
    job_name,
    cron_expression,
    wrapper_used,
    is_wrapper_valid,
    success,
    timestamp
FROM public.job_audit
ORDER BY timestamp DESC
LIMIT 20;
```

## Tabelul de Audit

### Structura `job_audit`
```sql
-- Câmpuri principale
id                    -- UUID primar
job_name             -- Numele job-ului cron
cron_expression      -- Expresia cron
command              -- Comanda executată
wrapper_used         -- Wrapper-ul folosit (dacă există)
is_wrapper_valid     -- Dacă wrapper-ul este valid
user_id              -- ID-ul utilizatorului
user_role            -- Rolul utilizatorului
is_admin             -- Dacă utilizatorul este admin
is_service_role      -- Dacă utilizatorul este service_role
timestamp            -- Timestamp-ul operației
success              -- Dacă operația a reușit
error_message        -- Mesajul de eroare (dacă există)
execution_count      -- Numărul de execuții
last_execution       -- Ultima execuție
next_execution       -- Următoarea execuție planificată
```

### Indexuri pentru Performanță
```sql
-- Indexuri optimizate
CREATE INDEX idx_job_audit_job_name ON public.job_audit(job_name);
CREATE INDEX idx_job_audit_timestamp ON public.job_audit(timestamp);
CREATE INDEX idx_job_audit_wrapper_used ON public.job_audit(wrapper_used);
CREATE INDEX idx_job_audit_success ON public.job_audit(success);
```

## Troubleshooting

### Probleme Comune

#### 1. "Job creation blocked - must use wrapper functions"
**Cauza**: Încercare de creare job cron fără wrapper permis
**Soluția**: Folosește una din funcțiile wrapper `f_cron_run_*`

```sql
-- ❌ Nu funcționează
SELECT cron.schedule('test', '0 0 * * *', 'SELECT refresh_tier_access_pool_all()');

-- ✅ Funcționează
SELECT cron.schedule('test', '0 0 * * *', 'SELECT public.f_cron_run_refresh_tier_access_pool()');
```

#### 2. "Funcția X nu este permisă pentru job-uri cron personalizate"
**Cauza**: Încercare de folosire funcție nepermisă în `f_cron_run_custom_job`
**Soluția**: Folosește doar funcțiile permise

```sql
-- Funcții permise:
-- cleanup_old_logs
-- refresh_materialized_views
-- update_statistics
-- health_check
```

#### 3. "Extensia pg_cron nu este instalată"
**Cauza**: pg_cron nu este configurat în PostgreSQL
**Soluția**: Configurează pg_cron

```bash
# 1. Adaugă în postgresql.conf
shared_preload_libraries = 'pg_cron'

# 2. Restartează PostgreSQL
sudo systemctl restart postgresql

# 3. Creează extensia
CREATE EXTENSION pg_cron;
```

### Verificări de Securitate

```sql
-- Verifică dacă pg_cron este instalat
SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
);

-- Verifică funcțiile wrapper
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'f_cron_run_%';

-- Verifică funcțiile de validare
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'f_validate_cron_job',
    'f_detect_cron_violations'
);

-- Verifică tabelul de audit
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'job_audit'
);
```

## Performanță

### Impact Minim
- **Wrapper-ele** rulează doar când sunt apelate
- **Validarea** se face la crearea job-ului, nu la execuție
- **Audit logging-ul** este eficient și indexat
- **Cleanup-ul** se face automat pentru log-urile vechi

### Optimizări
- **Indexuri** pentru toate câmpurile de căutare
- **Funcții** optimizate pentru performanță
- **Logging** asincron pentru operațiile de audit
- **Cleanup** programat pentru menținerea performanței

## Deployment

### 1. Development
```bash
./scripts/deploy-cron-validation.sh development
```

### 2. Staging
```bash
./scripts/deploy-cron-validation.sh staging $STAGING_DB_URL
```

### 3. Production
```bash
./scripts/deploy-cron-validation.sh production $PRODUCTION_DB_URL
```

### 4. Verificare Post-Deployment
```bash
# Rulează teste de validare
psql $DATABASE_URL -f test/smoke/smoke_cron_validation_01.sql

# Verifică implementarea
psql $DATABASE_URL -c "
SELECT 
    'CRON-01 STATUS' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'job_audit'
    ) THEN 'PASS' ELSE 'FAIL' END as audit_log,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name LIKE 'f_cron_run_%'
    ) THEN 'PASS' ELSE 'FAIL' END as wrapper_functions;
"
```

## Concluzie

**CRON-01** implementează o soluție completă de securitate pentru job-urile cron care:

✅ **Protejează** funcțiile de business de apelarea directă prin pg_cron  
✅ **Forțează** folosirea wrapper-elor specializate `f_cron_run_*`  
✅ **Implementează** audit trail complet pentru toate job-urile cron  
✅ **Oferă** monitoring și raportare pentru violări  
✅ **Permite** excepții pentru admin și service_role  
✅ **Asigură** validarea strictă a tuturor job-urilor cron  

Această implementare asigură că job-urile cron respectă principiile de securitate prin design, oferind în același timp flexibilitatea necesară pentru operațiile administrative și de deployment. Toate job-urile cron sunt acum blindate prin wrapper-e, iar accesul direct la funcțiile de business este interzis.
