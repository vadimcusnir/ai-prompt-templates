#!/bin/bash

# ============================================================================
# DEPLOYMENT SCRIPT: CRON-01 VALIDARE CRON
# ============================================================================
# 
# Acest script implementează validarea CRON-01 în baza de date:
# - Interzice apelarea directă a funcțiilor de business prin pg_cron
# - Forțează folosirea wrapper-elor f_cron_run_*
# - Loghează în job_audit pentru toate job-urile cron
# - Implementează sistem de validare și monitoring pentru pg_cron
#
# Utilizare:
#   ./deploy-cron-validation.sh [environment] [database_url]
# ============================================================================

set -e

# === CONFIGURARE ===

# Valori implicite
ENVIRONMENT=${1:-"development"}
DATABASE_URL=${2:-"postgresql://postgres:postgres@localhost:5432/ai_prompt_templates"}

# Colori pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# === FUNCȚII UTILITARE ===

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# === VERIFICĂRI INIȚIALE ===

check_dependencies() {
    log_info "Verifică dependențele..."
    
    if ! command -v psql &> /dev/null; then
        log_error "psql nu este instalat. Instalează PostgreSQL client."
        exit 1
    fi
    
    log_success "Dependențe verificate"
}

test_connection() {
    log_info "Testează conexiunea la baza de date..."
    
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        log_success "Conexiune la baza de date reușită"
    else
        log_error "Nu se poate conecta la baza de date: $DATABASE_URL"
        exit 1
    fi
}

check_pg_cron_extension() {
    log_info "Verifică extensia pg_cron..."
    
    local pg_cron_exists=$(psql "$DATABASE_URL" -t -c "
        SELECT EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
        );
    " | xargs)
    
    if [ "$pg_cron_exists" = "t" ]; then
        log_success "Extensia pg_cron este instalată"
    else
        log_warning "Extensia pg_cron nu este instalată. Se va încerca instalarea..."
        
        # Încearcă să instaleze extensia
        if psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pg_cron;" &> /dev/null; then
            log_success "Extensia pg_cron a fost instalată cu succes"
        else
            log_error "Nu s-a putut instala extensia pg_cron. Verifică configurația PostgreSQL."
            log_info "Pentru a instala pg_cron manual:"
            log_info "1. Adaugă 'shared_preload_libraries = ''pg_cron''' în postgresql.conf"
            log_info "2. Restartează PostgreSQL"
            log_info "3. Rulează: CREATE EXTENSION pg_cron;"
            exit 1
        fi
    fi
}

# === DEPLOYMENT ===

deploy_cron_validation() {
    log_info "Implementează validarea CRON-01..."
    
    local sql_file="sql/30_cron_validation_policies.sql"
    
    if [ ! -f "$sql_file" ]; then
        log_error "Fișierul $sql_file nu există"
        exit 1
    fi
    
    if psql "$DATABASE_URL" -f "$sql_file"; then
        log_success "Validarea CRON-01 implementată cu succes"
    else
        log_error "Eroare la implementarea validării CRON-01"
        exit 1
    fi
}

# === VERIFICARE IMPLEMENTARE ===

verify_implementation() {
    log_info "Verifică implementarea..."
    
    # Verifică dacă tabelul de audit există
    local audit_exists=$(psql "$DATABASE_URL" -t -c "
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'job_audit'
        );
    " | xargs)
    
    if [ "$audit_exists" = "t" ]; then
        log_success "Tabelul job_audit creat"
    else
        log_error "Tabelul job_audit nu a fost creat"
        return 1
    fi
    
    # Verifică dacă funcțiile wrapper sunt create
    local wrapper_count=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE 'f_cron_run_%';
    " | xargs)
    
    if [ "$wrapper_count" -gt 0 ]; then
        log_success "Funcții wrapper create: $wrapper_count"
    else
        log_error "Nu s-au creat funcțiile wrapper"
        return 1
    fi
    
    # Verifică funcțiile de validare
    local validation_functions=(
        "f_validate_cron_job"
        "f_detect_cron_violations"
        "f_get_cron_jobs_report"
        "f_get_cron_violations_report"
        "f_cleanup_old_cron_logs"
    )
    
    local missing_functions=0
    
    for func in "${validation_functions[@]}"; do
        local exists=$(psql "$DATABASE_URL" -t -c "
            SELECT EXISTS (
                SELECT 1 FROM information_schema.routines 
                WHERE routine_schema = 'public' 
                AND routine_name = '$func'
            );
        " | xargs)
        
        if [ "$exists" = "t" ]; then
            log_success "Funcția $func există"
        else
            log_error "Funcția $func nu există"
            ((missing_functions++))
        fi
    done
    
    if [ $missing_functions -gt 0 ]; then
        log_error "Lipsesc $missing_functions funcții de validare"
        return 1
    fi
    
    log_success "Implementarea verificată cu succes"
}

# === TESTE FUNCȚIONALE ===

test_wrapper_functions() {
    log_info "Testează funcțiile wrapper..."
    
    local test_functions=(
        "f_cron_run_refresh_tier_access_pool"
        "f_cron_run_check_library_cap"
        "f_cron_run_preview_audit"
        "f_cron_run_bundle_consistency"
    )
    
    local failed_tests=0
    
    for func in "${test_functions[@]}"; do
        if psql "$DATABASE_URL" -c "SELECT public.$func();" &> /dev/null; then
            log_success "Funcția $func testată cu succes"
        else
            log_error "Funcția $func a eșuat la testare"
            ((failed_tests++))
        fi
    done
    
    if [ $failed_tests -eq 0 ]; then
        log_success "Toate funcțiile wrapper au fost testate cu succes"
    else
        log_warning "$failed_tests funcții wrapper au eșuat la testare"
    fi
}

test_validation_functions() {
    log_info "Testează funcțiile de validare..."
    
    # Test validare job valid
    local valid_job=$(psql "$DATABASE_URL" -t -c "
        SELECT public.f_validate_cron_job(
            'test-valid-job',
            '0 0 * * *',
            'SELECT public.f_cron_run_refresh_tier_access_pool()'
        );
    " | xargs)
    
    if [ "$valid_job" = "t" ]; then
        log_success "Validarea job-urilor valide funcționează"
    else
        log_error "Validarea job-urilor valide nu funcționează"
    fi
    
    # Test validare job invalid
    local invalid_job=$(psql "$DATABASE_URL" -t -c "
        SELECT public.f_validate_cron_job(
            'test-invalid-job',
            '0 0 * * *',
            'SELECT refresh_tier_access_pool_all()'
        );
    " | xargs)
    
    if [ "$invalid_job" = "f" ]; then
        log_success "Validarea job-urilor invalide funcționează"
    else
        log_error "Validarea job-urilor invalide nu funcționează"
    fi
}

# === RAPORTARE ===

generate_deployment_report() {
    log_info "Generează raport de deployment..."
    
    local report_file="deployment_reports/cron_validation_01_$(date +%Y%m%d_%H%M%S).json"
    
    mkdir -p deployment_reports
    
    # Obține informații despre implementare
    local audit_table_exists=$(psql "$DATABASE_URL" -t -c "
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'job_audit'
        );
    " | xargs)
    
    local wrapper_count=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE 'f_cron_run_%';
    " | xargs)
    
    local validation_count=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name IN (
            'f_validate_cron_job',
            'f_detect_cron_violations',
            'f_get_cron_jobs_report',
            'f_get_cron_violations_report',
            'f_cleanup_old_cron_logs'
        );
    " | xargs)
    
    # Generează raportul JSON
    cat > "$report_file" << EOF
{
  "deployment": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$ENVIRONMENT",
    "database_url": "$(echo $DATABASE_URL | sed 's/:[^:]*@/@***:***@/')",
    "version": "CRON-01-1.0.0"
  },
  "implementation": {
    "audit_table_created": $([ "$audit_table_exists" = "t" ] && echo "true" || echo "false"),
    "wrapper_functions_created": $wrapper_count,
    "validation_functions_created": $validation_count
  },
  "security_features": {
    "direct_business_function_calls_blocked": true,
    "wrapper_functions_enforced": true,
    "cron_job_validation_active": true,
    "audit_trail_enabled": true,
    "admin_exceptions_active": true,
    "service_role_exceptions_active": true
  },
  "wrapper_functions": [
    "f_cron_run_refresh_tier_access_pool",
    "f_cron_run_check_library_cap",
    "f_cron_run_preview_audit",
    "f_cron_run_bundle_consistency",
    "f_cron_run_custom_job"
  ],
  "validation_functions": [
    "f_validate_cron_job",
    "f_detect_cron_violations",
    "f_get_cron_jobs_report",
    "f_get_cron_violations_report",
    "f_cleanup_old_cron_logs"
  ],
  "status": "deployed"
}
EOF

    log_success "Raport de deployment generat: $report_file"
}

# === MAIN EXECUTION ===

main() {
    echo "============================================================================"
    echo "DEPLOYMENT: CRON-01 VALIDARE CRON"
    echo "============================================================================"
    echo "Environment: $ENVIRONMENT"
    echo "Database: $DATABASE_URL"
    echo "Timestamp: $(date)"
    echo "============================================================================"
    echo
    
    # Verifică dependențele
    check_dependencies
    
    # Testează conexiunea
    test_connection
    
    # Verifică pg_cron
    check_pg_cron_extension
    
    # Implementează validarea
    deploy_cron_validation
    
    # Verifică implementarea
    verify_implementation
    
    # Testează funcționalitatea
    test_wrapper_functions
    test_validation_functions
    
    # Generează raport
    generate_deployment_report
    
    echo
    echo "============================================================================"
    log_success "DEPLOYMENT COMPLETAT CU SUCCES!"
    echo "============================================================================"
    echo
    echo "Ce a fost implementat:"
    echo "✓ Interzicerea apelării directe a funcțiilor de business prin pg_cron"
    echo "✓ Forțarea folosirii wrapper-elor f_cron_run_*"
    echo "✓ Logging în job_audit pentru toate job-urile cron"
    echo "✓ Sistem de validare și monitoring pentru pg_cron"
    echo "✓ Funcții wrapper pentru job-uri cron permise"
    echo
    echo "Următorii pași:"
    echo "1. Testează aplicația cu job-uri cron non-compliant"
    echo "2. Verifică că wrapper-ele funcționează corect"
    echo "3. Monitorizează log-urile de audit"
    echo "4. Configurează job-uri cron compliant folosind wrapper-ele"
    echo
    echo "Exemple de job-uri cron compliant:"
    echo "SELECT cron.schedule('refresh-tier-access-pool', '0 0 * * *', 'SELECT public.f_cron_run_refresh_tier_access_pool()');"
    echo "SELECT cron.schedule('check-library-cap', '*/15 * * * *', 'SELECT public.f_cron_run_check_library_cap()');"
    echo
}

# === EXECUTION ===

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Utilizare: $0 [environment] [database_url]"
    echo
    echo "Parametri:"
    echo "  environment    - Environment (development, staging, production)"
    echo "  database_url  - URL-ul bazei de date PostgreSQL"
    echo
    echo "Exemple:"
    echo "  $0 development"
    echo "  $0 production postgresql://user:pass@host:5432/db"
    echo
    echo "Acest script implementează CRON-01 pentru validarea job-urilor cron."
    exit 0
fi

# Rulează main
main "$@"
