#!/usr/bin/env node

/**
 * Script simplu pentru testarea conexiunii la Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurare Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabile de mediu Supabase lipsesc!');
  process.exit(1);
}

console.log('🔗 Testare conexiune Supabase...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('\n📋 Testare conexiune de bază...');
    
    // Test 1: Verifică dacă poți accesa plans (dacă există)
    console.log('1️⃣ Încerc să accesez tabelul plans...');
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .limit(1);
    
    if (plansError) {
      console.log('❌ Plans table error:', plansError.message);
    } else {
      console.log('✅ Plans table accessible, count:', plans?.length || 0);
    }
    
    // Test 2: Verifică dacă poți accesa neurons (dacă există)
    console.log('2️⃣ Încerc să accesez tabelul neurons...');
    const { data: neurons, error: neuronsError } = await supabase
      .from('neurons')
      .select('*')
      .limit(1);
    
    if (neuronsError) {
      console.log('❌ Neurons table error:', neuronsError.message);
    } else {
      console.log('✅ Neurons table accessible, count:', neurons?.length || 0);
    }
    
    // Test 3: Verifică dacă poți accesa user_subscriptions (dacă există)
    console.log('3️⃣ Încerc să accesez tabelul user_subscriptions...');
    const { data: subscriptions, error: subsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(1);
    
    if (subsError) {
      console.log('❌ User subscriptions table error:', subsError.message);
    } else {
      console.log('✅ User subscriptions table accessible, count:', subscriptions?.length || 0);
    }
    
    // Test 4: Verifică dacă poți accesa bundles (dacă există)
    console.log('4️⃣ Încerc să accesez tabelul bundles...');
    const { data: bundles, error: bundlesError } = await supabase
      .from('bundles')
      .select('*')
      .limit(1);
    
    if (bundlesError) {
      console.log('❌ Bundles table error:', bundlesError.message);
    } else {
      console.log('✅ Bundles table accessible, count:', bundles?.length || 0);
    }
    
    // Test 5: Verifică dacă poți accesa library_tree (dacă există)
    console.log('5️⃣ Încerc să accesez tabelul library_tree...');
    const { data: tree, error: treeError } = await supabase
      .from('library_tree')
      .select('*')
      .limit(1);
    
    if (treeError) {
      console.log('❌ Library tree table error:', treeError.message);
    } else {
      console.log('✅ Library tree table accessible, count:', tree?.length || 0);
    }
    
    console.log('\n📊 REZUMAT CONEXIUNE:');
    console.log('=' .repeat(40));
    
    const tables = [
      { name: 'plans', error: plansError, data: plans },
      { name: 'neurons', error: neuronsError, data: neurons },
      { name: 'user_subscriptions', error: subsError, data: subscriptions },
      { name: 'bundles', error: bundlesError, data: bundles },
      { name: 'library_tree', error: treeError, data: tree }
    ];
    
    let accessibleTables = 0;
    let totalTables = tables.length;
    
    tables.forEach(table => {
      if (table.error) {
        console.log(`❌ ${table.name}: ${table.error.message}`);
      } else {
        console.log(`✅ ${table.name}: accessible (${table.data?.length || 0} rows)`);
        accessibleTables++;
      }
    });
    
    console.log('\n' + '=' .repeat(40));
    console.log(`📋 Tabele accesibile: ${accessibleTables}/${totalTables}`);
    
    if (accessibleTables === 0) {
      console.log('\n⚠️ Schema nu a fost încă deployată!');
      console.log('📖 Urmărește instrucțiunile din INSTRUCTIONS-DEPLOY-SCHEMA.md');
    } else if (accessibleTables === totalTables) {
      console.log('\n🎉 Schema completă este accesibilă!');
    } else {
      console.log('\n⚠️ Doar o parte din schema este accesibilă.');
    }
    
  } catch (error) {
    console.error('❌ Eroare generală în testarea conexiunii:', error.message);
  }
}

// Rulare
if (require.main === module) {
  testConnection().catch(console.error);
}

module.exports = { testConnection };
