# DB-01: VALIDARE DE BAZE DE DATE

## Descriere

**DB-01** implementează validarea de baze de date care interzice SELECT direct pe tabele brute și forțează folosirea view-urilor publice sau RPC-urilor. Această implementare asigură securitatea datelor prin controlul accesului la nivel de bază de date.

## Caracteristici Principale

### 🔒 Securitate Avansată
- **Interzice SELECT direct** pe tabele brute (`neurons`, `bundles`, `plans`, `library_tree`)
- **Forțează folosirea view-urilor publice** (`v_neuron_public`, `v_bundle_public`, etc.)
- **Implementează RLS (Row Level Security)** cu politici restrictive
- **Audit trail complet** pentru toate încercările de acces

### 🚀 Excepții Inteligente
- **Admin access**: Utilizatorii admin pot accesa tabelele brute direct
- **Service role**: Webhooks, cron jobs și alte servicii nu sunt afectate
- **Migration mode**: Suport pentru migrări și deployment fără restricții
- **Deployment mode**: Flag special pentru operații de deployment

### 📊 Monitoring și Audit
- **Tabel de audit** (`access_audit_log`) pentru toate operațiile
- **Funcții de raportare** pentru accesul neautorizat
- **Cleanup automat** pentru log-urile vechi
- **Indexuri optimizate** pentru performanță

## Implementare

### 1. Fișiere SQL

- **`sql/29_db_validation_policies.sql`** - Schema principală cu toate funcțiile și politicile
- **`test/smoke/smoke_db_validation_01.sql`** - Teste de validare și verificare

### 2. Script de Deployment

- **`scripts/deploy-db-validation.sh`** - Script automatizat pentru implementare

### 3. Structura Implementării

```sql
-- Funcții de validare
public.f_detect_direct_table_access()     -- Trigger pentru detectarea accesului direct
public.f_validate_public_view_access()    -- Validarea accesului la view-uri publice

-- Funcții de migrare
public.f_enable_migration_mode()          -- Activează modul de migrare
public.f_disable_migration_mode()         -- Dezactivează modul de migrare

-- Funcții de monitoring
public.f_get_unauthorized_access_report() -- Raport acces neautorizat
public.f_cleanup_old_audit_logs()        -- Cleanup log-uri vechi

-- Tabel de audit
public.access_audit_log                   -- Log complet al tuturor acceselor

-- Trigger-uri de validare
trg_validate_direct_access               -- Activează pe toate tabelele sensibile

-- Politici RLS restrictive
neurons_public_select                     -- Blochează SELECT direct pe neurons
bundles_public_select                     -- Blochează SELECT direct pe bundles
plans_public_select                       -- Blochează SELECT direct pe plans
library_tree_public_select                -- Blochează SELECT direct pe library_tree
```

## Utilizare

### Deployment

```bash
# Development
./scripts/deploy-db-validation.sh development

# Production cu URL specific
./scripts/deploy-db-validation.sh production postgresql://user:pass@host:5432/db

# Ajutor
./scripts/deploy-db-validation.sh --help
```

### Testare

```bash
# Rulează teste de validare
psql $DATABASE_URL -f test/smoke/smoke_db_validation_01.sql
```

### Modul de Migrare

```sql
-- Activează modul de migrare (admin only)
SELECT public.f_enable_migration_mode();

-- Operații de migrare
-- ...

-- Dezactivează modul de migrare
SELECT public.f_disable_migration_mode();
```

### Monitoring

```sql
-- Raport acces neautorizat (ultimele 7 zile)
SELECT * FROM public.f_get_unauthorized_access_report(7);

-- Cleanup log-uri vechi (păstrează ultimele 90 zile)
SELECT public.f_cleanup_old_audit_logs(90);
```

## Tabele Protejate

| Tabel | Acces Direct | View Public | RPC |
|-------|--------------|-------------|-----|
| `neurons` | ❌ Blocat | ✅ `v_neuron_public` | ✅ `rpc_get_neuron_full` |
| `bundles` | ❌ Blocat | ✅ `v_bundle_public` | ✅ `rpc_get_bundle_full` |
| `plans` | ❌ Blocat | ✅ `v_plans_public` | ✅ `rpc_get_plan_details` |
| `library_tree` | ❌ Blocat | ✅ `v_tree_public` | ✅ `rpc_get_tree_structure` |
| `library_tree_neurons` | ❌ Blocat | ❌ Nu există | ✅ `rpc_get_tree_neurons` |

## View-uri Publice

### `v_neuron_public`
```sql
SELECT id, slug, title, summary, required_tier, price_cents
FROM public.v_neuron_public
WHERE published = TRUE;
```

### `v_bundle_public`
```sql
SELECT id, slug, title, description, price_cents, required_tier, items
FROM public.v_bundle_public;
```

### `v_plans_public`
```sql
SELECT code, name, percent_access, monthly_price_cents, annual_price_cents
FROM public.v_plans_public
ORDER BY f_plan_rank(code);
```

### `v_tree_public`
```sql
SELECT path, name, children_count
FROM public.v_tree_public;
```

## Excepții și Context

### Admin Access
Utilizatorii cu rol de admin pot accesa toate tabelele direct:
```sql
-- Verifică dacă utilizatorul este admin
SELECT public.f_is_admin(auth.uid()) as is_admin;

-- Admin poate face SELECT direct
SELECT * FROM public.neurons;
```

### Service Role
Webhooks, cron jobs și alte servicii rulează cu `service_role`:
```sql
-- Service role nu este afectat de restricții
SET ROLE service_role;
SELECT * FROM public.neurons; -- ✅ Funcționează
RESET ROLE;
```

### Migration Mode
Pentru migrări și deployment:
```sql
-- Activează modul de migrare
SELECT public.f_enable_migration_mode();

-- Operații de migrare
-- ...

-- Dezactivează modul de migrare
SELECT public.f_disable_migration_mode();
```

## Audit și Monitoring

### Tabelul de Audit
```sql
-- Structura tabelului de audit
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'access_audit_log'
ORDER BY ordinal_position;
```

### Raportare
```sql
-- Acces neautorizat pe ultimele 24 ore
SELECT 
    table_name,
    operation,
    user_id,
    COUNT(*) as attempt_count,
    MAX(timestamp) as last_attempt
FROM public.access_audit_log
WHERE timestamp >= now() - interval '24 hours'
AND success = false
GROUP BY table_name, operation, user_id
ORDER BY attempt_count DESC;
```

### Cleanup Automat
```sql
-- Curăță log-urile mai vechi de 90 zile
SELECT public.f_cleanup_old_audit_logs(90);
```

## Securitate și Compliance

### RLS (Row Level Security)
- Toate tabelele sensibile au RLS activat
- Politici restrictive pentru utilizatori non-admin
- Excepții pentru admin și service_role

### Audit Trail
- Log complet al tuturor operațiilor
- Tracking pentru IP, user agent, timestamp
- Raportare pentru acces neautorizat

### Validare Multi-nivel
- Trigger-uri la nivel de bază de date
- Politici RLS la nivel de tabel
- Funcții de validare la nivel de aplicație

## Troubleshooting

### Probleme Comune

#### 1. "Acces direct interzis la tabelul X"
**Cauza**: Încercare de SELECT direct pe tabel brut
**Soluția**: Folosește view-ul public corespunzător

```sql
-- ❌ Nu funcționează
SELECT * FROM public.neurons;

-- ✅ Funcționează
SELECT * FROM public.v_neuron_public;
```

#### 2. "Permission denied on access_audit_log"
**Cauza**: Utilizatorul nu este admin
**Soluția**: Verifică rolul utilizatorului

```sql
SELECT public.f_is_admin(auth.uid()) as is_admin;
```

#### 3. Trigger-urile nu sunt active
**Cauza**: Fișierul SQL nu a fost rulat complet
**Soluția**: Rulează din nou `29_db_validation_policies.sql`

### Verificări de Securitate

```sql
-- Verifică dacă RLS este activat
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('neurons', 'bundles', 'plans');

-- Verifică politicile RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('neurons', 'bundles', 'plans');

-- Verifică trigger-urile
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%validate_direct_access%';
```

## Performanță

### Indexuri Optimizate
```sql
-- Indexuri pentru audit log
CREATE INDEX idx_access_audit_log_table_name ON public.access_audit_log(table_name);
CREATE INDEX idx_access_audit_log_user_id ON public.access_audit_log(user_id);
CREATE INDEX idx_access_audit_log_timestamp ON public.access_audit_log(timestamp);
CREATE INDEX idx_access_audit_log_operation ON public.access_audit_log(operation);
```

### Impact Minim
- Trigger-urile rulează doar pentru operații de modificare
- View-urile publice sunt optimizate pentru citire
- Audit logging-ul este asincron și eficient

## Deployment

### 1. Development
```bash
./scripts/deploy-db-validation.sh development
```

### 2. Staging
```bash
./scripts/deploy-db-validation.sh staging $STAGING_DB_URL
```

### 3. Production
```bash
./scripts/deploy-db-validation.sh production $PRODUCTION_DB_URL
```

### 4. Verificare Post-Deployment
```bash
# Rulează teste de validare
psql $DATABASE_URL -f test/smoke/smoke_db_validation_01.sql

# Verifică implementarea
psql $DATABASE_URL -c "
SELECT 
    'DB-01 STATUS' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'access_audit_log'
    ) THEN 'PASS' ELSE 'FAIL' END as audit_log,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name LIKE '%validate_direct_access%'
    ) THEN 'PASS' ELSE 'FAIL' END as triggers;
"
```

## Concluzie

**DB-01** implementează o soluție completă de securitate pentru baza de date care:

✅ **Protejează** tabelele brute de accesul direct  
✅ **Forțează** folosirea view-urilor publice și RPC-urilor  
✅ **Permite** excepții pentru admin și service_role  
✅ **Implementează** audit trail complet  
✅ **Oferă** suport pentru migrări și deployment  
✅ **Monitorizează** toate încercările de acces  

Această implementare asigură că aplicația respectă principiile de securitate prin design, oferind în același timp flexibilitatea necesară pentru operațiile administrative și de deployment.
