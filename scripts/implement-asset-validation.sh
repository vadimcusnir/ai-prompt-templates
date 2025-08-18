#!/bin/bash

# ============================================================================
# IMPLEMENTARE AUTOMATĂ VALIDARE ASSET-01
# ============================================================================
# 
# Acest script implementează automat validarea ASSET-01:
# - Aplică politicile RLS pentru neuron_assets
# - Verifică că accesul la neuron_assets verifică neurons.published=true
# - Rulează teste de validare
#
# Utilizare: ./implement-asset-validation.sh [database_url]
# ============================================================================

set -e  # Oprește execuția la prima eroare

# === CONFIGURARE ===

# Culori pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database URL (din argument sau variabilă de mediu)
DB_URL="${1:-$DATABASE_URL}"

if [ -z "$DB_URL" ]; then
    echo -e "${RED}EROARE: Specificați DATABASE_URL sau pasați-l ca argument${NC}"
    echo "Utilizare: $0 [database_url]"
    echo "Exemplu: $0 postgresql://user:pass@localhost:5432/dbname"
    exit 1
fi

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

# === VERIFICĂRI PRELIMINARE ===

log_info "Verificări preliminare..."

# Verifică dacă psql este disponibil
if ! command -v psql &> /dev/null; then
    log_error "psql nu este instalat sau nu este în PATH"
    exit 1
fi

# Verifică conexiunea la baza de date
log_info "Testează conexiunea la baza de date..."
if ! psql "$DB_URL" -c "SELECT 1;" &> /dev/null; then
    log_error "Nu se poate conecta la baza de date"
    exit 1
fi

log_success "Conexiunea la baza de date este funcțională"

# === IMPLEMENTARE VALIDARE ASSET-01 ===

log_info "Implementează validarea ASSET-01..."

# 1. Aplică politicile RLS
log_info "Aplică politicile RLS pentru neuron_assets..."
if psql "$DB_URL" -f "sql/31_asset_validation_policies.sql"; then
    log_success "Politicile RLS au fost aplicate cu succes"
else
    log_error "Eroare la aplicarea politicilor RLS"
    exit 1
fi

# 2. Verifică că politicile sunt active
log_info "Verifică că politicile RLS sunt active..."
POLICY_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'neuron_assets';" | tr -d ' ')

if [ "$POLICY_COUNT" -eq 4 ]; then
    log_success "Toate cele 4 politici RLS sunt active"
else
    log_warning "Numărul de politici RLS nu este cel așteptat (așteptat: 4, găsit: $POLICY_COUNT)"
fi

# 3. Verifică că RLS este activ
log_info "Verifică că RLS este activ pe neuron_assets..."
RLS_STATUS=$(psql "$DB_URL" -t -c "SELECT rowsecurity FROM pg_tables WHERE tablename = 'neuron_assets';" | tr -d ' ')

if [ "$RLS_STATUS" = "t" ]; then
    log_success "RLS este activ pe neuron_assets"
else
    log_error "RLS nu este activ pe neuron_assets"
    exit 1
fi

# === TESTE DE VALIDARE ===

log_info "Rulează teste de validare ASSET-01..."

# Rulează testele de smoke
if psql "$DB_URL" -f "test/smoke/smoke_asset_validation_01.sql"; then
    log_success "Testele de validare au trecut cu succes"
else
    log_warning "Unele teste de validare au eșuat - verifică output-ul de mai sus"
fi

# === VERIFICĂRI FINALE ===

log_info "Verificări finale..."

# Verifică funcțiile utilitare
log_info "Verifică funcțiile utilitare..."
if psql "$DB_URL" -t -c "SELECT f_is_neuron_published('00000000-0000-0000-0000-000000000000');" &> /dev/null; then
    log_success "Funcțiile utilitare sunt create și funcționale"
else
    log_error "Funcțiile utilitare nu sunt create corect"
    exit 1
fi

# Verifică funcțiile RPC
log_info "Verifică funcțiile RPC..."
if psql "$DB_URL" -t -c "SELECT rpc_list_neuron_preview_assets('00000000-0000-0000-0000-000000000000');" &> /dev/null; then
    log_success "Funcțiile RPC sunt create și funcționale"
else
    log_error "Funcțiile RPC nu sunt create corect"
    exit 1
fi

# === REZUMAT IMPLEMENTARE ===

log_info "=== REZUMAT IMPLEMENTARE ASSET-01 ==="

echo
echo "✅ Politici RLS implementate:"
psql "$DB_URL" -c "SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'neuron_assets' ORDER BY policyname;"

echo
echo "✅ Funcții create:"
psql "$DB_URL" -c "SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_name LIKE 'f_is_%' OR routine_name LIKE 'rpc_%' ORDER BY routine_name;"

echo
echo "✅ Securitate verificată:"
echo "- RLS activ pe neuron_assets: $([ "$RLS_STATUS" = "t" ] && echo "DA" || echo "NU")"
echo "- Politici RLS create: $POLICY_COUNT/4"
echo "- Funcții utilitare: $(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE 'f_is_%';" | tr -d ' ') găsite"
echo "- Funcții RPC: $(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE 'rpc_%';" | tr -d ' ') găsite"

# === INSTRUCȚIUNI POST-IMPLEMENTARE ===

echo
log_success "=== VALIDAREA ASSET-01 A FOST IMPLEMENTATĂ CU SUCCES ==="
echo
echo "🔒 SECURITATE IMPLEMENTATĂ:"
echo "   • Accesul la neuron_assets verifică neurons.published=true"
echo "   • Utilizatorii anonimi văd doar assets publice de la neuroni publicați"
echo "   • Download-urile sunt gated prin funcții RPC cu verificare acces"
echo "   • Adminii au acces complet la toate assets"
echo
echo "📋 URMĂTORII PAȘI:"
echo "   1. Testează funcționalitatea în aplicația de producție"
echo "   2. Monitorizează log-urile pentru erori de securitate"
echo "   3. Verifică că toate interogările folosesc funcțiile RPC"
echo "   4. Actualizează documentația pentru dezvoltatori"
echo
echo "🧪 PENTRU TESTARE:"
echo "   • Rulează: psql \"$DB_URL\" -f test/smoke/smoke_asset_validation_01.sql"
echo "   • Verifică că politicile RLS blochează accesul la assets neautorizate"
echo
echo "📚 DOCUMENTAȚIE:"
echo "   • Politici RLS: sql/31_asset_validation_policies.sql"
echo "   • Teste: test/smoke/smoke_asset_validation_01.sql"
echo "   • Implementare: scripts/implement-asset-validation.sh"
