# Schema Setup pentru "Creier pe neuroni" cu RLS activ

## Descriere

Această schemă implementează un sistem complet de management pentru conținut digital cu:
- **Neuroni**: Unități individuale de conținut cu gating pe tier
- **Bundle-uri**: Seturi de neuroni vândute ca pachete
- **Plans**: Abonamente cu gating 10/40/70/100
- **Library Tree**: Structură ierarhică pentru organizarea conținutului
- **RLS**: Row Level Security activ pentru toate tabelele

## Caracteristici Cheie

### 🔒 Securitate
- **RLS activ** pe toate tabelele
- **Views publice** pentru acces securizat
- **Soft delete** pentru toate entitățile
- **Gating pe tier** pentru acces la conținut

### 💰 Prețuri Digital Root 2
- Toate prețurile respectă algoritmul digital root = 2
- Validare automată prin triggers
- Prețuri în cenți pentru precizie

### 🏗️ Arhitectură
- **Idempotent**: Poate fi rulat de mai multe ori
- **Extensibil**: Ușor de modificat și extins
- **Performant**: Indexuri optimizate pentru toate cazurile de utilizare

## Fișiere

### 1. `00_complete_schema_ddl.sql`
**Schema completă cu toate tabelele, funcțiile și trigger-ele**

Conține:
- Extensii necesare (pgcrypto, ltree, unaccent)
- ENUM pentru plan_tier
- Funcții utilitare (digital root, plan access, etc.)
- Tabele: neurons, library_tree, bundles, plans, pivot tables
- Triggers pentru validări și audit
- Views publice
- Seed data pentru plans
- Verificări finale

### 2. `01_rls_policies.sql`
**Politici RLS pentru toate tabelele**

Conține:
- Politici pentru SELECT, INSERT, UPDATE, DELETE
- Acces public la conținut publicat
- Acces autentificat pentru modificări
- Funcții utilitare pentru verificarea accesului
- Verificări RLS

## Instalare

### Pasul 1: Rularea schemei principale
```bash
psql -h your_host -U your_user -d your_database -f 00_complete_schema_ddl.sql
```

### Pasul 2: Rularea politicilor RLS
```bash
psql -h your_host -U your_user -d your_database -f 01_rls_policies.sql
```

### Pasul 3: Verificarea instalării
```sql
-- Verifică dacă toate tabelele sunt create
\dt public.*

-- Verifică dacă RLS e activ
SELECT tablename, relrowsecurity 
FROM pg_tables t 
JOIN pg_class c ON t.tablename = c.relname 
WHERE schemaname = 'public';

-- Verifică politicile RLS
SELECT * FROM f_test_rls_policies();
```

## Structura Tabelelor

### Neurons
```sql
CREATE TABLE public.neurons (
  id                 uuid PRIMARY KEY,
  slug               text UNIQUE NOT NULL,
  title              text NOT NULL,
  summary            text NOT NULL,          -- public preview
  content_full       text NOT NULL,          -- gated content
  required_tier      plan_tier NOT NULL,
  price_cents        integer NOT NULL,
  digital_root       integer NOT NULL,       -- = 2
  category           text NOT NULL,
  tags               text[] NOT NULL,
  depth_score        integer,
  pattern_complexity integer,
  published          boolean DEFAULT true,
  deleted_at         timestamptz NULL,       -- soft delete
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);
```

### Plans
```sql
CREATE TABLE public.plans (
  id                    uuid PRIMARY KEY,
  code                  plan_tier UNIQUE,    -- 'free'|'architect'|'initiate'|'elite'
  name                  text NOT NULL,
  percent_access        int NOT NULL,        -- 10|40|70|100
  monthly_price_cents   int NOT NULL,       -- 0 pentru 'free'
  annual_price_cents    int NOT NULL,       -- 0 pentru 'free'
  stripe_price_id_month text,
  stripe_price_id_year  text
);
```

### Library Tree
```sql
CREATE TABLE public.library_tree (
  id         uuid PRIMARY KEY,
  parent_id  uuid REFERENCES library_tree(id),
  name       text NOT NULL,
  path       ltree NOT NULL,                -- path ierarhic
  position   int DEFAULT 0,
  deleted_at timestamptz NULL
);
```

## Funcții Utilitare

### Digital Root
```sql
-- Verifică dacă un preț respectă digital root = 2
SELECT f_is_root2_eur_cents(2900);  -- true (29€ → 2+9=11 → 1+1=2)
SELECT f_is_root2_eur_cents(3000);  -- false (30€ → 3+0=3)
```

### Plan Access
```sql
-- Obține procentul de acces pentru un tier
SELECT f_plan_percent_access('architect');  -- 40
SELECT f_plan_rank('elite');               -- 3
SELECT f_plan_display_name('initiate');    -- 'Inițiat'
```

### Acces la Conținut
```sql
-- Verifică dacă un user poate accesa un neuron
SELECT f_can_access_neuron_by_tier('neuron-uuid', 'architect');
```

## Views Publice

### v_neuron_public
```sql
-- Acces public la preview-ul neuronilor
SELECT * FROM v_neuron_public 
WHERE required_tier <= 'architect'::plan_tier;
```

### v_plans_public
```sql
-- Acces public la planuri (pentru /pricing)
SELECT * FROM v_plans_public ORDER BY percent_access;
```

## Exemple de Utilizare

### Inserarea unui neuron
```sql
INSERT INTO public.neurons (
  slug, title, summary, content_full, 
  required_tier, price_cents, category, tags
) VALUES (
  'ai-frameworks-101',
  'AI Frameworks 101',
  'Introducere în framework-urile AI moderne',
  'Conținut complet cu exemple practice...',
  'architect',
  2900,  -- 29€ (digital root = 2)
  'ai',
  '{ai, frameworks, beginner}'
);
```

### Inserarea unui bundle
```sql
INSERT INTO public.bundles (
  slug, title, description, 
  required_tier, price_cents
) VALUES (
  'ai-starter-pack',
  'AI Starter Pack',
  '3 framework-uri esențiale pentru începători',
  'architect',
  11900  -- 119€ (digital root = 2)
);
```

### Organizarea în library tree
```sql
-- Root node
INSERT INTO public.library_tree (parent_id, name) 
VALUES (NULL, 'AI Frameworks');

-- Child node
WITH root AS (SELECT id FROM public.library_tree WHERE name = 'AI Frameworks')
INSERT INTO public.library_tree (parent_id, name)
SELECT root.id, 'Prompt Engineering' FROM root;
```

## Validări și Constrains

### Digital Root 2
- Toate prețurile neuronilor și bundle-urilor trebuie să respecte digital root = 2
- Validare automată prin triggers
- Eroare la încercarea de a insera prețuri invalide

### Plan Consistency
- Procentul de acces trebuie să corespundă codului planului
- Planul 'free' trebuie să aibă prețuri 0
- Planurile plătite trebuie să aibă Stripe IDs

### Soft Delete
- Toate tabelele suportă soft delete prin coloana `deleted_at`
- Views publice filtrează automat conținutul șters
- Politici RLS respectă soft delete

## Monitorizare și Audit

### Verificarea politicilor RLS
```sql
-- Lista toate politicile RLS
SELECT * FROM f_test_rls_policies();

-- Verifică dacă RLS e activ pe toate tabelele
SELECT tablename, relrowsecurity 
FROM pg_tables t 
JOIN pg_class c ON t.tablename = c.relname 
WHERE schemaname = 'public';
```

### Auditul modificărilor
```sql
-- Funcția de audit poate fi extinsă pentru logging
SELECT * FROM f_audit_table_changes();
```

## Troubleshooting

### Eroare: "violates digital root = 2"
```sql
-- Verifică prețul: trebuie să aibă digital root = 2
SELECT f_digital_root(price_cents / 100) FROM neurons WHERE id = 'your-neuron-id';

-- Exemple de prețuri valide: 29€, 74€, 119€, 299€
-- Exemple de prețuri invalide: 30€, 75€, 120€, 300€
```

### Eroare: "RLS not enabled on table"
```sql
-- Activează RLS manual dacă e necesar
ALTER TABLE public.neurons ENABLE ROW LEVEL SECURITY;
```

### Eroare: "No RLS policies defined"
```sql
-- Rulează din nou fișierul de politici RLS
\i 01_rls_policies.sql
```

## Extensii și Modificări

### Adăugarea de noi coloane
```sql
-- Exemplu: adăugarea unei coloane pentru rating
ALTER TABLE public.neurons 
ADD COLUMN rating decimal(3,2) CHECK (rating >= 0 AND rating <= 5);
```

### Modificarea politicilor RLS
```sql
-- Exemplu: restricționarea accesului la conținut premium
DROP POLICY IF EXISTS neurons_select_public ON public.neurons;
CREATE POLICY neurons_select_public
  ON public.neurons
  FOR SELECT
  TO anon, authenticated
  USING (
    published = true 
    AND deleted_at IS NULL
    AND (required_tier = 'free' OR auth.uid() IS NOT NULL)
  );
```

## Performanță

### Indexuri create automat
- **Full-text search** pe title + summary
- **GIN indexuri** pe tags și array-uri
- **B-tree indexuri** pe coloanele frecvent folosite
- **Partial indexuri** pentru soft delete

### Optimizări recomandate
```sql
-- Pentru căutări complexe, poți adăuga indexuri suplimentare
CREATE INDEX CONCURRENTLY idx_neurons_created_at 
ON public.neurons (created_at DESC) 
WHERE published = true AND deleted_at IS NULL;

-- Pentru agregații pe tier
CREATE INDEX CONCURRENTLY idx_neurons_tier_count 
ON public.neurons (required_tier, published) 
WHERE published = true AND deleted_at IS NULL;
```

## Backup și Restore

### Backup al schemei
```bash
pg_dump -h your_host -U your_user -d your_database \
  --schema-only --no-owner --no-privileges \
  -f schema_backup.sql
```

### Restore al schemei
```bash
psql -h your_host -U your_user -d your_database -f schema_backup.sql
```

## Suport și Contribuții

Pentru întrebări sau probleme:
1. Verifică logurile PostgreSQL
2. Rulează verificările automate din fișiere
3. Testează politicile RLS cu `f_test_rls_policies()`

## Licență

Acest cod este furnizat "as is" pentru utilizare educațională și comercială.
