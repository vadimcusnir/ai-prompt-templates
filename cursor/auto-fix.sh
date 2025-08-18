#!/bin/bash

# Cursor Law Guard - Auto-fix Script
# Script pentru corectarea automată a patterns tipice

set -e

echo "🔧 Cursor Law Guard - Auto-fix Script"
echo "======================================"

# Verifică dacă există violări
echo "📋 Verificare violări curente..."
VIOLATIONS=$(npx tsx ./cursor/agent.ts --soft 2>&1 | grep -c "Violări de Lege" || echo "0")

if [ "$VIOLATIONS" -eq 0 ]; then
    echo "✅ Nu există violări de corectat."
    exit 0
fi

echo "⚠️  Găsite $VIOLATIONS tipuri de violări."

# Auto-fix pentru patterns tipice
echo ""
echo "🔧 Aplicare auto-fixes..."

# 1. Fix pentru SELECT pe tabele brute (înlocuiește cu views)
echo "📊 Fix SELECT pe tabele brute..."

# Găsește fișierele cu SELECT pe tabele brute
FILES_WITH_RAW_SELECT=$(npx tsx ./cursor/agent.ts --only=DB-01 --soft 2>&1 | grep "DB-01" | awk '{print $2}' | sed 's/.*\///' | sort -u)

for file in $FILES_WITH_RAW_SELECT; do
    if [ -f "$file" ]; then
        echo "  📝 Procesez $file..."
        
        # Backup
        cp "$file" "$file.backup"
        
        # Înlocuiește patterns tipice
        sed -i.bak \
            -e 's/public\.bundles/v_bundle_public/g' \
            -e 's/public\.plans/v_plans_public/g' \
            -e 's/public\.neurons/rpc_search_neurons()/g' \
            -e 's/public\.user_subscriptions/rpc_list_my_entitlements()/g' \
            "$file"
        
        echo "    ✅ $file procesat"
    fi
done

# 2. Fix pentru cron fără wrapper
echo "⏰ Fix cron fără wrapper..."
CRON_FILES=$(npx tsx ./cursor/agent.ts --only=CRON-01 --soft 2>&1 | grep "CRON-01" | awk '{print $2}' | sed 's/.*\///' | sort -u)

for file in $CRON_FILES; do
    if [ -f "$file" ]; then
        echo "  📝 Procesez $file..."
        
        # Backup
        cp "$file" "$file.backup"
        
        # Înlocuiește funcții directe cu wrapper-ele
        sed -i.bak \
            -e 's/refresh_tier_access_pool_all/f_cron_run_refresh_tier_access_pool_all/g' \
            -e 's/check_library_cap_and_alert/f_cron_run_check_library_cap/g' \
            -e 's/check_preview_privileges_and_alert/f_cron_run_preview_privileges_audit/g' \
            -e 's/check_bundle_consistency_and_alert/f_cron_run_bundle_consistency_audit/g' \
            "$file"
        
        echo "    ✅ $file procesat"
    fi
done

# 3. Fix pentru DELETE pe neurons
echo "🗑️  Fix DELETE pe neurons..."
DELETE_FILES=$(npx tsx ./cursor/agent.ts --only=DELETE-01 --soft 2>&1 | grep "DELETE-01" | awk '{print $2}' | sed 's/.*\///' | sort -u)

for file in $DELETE_FILES; do
    if [ -f "$file" ]; then
        echo "  📝 Procesez $file..."
        
        # Backup
        cp "$file" "$file.backup"
        
        # Înlocuiește DELETE cu UPDATE published=false
        sed -i.bak \
            -e 's/DELETE FROM public\.neurons/UPDATE public.neurons SET published = false/g' \
            -e 's/DELETE public\.neurons/UPDATE public.neurons SET published = false/g' \
            "$file"
        
        echo "    ✅ $file procesat"
    fi
done

echo ""
echo "🔍 Verificare finală..."

# Verifică dacă mai există violări
REMAINING_VIOLATIONS=$(npx tsx ./cursor/agent.ts --soft 2>&1 | grep -c "Violări de Lege" || echo "0")

if [ "$REMAINING_VIOLATIONS" -eq 0 ]; then
    echo "🎉 Toate violările au fost corectate automat!"
else
    echo "⚠️  Rămân $REMAINING_VIOLATIONS tipuri de violări care necesită intervenție manuală."
    echo "📋 Rulare: npx tsx ./cursor/agent.ts --soft"
fi

echo ""
echo "📁 Backup-urile au fost salvate cu extensia .backup"
echo "🔄 Pentru a reveni: mv file.backup file"
echo ""
echo "✨ Auto-fix complet!"
