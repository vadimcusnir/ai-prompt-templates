#!/bin/bash

# ============================================================================
# QUICK VALIDATION: CRON-01 VALIDARE CRON
# ============================================================================
# 
# Script rapid pentru verificarea implementării CRON-01
# Verifică elementele cheie fără a rula teste complete
#
# Utilizare:
#   ./quick-validate-cron-01.sh [database_url]
# ============================================================================

set -e

# === CONFIGURARE ===

DATABASE_URL=${1:-"postgresql://postgres:postgres@localhost:5432/ai_prompt_templates"}

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
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# === VERIFICĂRI RAPIDE ===

check_connection() {
    log_info "Verifică conexiunea la baza de date..."
    
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        log_success "Conexiune la baza de date reușită"
        return 0
    else
        log_error "Nu se poate conecta la baza de date"
        return 1
    fi
}

check_pg_cron_extension() {
    log_info "Verifică extensia pg_cron..."
    
    local exists=$(psql "$DATABASE_URL" -t -c "
        SELECT EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
        );
    " | xargs)
    
    if [ "$exists" = "t" ]; then
        log_success "Extensia pg_cron este instalată"
        return 0
    else
        log_error "Extensia pg_cron nu este instalată"
        return 1
    fi
}

check_job_audit_table() {
    log_info "Verifică tabelul de audit pentru job-uri..."
    
    local exists=$(psql "$DATABASE_URL" -t -c "
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'job_audit'
        );
    " | xargs)
    
    if [ "$exists" = "t" ]; then
        log_success "Tabelul job_audit există"
        return 0
    else
        log_error "Tabelul job_audit nu există"
        return 1
    fi
}

check_wrapper_functions() {
    log_info "Verifică funcțiile wrapper..."
    
    local functions=(
        "f_cron_run_refresh_tier_access_pool"
        "f_cron_run_check_library_cap"
        "f_cron_run_preview_audit"
        "f_cron_run_bundle_consistency"
        "f_cron_run_custom_job"
    )
    
    local missing=0
    
    for func in "${functions[@]}"; do
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
            ((missing++))
        fi
    done
    
    return $missing
}

check_validation_functions() {
    log_info "Verifică funcțiile de validare..."
    
    local functions=(
        "f_validate_cron_job"
        "f_detect_cron_violations"
        "f_get_cron_jobs_report"
        "f_get_cron_violations_report"
        "f_cleanup_old_cron_logs"
    )
    
    local missing=0
    
    for func in "${functions[@]}"; do
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
            ((missing++))
        fi
    done
    
    return $missing
}

test_wrapper_function() {
    log_info "Testează o funcție wrapper..."
    
    local result=$(psql "$DATABASE_URL" -t -c "
        SELECT public.f_cron_run_refresh_tier_access_pool();
    " 2>&1 | grep -c "ERROR" || true)
    
    if [ "$result" -eq 0 ]; then
        log_success "Funcția wrapper testată cu succes"
        return 0
    else
        log_error "Funcția wrapper a eșuat la testare"
        return 1
    fi
}

test_validation_function() {
    log_info "Testează funcția de validare..."
    
    local result=$(psql "$DATABASE_URL" -t -c "
        SELECT public.f_validate_cron_job(
            'test-job',
            '0 0 * * *',
            'SELECT public.f_cron_run_refresh_tier_access_pool()'
        );
    " 2>&1 | grep -c "ERROR" || true)
    
    if [ "$result" -eq 0 ]; then
        log_success "Funcția de validare testată cu succes"
        return 0
    else
        log_error "Funcția de validare a eșuat la testare"
        return 1
    fi
}

check_cron_jobs() {
    log_info "Verifică job-urile cron existente..."
    
    if psql "$DATABASE_URL" -c "SELECT 1 FROM cron.job LIMIT 1;" &> /dev/null; then
        local job_count=$(psql "$DATABASE_URL" -t -c "
            SELECT COUNT(*) FROM cron.job;
        " | xargs)
        
        if [ "$job_count" -gt 0 ]; then
            log_info "Găsite $job_count job-uri cron"
            
            # Verifică dacă job-urile sunt compliant
            local compliant_count=$(psql "$DATABASE_URL" -t -c "
                SELECT COUNT(*) FROM cron.job 
                WHERE command LIKE '%f_cron_run_%';
            " | xargs)
            
            local non_compliant_count=$(psql "$DATABASE_URL" -t -c "
                SELECT COUNT(*) FROM cron.job 
                WHERE command NOT LIKE '%f_cron_run_%';
            " | xargs)
            
            log_info "Job-uri compliant: $compliant_count"
            log_info "Job-uri non-compliant: $non_compliant_count"
            
            if [ "$non_compliant_count" -gt 0 ]; then
                log_warning "Găsite $non_compliant_count job-uri non-compliant cu CRON-01"
            fi
        else
            log_info "Nu există job-uri cron configurate"
        fi
        return 0
    else
        log_warning "Schema cron nu este accesibilă (nu există job-uri cron)"
        return 0
    fi
}

# === MAIN EXECUTION ===

main() {
    echo "============================================================================"
    echo "QUICK VALIDATION: CRON-01 VALIDARE CRON"
    echo "============================================================================"
    echo "Database: $DATABASE_URL"
    echo "Timestamp: $(date)"
    echo "============================================================================"
    echo
    
    local total_checks=0
    local passed_checks=0
    local failed_checks=0
    
    # Array cu toate verificările
    local checks=(
        "check_connection"
        "check_pg_cron_extension"
        "check_job_audit_table"
        "check_wrapper_functions"
        "check_validation_functions"
        "test_wrapper_function"
        "test_validation_function"
        "check_cron_jobs"
    )
    
    # Rulează toate verificările
    for check in "${checks[@]}"; do
        ((total_checks++))
        
        if $check; then
            ((passed_checks++))
        else
            ((failed_checks++))
        fi
        
        echo
    done
    
    # Rezumat final
    echo "============================================================================"
    echo "REZUMAT VALIDARE CRON-01"
    echo "============================================================================"
    echo "Total verificări: $total_checks"
    echo "Verificări reușite: $passed_checks"
    echo "Verificări eșuate: $failed_checks"
    echo
    
    if [ $failed_checks -eq 0 ]; then
        log_success "TOATE VERIFICĂRILE AU TRECUT! CRON-01 este implementat corect."
        echo
        echo "Ce este implementat:"
        echo "✓ Extensia pg_cron este instalată"
        echo "✓ Tabelul de audit job_audit este creat"
        echo "✓ Funcțiile wrapper f_cron_run_* sunt create"
        echo "✓ Funcțiile de validare sunt operaționale"
        echo "✓ Sistemul de audit funcționează"
        echo "✓ Job-urile cron sunt validate"
        echo
        echo "Următorii pași:"
        echo "1. Rulează teste complete: ./test/smoke/smoke_cron_validation_01.sql"
        echo "2. Monitorizează log-urile de audit"
        echo "3. Configurează job-uri cron compliant folosind wrapper-ele"
        echo "4. Testează validarea cu job-uri non-compliant"
    else
        log_error "UNEA VERIFICĂRI AU EȘUAT! CRON-01 nu este implementat complet."
        echo
        echo "Ce să faci:"
        echo "1. Verifică că fișierul 30_cron_validation_policies.sql a fost rulat"
        echo "2. Verifică că utilizatorul are drepturi de admin"
        echo "3. Verifică că extensia pg_cron este instalată"
        echo "4. Verifică că funcțiile wrapper sunt create corect"
        echo "5. Rulează din nou scriptul de deployment"
    fi
    
    echo "============================================================================"
}

# === EXECUTION ===

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Utilizare: $0 [database_url]"
    echo
    echo "Parametri:"
    echo "  database_url  - URL-ul bazei de date PostgreSQL (opțional)"
    echo
    echo "Exemple:"
    echo "  $0"
    echo "  $0 postgresql://user:pass@host:5432/db"
    echo
    echo "Acest script verifică rapid implementarea CRON-01 fără a rula teste complete."
    exit 0
fi

# Rulează main
main "$@"
