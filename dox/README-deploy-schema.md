# Deploy Schema pe Database-ul de Dezvoltare

## 🎯 Obiectiv

Acest document descrie cum să rulezi scriptul SQL pentru deploy-ul schemei pe database-ul de dezvoltare Supabase.

## 📋 Pașii de Deploy

### 1. Accesează Supabase Dashboard

1. Mergi la [supabase.com](https://supabase.com)
2. Autentifică-te în contul tău
3. Selectează proiectul `ai-prompt-templates`
4. Accesează **SQL Editor** din meniul din stânga

### 2. Rulează Scriptul SQL

1. În SQL Editor, creează un nou query
2. Copiază conținutul din `sql/deploy-schema-dev.sql`
3. Rulează query-ul (Ctrl+Enter sau butonul "Run")

### 3. Verifică Rezultatul

După rulare, ar trebui să vezi:

```
NOTICE:  All tables have RLS enabled successfully
NOTICE:  Schema DDL completed successfully!
NOTICE:  Features:
NOTICE:  - Digital root 2 validation for all prices
NOTICE:  - RLS enabled on all tables
NOTICE:  - Comprehensive indexing for performance
NOTICE:  - User tier logic implemented
NOTICE:  - Stripe pricing integration ready
```

## 🗄️ Ce se Creează

### Tabele Principale
- ✅ `user_subscriptions` - Abonamentele utilizatorilor
- ✅ `plans` - Planurile de preț cu digital root 2
- ✅ `neurons` - Unitățile de conținut
- ✅ `library_tree` - Structura ierarhică
- ✅ `bundles` - Pachete de neuroni
- ✅ `library_tree_neurons` - Relații tree-neuroni
- ✅ `bundle_neurons` - Relații bundle-neuroni

### Funcții Utilitare
- ✅ `f_digital_root()` - Calculează digital root
- ✅ `f_plan_percent_access()` - Procentul de acces al planului
- ✅ `f_plan_rank()` - Rank-ul planului pentru ordonare
- ✅ `f_get_current_user_tier()` - Tier-ul curent al user-ului
- ✅ `f_can_access_neuron()` - Verifică accesul la neuron

### Indexuri de Performanță
- ✅ Indexuri compuse pentru căutări frecvente
- ✅ Indexuri case-insensitive pentru slug și title
- ✅ Indexuri pentru filtrarea pe tier și status
- ✅ Indexuri pentru soft delete cleanup

### Securitate
- ✅ RLS activat pe toate tabelele
- ✅ Policies pentru acces public la conținut
- ✅ Policies pentru acces privat la subscription-uri

## 🔧 Verificare Deploy

### 1. Verifică Tabelele

```sql
-- Lista toate tabelele create
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### 2. Verifică Funcțiile

```sql
-- Lista toate funcțiile create
SELECT proname, prosrc 
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;
```

### 3. Verifică Indexurile

```sql
-- Lista toate indexurile
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 4. Verifică RLS

```sql
-- Verifică dacă RLS e activat
SELECT 
  tablename,
  relrowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
ORDER BY tablename;
```

### 5. Verifică Seed Data

```sql
-- Verifică planurile create
SELECT * FROM public.plans ORDER BY f_plan_rank(code);
```

## 🚨 Troubleshooting

### Eroare: "extension already exists"
**Soluție:** Aceasta e normală, extensiile sunt create cu `IF NOT EXISTS`.

### Eroare: "type already exists"
**Soluție:** Tipul `plan_tier` este creat cu verificare `IF NOT EXISTS`.

### Eroare: "table already exists"
**Soluție:** Tabelele sunt create cu `IF NOT EXISTS`.

### Eroare: "function already exists"
**Soluție:** Funcțiile sunt create cu `CREATE OR REPLACE`.

## 📊 Testare După Deploy

### 1. Testează Schema

```bash
make test-schema
```

### 2. Generează Date de Test

```bash
make generate-data
```

### 3. Testează Performanța

```bash
make performance-test
```

## 🔄 Re-deploy

Dacă vrei să rulezi din nou scriptul:

1. Scriptul folosește `IF NOT EXISTS` și `CREATE OR REPLACE`
2. Poți rula scriptul de mai multe ori fără probleme
3. Datele existente nu vor fi afectate

## 📝 Note Importante

- **Digital Root 2:** Toate prețurile respectă formula digital root = 2
- **RLS Activ:** Toate tabelele au Row Level Security activat
- **Indexuri Optimizate:** Schema include indexuri pentru performanță maximă
- **Stripe Ready:** Prețurile sunt configurate pentru integrarea cu Stripe

## 🎯 Următorii Pași

1. **Verifică deploy-ul** cu comenzile de mai sus
2. **Rulează testele** pentru validarea schemei
3. **Generează date de test** pentru testarea performanței
4. **Integrează cu aplicația** pentru testarea funcționalității

---

**Notă:** Acest script creează schema completă gata pentru producție, cu toate optimizările de performanță și securitate implementate.
