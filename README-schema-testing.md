# Testarea Schemei pe Database-ul de Dezvoltare

## 🎯 Obiectiv

Acest document descrie procesul complet de testare a schemei pe database-ul de dezvoltare, incluzând:
- Validarea schemei
- Adaptarea prețurilor Stripe
- Implementarea logicii de user tier
- Adăugarea indexurilor de performanță
- Testarea performanței cu date reale

## 🚀 Comenzi Rapide

```bash
# Testare rapidă a schemei
make test-schema

# Deploy complet cu optimizări
make deploy-schema

# Generare date de test
make generate-data

# Teste de performanță
make performance-test

# Verificare status database
make db-status
```

## 📋 Pașii de Implementare

### 1. Testarea Schemei

```bash
# Rulează testele complete
node scripts/test-schema-dev.js

# Sau folosește Makefile
make test-schema
```

**Ce se testează:**
- ✅ Existența tuturor tabelelor principale
- ✅ Activarea RLS pe toate tabelele
- ✅ Validarea digital root pentru prețuri
- ✅ Funcționalitatea politicilor de securitate
- ✅ Integritatea datelor

### 2. Adaptarea Prețurilor Stripe

Prețurile au fost actualizate să respecte **digital root = 2**:

| Plan | Preț Lunar | Preț Anual | Digital Root |
|------|------------|------------|--------------|
| Free | 0€ | 0€ | N/A |
| Architect | 29€ | 299€ | 2 |
| Initiate | 74€ | 749€ | 2 |
| Elite | 299€ | 2999€ | 2 |

**ID-uri Stripe actualizate:**
- `price_1OqK8L2eZvKYlo2C8QZQZQZQ` (toate planurile)

### 3. Implementarea Logicii User Tier

Funcția `f_get_current_user_tier()` implementează:

```sql
-- Verifică subscription-urile active
-- Mapează Stripe price IDs la tier-uri
-- Fallback la 'free' pentru erori
-- Integrare cu tabelul user_subscriptions
```

**Tabelul `user_subscriptions`:**
- `user_id` - Referință la auth.users
- `stripe_subscription_id` - ID-ul subscription-ului Stripe
- `tier` - Tier-ul planului (architect/initiate/elite)
- `status` - Status-ul subscription-ului
- `current_period_end` - Data de expirare

### 4. Indexuri de Performanță

**Indexuri pentru Neuroni:**
- `idx_neurons_tier_published_deleted` - Căutări frecvente
- `idx_neurons_cognitive_category` - Filtrare pe categorii
- `idx_neurons_title_description_gin` - Căutări full-text
- `idx_neurons_slug_ci` - Căutări case-insensitive

**Indexuri pentru Bundle-uri:**
- `idx_bundles_tier_deleted` - Filtrare pe tier
- `idx_bundles_title_ci` - Căutări în titluri

**Indexuri pentru Tree:**
- `idx_library_tree_path` - Optimizare căutări pe path
- `idx_library_tree_parent_id` - Relații parent-child

### 5. Testarea Performanței

```bash
# Testare cu date reale
node scripts/generate-test-data.js

# Teste de performanță
make performance-test
```

**Metrici monitorizate:**
- ⚡ Timpul de răspuns pentru căutări
- 📊 Numărul de rezultate returnate
- 🔍 Eficiența indexurilor
- 💾 Utilizarea memoriei

## 🛠️ Scripturi Disponibile

### `scripts/test-schema-dev.js`
Scriptul principal de testare care verifică:
- Validarea schemei
- Prețurile Stripe
- Logica user tier
- Indexurile de performanță
- Performanța generală

### `scripts/generate-test-data.js`
Generează date de test cu:
- Neuroni cu prețuri reale
- Bundle-uri cu digital root valid
- Structură library tree
- Subscription-uri de test

### `scripts/deploy-schema-dev.sh`
Script bash pentru deployment complet:
- Verificări preliminare
- Deploy schema
- Adăugare indexuri
- Generare date test
- Rulare teste
- Raport final

### `sql/performance_indexes.sql`
Script SQL cu toate indexurile de performanță:
- Indexuri compuse
- Indexuri GIN pentru full-text
- Indexuri pentru soft delete
- Funcții de monitorizare

## 📊 Raportul de Testare

După rularea testelor, vei primi un raport detaliat cu:

```
📊 RAPORT FINAL DE TESTARE
==================================================

Schema:
  ✅ Teste reușite: 3
  ❌ Teste eșuate: 0

Pricing:
  ✅ Teste reușite: 3
  ❌ Teste eșuate: 0

UserTier:
  ✅ Teste reușite: 3
  ❌ Teste eșuate: 0

Indexes:
  ✅ Teste reușite: 2
  ❌ Teste eșuate: 0

Performance:
  ✅ Teste reușite: 3
  ❌ Teste eșuate: 0

==================================================
TOTAL: 14 teste
✅ Reușite: 14
❌ Eșuate: 0

🎉 Toate testele au trecut cu succes!
```

## 🔧 Configurare

### Variabile de Mediu

Asigură-te că ai în `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Dependințe

```bash
npm install @supabase/supabase-js dotenv
```

## 🚨 Troubleshooting

### Eroare: "Variabile de mediu Supabase lipsesc!"
**Soluție:** Verifică că fișierul `.env` există și conține cheile corecte.

### Eroare: "RLS not enabled on table"
**Soluție:** Rulează scriptul SQL pentru activarea RLS.

### Eroare: "Digital root validation failed"
**Soluție:** Verifică că toate prețurile respectă formula digital root = 2.

### Performanță lentă
**Soluție:** Verifică că indexurile au fost create corect.

## 📈 Monitorizare Continuă

### Funcții de Monitorizare

```sql
-- Verifică indexurile de performanță
SELECT * FROM f_check_performance_indexes();

-- Analizează performanța indexurilor
SELECT * FROM f_analyze_index_performance();
```

### Loguri și Metrici

- Monitorizează timpul de răspuns pentru query-uri
- Verifică utilizarea indexurilor
- Urmărește erorile din loguri
- Analizează performanța pe diferite volume de date

## 🎯 Următorii Pași

1. **Testează schema** pe database-ul de dezvoltare
2. **Validează prețurile** Stripe cu ID-urile reale
3. **Monitorizează performanța** cu date reale
4. **Optimizează indexurile** bazat pe usage patterns
5. **Deployează în producție** după validarea completă

## 📞 Suport

Pentru probleme sau întrebări:
- Verifică logurile de eroare
- Rulează testele de validare
- Consultă documentația Supabase
- Verifică status-ul serviciilor

---

**Notă:** Acest proces asigură că schema este robustă, performantă și gata pentru producție.
