// /cursor/init.ts
import { execSync } from 'node:child_process';
import { writeFileSync, existsSync, chmodSync, readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

export function installGitHook(root = process.cwd()) {
  const hookPath = join(root, '.git', 'hooks', 'pre-commit');
  const script = `#!/usr/bin/env bash
# Cursor Law Guard: blocăm commit-ul dacă există încălcări
npx tsx ./cursor/agent.ts
STATUS=$?
if [ $STATUS -ne 0 ]; then
  echo "✖ Commit blocat: încalcă Legile Cursor."
  exit $STATUS
fi
exit 0
`;
  writeFileSync(hookPath, script, { encoding: 'utf8' });
  chmodSync(hookPath, 0o755);
  console.log('✔ pre-commit instalat');
}

function loadDoxCorpus(dir = './dox'): string {
  const files = readdirSync(dir).filter(f => f.endsWith('.txt'));
  return files.map(file => {
    const content = readFileSync(join(dir, file), 'utf8').trim();
    return `📜 [${file}]\n${content}`;
  }).join('\n\n');
}

const systemPromptAppendix = `
TU EȘTI SUB LEGE. NU AI VOIE SĂ:
- Faci SELECT direct pe tabele brute pentru pricing/bundles/neuroni; folosește v_plans_public / v_bundle_public, rpc_search_neurons, rpc_get_my_active_plan, rpc_list_my_entitlements.
- Livrezi content_full altfel decât prin rpc_get_neuron_full verificat de f_has_full_access (fallback no-sub → free; Free = 10% FULL prin tier_access_pool).
- Programezi cronuri care ocolesc wrapper-ele f_cron_run_* sau care nu loghează în job_audit.
- Modifici plans fără root=2 pe prețuri non-free, fără Stripe IDs, sau fără a trece f_assert_plans_sane().
- Creezi bundle-uri cu neuroni lipsă/nepublicați; watchdog-ul trebuie să rămână verde.
- Încalci RLS (self-only + admin via f_is_admin).
- Expui assets pentru neuroni nepublicați.
- Ștergi neuroni cu obligații (entitlements/receipts) — folosește published=false.
- Ocolești tsv/unaccent în search; folosește rpc_search_neurons.
- Amesteci logicile AI-Prompts și 8VULTUS într-o singură aplicație; păstrează separarea de platforme.

Dacă intenția ta contravine acestor reguli, OPREȘTE și propune soluția conformă.
`.trim();

function writeSystemPromptFile() {
  const corpus = loadDoxCorpus('./dox');
  const fullPrompt = `${corpus}\n\n${systemPromptAppendix}`;
  const outPath = join(process.cwd(), 'cursor', 'SYSTEM_PROMPT.txt');
  writeFileSync(outPath, fullPrompt, 'utf8');
  console.log(`✔ SYSTEM_PROMPT scris în ${outPath}`);
}

if (require.main === module) {
  installGitHook();
  writeSystemPromptFile();
}