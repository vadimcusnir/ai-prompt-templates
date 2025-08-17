// /cursor/agent.ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

type Violation = {
  law: string;
  file: string;
  detail: string;
  fix?: string;
};

const ROOT = process.cwd();
const SRC_DIRS = ['src', 'apps', 'packages', 'database', 'supabase', 'sql', 'migrations', 'cursor'];

// --- Helpers
function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const e of entries) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) files.push(...walk(p));
    else files.push(p);
  }
  return files;
}

function digitalRoot2Ok(eurCents: number): boolean {
  if (!Number.isFinite(eurCents) || eurCents <= 0) return false;
  const euros = Math.floor(eurCents / 100);
  const root = 1 + ((euros - 1) % 9);
  return root === 2;
}

// --- Law checks (regex/static)
const RAW_TABLES = [
  // interzise pe suprafața publică
  'public\\.bundles', 'public\\.plans', 'public\\.neurons',
  'public\\.user_entitlements', 'public\\.user_subscriptions', 'public\\.user_purchases', 'public\\.purchase_receipts',
  'public\\.neuron_assets'
];

const ALLOWED_FE_SURFACES = [
  'public\\.v_bundle_public', 'public\\.v_plans_public',
  'public\\.rpc_search_neurons\\(', 'public\\.rpc_get_my_active_plan\\(', 'public\\.rpc_list_my_entitlements\\(',
  // livrare full e în alt contract (rpc_get_neuron_full) – nu îl validăm aici pentru conținut
];

const CRON_WRAPPERS = [
  'public\\.f_cron_run_refresh_tier_access_pool_all\\(',
  'public\\.f_cron_run_check_library_cap\\(',
  'public\\.f_cron_run_preview_privileges_audit\\(',
  'public\\.f_cron_run_bundle_consistency_audit\\(',
];

const FORBIDDEN_CRON_TARGETS = [
  // funcțiile „nucleu” care trebuie invocate NUMAI prin wrapper
  'public\\.refresh_tier_access_pool_all\\(',
  'public\\.check_library_cap_and_alert\\(',
  'public\\.check_preview_privileges_and_alert\\(',
  'public\\.check_bundle_consistency_and_alert\\('
];

function checkFile(path: string, text: string): Violation[] {
  const v: Violation[] = [];
  const isSQL = extname(path).toLowerCase() === '.sql';
  const isTS = extname(path).toLowerCase() === '.ts' || extname(path).toLowerCase() === '.tsx';

  // (1) Interzice SELECT pe tabele brute pentru suprafața FE
  if ((isSQL || isTS) && /select\s+/i.test(text)) {
    for (const raw of RAW_TABLES) {
      const rawRe = new RegExp(`\\bselect\\b[\\s\\S]*?\\bfrom\\b[\\s\\S]*?${raw}`, 'i');
      if (rawRe.test(text)) {
        // dacă e o migrare internă, e ok; dacă e în API/FE, interzice
        if (!/v_(bundle_public|plans_public)/i.test(text) && !/rpc_/i.test(text)) {
          v.push({
            law: 'DB-01',
            file: path,
            detail: `SELECT pe tabel brut detectat (${raw}). Folosește views/RPC.`,
            fix: `Înlocuiește cu v_plans_public / v_bundle_public / rpc_search_neurons / rpc_get_my_active_plan / rpc_list_my_entitlements.`
          });
        }
      }
    }
  }

  // (2) Cron: doar wrapper-ele
  if ((isSQL || isTS) && /cron\.schedule\s*\(/i.test(text)) {
    for (const forbidden of FORBIDDEN_CRON_TARGETS) {
      const forbRe = new RegExp(forbidden, 'i');
      if (forbRe.test(text)) {
        v.push({
          law: 'CRON-01',
          file: path,
          detail: `pg_cron apelează funcția de business directă (${forbidden}).`,
          fix: `Apelează wrapper-ul corespondent din lista f_cron_run_* și loghează în job_audit.`
        });
      }
    }
    // dacă folosește cron, asigură cel puțin un wrapper permis în fișier
    const ok = CRON_WRAPPERS.some(w => new RegExp(w, 'i').test(text));
    if (!ok) {
      v.push({
        law: 'CRON-01',
        file: path,
        detail: `pg_cron folosit fără wrappers f_cron_run_*.`,
        fix: `Folosește f_cron_run_refresh_tier_access_pool_all / f_cron_run_check_library_cap / f_cron_run_preview_privileges_audit / f_cron_run_bundle_consistency_audit.`
      });
    }
  }

  // (3) Plans: root=2 în seeding/migrări
  if (isSQL && /(insert|update)\s+public\.plans/i.test(text)) {
    // scanează valori explicite ..._price_cents
    const prices = Array.from(text.matchAll(/(monthly|annual)_price_cents\s*=\s*(\d+)/gi));
    for (const [, , centsStr] of prices) {
      const cents = parseInt(centsStr, 10);
      if (!digitalRoot2Ok(cents)) {
        v.push({
          law: 'PLANS-01',
          file: path,
          detail: `Preț ${cents} nu respectă root=2 la non-free.`,
          fix: `Alege centi cu root=2 (ex: 2900, 29900, 7400, 74900, 29900, 299900).`
        });
      }
    }
    // Stripe IDs obligatorii la non-free
    if (/code\s*<>\s*'free'/i.test(text) && !/stripe_price_id_month/i.test(text)) {
      v.push({
        law: 'PLANS-01',
        file: path,
        detail: `Plan non-free fără Stripe price IDs.`,
        fix: `Completează stripe_price_id_month / stripe_price_id_year și rulează f_assert_plans_sane().`
      });
    }
  }

  // (4) Delete guard pe neuroni
  if (isSQL && /\bdelete\b[\s\S]*\bfrom\b[\s\S]*public\.neurons/i.test(text)) {
    v.push({
      law: 'DELETE-01',
      file: path,
      detail: `DELETE pe neurons găsit. Interzis dacă există obligații.`,
      fix: `Folosește UPDATE ... SET published=false; triggerele blochează DELETE cu obligații.`
    });
  }

  // (5) Assets publice doar dacă neuron published
  if ((isSQL || isTS) && /neuron_assets/i.test(text) && /select/i.test(text) && !/exists\s*\(\s*select\s+1\s+from\s+public\.neurons\s+n\s+where\s+n\.id\s*=\s*neuron_id\s+and\s+n\.published\s*=\s*true\s*\)/i.test(text)) {
    v.push({
      law: 'ASSET-01',
      file: path,
      detail: `Acces assets fără condiția published=true.`,
      fix: `Aplică politica RLS sau EXISTS(...) pe neurons.published=true.`
    });
  }

  // (6) Arhitectură: interzice „brand switch” în aceeași aplicație
  if (isTS && /NEXT_PUBLIC_BRAND/i.test(text) && /AI_PROMPTS/i.test(text) && /VULTUS/i.test(text)) {
    v.push({
      law: 'ARCH-01',
      file: path,
      detail: `Mixaj de branduri într-un singur app.`,
      fix: `Separă aplicațiile (ai-prompt-templates/ și 8vultus/) cu shared libs, nu shared UI runtime.`
    });
  }

  return v;
}

function main() {
  const files: string[] = [];
  for (const dir of SRC_DIRS) {
    try {
      const abs = join(ROOT, dir);
      files.push(...walk(abs));
    } catch { /* ignore */ }
  }

  const violations: Violation[] = [];
  for (const f of files) {
    if (!/\.(sql|ts|tsx|js|mjs|cjs)$/i.test(f)) continue;
    const text = readFileSync(f, 'utf8');
    violations.push(...checkFile(f, text));
  }

  if (violations.length > 0) {
    console.error('┏━━━━━━━━ Violări de Lege ━━━━━━━━');
    for (const v of violations) {
      console.error(`┣ [${v.law}] ${v.file}\n┣→ ${v.detail}\n┗↪ Fix: ${v.fix ?? '—'}`);
    }
    process.exit(1);
  } else {
    console.log('✔ Toate Legile sunt respectate.');
  }
}

if (require.main === module) {
  main();
}
