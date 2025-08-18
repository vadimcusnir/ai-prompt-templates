# CI/CD Workflows

Acest director conține workflow-urile GitHub Actions pentru CI/CD pipeline-ul optimizat.

## Workflow-uri Disponibile

### 1. **cache.yml** - Cache & Optimization
- **Scop**: Optimizează cache-ul pentru dependențe, build și teste
- **Trigger**: Push/PR pe main/develop
- **Jobs**:
  - Cache Dependencies
  - Cache Build
  - Cache Test Results
  - Cache Optimization
  - Cache Notification
  - Cache Report
  - Cache Summary

### 2. **security.yml** - Security & Compliance
- **Scop**: Scanează pentru vulnerabilități de securitate și verifică compliance-ul
- **Trigger**: Push/PR pe main/develop + zilnic la 2:00 UTC
- **Jobs**:
  - Security Scan
  - Dependency Vulnerability Check
  - Code Security Analysis
  - Compliance Check
  - Security Notification
  - Security Report
  - Security Optimization
  - Compliance Summary

### 3. **performance.yml** - Performance & Monitoring
- **Scop**: Testează performanța și rulează Lighthouse CI
- **Trigger**: Push/PR pe main/develop + la fiecare 6 ore
- **Jobs**:
  - Performance Test
  - Lighthouse CI
  - Bundle Analysis
  - Performance Monitoring
  - Performance Notification
  - Performance Optimization
  - Performance Report
  - Performance Summary

### 4. **database.yml** - Database & Migrations
- **Scop**: Verifică schema database-ului și testează migrațiile
- **Trigger**: Push/PR pe main/develop (doar când se modifică fișiere SQL) + zilnic la 1:00 UTC
- **Jobs**:
  - Database Schema Check
  - Database Migration Test
  - Database Performance Check
  - Database Backup
  - Database Health Check
  - Database Notification
  - Database Report
  - Database Optimization
  - Database Summary

### 5. **release.yml** - Release Management
- **Scop**: Gestionează release-urile software
- **Trigger**: Release published + manual dispatch
- **Jobs**:
  - Pre-Release Check
  - Create Release
  - Deploy to Staging
  - Deploy to Production
  - Post-Release
  - Release Report
  - Release Notification
  - Release Summary

### 6. **cleanup.yml** - Cleanup & Maintenance
- **Scop**: Curăță artefactele vechi și efectuează mentenanța
- **Trigger**: Săptămânal duminică la 3:00 UTC + manual dispatch
- **Jobs**:
  - Cleanup Old Artifacts
  - Cleanup Stale Branches
  - Dependency Cleanup
  - Cache Cleanup
  - Log Cleanup
  - Maintenance Report
  - Maintenance Notification
  - Maintenance Optimization
  - Maintenance Summary

### 7. **testing.yml** - Testing & Validation
- **Scop**: Rulează toate tipurile de teste
- **Trigger**: Push/PR pe main/develop
- **Jobs**:
  - Unit Tests (matrix: Node 18/20, Ubuntu/Windows)
  - Integration Tests
  - E2E Tests (Playwright)
  - Performance Tests
  - Smoke Tests
  - Accessibility Tests
  - Test Report
  - Test Notification
  - Test Optimization
  - Test Summary

### 8. **build-deploy.yml** - Build & Deploy
- **Scop**: Construiește și deployează aplicația
- **Trigger**: Push pe main/develop + după ce Testing & Validation se termină cu succes
- **Jobs**:
  - Build Application
  - Deploy to Development
  - Deploy to Production
  - Rollback Deployment
  - Deployment Report
  - Deployment Notification
  - Deployment Optimization
  - Deployment Summary

### 9. **monitoring.yml** - Monitoring & Alerting
- **Scop**: Monitorizează sănătatea aplicației și trimite alerte
- **Trigger**: La fiecare 6 ore + manual dispatch
- **Jobs**:
  - Health Check
  - Performance Monitoring
  - Error Monitoring
  - Alerting
  - Monitoring Report
  - Monitoring Notification
  - Monitoring Optimization
  - Monitoring Summary

### 10. **backup.yml** - Backup & Disaster Recovery
- **Scop**: Creează backup-uri și testează disaster recovery
- **Trigger**: Zilnic la 4:00 UTC + manual dispatch
- **Jobs**:
  - Database Backup
  - File Backup
  - Configuration Backup
  - Disaster Recovery Test
  - Backup Verification
  - Backup Notification
  - Backup Report
  - Backup Optimization
  - Backup Summary

### 11. **dependencies.yml** - Dependency Management
- **Scop**: Gestionează dependențele și verifică actualizările
- **Trigger**: Zilnic la 5:00 UTC + manual dispatch
- **Jobs**:
  - Dependency Check
  - Dependency Update
  - Dependency Audit
  - Dependency Optimization
  - Dependency Notification
  - Dependency Summary

## Configurare

### Secrets Necesare

```bash
# Vercel
VERCEL_TOKEN
VERCEL_PROJECT_ID_DEV
VERCEL_PROJECT_ID_PROD
VERCEL_ORG_ID

# Supabase
SUPABASE_URL_DEV
SUPABASE_ANON_KEY_DEV
SUPABASE_SERVICE_ROLE_KEY_DEV
SUPABASE_URL_PROD
SUPABASE_ANON_KEY_PROD
SUPABASE_SERVICE_ROLE_KEY_PROD

# URLs
DEV_BASE_URL
PROD_BASE_URL

# Notificări
SLACK_WEBHOOK_URL

# Securitate
SNYK_TOKEN
```

### Scripts NPM Necesare

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "test": "jest",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:performance": "lighthouse --output=json --output-path=./performance-report/lighthouse.json",
    "lighthouse": "lighthouse --output=json --output-path=./lighthouse-report/lighthouse.json",
    "db:check": "node scripts/check-schema.js",
    "deploy:dev": "vercel --prod --yes",
    "deploy:prod": "vercel --prod --yes",
    "rollback": "vercel rollback",
    "clean": "rm -rf .next out coverage .nyc_output",
    "deps:check": "npx depcheck",
    "deps:update": "npx npm-check-updates -u",
    "security:audit": "npm audit --audit-level=moderate",
    "security:fix": "npm audit fix"
  }
}
```

### Dependențe Necesare

```json
{
  "devDependencies": {
    "depcheck": "^1.4.7",
    "npm-check-updates": "^16.14.19",
    "lighthouse": "^11.6.0"
  }
}
```

## Flux de Lucru

1. **Push/PR** → declanșează Testing & Validation
2. **Testing & Validation** → declanșează Build & Deploy
3. **Build & Deploy** → deployează pe staging/production
4. **Monitoring** → rulează continuu pentru sănătatea aplicației
5. **Backup** → rulează zilnic pentru siguranța datelor
6. **Cleanup** → rulează săptămânal pentru mentenanța sistemului

## Beneficii

- **Modularitate**: Fiecare workflow are un scop specific
- **Paralelizare**: Job-urile pot rula în paralel când este posibil
- **Cache**: Optimizat pentru viteza de execuție
- **Securitate**: Scanează continuu pentru vulnerabilități
- **Monitoring**: Urmărește performanța și sănătatea aplicației
- **Backup**: Asigură siguranța datelor
- **Notificări**: Informează echipa despre status-ul pipeline-ului

## Troubleshooting

### Workflow-ul nu rulează
- Verifică dacă branch-ul este corect (main/develop)
- Verifică dacă fișierele modificate declanșează workflow-ul

### Job-ul eșuează
- Verifică log-urile pentru detalii despre eroare
- Verifică dacă toate dependențele sunt instalate
- Verifică dacă toate secrets-urile sunt configurate

### Cache-ul nu funcționează
- Verifică dacă cheia de cache este corectă
- Verifică dacă path-urile de cache sunt corecte
- Verifică dacă restore-keys sunt configurate corect
