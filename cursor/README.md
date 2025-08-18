# Cursor Law Guard

Un guardrail CLI TypeScript care blochează commit-uri pe baza unor reguli de securitate și arhitectură.

## Reguli Active

### DB-01: Protecție Tabele Brute
- **Scop**: Interzice SELECT direct pe tabele brute (`public.bundles`, `public.plans`, `public.neurons`, etc.)
- **Permis**: Views publice (`v_plans_public`, `v_bundle_public`) și RPC-uri
- **Whitelist**: Fișiere de migrare (`sql/migrations/**`, `sql/deploy-*.sql`)

### CRON-01: Wrapper Cron
- **Scop**: Forțează folosirea wrapper-elor `f_cron_run_*` pentru funcții cron
- **Interzis**: Apelarea directă a funcțiilor de business din cron
- **Permis**: `f_cron_run_refresh_tier_access_pool_all`, `f_cron_run_check_library_cap`, etc.

### PLANS-01: Validare Prețuri
- **Scop**: Asigură prețurile respectă `root=2` și au Stripe IDs
- **Validare**: `digitalRoot2Ok()` pentru prețuri non-free
- **Obligatoriu**: `stripe_price_id_month`, `stripe_price_id_year` pentru planuri non-free

### DELETE-01: Protecție Neuroni
- **Scop**: Blochează DELETE pe `neurons` (trebuie `published=false`)
- **Motiv**: Triggerele blochează DELETE cu obligații
- **Alternativă**: `UPDATE neurons SET published=false WHERE id = ?`

### ASSET-01: Acces Assets
- **Scop**: Verifică accesul la assets doar pentru neuroni publicați
- **Condiție**: `EXISTS(...) pe neurons.published=true`
- **Implementare**: Politici RLS sau verificări explicite

### ARCH-01: Separare Branduri
- **Scop**: Previne mixajul de branduri într-o singură aplicație
- **Interzis**: `NEXT_PUBLIC_BRAND` + `AI_PROMPTS` + `VULTUS` în același app
- **Soluție**: Separare completă cu shared libs

## Utilizare

### Verificare Completă
```bash
# Verificare strictă (blochează dacă există violări)
npx tsx ./cursor/agent.ts

# Verificare soft (nu blochează)
npx tsx ./cursor/agent.ts --soft

# Verificare JSON
npx tsx ./cursor/agent.ts --json

# Verificare regulă specifică
npx tsx ./cursor/agent.ts --only=DB-01
```

### Scripts NPM
```bash
# Verificare completă
npm run law:check

# Verificare soft
npm run law:check:soft

# Verificare JSON
npm run law:check:json

# Test toate regulile
npm run law:test
```

### Git Hook
```bash
# Instalare pre-commit hook
npx tsx ./cursor/init.ts
```

## Extensii Suportate

- **SQL**: `.sql`, `.psql`
- **TypeScript**: `.ts`, `.tsx`, `.jsx`
- **JavaScript**: `.js`, `.mjs`, `.cjs`
- **Prisma**: `.prisma`

## Directoare Scaneate

- `src`, `apps`, `packages`
- `database`, `supabase`, `sql`, `migrations`
- `cursor`

## Directoare Ignorate

- `node_modules`, `.next`, `.vercel`
- `dist`, `build`, `.git`
- `coverage`, `logs`, `tmp`, `.cache`

## Whitelist Fișiere

Următoarele fișiere sunt permise să conțină "violări":
- `sql/migrations/**` - Migrări de bază de date
- `sql/deploy-*.sql` - Scripturi de deployment
- `sql/0*_*.sql` - Scripturi de setup și configurare
- `*rls_policies*.sql` - Politici RLS
- `*admin_roles*.sql` - Roluri administrative
- `*neuron_delete_guard*.sql` - Guard-uri pentru DELETE

## Smoke Tests

Suite-ul de test conține 10 cazuri de test:

1. **`smoke_db01.sql`** - SELECT pe tabele brute
2. **`smoke_cron01.sql`** - Cron fără wrapper
3. **`smoke_plans01.sql`** - Prețuri fără root=2
4. **`smoke_delete01.sql`** - DELETE pe neurons
5. **`smoke_asset01.sql`** - Assets fără published check
6. **`smoke_arch01.ts`** - Mixaj de branduri

## Raportare

### Output Console
```
┏━━━━━━━━ Violări de Lege ━━━━━━━━
┣ [DB-01] ./file.sql
┣→ SELECT pe tabel brut detectat
┗↪ Fix: Înlocuiește cu v_plans_public
```

### Output JSON
```json
{
  "timestamp": "2025-08-17T09:55:59.142Z",
  "violations": [...],
  "summary": {
    "total": 7,
    "byLaw": {
      "DB-01": 5,
      "ASSET-01": 1,
      "ARCH-01": 1
    }
  }
}
```

## Performance

- **Target**: < 1.5s pe 2k+ fișiere
- **Optimizări**: Ignorare directoare grele, scan incremental
- **Regex**: Optimizat pentru cazuri comune (JOIN, subquery, aliasuri)

## Troubleshooting

### False Positives
```bash
# Verificare soft pentru debugging
npx tsx ./cursor/agent.ts --soft

# Verificare regulă specifică
npx tsx ./cursor/agent.ts --only=DB-01
```

### Whitelist Temporar
Adaugă fișierul în `ALLOWED_FILES` din `agent.ts`:
```typescript
const ALLOWED_FILES = [
  /sql\/(?:migrations|deploy-|0\d_)/i,
  /rls_policies|admin_roles|neuron_delete_guard/i,
  /schema\.sql|setup\.sql/i,
  /your_file_pattern/i  // ← Adaugă aici
];
```

## Integrare CI

### GitHub Actions
```yaml
- name: Check Laws
  run: npm run law:check
```

### Pre-commit Hook
```bash
#!/bin/bash
npx tsx ./cursor/agent.ts
```

## Roadmap

- **Ziua 1-2**: ✅ Harden regex + ignore dirs + whitelist
- **Ziua 3-5**: ✅ JSON reporter + extensii suplimentare  
- **Ziua 6-10**: ✅ Smoke test suite + npm scripts
- **Ziua 11-14**: 🔄 Integrare CI + GitHub Actions
