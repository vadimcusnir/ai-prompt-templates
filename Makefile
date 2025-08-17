# ============================================================================
# MAKEFILE - AI Prompt Templates
# ============================================================================
# 
# Comenzi disponibile:
# - test-schema: Testează schema pe database-ul de dezvoltare
# - deploy-schema: Deployează schema completă cu toate optimizările
# - generate-data: Generează date de test cu prețuri reale
# - performance-test: Rulează teste de performanță
# - clean: Curăță fișierele temporare
# ============================================================================

.PHONY: help test-schema deploy-schema generate-data performance-test clean

# Comanda implicită
help:
	@echo "AI Prompt Templates - Comenzi disponibile:"
	@echo ""
	@echo "🧪 test-schema      - Testează schema pe database-ul de dezvoltare"
	@echo "🚀 deploy-schema    - Deployează schema completă cu optimizări"
	@echo "📊 generate-data    - Generează date de test cu prețuri reale"
	@echo "⚡ performance-test - Rulează teste de performanță"
	@echo "🧹 clean            - Curăță fișierele temporare"
	@echo "❓ help             - Afișează această ajutor"
	@echo ""
	@echo "Exemplu: make test-schema"

# Testare schema pe database-ul de dezvoltare
test-schema:
	@echo "🧪 Testare schema pe database-ul de dezvoltare..."
	@node scripts/test-schema-dev.js

# Deploy schema completă
deploy-schema:
	@echo "🚀 Deploy schema completă cu optimizări..."
	@./scripts/deploy-schema-dev.sh

# Generare date de test
generate-data:
	@echo "📊 Generare date de test cu prețuri reale..."
	@node scripts/generate-test-data.js

# Teste de performanță
performance-test:
	@echo "⚡ Rulare teste de performanță..."
	@node scripts/test-schema-dev.js performance

# Curățare fișiere temporare
clean:
	@echo "🧹 Curățare fișiere temporare..."
	@rm -f DEPLOYMENT_REPORT.md
	@rm -f logs/*.log
	@echo "✅ Curățare completă!"

# Instalare dependințe
install:
	@echo "📦 Instalare dependințe..."
	@npm install

# Verificare precondiții
check:
	@echo "🔍 Verificare precondiții..."
	@test -f .env || (echo "❌ Fișierul .env lipsește!" && exit 1)
	@test -f package.json || (echo "❌ package.json lipsește!" && exit 1)
	@echo "✅ Toate precondițiile sunt îndeplinite!"

# Setup complet pentru dezvoltare
setup-dev: check install
	@echo "🔧 Setup complet pentru dezvoltare..."
	@echo "✅ Setup complet!"

# Rulare rapidă a testelor
quick-test: check
	@echo "⚡ Testare rapidă..."
	@node scripts/test-schema-dev.js quick

# Verificare status database
db-status:
	@echo "📊 Verificare status database..."
	@node -e 'const { createClient } = require("@supabase/supabase-js"); require("dotenv").config(); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); async function checkStatus() { try { const { data, error } = await supabase.from("information_schema.tables").select("table_name").eq("table_schema", "public").in("table_name", ["neurons", "library_tree", "bundles", "plans"]); if (error) throw error; console.log("✅ Database conectat!"); console.log("📋 Tabele găsite:", data.length); data.forEach(t => console.log("  -", t.table_name)); } catch (error) { console.error("❌ Eroare conexiune database:", error.message); } } checkStatus();'
