#!/bin/bash

# ============================================================================
# TEST RAPID ARHITECTURĂ ARCH-01
# ============================================================================
# 
# Script de test rapid pentru validarea arhitecturală:
# - Verificări de bază fără rularea validării complete
# - Detectare rapidă a problemelor evidente
# - Output concis pentru verificări rapide
#
# Utilizare: ./quick-arch-test.sh
# ============================================================================

set -e

# === CONFIGURARE ===

# Culori pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# === FUNCȚII UTILITARE ===

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# === TESTE RAPIDE ===

echo "🔍 TEST RAPID ARHITECTURĂ ARCH-01"
echo "=================================="

# 1. Verifică structura packages
log_info "Verifică structura packages..."
if [ -d "packages" ]; then
    PACKAGES=$(ls packages/)
    EXPECTED_PACKAGES="ai-prompt-templates 8vultus shared"
    
    for pkg in $EXPECTED_PACKAGES; do
        if echo "$PACKAGES" | grep -q "$pkg"; then
            log_success "Package $pkg există"
        else
            log_error "Package $pkg lipsește"
        fi
    done
    
    # Verifică package-uri neașteptate
    UNEXPECTED=$(echo "$PACKAGES" | grep -v -E "(ai-prompt-templates|8vultus|shared)")
    if [ -n "$UNEXPECTED" ]; then
        log_warning "Package-uri neașteptate: $UNEXPECTED"
    fi
else
    log_error "Directorul packages nu există"
    exit 1
fi

# 2. Verifică BrandProvider în layout-uri
log_info "Verifică BrandProvider în layout-uri..."

# ai-prompt-templates
AI_LAYOUT="packages/ai-prompt-templates/app/layout.tsx"
if [ -f "$AI_LAYOUT" ]; then
    if grep -q "BrandProvider" "$AI_LAYOUT"; then
        log_success "BrandProvider găsit în ai-prompt-templates"
    else
        log_error "BrandProvider lipsește din ai-prompt-templates"
    fi
else
    log_warning "Layout ai-prompt-templates nu există: $AI_LAYOUT"
fi

# 8vultus
VULTUS_LAYOUT="packages/8vultus/src/app/layout.tsx"
if [ -f "$VULTUS_LAYOUT" ]; then
    if grep -q "BrandProvider" "$VULTUS_LAYOUT"; then
        log_success "BrandProvider găsit în 8vultus"
    else
        log_error "BrandProvider lipsește din 8vultus"
    fi
else
    log_warning "Layout 8vultus nu există: $VULTUS_LAYOUT"
fi

# 3. Verifică importuri cross-brand
log_info "Verifică importuri cross-brand..."

# Caută importuri 8vultus în ai-prompt-templates
CROSS_IMPORTS_AI=$(grep -r "8vultus" packages/ai-prompt-templates/ 2>/dev/null | grep -v "node_modules" | grep -v ".git" || true)
if [ -n "$CROSS_IMPORTS_AI" ]; then
    log_error "Importuri cross-brand găsite în ai-prompt-templates:"
    echo "$CROSS_IMPORTS_AI" | head -3
else
    log_success "Nu există importuri cross-brand în ai-prompt-templates"
fi

# Caută importuri ai-prompt-templates în 8vultus
CROSS_IMPORTS_VULTUS=$(grep -r "ai-prompt-templates" packages/8vultus/ 2>/dev/null | grep -v "node_modules" | grep -v ".git" || true)
if [ -n "$CROSS_IMPORTS_VULTUS" ]; then
    log_error "Importuri cross-brand găsite în 8vultus:"
    echo "$CROSS_IMPORTS_VULTUS" | head -3
else
    log_success "Nu există importuri cross-brand în 8vultus"
fi

# 4. Verifică dependențe cross-brand
log_info "Verifică dependențe cross-brand..."

# ai-prompt-templates package.json
AI_PACKAGE_JSON="packages/ai-prompt-templates/package.json"
if [ -f "$AI_PACKAGE_JSON" ]; then
    if grep -q "8vultus" "$AI_PACKAGE_JSON"; then
        log_error "Dependință cross-brand găsită în ai-prompt-templates package.json"
    else
        log_success "Nu există dependințe cross-brand în ai-prompt-templates"
    fi
fi

# 8vultus package.json
VULTUS_PACKAGE_JSON="packages/8vultus/package.json"
if [ -f "$VULTUS_PACKAGE_JSON" ]; then
    if grep -q "ai-prompt-templates" "$VULTUS_PACKAGE_JSON"; then
        log_error "Dependință cross-brand găsită în 8vultus package.json"
    else
        log_success "Nu există dependințe cross-brand în 8vultus"
    fi
fi

# 5. Verifică configurația shared
log_info "Verifică configurația shared..."

SHARED_TYPES="packages/shared/types/brand.ts"
SHARED_CONFIGS="packages/shared/lib/brand-configs.ts"

if [ -f "$SHARED_TYPES" ]; then
    log_success "Brand types există în shared"
else
    log_error "Brand types lipsește din shared"
fi

if [ -f "$SHARED_CONFIGS" ]; then
    log_success "Brand configs există în shared"
else
    log_error "Brand configs lipsesc din shared"
fi

# 6. Verifică scripturile de validare
log_info "Verifică scripturile de validare..."

if [ -f "scripts/arch-01-architecture-validation.js" ]; then
    log_success "Script validare Node.js există"
else
    log_error "Script validare Node.js lipsește"
fi

if [ -f "scripts/validate-architecture.sh" ]; then
    log_success "Script validare bash există"
else
    log_error "Script validare bash lipsește"
fi

# === REZUMAT RAPID ===

echo
echo "📊 REZUMAT TEST RAPID:"
echo "======================"

# Numără rezultatele
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS_COUNT=0

# Calculează statisticile (simplificat)
if [ -d "packages" ]; then TOTAL_CHECKS=$((TOTAL_CHECKS + 1)); fi
if [ -d "packages/ai-prompt-templates" ]; then TOTAL_CHECKS=$((TOTAL_CHECKS + 1)); fi
if [ -d "packages/8vultus" ]; then TOTAL_CHECKS=$((TOTAL_CHECKS + 1)); fi
if [ -d "packages/shared" ]; then TOTAL_CHECKS=$((TOTAL_CHECKS + 1)); fi

# Verifică BrandProvider
if [ -f "packages/ai-prompt-templates/app/layout.tsx" ] && grep -q "BrandProvider" "packages/ai-prompt-templates/app/layout.tsx"; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

if [ -f "packages/8vultus/src/app/layout.tsx" ] && grep -q "BrandProvider" "packages/8vultus/src/app/layout.tsx"; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

# Verifică importuri cross-brand
if [ -z "$CROSS_IMPORTS_AI" ]; then PASSED_CHECKS=$((PASSED_CHECKS + 1)); fi
if [ -z "$CROSS_IMPORTS_VULTUS" ]; then PASSED_CHECKS=$((PASSED_CHECKS + 1)); fi

# Verifică dependențe cross-brand
if [ -f "$AI_PACKAGE_JSON" ] && ! grep -q "8vultus" "$AI_PACKAGE_JSON"; then PASSED_CHECKS=$((PASSED_CHECKS + 1)); fi
if [ -f "$VULTUS_PACKAGE_JSON" ] && ! grep -q "ai-prompt-templates" "$VULTUS_PACKAGE_JSON"; then PASSED_CHECKS=$((PASSED_CHECKS + 1)); fi

# Verifică shared
if [ -f "$SHARED_TYPES" ]; then PASSED_CHECKS=$((PASSED_CHECKS + 1)); fi
if [ -f "$SHARED_CONFIGS" ]; then PASSED_CHECKS=$((PASSED_CHECKS + 1)); fi

# Verifică scripturi
if [ -f "scripts/arch-01-architecture-validation.js" ]; then PASSED_CHECKS=$((PASSED_CHECKS + 1)); fi
if [ -f "scripts/validate-architecture.sh" ]; then PASSED_CHECKS=$((PASSED_CHECKS + 1)); fi

FAILED_CHECKS=$((TOTAL_CHECKS - PASSED_CHECKS))

echo "   ✅ Teste trecute: $PASSED_CHECKS"
echo "   ❌ Teste eșuate: $FAILED_CHECKS"
echo "   ⚠️  Avertismente: $WARNINGS_COUNT"

# Status final
if [ $FAILED_CHECKS -eq 0 ]; then
    echo
    log_success "🎉 TEST RAPID TRECUT!"
    echo "   Arhitectura pare să fie validă."
    echo "   Rulează validarea completă pentru confirmare."
else
    echo
    log_error "❌ TEST RAPID EȘUAT!"
    echo "   Există probleme de arhitectură."
    echo "   Rezolvă-le înainte de a rula validarea completă."
fi

echo
echo "🔧 URMĂTORII PAȘI:"
if [ $FAILED_CHECKS -eq 0 ]; then
    echo "   1. Rulează validarea completă: ./scripts/validate-architecture.sh"
    echo "   2. Generează raport: ./scripts/validate-architecture.sh --report"
else
    echo "   1. Rezolvă problemele detectate"
    echo "   2. Rulează din nou testul rapid"
    echo "   3. Apoi rulează validarea completă"
fi

echo
echo "📚 DOCUMENTAȚIE: README-ARCH-01-VALIDATION.md"
