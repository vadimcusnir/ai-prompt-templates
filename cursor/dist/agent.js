"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceLawsFromDox = enforceLawsFromDox;
// /cursor/agent.ts
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
function enforceLawsFromDox(dir) {
    if (dir === void 0) { dir = './dox'; }
    var files = (0, node_fs_1.readdirSync)(dir).filter(function (f) { return f.endsWith('.txt'); });
    return files.map(function (f) { return ({
        title: f,
        content: (0, node_fs_1.readFileSync)((0, node_path_1.join)(dir, f), 'utf8').trim()
    }); });
}
var ROOT = process.cwd();
var SRC_DIRS = ['src', 'apps', 'packages', 'database', 'supabase', 'sql', 'migrations', 'cursor', 'test'];
// Directoare ignorate pentru performanță
var IGNORE_DIRS = [
    'node_modules', '.next', '.vercel', 'dist', 'build',
    '.git', 'coverage', 'logs', 'tmp', '.cache'
];
// --- Helpers
function walk(dir) {
    var entries = (0, node_fs_1.readdirSync)(dir);
    var files = [];
    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var e = entries_1[_i];
        if (IGNORE_DIRS.includes(e))
            continue;
        var p = (0, node_path_1.join)(dir, e);
        var s = (0, node_fs_1.statSync)(p);
        if (s.isDirectory())
            files.push.apply(files, walk(p));
        else
            files.push(p);
    }
    return files;
}
function digitalRoot2Ok(eurCents) {
    if (!Number.isFinite(eurCents) || eurCents <= 0)
        return false;
    var euros = Math.floor(eurCents / 100);
    var root = 1 + ((euros - 1) % 9);
    return root === 2;
}
// --- Law checks (regex/static)
var RAW_TABLES = [
    // interzise pe suprafața publică
    'public\\.bundles', 'public\\.plans', 'public\\.neurons',
    'public\\.user_entitlements', 'public\\.user_subscriptions', 'public\\.user_purchases', 'public\\.purchase_receipts',
    'public\\.neuron_assets'
];
var ALLOWED_FE_SURFACES = [
    'public\\.v_bundle_public', 'public\\.v_plans_public',
    'public\\.rpc_search_neurons\\(', 'public\\.rpc_get_my_active_plan\\(', 'public\\.rpc_list_my_entitlements\\(',
    // livrare full e în alt contract (rpc_get_neuron_full) – nu îl validăm aici pentru conținut
];
var CRON_WRAPPERS = [
    'public\\.f_cron_run_refresh_tier_access_pool_all\\(',
    'public\\.f_cron_run_check_library_cap\\(',
    'public\\.f_cron_run_preview_privileges_audit\\(',
    'public\\.f_cron_run_bundle_consistency_audit\\(',
];
var FORBIDDEN_CRON_TARGETS = [
    // funcțiile „nucleu" care trebuie invocate NUMAI prin wrapper
    'public\\.refresh_tier_access_pool_all\\(',
    'public\\.check_library_cap_and_alert\\(',
    'public\\.check_preview_privileges_and_alert\\(',
    'public\\.check_bundle_consistency_and_alert\\('
];
// Whitelist pentru fișiere permise (migrări, deployment, policies)
var ALLOWED_FILES = [
    /sql\/(?:migrations|deploy-|0\d_)/i,
    /rls_policies|admin_roles|neuron_delete_guard/i,
    /schema\.sql|setup\.sql/i
];
function isAllowedFile(path) {
    return ALLOWED_FILES.some(function (pattern) { return pattern.test(path); });
}
function checkFile(path, text) {
    var v = [];
    var isSQL = /\.(sql|psql)$/i.test(path);
    var isTS = /\.(ts|tsx|jsx)$/i.test(path);
    var isJS = /\.(js|mjs|cjs)$/i.test(path);
    var isPrisma = /\.prisma$/i.test(path);
    // (1) Interzice SELECT pe tabele brute pentru suprafața FE
    if ((isSQL || isTS || isJS || isPrisma) && /select\s+/i.test(text)) {
        for (var _i = 0, RAW_TABLES_1 = RAW_TABLES; _i < RAW_TABLES_1.length; _i++) {
            var raw = RAW_TABLES_1[_i];
            // Regex îmbunătățit pentru JOIN, subquery, aliasuri
            var rawRe = new RegExp("\\bselect\\b[\\s\\S]*?(?:\\bfrom\\b|\\bjoin\\b)[\\s\\S]*?".concat(raw.replace('public\\.', ''), "\\b"), 'i');
            if (rawRe.test(text)) {
                // Whitelist pentru migrări și deployment
                if (!isAllowedFile(path) && !/v_(bundle_public|plans_public)/i.test(text) && !/rpc_/i.test(text)) {
                    v.push({
                        law: 'DB-01',
                        file: path,
                        detail: "SELECT pe tabel brut detectat (".concat(raw, "). Folose\u0219te views/RPC."),
                        fix: "\u00CEnlocuie\u0219te cu v_plans_public / v_bundle_public / rpc_search_neurons / rpc_get_my_active_plan / rpc_list_my_entitlements."
                    });
                }
            }
        }
    }
    // (2) Cron: doar wrapper-ele
    if ((isSQL || isTS || isJS) && /cron\.schedule\s*\(/i.test(text)) {
        for (var _a = 0, FORBIDDEN_CRON_TARGETS_1 = FORBIDDEN_CRON_TARGETS; _a < FORBIDDEN_CRON_TARGETS_1.length; _a++) {
            var forbidden = FORBIDDEN_CRON_TARGETS_1[_a];
            var forbRe = new RegExp(forbidden, 'i');
            if (forbRe.test(text)) {
                v.push({
                    law: 'CRON-01',
                    file: path,
                    detail: "pg_cron apeleaz\u0103 func\u021Bia de business direct\u0103 (".concat(forbidden, ")."),
                    fix: "Apeleaz\u0103 wrapper-ul corespondent din lista f_cron_run_* \u0219i logheaz\u0103 \u00EEn job_audit."
                });
            }
        }
        // dacă folosește cron, asigură cel puțin un wrapper permis în fișier
        var ok = CRON_WRAPPERS.some(function (w) { return new RegExp(w, 'i').test(text); });
        if (!ok) {
            v.push({
                law: 'CRON-01',
                file: path,
                detail: "pg_cron folosit f\u0103r\u0103 wrappers f_cron_run_*.",
                fix: "Folose\u0219te f_cron_run_refresh_tier_access_pool_all / f_cron_run_check_library_cap / f_cron_run_preview_privileges_audit / f_cron_run_bundle_consistency_audit."
            });
        }
    }
    // (3) Plans: root=2 în seeding/migrări
    if (isSQL && /(insert|update)\s+public\.plans/i.test(text)) {
        // scanează valori explicite ..._price_cents
        var prices = Array.from(text.matchAll(/(monthly|annual)_price_cents\s*=\s*(\d+)/gi));
        for (var _b = 0, prices_1 = prices; _b < prices_1.length; _b++) {
            var _c = prices_1[_b], centsStr = _c[2];
            var cents = parseInt(centsStr, 10);
            if (!digitalRoot2Ok(cents)) {
                v.push({
                    law: 'PLANS-01',
                    file: path,
                    detail: "Pre\u021B ".concat(cents, " nu respect\u0103 root=2 la non-free."),
                    fix: "Alege centi cu root=2 (ex: 2900, 29900, 7400, 74900, 29900, 299900)."
                });
            }
        }
        // Stripe IDs obligatorii la non-free
        if (/code\s*<>\s*'free'/i.test(text) && !/stripe_price_id_month/i.test(text)) {
            v.push({
                law: 'PLANS-01',
                file: path,
                detail: "Plan non-free f\u0103r\u0103 Stripe price IDs.",
                fix: "Completeaz\u0103 stripe_price_id_month / stripe_price_id_year \u0219i ruleaz\u0103 f_assert_plans_sane()."
            });
        }
    }
    // (4) Delete guard pe neuroni
    if (isSQL && /\bdelete\b[\s\S]*\bfrom\b[\s\S]*public\.neurons/i.test(text)) {
        // Whitelist pentru fișiere de guard
        if (!isAllowedFile(path)) {
            v.push({
                law: 'DELETE-01',
                file: path,
                detail: "DELETE pe neurons g\u0103sit. Interzis dac\u0103 exist\u0103 obliga\u021Bii.",
                fix: "Folose\u0219te UPDATE ... SET published=false; triggerele blocheaz\u0103 DELETE cu obliga\u021Bii."
            });
        }
    }
    // (5) Assets publice doar dacă neuron published
    if ((isSQL || isTS || isJS) && /neuron_assets/i.test(text) && /select/i.test(text) && !/exists\s*\(\s*select\s+1\s+from\s+public\.neurons\s+n\s+where\s+n\.id\s*=\s*neuron_id\s+and\s+n\.published\s*=\s*true\s*\)/i.test(text)) {
        v.push({
            law: 'ASSET-01',
            file: path,
            detail: "Acces assets f\u0103r\u0103 condi\u021Bia published=true.",
            fix: "Aplic\u0103 politica RLS sau EXISTS(...) pe neurons.published=true."
        });
    }
    // (6) Arhitectură: interzice „brand switch" în aceeași aplicație
    if (isTS && /NEXT_PUBLIC_BRAND/i.test(text) && /AI_PROMPTS/i.test(text) && /VULTUS/i.test(text)) {
        v.push({
            law: 'ARCH-01',
            file: path,
            detail: "Mixaj de branduri \u00EEntr-un singur app.",
            fix: "Separ\u0103 aplica\u021Biile (ai-prompt-templates/ \u0219i 8vultus/) cu shared libs, nu shared UI runtime."
        });
    }
    return v;
}
function main() {
    var _a, _b;
    var args = process.argv.slice(2);
    var jsonOutput = args.includes('--json');
    var softMode = args.includes('--soft');
    var onlyRule = (_a = args.find(function (arg) { return arg.startsWith('--only='); })) === null || _a === void 0 ? void 0 : _a.split('=')[1];
    var files = [];
    for (var _i = 0, SRC_DIRS_1 = SRC_DIRS; _i < SRC_DIRS_1.length; _i++) {
        var dir = SRC_DIRS_1[_i];
        try {
            var abs = (0, node_path_1.join)(ROOT, dir);
            console.log("\uD83D\uDD0D Scanning directory: ".concat(abs));
            var dirFiles = walk(abs);
            console.log("  \uD83D\uDCC1 Found ".concat(dirFiles.length, " files in ").concat(dir));
            files.push.apply(files, dirFiles);
        }
        catch (e) {
            console.log("\u274C Error scanning ".concat(dir, ": ").concat(e));
        }
    }
    var violations = [];
    for (var _c = 0, files_1 = files; _c < files_1.length; _c++) {
        var f = files_1[_c];
        if (!/\.(sql|psql|ts|tsx|jsx|js|mjs|cjs|prisma)$/i.test(f))
            continue;
        var text = (0, node_fs_1.readFileSync)(f, 'utf8');
        var fileViolations = checkFile(f, text);
        // Filtrare pe regulă specifică dacă e specificată
        if (onlyRule) {
            violations.push.apply(violations, fileViolations.filter(function (v) { return v.law === onlyRule; }));
        }
        else {
            violations.push.apply(violations, fileViolations);
        }
    }
    if (violations.length > 0) {
        if (jsonOutput) {
            var report = {
                timestamp: new Date().toISOString(),
                violations: violations.map(function (v) { return ({
                    law: v.law,
                    file: v.file.replace(ROOT, '.'),
                    detail: v.detail,
                    fix: v.fix
                }); }),
                summary: {
                    total: violations.length,
                    byLaw: violations.reduce(function (acc, v) {
                        acc[v.law] = (acc[v.law] || 0) + 1;
                        return acc;
                    }, {})
                }
            };
            if (!(0, node_fs_1.existsSync)('./cursor/report')) {
                (0, node_fs_1.mkdirSync)('./cursor/report', { recursive: true });
            }
            (0, node_fs_1.writeFileSync)('./cursor/report/law_report.json', JSON.stringify(report, null, 2));
            console.log('📊 Report JSON generat în ./cursor/report/law_report.json');
        }
        if (!softMode) {
            console.error('┏━━━━━━━━ Violări de Lege ━━━━━━━━');
            for (var _d = 0, violations_1 = violations; _d < violations_1.length; _d++) {
                var v = violations_1[_d];
                console.error("\u2523 [".concat(v.law, "] ").concat(v.file, "\n\u2523\u2192 ").concat(v.detail, "\n\u2517\u21AA Fix: ").concat((_b = v.fix) !== null && _b !== void 0 ? _b : '—'));
            }
            process.exit(1);
        }
    }
    else {
        console.log('✔ Toate Legile sunt respectate.');
    }
}
var laws = enforceLawsFromDox();
for (var _i = 0, laws_1 = laws; _i < laws_1.length; _i++) {
    var law = laws_1[_i];
    console.log("\uD83D\uDCDC ".concat(law.title, ": ").concat(law.content.slice(0, 100), "..."));
}
if (require.main === module) {
    main();
}
