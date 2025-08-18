#!/bin/bash

# ============================================================================
# VALIDARE ARHITECTURĂ ARCH-01
# ============================================================================
# 
# Script pentru validarea arhitecturii dual-brand:
# - Interzice mixajul de branduri într-un singur app
# - Separă aplicațiile ai-prompt-templates/ și 8vultus/
# - Detectează încălcări de separare
#
# Utilizare: ./validate-architecture.sh [options]
# ============================================================================

set -e

# === CONFIGURARE ===

# Culori pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Opțiuni
QUICK_MODE=false
FIX_VIOLATIONS=false
GENERATE_REPORT=false
VERBOSE=false

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

log_header() {
    echo -e "${PURPLE}$1${NC}"
}

show_help() {
    echo "Validare Arhitectură ARCH-01 - Separare Dual-Brand"
    echo
    echo "Utilizare: $0 [options]"
    echo
    echo "Opțiuni:"
    echo "  -h, --help           Afișează acest mesaj de ajutor"
    echo "  -q, --quick          Mod rapid (doar verificări de bază)"
    echo "  -f, --fix            Încearcă să corecteze automat violările"
    echo "  -r, --report         Generează raport detaliat"
    echo "  -v, --verbose        Output detaliat"
    echo
    echo "Exemple:"
    echo "  $0                    # Validare completă"
    echo "  $0 --quick            # Validare rapidă"
    echo "  $0 --fix              # Validare + corectare automată"
    echo "  $0 --report --verbose # Raport detaliat cu output verbose"
}

parse_options() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -q|--quick)
                QUICK_MODE=true
                shift
                ;;
            -f|--fix)
                FIX_VIOLATIONS=true
                shift
                ;;
            -r|--report)
                GENERATE_REPORT=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            *)
                log_error "Opțiune necunoscută: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# === VERIFICĂRI PRELIMINARE ===

check_prerequisites() {
    log_info "Verificări preliminare..."
    
    # Verifică dacă Node.js este disponibil
    if ! command -v node &> /dev/null; then
        log_error "Node.js nu este instalat sau nu este în PATH"
        exit 1
    fi
    
    # Verifică versiunea Node.js
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 14 ]; then
        log_error "Node.js 14+ este necesar, găsit: $(node --version)"
        exit 1
    fi
    
    log_success "Node.js $(node --version) este disponibil"
    
    # Verifică dacă scriptul de validare există
    if [ ! -f "scripts/arch-01-architecture-validation.js" ]; then
        log_error "Script-ul de validare nu există: scripts/arch-01-architecture-validation.js"
        exit 1
    fi
    
    # Verifică structura packages
    if [ ! -d "packages" ]; then
        log_error "Directorul packages nu există"
        exit 1
    fi
    
    log_success "Toate verificările preliminare au trecut"
}

# === VALIDARE ARHITECTURĂ ===

run_architecture_validation() {
    log_header "🏗️  VALIDARE ARHITECTURĂ ARCH-01"
    
    if [ "$QUICK_MODE" = true ]; then
        log_info "Mod rapid activat - verificări limitate"
    fi
    
    if [ "$FIX_VIOLATIONS" = true ]; then
        log_info "Mod corectare automată activat"
    fi
    
    # Rulează validarea
    log_info "Rulează validarea arhitecturală..."
    
    if [ "$VERBOSE" = true ]; then
        node scripts/arch-01-architecture-validation.js
    else
        # Captează output-ul pentru analiză
        VALIDATION_OUTPUT=$(node scripts/arch-01-architecture-validation.js 2>&1)
        VALIDATION_EXIT_CODE=$?
        
        # Afișează output-ul
        echo "$VALIDATION_OUTPUT"
        
        # Analizează rezultatul
        if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
            log_success "Validarea arhitecturală a trecut cu succes!"
        else
            log_error "Validarea arhitecturală a eșuat (exit code: $VALIDATION_EXIT_CODE)"
        fi
    fi
}

# === CORECTARE AUTOMATĂ ===

fix_architecture_violations() {
    if [ "$FIX_VIOLATIONS" != true ]; then
        return
    fi
    
    log_header "🔧 CORECTARE AUTOMATĂ VIOLĂRI"
    
    # Detectează și corectează probleme comune
    
    # 1. Verifică și corectează BrandProvider în ai-prompt-templates
    log_info "Verifică BrandProvider în ai-prompt-templates..."
    AI_LAYOUT_PATH="packages/ai-prompt-templates/app/layout.tsx"
    
    if [ -f "$AI_LAYOUT_PATH" ]; then
        if ! grep -q "BrandProvider" "$AI_LAYOUT_PATH"; then
            log_warning "BrandProvider lipsește din ai-prompt-templates - se corectează..."
            fix_ai_prompt_templates_layout
        else
            log_success "BrandProvider este deja implementat în ai-prompt-templates"
        fi
    fi
    
    # 2. Verifică și corectează importuri cross-brand
    log_info "Verifică importuri cross-brand..."
    fix_cross_brand_imports
    
    # 3. Verifică și corectează dependențe
    log_info "Verifică dependențe cross-brand..."
    fix_cross_brand_dependencies
}

fix_ai_prompt_templates_layout() {
    log_info "Corectează layout-ul ai-prompt-templates..."
    
    # Creează backup
    cp "packages/ai-prompt-templates/app/layout.tsx" "packages/ai-prompt-templates/app/layout.tsx.backup"
    
    # Creează layout-ul corectat
    cat > "packages/ai-prompt-templates/app/layout.tsx" << 'EOF'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/shared/styles/brand-themes.css'
import { BrandProvider } from '@/shared/contexts/BrandContext'
import { BRAND_IDS } from '@/shared/types/brand'
import { AuthProvider } from '@/contexts/AuthContext'
import { Provider as ChakraProvider } from '@/components/ui/provider'
import Navigation from '@/components/Navigation'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Prompt Templates - Cognitive Architecture Platform',
  description: 'Advanced AI prompts for cognitive depth and meaning engineering',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-brand="ai-prompt-templates">
      <body className={inter.className}>
        <BrandProvider initialBrandId={BRAND_IDS.AI_PROMPT_TEMPLATES}>
          <ChakraProvider>
            <AuthProvider>
              <Navigation />
              {children}
              <CookieConsent />
            </AuthProvider>
          </ChakraProvider>
        </BrandProvider>
      </body>
    </html>
  )
}
EOF
    
    log_success "Layout-ul ai-prompt-templates a fost corectat cu BrandProvider"
}

fix_cross_brand_imports() {
    log_info "Scanează și corectează importuri cross-brand..."
    
    # Caută importuri cross-brand în ai-prompt-templates
    find packages/ai-prompt-templates -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
        if grep -q "8vultus" "$file"; then
            log_warning "Import cross-brand găsit în $file - se corectează..."
            # Înlocuiește importurile 8vultus cu shared
            sed -i.bak 's|@/8vultus|@/shared|g' "$file"
            sed -i.bak 's|8vultus|shared|g' "$file"
            log_success "Importuri corectate în $file"
        fi
    done
    
    # Caută importuri cross-brand în 8vultus
    find packages/8vultus -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
        if grep -q "ai-prompt-templates" "$file"; then
            log_warning "Import cross-brand găsit în $file - se corectează..."
            # Înlocuiește importurile ai-prompt-templates cu shared
            sed -i.bak 's|@/ai-prompt-templates|@/shared|g' "$file"
            sed -i.bak 's|ai-prompt-templates|shared|g' "$file"
            log_success "Importuri corectate în $file"
        fi
    done
}

fix_cross_brand_dependencies() {
    log_info "Verifică și corectează dependențe cross-brand..."
    
    # Verifică package.json pentru ai-prompt-templates
    AI_PACKAGE_JSON="packages/ai-prompt-templates/package.json"
    if [ -f "$AI_PACKAGE_JSON" ]; then
        if grep -q "8vultus" "$AI_PACKAGE_JSON"; then
            log_warning "Dependință cross-brand găsită în ai-prompt-templates - se corectează..."
            # Creează backup
            cp "$AI_PACKAGE_JSON" "$AI_PACKAGE_JSON.backup"
            # Elimină dependențele 8vultus
            sed -i.bak '/8vultus/d' "$AI_PACKAGE_JSON"
            log_success "Dependințe cross-brand eliminate din ai-prompt-templates"
        fi
    fi
    
    # Verifică package.json pentru 8vultus
    VULTUS_PACKAGE_JSON="packages/8vultus/package.json"
    if [ -f "$VULTUS_PACKAGE_JSON" ]; then
        if grep -q "ai-prompt-templates" "$VULTUS_PACKAGE_JSON"; then
            log_warning "Dependință cross-brand găsită în 8vultus - se corectează..."
            # Creează backup
            cp "$VULTUS_PACKAGE_JSON" "$VULTUS_PACKAGE_JSON.backup"
            # Elimină dependențele ai-prompt-templates
            sed -i.bak '/ai-prompt-templates/d' "$VULTUS_PACKAGE_JSON"
            log_success "Dependințe cross-brand eliminate din 8vultus"
        fi
    fi
}

# === GENERARE RAPORT ===

generate_architecture_report() {
    if [ "$GENERATE_REPORT" != true ]; then
        return
    fi
    
    log_header "📊 GENERARE RAPORT ARHITECTURĂ"
    
    REPORT_FILE="ARCH-01-ARCHITECTURE-REPORT-$(date +%Y%m%d-%H%M%S).md"
    
    log_info "Generează raport în $REPORT_FILE..."
    
    cat > "$REPORT_FILE" << EOF
# Raport Validare Arhitectură ARCH-01

**Data generare:** $(date)
**Script rulat:** $0
**Opțiuni:** $(echo "$*" | tr '\n' ' ')

## Rezumat Execuție

- **Status:** $(if [ $VALIDATION_EXIT_CODE -eq 0 ]; then echo "SUCCESS"; else echo "FAILED"; fi)
- **Exit Code:** $VALIDATION_EXIT_CODE
- **Mod rapid:** $QUICK_MODE
- **Corectare automată:** $FIX_VIOLATIONS
- **Output verbose:** $VERBOSE

## Structura Packages

\`\`\`
$(tree packages -I 'node_modules|.next|.git' 2>/dev/null || echo "tree command not available")
\`\`\`

## Validare Arhitecturală

\`\`\`
$VALIDATION_OUTPUT
\`\`\`

## Fișiere Modificate

$(if [ "$FIX_VIOLATIONS" = true ]; then
    echo "- Layout ai-prompt-templates: BrandProvider adăugat"
    echo "- Importuri cross-brand: corectate"
    echo "- Dependințe cross-brand: eliminate"
else
    echo "- Nu s-au efectuat modificări (mod corectare dezactivat)"
fi)

## Recomandări

1. **Verificare post-corectare:** Rulează din nou validarea pentru confirmare
2. **Testare:** Testează ambele aplicații pentru a verifica funcționalitatea
3. **Monitorizare:** Implementează validare automată în CI/CD
4. **Documentație:** Actualizează ghidurile de dezvoltare

## Următorii Pași

$(if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
    echo "✅ Arhitectura este validă - poți proceda cu deployment"
else
    echo "❌ Arhitectura are probleme - rezolvă violările înainte de deployment"
fi)

---
*Raport generat automat de script-ul de validare arhitecturală ARCH-01*
EOF
    
    log_success "Raport generat în $REPORT_FILE"
}

# === FUNCȚIE PRINCIPALĂ ===

main() {
    log_header "🏗️  VALIDARE ARHITECTURĂ ARCH-01 - SEPARARE DUAL-BRAND"
    
    # Parsează opțiunile
    parse_options "$@"
    
    # Verificări preliminare
    check_prerequisites
    
    # Rulează validarea
    run_architecture_validation
    
    # Corectare automată dacă este activată
    if [ "$FIX_VIOLATIONS" = true ]; then
        fix_architecture_violations
        
        # Rulează din nou validarea pentru confirmare
        log_info "Rulează din nou validarea pentru confirmare..."
        run_architecture_validation
    fi
    
    # Generează raport dacă este activat
    generate_architecture_report
    
    # Mesaj final
    log_header "🏁 VALIDARE COMPLETĂ"
    
    if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
        log_success "🎉 Arhitectura ARCH-01 este validă!"
        echo "   Separarea brandurilor este implementată corect."
        echo "   Nu există mixaj de branduri între aplicații."
    else
        log_error "❌ Arhitectura ARCH-01 are probleme!"
        echo "   Rezolvă violările înainte de deployment."
        echo "   Folosește --fix pentru corectare automată."
    fi
    
    echo
    echo "📚 DOCUMENTAȚIE: README-ARCH-01-VALIDATION.md"
    echo "🔧 SCRIPT VALIDARE: scripts/arch-01-architecture-validation.js"
    echo "📊 RAPORT: $REPORT_FILE (dacă generat)"
}

# === EXECUȚIE ===

# Captează toate argumentele
main "$@"
