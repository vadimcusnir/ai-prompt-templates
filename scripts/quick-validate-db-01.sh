#!/bin/bash

# ============================================================================
# QUICK VALIDATION: DB-01 VALIDARE DE BAZE DE DATE
# ============================================================================
# 
# Script rapid pentru verificarea implementării DB-01
# Verifică elementele cheie fără a rula teste complete
#
# Utilizare:
#   ./quick-validate-db-01.sh [database_url]
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

check_audit_table() {
    log_info "Verifică tabelul de audit..."
    
    local exists=$(psql "$DATABASE_URL" -t -c "
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'access_audit_log'
        );
    " | xargs)
    
    if [ "$exists" = "t" ]; then
        log_success "Tabelul access_audit_log există"
        return 0
    else
        log_error "Tabelul access_audit_log nu există"
        return 1
    fi
}

check_validation_triggers() {
    log_info "Verifică trigger-urile de validare..."
    
    local count=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name LIKE '%validate_direct_access%';
    " | xargs)
    
    if [ "$count" -gt 0 ]; then
        log_success "Trigger-uri de validare active: $count"
        return 0
    else
        log_error "Nu s-au găsit trigger-uri de validare"
        return 1
    fi
}

check_rls_policies() {
    log_info "Verifică politicile RLS restrictive..."
    
    local count=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('neurons', 'bundles', 'plans', 'library_tree', 'library_tree_neurons')
        AND policyname LIKE '%public_select%';
    " | xargs)
    
    if [ "$count" -gt 0 ]; then
        log_success "Politici RLS restrictive active: $count"
        return 0
    else
        log_error "Nu s-au găsit politicile RLS restrictive"
        return 1
    fi
}

check_validation_functions() {
    log_info "Verifică funcțiile de validare..."
    
    local functions=(
        "f_detect_direct_table_access"
        "f_validate_public_view_access"
        "f_enable_migration_mode"
        "f_disable_migration_mode"
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

check_public_views() {
    log_info "Verifică view-urile publice..."
    
    local views=(
        "v_neuron_public"
        "v_tree_public"
        "v_bundle_public"
        "v_plans_public"
    )
    
    local missing=0
    
    for view in "${views[@]}"; do
        local exists=$(psql "$DATABASE_URL" -t -c "
            SELECT EXISTS (
                SELECT 1 FROM information_schema.views 
                WHERE table_schema = 'public' 
                AND table_name = '$view'
            );
        " | xargs)
        
        if [ "$exists" = "t" ]; then
            log_success "View-ul $view există"
        else
            log_error "View-ul $view nu există"
            ((missing++))
        fi
    done
    
    return $missing
}

test_direct_access_blocking() {
    log_info "Testează blocarea accesului direct..."
    
    # Test SELECT direct pe neurons (ar trebui să eșueze)
    local result=$(psql "$DATABASE_URL" -t -c "
        DO \$\$
        BEGIN
            BEGIN
                SELECT COUNT(*) FROM public.neurons;
                RAISE NOTICE 'FAIL: SELECT direct pe neurons a funcționat';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'PASS: SELECT direct pe neurons a fost blocat';
            END;
        END \$\$;
    " 2>&1 | grep -o "PASS\|FAIL" | head -1)
    
    if [ "$result" = "PASS" ]; then
        log_success "Accesul direct la neurons este blocat"
        return 0
    else
        log_error "Accesul direct la neurons nu este blocat"
        return 1
    fi
}

test_public_view_access() {
    log_info "Testează accesul la view-urile publice..."
    
    local result=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM public.v_neuron_public;
    " 2>&1 | grep -c "ERROR" || true)
    
    if [ "$result" -eq 0 ]; then
        log_success "View-urile publice sunt accesibile"
        return 0
    else
        log_error "View-urile publice nu sunt accesibile"
        return 1
    fi
}

# === MAIN EXECUTION ===

main() {
    echo "============================================================================"
    echo "QUICK VALIDATION: DB-01 VALIDARE DE BAZE DE DATE"
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
        "check_audit_table"
        "check_validation_triggers"
        "check_rls_policies"
        "check_validation_functions"
        "check_public_views"
        "test_direct_access_blocking"
        "test_public_view_access"
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
    echo "REZUMAT VALIDARE DB-01"
    echo "============================================================================"
    echo "Total verificări: $total_checks"
    echo "Verificări reușite: $passed_checks"
    echo "Verificări eșuate: $failed_checks"
    echo
    
    if [ $failed_checks -eq 0 ]; then
        log_success "TOATE VERIFICĂRILE AU TRECUT! DB-01 este implementat corect."
        echo
        echo "Ce este implementat:"
        echo "✓ Tabel de audit pentru tracking acces"
        echo "✓ Trigger-uri de validare pe tabele sensibile"
        echo "✓ Politici RLS restrictive pentru non-admin"
        echo "✓ Funcții de validare și migrare"
        echo "✓ View-uri publice accesibile"
        echo "✓ Blocarea accesului direct la tabele brute"
        echo
        echo "Următorii pași:"
        echo "1. Rulează teste complete: ./test/smoke/smoke_db_validation_01.sql"
        echo "2. Monitorizează log-urile de audit"
        echo "3. Testează aplicația cu utilizatori non-admin"
    else
        log_error "UNEA VERIFICĂRI AU EȘUAT! DB-01 nu este implementat complet."
        echo
        echo "Ce să faci:"
        echo "1. Verifică că fișierul 29_db_validation_policies.sql a fost rulat"
        echo "2. Verifică că utilizatorul are drepturi de admin"
        echo "3. Verifică că RLS este activat pe tabele"
        echo "4. Rulează din nou scriptul de deployment"
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
    echo "Acest script verifică rapid implementarea DB-01 fără a rula teste complete."
    exit 0
fi

# Rulează main
main "$@"
