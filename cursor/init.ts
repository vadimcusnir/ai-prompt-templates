// /cursor/init.ts
import { execSync } from 'node:child_process';
import { writeFileSync, existsSync, chmodSync } from 'node:fs';
import { join } from 'node:path';

// 1) Setup pre-commit hook -> rulează agentul la fiecare commit
export function installGitHook(root = process.cwd()) {
  const hookPath = join(root, '.git', 'hooks', 'pre-commit');
  const script = `#!/usr/bin/env bash
# Cursor Law Guard: blocăm commit-ul dacă există încălcări
npx ts-node -T ./cursor/agent.ts
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

// 2) System Prompt pentru Cursor (agent LLM) – injecție hard a legilor
export const systemPrompt = `
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
`;

// 3) Run once to install hook when imported as CLI
if (require.main === module) {
  installGitHook();
  // Scrie promptul într-un fișier pentru integrarea Cursor
  const promptPath = join(process.cwd(), 'cursor', 'SYSTEM_PROMPT.txt');
  writeFileSync(promptPath, systemPrompt.trim(), 'utf8');
  console.log(`✔ SYSTEM_PROMPT scris în ${promptPath}`);
}
