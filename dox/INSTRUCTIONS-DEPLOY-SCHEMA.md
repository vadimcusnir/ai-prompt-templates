# 🚀 INSTRUCȚIUNI DEPLOY SCHEMA - Supabase Dashboard

## 📋 **PAȘII OBLIGATORII PENTRU DEPLOY**

### **1. ACCESEAZĂ SUPABASE DASHBOARD**
1. Mergi la [supabase.com](https://supabase.com)
2. Autentifică-te în contul tău
3. Selectează proiectul `ai-prompt-templates`
4. Accesează **SQL Editor** din meniul din stânga

### **2. COPIAZĂ ȘI RULEAZĂ SCRIPTUL**
1. În SQL Editor, creează un **nou query**
2. Copiază **TOATĂ** conținutul din `sql/deploy-schema-manual.sql`
3. **Rulează query-ul** (Ctrl+Enter sau butonul "Run")

### **3. VERIFICĂ REZULTATUL**
După rulare, ar trebui să vezi:
```
NOTICE:  Schema DDL completed successfully!
NOTICE:  Features:
NOTICE:  - Digital root 2 validation for all prices
NOTICE:  - RLS enabled on all tables
NOTICE:  - Comprehensive indexing for performance
NOTICE:  - User tier logic implemented
NOTICE:  - Stripe pricing integration ready
```

## ⚠️ **IMPORTANT: Scriptul trebuie rulat MANUAL în Supabase Dashboard**

**NU** poate fi rulat prin Node.js din cauza limitărilor de securitate.

## 🔧 **DUPĂ DEPLOY - VERIFICĂ SCHEMA**

### **Verifică Tabelele Create**
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Rezultat așteptat:**
- user_subscriptions
- plans
- neurons
- library_tree
- bundles
- library_tree_neurons
- bundle_neurons

### **Verifică Funcțiile Create**
```sql
SELECT proname 
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;
```

**Rezultat așteptat:**
- f_digital_root
- f_plan_percent_access
- f_plan_rank
- f_get_current_user_tier
- f_can_access_neuron

### **Verifică Planurile Create**
```sql
SELECT * FROM public.plans ORDER BY f_plan_rank(code);
```

**Rezultat așteptat:**
- Free (0€)
- Architect (29€/299€)
- Initiate (74€/749€)
- Elite (299€/2999€)

## 🧪 **DUPĂ VERIFICARE - RULEAZĂ TESTELE**

### **1. Testează Schema**
```bash
make test-schema
```

### **2. Generează Date de Test**
```bash
make generate-data
```

### **3. Testează Performanța**
```bash
make performance-test
```

## 🚨 **TROUBLESHOOTING**

### **Eroare: "extension already exists"**
- **Normal** - extensiile sunt create cu `IF NOT EXISTS`

### **Eroare: "type already exists"**
- **Normal** - tipul `plan_tier` este creat cu verificare

### **Eroare: "table already exists"**
- **Normal** - tabelele sunt create cu `IF NOT EXISTS`

### **Eroare: "function already exists"**
- **Normal** - funcțiile sunt create cu `CREATE OR REPLACE`

## 📊 **CE SE CREEAZĂ**

### **Tabele Principale**
- ✅ `user_subscriptions` - Abonamentele utilizatorilor
- ✅ `plans` - Planurile de preț cu digital root 2
- ✅ `neurons` - Unitățile de conținut
- ✅ `library_tree` - Structura ierarhică
- ✅ `bundles` - Pachete de neuroni
- ✅ `library_tree_neurons` - Relații tree-neuroni
- ✅ `bundle_neurons` - Relații bundle-neuroni

### **Funcții Utilitare**
- ✅ `f_digital_root()` - Calculează digital root
- ✅ `f_plan_percent_access()` - Procentul de acces al planului
- ✅ `f_plan_rank()` - Rank-ul planului pentru ordonare
- ✅ `f_get_current_user_tier()` - Tier-ul curent al user-ului
- ✅ `f_can_access_neuron()` - Verifică accesul la neuron

### **Indexuri de Performanță**
- ✅ Indexuri compuse pentru căutări frecvente
- ✅ Indexuri case-insensitive pentru slug și title
- ✅ Indexuri pentru filtrarea pe tier și status

### **Securitate**
- ✅ RLS activat pe toate tabelele
- ✅ Policies pentru acces public la conținut
- ✅ Policies pentru acces privat la subscription-uri

## 🎯 **URMĂTORII PAȘI**

1. **Rulează scriptul SQL** în Supabase Dashboard
2. **Verifică deploy-ul** cu comenzile de mai sus
3. **Rulează testele** pentru validarea schemei
4. **Generează date de test** pentru testarea performanței
5. **Monitorizează performanța** cu date reale

---

## 📞 **AJUTOR**

Dacă întâmpini probleme:
1. Verifică că ai acces la proiectul Supabase
2. Verifică că ai permisiuni de admin
3. Verifică logurile de eroare din Supabase
4. Rulează scriptul pas cu pas dacă e necesar

**Schema este gata pentru producție după deploy-ul cu succes!** 🎉
