#!/bin/bash

# Script pentru testarea workflow-urilor CI/CD
# Usage: ./scripts/test-workflows.sh [workflow_name]

set -e

# Culori pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funcție pentru logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Verifică dacă suntem în directorul corect
if [ ! -f "package.json" ]; then
    error "Nu sunt în directorul rădăcină al proiectului"
    exit 1
fi

# Verifică dacă directorul .github/workflows există
if [ ! -d ".github/workflows" ]; then
    error "Directorul .github/workflows nu există"
    exit 1
fi

# Lista workflow-urilor disponibile
WORKFLOWS=(
    "cache"
    "security"
    "performance"
    "database"
    "release"
    "cleanup"
    "testing"
    "build-deploy"
    "monitoring"
    "backup"
    "dependencies"
)

# Funcție pentru validarea unui workflow
validate_workflow() {
    local workflow_name=$1
    local workflow_file=".github/workflows/${workflow_name}.yml"
    
    if [ ! -f "$workflow_file" ]; then
        error "Workflow-ul $workflow_name nu există: $workflow_file"
        return 1
    fi
    
    log "Validând workflow-ul: $workflow_name"
    
    # Verifică sintaxa YAML
    if command -v yamllint &> /dev/null; then
        if yamllint "$workflow_file" > /dev/null 2>&1; then
            success "Sintaxa YAML este validă pentru $workflow_name"
        else
            warning "Sintaxa YAML poate avea probleme pentru $workflow_name"
        fi
    else
        warning "yamllint nu este instalat, nu se poate valida sintaxa YAML"
    fi
    
    # Verifică dacă workflow-ul are job-uri
    if grep -q "^jobs:" "$workflow_file"; then
        success "Workflow-ul $workflow_name are job-uri definite"
    else
        error "Workflow-ul $workflow_name nu are job-uri definite"
        return 1
    fi
    
    # Verifică dacă workflow-ul are trigger-e
    if grep -q "^on:" "$workflow_file"; then
        success "Workflow-ul $workflow_name are trigger-e definite"
    else
        error "Workflow-ul $workflow_name nu are trigger-e definite"
        return 1
    fi
    
    return 0
}

# Funcție pentru testarea unui workflow specific
test_specific_workflow() {
    local workflow_name=$1
    
    log "Testând workflow-ul specific: $workflow_name"
    
    if validate_workflow "$workflow_name"; then
        success "Workflow-ul $workflow_name este valid"
        
        # Afișează informații despre workflow
        echo
        log "Informații despre workflow-ul $workflow_name:"
        echo "----------------------------------------"
        
        # Extrage numele workflow-ului
        local display_name=$(grep "^name:" ".github/workflows/${workflow_name}.yml" | head -1 | sed 's/^name: *//')
        echo "Nume: $display_name"
        
        # Extrage trigger-ele
        echo "Trigger-e:"
        grep -A 10 "^on:" ".github/workflows/${workflow_name}.yml" | grep -E "^(  -|  push|  pull_request|  schedule|  workflow_run|  release|  workflow_dispatch)" | sed 's/^/  /'
        
        # Extrage job-urile
        echo "Job-uri:"
        grep "^  [a-zA-Z-]*:" ".github/workflows/${workflow_name}.yml" | grep -v "^  runs-on:" | grep -v "^  needs:" | sed 's/^/  /'
        
        echo "----------------------------------------"
        
    else
        error "Workflow-ul $workflow_name are probleme"
        return 1
    fi
}

# Funcție pentru testarea tuturor workflow-urilor
test_all_workflows() {
    log "Testând toate workflow-urile..."
    
    local failed_workflows=()
    local successful_workflows=()
    
    for workflow in "${WORKFLOWS[@]}"; do
        if validate_workflow "$workflow"; then
            successful_workflows+=("$workflow")
        else
            failed_workflows+=("$workflow")
        fi
        echo
    done
    
    # Rezumat
    echo "========================================"
    log "REZUMAT TESTARE WORKFLOW-URI"
    echo "========================================"
    echo "Total workflow-uri: ${#WORKFLOWS[@]}"
    echo "Succes: ${#successful_workflows[@]}"
    echo "Eșec: ${#failed_workflows[@]}"
    
    if [ ${#successful_workflows[@]} -gt 0 ]; then
        echo
        success "Workflow-uri cu succes:"
        for workflow in "${successful_workflows[@]}"; do
            echo "  ✓ $workflow"
        done
    fi
    
    if [ ${#failed_workflows[@]} -gt 0 ]; then
        echo
        error "Workflow-uri cu probleme:"
        for workflow in "${failed_workflows[@]}"; do
            echo "  ✗ $workflow"
        done
        return 1
    fi
    
    return 0
}

# Funcție pentru verificarea dependențelor
check_dependencies() {
    log "Verificând dependențele..."
    
    # Verifică dacă package.json are script-urile necesare
    local required_scripts=(
        "type-check"
        "format"
        "test:ci"
        "test:e2e"
        "test:performance"
        "lighthouse"
        "db:check"
        "deploy:dev"
        "deploy:prod"
        "rollback"
        "clean"
        "deps:check"
        "deps:update"
        "security:audit"
        "security:fix"
    )
    
    local missing_scripts=()
    
    for script in "${required_scripts[@]}"; do
        if grep -q "\"$script\":" package.json; then
            success "Script $script este definit"
        else
            warning "Script $script lipsește"
            missing_scripts+=("$script")
        fi
    done
    
    if [ ${#missing_scripts[@]} -gt 0 ]; then
        echo
        warning "Script-uri lipsă:"
        for script in "${missing_scripts[@]}"; do
            echo "  - $script"
        done
    fi
    
    # Verifică dependențele
    local required_deps=(
        "depcheck"
        "npm-check-updates"
        "lighthouse"
    )
    
    local missing_deps=()
    
    for dep in "${required_deps[@]}"; do
        if grep -q "\"$dep\":" package.json; then
            success "Dependența $dep este instalată"
        else
            warning "Dependența $dep lipsește"
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo
        warning "Dependențe lipsă:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
    fi
}

# Funcție pentru afișarea ajutorului
show_help() {
    echo "Usage: $0 [OPTIONS] [WORKFLOW_NAME]"
    echo
    echo "OPTIONS:"
    echo "  -h, --help     Afișează acest ajutor"
    echo "  -a, --all      Testează toate workflow-urile"
    echo "  -d, --deps     Verifică dependențele"
    echo "  -v, --validate Validează workflow-urile"
    echo
    echo "WORKFLOW_NAME:"
    echo "  Numele workflow-ului de testat (opțional)"
    echo "  Workflow-uri disponibile: ${WORKFLOWS[*]}"
    echo
    echo "EXEMPLE:"
    echo "  $0                    # Afișează ajutorul"
    echo "  $0 -a                 # Testează toate workflow-urile"
    echo "  $0 cache              # Testează workflow-ul cache"
    echo "  $0 -d                 # Verifică dependențele"
    echo "  $0 -v                 # Validează workflow-urile"
}

# Main
main() {
    local test_all=false
    local check_deps=false
    local validate_only=false
    local specific_workflow=""
    
    # Parsează argumentele
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -a|--all)
                test_all=true
                shift
                ;;
            -d|--deps)
                check_deps=true
                shift
                ;;
            -v|--validate)
                validate_only=true
                shift
                ;;
            -*)
                error "Opțiune necunoscută: $1"
                show_help
                exit 1
                ;;
            *)
                if [ -z "$specific_workflow" ]; then
                    specific_workflow="$1"
                else
                    error "Prea multe argumente"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Dacă nu s-au specificat opțiuni, afișează ajutorul
    if [ "$test_all" = false ] && [ "$check_deps" = false ] && [ "$validate_only" = false ] && [ -z "$specific_workflow" ]; then
        show_help
        exit 0
    fi
    
    # Verifică dependențele dacă este solicitat
    if [ "$check_deps" = true ]; then
        check_dependencies
        echo
    fi
    
    # Testează workflow-urile
    if [ "$test_all" = true ]; then
        test_all_workflows
    elif [ -n "$specific_workflow" ]; then
        test_specific_workflow "$specific_workflow"
    elif [ "$validate_only" = true ]; then
        test_all_workflows
    fi
    
    success "Testarea workflow-urilor s-a terminat"
}

# Rulează main cu toate argumentele
main "$@"
