#!/bin/bash

# Cursor Law Guard - Smoke Test Runner
# Script pentru testarea suite-ului de smoke tests

set -e

echo "🧪 Cursor Law Guard - Smoke Test Runner"
echo "========================================"

# Verifică dacă există directorul smoke
if [ ! -d "./test/smoke" ]; then
    echo "❌ Directorul ./test/smoke nu există!"
    exit 1
fi

# Contoară testele
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo ""
echo "📋 Rulare smoke tests..."

# Test 1: DB-01
echo "🔍 Test DB-01 (SELECT pe tabele brute)..."
if npx tsx ./cursor/agent.ts --only=DB-01 --soft 2>&1 | grep -q "Violări de Lege"; then
    echo "  ✅ DB-01: Violări detectate (așteptat)"
    ((PASSED_TESTS++))
else
    echo "  ❌ DB-01: Nu s-au detectat violări (neasteptat)"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Test 2: CRON-01
echo "🔍 Test CRON-01 (cron fără wrapper)..."
if npx tsx ./cursor/agent.ts --only=CRON-01 --soft 2>&1 | grep -q "Violări de Lege"; then
    echo "  ✅ CRON-01: Violări detectate (așteptat)"
    ((PASSED_TESTS++))
else
    echo "  ❌ CRON-01: Nu s-au detectat violări (neasteptat)"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Test 3: PLANS-01
echo "🔍 Test PLANS-01 (prețuri fără root=2)..."
if npx tsx ./cursor/agent.ts --only=PLANS-01 --soft 2>&1 | grep -q "Violări de Lege"; then
    echo "  ✅ PLANS-01: Violări detectate (așteptat)"
    ((PASSED_TESTS++))
else
    echo "  ❌ PLANS-01: Nu s-au detectat violări (neasteptat)"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Test 4: DELETE-01
echo "🔍 Test DELETE-01 (DELETE pe neurons)..."
if npx tsx ./cursor/agent.ts --only=DELETE-01 --soft 2>&1 | grep -q "Violări de Lege"; then
    echo "  ✅ DELETE-01: Violări detectate (așteptat)"
    ((PASSED_TESTS++))
else
    echo "  ❌ DELETE-01: Nu s-au detectat violări (neasteptat)"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Test 5: ASSET-01
echo "🔍 Test ASSET-01 (assets fără published check)..."
if npx tsx ./cursor/agent.ts --only=ASSET-01 --soft 2>&1 | grep -q "Violări de Lege"; then
    echo "  ✅ ASSET-01: Violări detectate (așteptat)"
    ((PASSED_TESTS++))
else
    echo "  ❌ ASSET-01: Nu s-au detectat violări (neasteptat)"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Test 6: ARCH-01
echo "🔍 Test ARCH-01 (mixaj de branduri)..."
if npx tsx ./cursor/agent.ts --only=ARCH-01 --soft 2>&1 | grep -q "Violări de Lege"; then
    echo "  ✅ ARCH-01: Violări detectate (așteptat)"
    ((PASSED_TESTS++))
else
    echo "  ❌ ARCH-01: Nu s-au detectat violări (neasteptat)"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

echo ""
echo "📊 Rezultate Smoke Tests:"
echo "=========================="
echo "Total teste: $TOTAL_TESTS"
echo "✅ Pasează: $PASSED_TESTS"
echo "❌ Eșuează: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo "🎉 Toate smoke test-urile au trecut!"
    echo "✅ Agentul detectează corect toate tipurile de violări."
    exit 0
else
    echo ""
    echo "⚠️  $FAILED_TESTS test(e) au eșuat!"
    echo "🔍 Verifică configurația agentului."
    exit 1
fi
