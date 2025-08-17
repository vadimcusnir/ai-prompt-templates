# Ghid de Deployment - AI Prompt Templates Platform

## 🚀 Prezentare Generală

Acest ghid oferă instrucțiuni complete pentru deployment-ul platformei AI Prompt Templates, incluzând configurarea mediului, deployment-ul automat și monitorizarea.

## 📋 Cerințe Preliminare

### Software Necesar
- **Node.js** 18.x sau mai nou
- **npm** 8.x sau mai nou
- **Git** 2.x sau mai nou
- **Docker** (opțional, pentru local development)
- **Vercel CLI** (pentru deployment)

### Conturi și Servicii
- **GitHub** - pentru version control
- **Vercel** - pentru hosting și deployment automat
- **Supabase** - pentru database și autentificare
- **Stripe** - pentru plăți (opțional)

## 🔧 Configurarea Mediului

### 1. Clonarea Repository-ului

```bash
git clone https://github.com/your-username/ai-prompt-templates.git
cd ai-prompt-templates
```

### 2. Instalarea Dependențelor

```bash
npm install
```

### 3. Configurarea Variabilelor de Mediu

Creează fișierul `.env.local` în directorul rădăcină:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration (opțional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Analytics Configuration
NEXT_PUBLIC_ANALYTICS_ENDPOINT=/api/analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### 4. Configurarea Database-ului

```bash
# Instalarea Supabase CLI
npm install -g supabase

# Login în Supabase
supabase login

# Inițializarea proiectului
supabase init

# Conectarea la proiectul Supabase
supabase link --project-ref your_project_ref

# Aplicarea migrărilor
npm run db:migrate

# Popularea cu date de test
npm run db:seed
```

## 🚀 Deployment

### Deployment Automat cu GitHub Actions

Platforma este configurată cu CI/CD automat prin GitHub Actions. Pentru a activa deployment-ul automat:

#### 1. Configurarea Secrets în GitHub

În repository-ul GitHub, mergi la **Settings > Secrets and variables > Actions** și adaugă:

```bash
# Vercel Configuration
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID_DEV=your_dev_project_id
VERCEL_PROJECT_ID_PROD=your_prod_project_id

# Supabase Development
SUPABASE_URL_DEV=your_dev_supabase_url
SUPABASE_ANON_KEY_DEV=your_dev_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_supabase_service_role_key

# Supabase Production
SUPABASE_URL_PROD=your_prod_supabase_url
SUPABASE_ANON_KEY_PROD=your_prod_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY_PROD=your_prod_supabase_service_role_key

# Environment URLs
DEV_BASE_URL=https://your-dev-domain.vercel.app
PROD_BASE_URL=https://your-production-domain.com

# Slack Notifications (opțional)
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

#### 2. Configurarea Branch Protection

Configurează branch-ul `main` cu protecții:
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date

#### 3. Workflow-ul CI/CD

Workflow-ul automat execută următoarele etape:

1. **Linting și Type Checking**
2. **Unit și Integration Tests**
3. **E2E Tests**
4. **Security Audit**
5. **Build Application**
6. **Database Migration Check**
7. **Deployment la Development** (branch `develop`)
8. **Deployment la Production** (branch `main`)
9. **Performance Monitoring**
10. **Rollback automat** în caz de eșec

### Deployment Manual

#### Development Environment

```bash
# Build pentru development
npm run build

# Deployment la Vercel
npm run deploy:dev
```

#### Production Environment

```bash
# Build pentru production
npm run build

# Deployment la Vercel
npm run deploy:prod
```

#### Rollback

```bash
# Rollback la versiunea anterioară
npm run rollback
```

## 🧪 Testing

### Rularea Testelor

```bash
# Unit tests
npm test

# Tests cu coverage
npm run test:ci

# Tests în mod watch
npm run test:watch

# E2E tests
npm run test:e2e

# Smoke tests
npm run test:smoke

# Performance tests
npm run test:performance
```

### Configurarea Testelor

Testele sunt configurate cu:
- **Jest** pentru unit și integration tests
- **Playwright** pentru E2E tests
- **Testing Library** pentru component testing
- **Coverage thresholds** de 80%

## 📊 Monitoring și Analytics

### Dashboard de Monitoring

Accesează dashboard-ul de monitoring la `/admin/monitoring` (doar pentru admini).

### Metrici Monitorizate

- **Core Web Vitals** (FCP, LCP, FID, CLS, TTFB)
- **Performance Metrics** (response time, memory usage)
- **User Analytics** (page views, conversions, user behavior)
- **System Health** (uptime, error rates, resource usage)

### Alerting

Sistemul de alerting notifică automat:
- Performance degradation
- High error rates
- System resource issues
- Security incidents

## 🔒 Securitate

### Middleware de Securitate

Platforma include middleware avansat pentru:
- **Rate Limiting** - 100 requests/minute per IP
- **Security Headers** - CSP, HSTS, X-Frame-Options
- **Bot Protection** - detectare și blocare bot-uri
- **SQL Injection Protection** - pattern matching
- **XSS Protection** - sanitizare input-uri

### Autentificare și Autorizare

- **Supabase Auth** pentru autentificare
- **Row Level Security (RLS)** pentru database
- **Role-based Access Control** pentru admin features
- **JWT tokens** cu refresh automat

### Rate Limiting

```typescript
// Configurare rate limiting
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP'
};
```

## 📈 Performance Optimization

### Core Web Vitals Targets

- **FCP**: < 1.8s
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTFB**: < 800ms

### Optimization Techniques

- **Code Splitting** cu Next.js
- **Image Optimization** cu next/image
- **Static Generation** pentru pagini statice
- **CDN** prin Vercel Edge Network
- **Database Query Optimization** cu Supabase

## 🗄️ Database Management

### Migrări

```bash
# Verificarea migrărilor
npm run db:check

# Aplicarea migrărilor
npm run db:migrate

# Reset database
npm run db:reset

# Popularea cu date
npm run db:seed
```

### Backup și Recovery

- **Automated backups** zilnice
- **Point-in-time recovery** disponibil
- **Cross-region replication** pentru disaster recovery

## 🔄 Maintenance

### Updates și Upgrades

```bash
# Update dependencies
npm update

# Security audit
npm audit

# Fix security vulnerabilities
npm audit fix
```

### Monitoring Continuu

- **Uptime monitoring** cu Vercel Analytics
- **Error tracking** cu built-in error boundary
- **Performance monitoring** cu Core Web Vitals
- **User behavior analytics** cu custom tracking

## 🚨 Troubleshooting

### Probleme Comune

#### Build Failures
```bash
# Clean build
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

#### Database Connection Issues
```bash
# Verificare conexiune
npm run db:check

# Reset connection
supabase db reset
```

#### Performance Issues
```bash
# Run performance tests
npm run test:performance

# Check Core Web Vitals
npm run lighthouse
```

### Logs și Debugging

- **Application logs** în Vercel dashboard
- **Database logs** în Supabase dashboard
- **Performance logs** în browser DevTools
- **Error logs** în custom error tracking

## 📚 Resurse Suplimentare

### Documentație
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

### Support
- **GitHub Issues** pentru bug reports
- **Discord Community** pentru suport tehnic
- **Email Support** pentru probleme critice

## 🎯 Următorii Pași

1. **Configurare Environment** - Completează variabilele de mediu
2. **Database Setup** - Aplică migrările și populează cu date
3. **Deployment Test** - Testează deployment-ul pe development
4. **Production Deployment** - Deploy la production după testare
5. **Monitoring Setup** - Configurează alerting și monitoring
6. **Performance Tuning** - Optimizează bazat pe metrici

---

**Notă**: Acest ghid este actualizat regulat. Pentru cea mai recentă versiune, verifică repository-ul GitHub.
