# 📋 INSTRUCȚIUNI COMPLETE - Arhitectura Dual-Brand AI

## 🎯 Scopul Implementării

Această instrucțiune detaliază implementarea completă a unui sistem dual-brand AI care permite rularea a două platforme separate (`ai-prompt-templates` și `8vultus`) cu cod maxim reutilizat, bază de date multi-tenant și branding complet separat.

---

## 🏗️ ARHITECTURA SISTEMULUI

### Structura de Directoare
```
ai-prompt-templates/
├── packages/
│   ├── shared/                    # Componente și utilități comune (80% din cod)
│   │   ├── components/            # NeuronCard, Navigation, CookieConsent, etc.
│   │   ├── hooks/                # useAuth, useNeurons, useSearch, etc.
│   │   ├── lib/                  # Supabase, Stripe, analytics, etc.
│   │   ├── types/                # Tipuri TypeScript comune
│   │   ├── contexts/             # BrandContext, AuthContext
│   │   ├── styles/               # Teme CSS per brand
│   │   └── utils/                # Funcții utilitare
│   ├── ai-prompt-templates/      # Platforma principală
│   │   ├── src/app/              # Next.js App Router
│   │   ├── src/components/       # Componente specifice platformei
│   │   ├── src/hooks/            # Hook-uri specifice platformei
│   │   ├── public/               # Assets statice
│   │   ├── package.json          # Dependențe platformei
│   │   ├── next.config.js        # Configurația Next.js
│   │   └── vercel.json           # Configurația Vercel
│   └── 8vultus/                  # Platforma secundară
│       ├── src/app/              # Next.js App Router
│       ├── src/components/       # Componente specifice platformei
│       ├── src/hooks/            # Hook-uri specifice platformei
│       ├── public/               # Assets statice
│       ├── package.json          # Dependențe platformei
│       ├── next.config.js        # Configurația Next.js
│       └── vercel.json           # Configurația Vercel
├── shared-database/               # Schema și migrații comune
├── shared-infrastructure/         # Configurări Vercel, Supabase
├── package.json                   # Root package cu workspaces
└── ARCHITECTURE_IMPLEMENTATION.md # Documentația completă
```

---

## 🔧 CONFIGURAREA INIȚIALĂ

### 1. Instalarea Dependențelor
```bash
# În directorul root
npm install

# Instalarea dependențelor pentru toate workspace-urile
npm install --workspaces
```

### 2. Configurarea Environment Variables
Creează fișierele `.env.local` în fiecare platformă:

#### packages/ai-prompt-templates/.env.local
```bash
# Brand Configuration
BRAND_ID=ai-prompt-templates
NEXT_PUBLIC_BRAND_NAME="AI Prompt Templates"
NEXT_PUBLIC_BRAND_DOMAIN=ai-prompt-templates.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY_AI_PROMPT_TEMPLATES=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_AI_PROMPT_TEMPLATES=pk_test_...
STRIPE_WEBHOOK_SECRET_AI_PROMPT_TEMPLATES=whsec_...
```

#### packages/8vultus/.env.local
```bash
# Brand Configuration
BRAND_ID=8vultus
NEXT_PUBLIC_BRAND_NAME="8Vultus"
NEXT_PUBLIC_BRAND_DOMAIN=8vultus.com

# Supabase (același proiect, diferite brand-uri)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY_8VULTUS=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_8VULTUS=pk_test_...
STRIPE_WEBHOOK_SECRET_8VULTUS=whsec_...
```

---

## 🗄️ CONFIGURAREA DATABASE

### 1. Supabase Setup
```bash
# Instalarea Supabase CLI
npm install -g supabase

# Login în Supabase
supabase login

# Inițializarea proiectului
supabase init

# Conectarea la proiectul existent
supabase link --project-ref your_project_ref
```

### 2. Deploy Schema
```bash
# Deploy schema-ul multi-tenant
supabase db push

# Verificarea status-ului
supabase db diff

# Reset database (doar pentru development)
supabase db reset
```

### 3. Seed Data
```bash
# Inserarea brand-urilor inițiale
supabase db seed

# Verificarea datelor
supabase db dump --data-only
```

---

## 🚀 RULAREA SISTEMULUI

### Development Mode
```bash
# Terminal 1 - AI Prompt Templates
npm run dev:ai
# Rulează pe http://localhost:3000

# Terminal 2 - 8Vultus
npm run dev:8vultus
# Rulează pe http://localhost:3001

# Sau rulează ambele simultan
npm run dev:ai & npm run dev:8vultus
```

### Production Build
```bash
# Build pentru toate platformele
npm run build:all

# Build individual
npm run build:ai
npm run build:8vultus

# Start production
npm run start --workspace=ai-prompt-templates
npm run start --workspace=8vultus
```

---

## 🧪 TESTAREA SISTEMULUI

### Unit Tests
```bash
# Teste pentru toate platformele
npm run test:all

# Teste individuale
npm run test:ai
npm run test:8vultus

# Teste cu coverage
npm run test:ai -- --coverage
npm run test:8vultus -- --coverage
```

### Integration Tests
```bash
# Teste de integrare
npm run test:integration --workspace=ai-prompt-templates
npm run test:integration --workspace=8vultus
```

### E2E Tests
```bash
# Teste end-to-end
npm run test:e2e --workspace=ai-prompt-templates
npm run test:e2e --workspace=8vultus
```

---

## 🌐 DEPLOYMENT PE VERCEL

### 1. Configurarea Proiectelor
```bash
# Pentru fiecare platformă, în directorul său
vercel --prod
```

### 2. Configurarea Domain-urilor
- `ai-prompt-templates.vercel.app` → `ai-prompt-templates.com`
- `8vultus.vercel.app` → `8vultus.com`

### 3. Environment Variables pe Vercel
```bash
# Pentru ai-prompt-templates
vercel env add BRAND_ID ai-prompt-templates
vercel env add NEXT_PUBLIC_BRAND_NAME "AI Prompt Templates"
vercel env add NEXT_PUBLIC_BRAND_DOMAIN ai-prompt-templates.com

# Pentru 8vultus
vercel env add BRAND_ID 8vultus
vercel env add NEXT_PUBLIC_BRAND_NAME "8Vultus"
vercel env add NEXT_PUBLIC_BRAND_DOMAIN 8vultus.com
```

---

## 💳 CONFIGURAREA STRIPE

### 1. Conturi Stripe Separate
- **AI Prompt Templates**: Cont principal cu prețurile €29, €47, €74
- **8Vultus**: Cont secundar cu prețurile €39, €69, €99

### 2. Webhook Endpoints
```typescript
// packages/ai-prompt-templates/src/app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  
  const event = await handleBrandedWebhook(
    'ai-prompt-templates',
    body,
    signature
  );
  
  return NextResponse.json({ received: true });
}
```

```typescript
// packages/8vultus/src/app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  
  const event = await handleBrandedWebhook(
    '8vultus',
    body,
    signature
  );
  
  return NextResponse.json({ received: true });
}
```

---

## 🎨 PERSONALIZAREA BRAND-URILOR

### 1. Teme CSS
```css
/* packages/shared/styles/brand-themes.css */
:root[data-brand="ai-prompt-templates"] {
  --color-primary: #3B82F6;    /* Albastru */
  --color-secondary: #1E40AF;
  --color-accent: #60A5FA;
}

:root[data-brand="8vultus"] {
  --color-primary: #8B5CF6;    /* Violet */
  --color-secondary: #7C3AED;
  --color-accent: #A78BFA;
}
```

### 2. Animații Brand-Specific
```css
/* AI Prompt Templates */
.ai-prompt-glow {
  animation: ai-prompt-glow 2s ease-in-out infinite;
}

/* 8Vultus */
.eightvultus-pulse {
  animation: eightvultus-pulse 3s ease-in-out infinite;
}
```

### 3. Configurații per Brand
```typescript
// packages/shared/lib/brand-configs.ts
export const AI_PROMPT_TEMPLATES_CONFIG: BrandConfig = {
  id: 'ai-prompt-templates',
  name: 'AI Prompt Templates',
  domain: 'ai-prompt-templates.com',
  theme: { primary: '#3B82F6', ... },
  features: ['cognitive_frameworks', 'meaning_engineering'],
  targetAudience: 'AI researchers, cognitive architects'
};

export const EIGHT_VULTUS_CONFIG: BrandConfig = {
  id: '8vultus',
  name: '8Vultus',
  domain: '8vultus.com',
  theme: { primary: '#8B5CF6', ... },
  features: ['consciousness_mapping', 'advanced_systems'],
  targetAudience: 'Consciousness researchers, system architects'
};
```

---

## 🔐 SECURITATE ȘI MULTI-TENANCY

### 1. Row Level Security (RLS)
```sql
-- Fiecare brand poate accesa doar propriile date
CREATE POLICY "Users can only access their brand's prompts" ON prompts
  FOR ALL USING (brand_id = current_setting('app.brand_id')::UUID);

CREATE POLICY "Users can only access their brand's bundles" ON bundles
  FOR ALL USING (brand_id = current_setting('app.brand_id')::UUID);
```

### 2. Brand Context Setting
```typescript
// În fiecare request, se setează contextul brand-ului
await supabase.rpc('set_brand_context', { 
  brand_id: currentBrand.id 
});
```

### 3. User Isolation
```typescript
// Fiecare user este asociat cu un brand specific
const { data, error } = await supabase
  .from('users')
  .insert({
    id: user.id,
    brand_id: currentBrand.id,
    email: user.email,
    tier: 'free'
  });
```

---

## 📊 MONITORING ȘI ANALYTICS

### 1. Brand-Specific Tracking
```typescript
export const trackEvent = (event: string, properties: any, brandId: string) => {
  analytics.track(event, {
    ...properties,
    brand_id: brandId,
    platform: 'web',
    timestamp: new Date().toISOString()
  });
};
```

### 2. Performance Monitoring
```typescript
export const usePerformanceMonitor = () => {
  const { currentBrand } = useBrand();
  
  const trackPerformance = (metric: string, value: number) => {
    analytics.track('performance_metric', {
      metric,
      value,
      brand_id: currentBrand.id,
      url: window.location.href
    });
  };
  
  return { trackPerformance };
};
```

---

## 🔄 WORKFLOW DE DEVELOPMENT

### 1. Modificări în Codul Shared
```bash
# Modificări în packages/shared/ se reflectă automat la ambele brand-uri
cd packages/shared/components
# Editează NeuronCard.tsx
# Modificarea se reflectă la ambele platforme
```

### 2. Modificări Brand-Specific
```bash
# Pentru ai-prompt-templates
cd packages/ai-prompt-templates/src/app
# Editează page.tsx

# Pentru 8vultus
cd packages/8vultus/src/app
# Editează page.tsx
```

### 3. Testing Strategy
```bash
# Teste comune
npm run test:all

# Teste specifice per brand
npm run test:ai -- --testNamePattern="AI Prompt Templates"
npm run test:8vultus -- --testNamePattern="8Vultus"
```

---

## 🚨 TROUBLESHOOTING

### 1. Probleme cu Workspaces
```bash
# Verifică configurația workspaces
npm ls --workspaces

# Reinstalează dependențele
rm -rf node_modules package-lock.json
npm install
```

### 2. Probleme cu Brand Context
```bash
# Verifică că BrandProvider este înfășurat corect
# Verifică că useBrand() este folosit în componente
# Verifică că brand_id este setat corect în database
```

### 3. Probleme cu RLS
```sql
-- Verifică că brand context este setat
SELECT current_setting('app.brand_id');

-- Verifică că user-ul are brand_id corect
SELECT * FROM users WHERE id = 'user_uuid';
```

### 4. Probleme cu Stripe
```bash
# Verifică environment variables
echo $STRIPE_SECRET_KEY_AI_PROMPT_TEMPLATES
echo $STRIPE_SECRET_KEY_8VULTUS

# Verifică webhook endpoints
curl -X POST https://your-domain.com/api/stripe/webhook
```

---

## 📈 SCALABILITATE ȘI EXTENSIBILITATE

### 1. Adăugarea unui Brand Nou
```typescript
// 1. Adaugă în types/brand.ts
export const BRAND_IDS = {
  AI_PROMPT_TEMPLATES: 'ai-prompt-templates',
  EIGHT_VULTUS: '8vultus',
  NEW_BRAND: 'new-brand'  // ← Adaugă aici
};

// 2. Creează configurația în lib/brand-configs.ts
export const NEW_BRAND_CONFIG: BrandConfig = {
  id: 'new-brand',
  name: 'New Brand',
  domain: 'new-brand.com',
  theme: { primary: '#FF6B6B', ... },
  features: ['feature1', 'feature2']
};

// 3. Adaugă în BRAND_CONFIGS
export const BRAND_CONFIGS: Record<string, BrandConfig> = {
  [BRAND_IDS.AI_PROMPT_TEMPLATES]: AI_PROMPT_TEMPLATES_CONFIG,
  [BRAND_IDS.EIGHT_VULTUS]: EIGHT_VULTUS_CONFIG,
  [BRAND_IDS.NEW_BRAND]: NEW_BRAND_CONFIG  // ← Adaugă aici
};
```

### 2. Crearea Platformei Noi
```bash
# 1. Creează directorul
mkdir -p packages/new-brand

# 2. Copiază structura de bază
cp -r packages/8vultus/* packages/new-brand/

# 3. Modifică configurațiile
# 4. Adaugă în package.json root
# 5. Creează proiectul Vercel
```

---

## 📚 RESURSE ȘI REFERINȚE

### Documentație Oficială
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Multi-Tenancy](https://supabase.com/docs/guides/auth/row-level-security)
- [Stripe Multi-Account](https://stripe.com/docs/connect)
- [Vercel Deployment](https://vercel.com/docs)

### Best Practices
- [React Context Best Practices](https://react.dev/learn/passing-data-deeply-with-context)
- [TypeScript Workspaces](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

### Community Resources
- [Next.js Discord](https://discord.gg/nextjs)
- [Supabase Discord](https://discord.supabase.com)
- [Stripe Community](https://community.stripe.com)

---

## 🎉 CONCLUZIE

Această instrucțiune oferă o ghidare completă pentru implementarea și utilizarea arhitecturii dual-brand AI. Sistemul este gata pentru producție și poate fi ușor extins cu noi brand-uri sau funcționalități.

### Chei pentru Succes:
1. **Urmează structura de directoare** exact cum este definită
2. **Configurează environment variables** corect pentru fiecare brand
3. **Testează RLS policies** înainte de deployment
4. **Monitorizează performance** per brand
5. **Menteține codul shared** curat și documentat

### Suport:
Pentru întrebări sau probleme, consultă:
- Documentația în `ARCHITECTURE_IMPLEMENTATION.md`
- Logs-urile de build și runtime
- Community-urile tehnologiilor folosite

**Sistemul este gata pentru producție! 🚀**
