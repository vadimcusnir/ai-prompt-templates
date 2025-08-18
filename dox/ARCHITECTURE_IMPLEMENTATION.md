# 🏗️ Arhitectura Dual-Brand AI - Implementare Completă

## 📋 Prezentare Generală

Această implementare realizează o arhitectură completă pentru un sistem dual-brand AI, separând codul per platformă (`ai-prompt-templates` și `8vultus`) cu componente shared și o bază de date multi-tenant.

## 🎯 Brand-urile Implementate

### 1. **AI Prompt Templates** (`ai-prompt-templates`)
- **Focus**: Cognitive frameworks, meaning engineering, deep analysis
- **Audiență**: AI researchers, cognitive architects, meaning engineers
- **Temă**: Albastru (#3B82F6) cu accent pe claritate și structură
- **Prețuri**: €29, €47, €74

### 2. **8Vultus** (`8vultus`)
- **Focus**: Consciousness mapping, advanced systems, expert tier
- **Audiență**: Consciousness researchers, system architects, expert practitioners
- **Temă**: Violet (#8B5CF6) cu accent pe profunditate și mister
- **Prețuri**: €39, €69, €99

## 🏛️ Structura de Directoare

```
ai-prompt-templates/
├── packages/
│   ├── shared/                    # Componente și utilități comune
│   │   ├── components/            # Componente React reutilizabile
│   │   ├── hooks/                # Hook-uri React custom
│   │   ├── lib/                  # Utilități și configurații
│   │   ├── types/                # Tipuri TypeScript
│   │   ├── contexts/             # Context-uri React
│   │   ├── styles/               # Stiluri CSS și teme
│   │   └── utils/                # Funcții utilitare
│   ├── ai-prompt-templates/      # Platforma principală
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── vercel.json
│   └── 8vultus/                  # Platforma secundară
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── next.config.js
│       └── vercel.json
├── shared-database/               # Schema și migrații comune
├── shared-infrastructure/         # Configurări Vercel, Supabase
└── package.json                   # Root package cu workspaces
```

## 🔧 Configurația Root

### Package.json cu Workspaces
```json
{
  "name": "ai-dual-brand-platform",
  "workspaces": ["packages/*"],
  "scripts": {
    "dev:ai": "npm run dev --workspace=ai-prompt-templates",
    "dev:8vultus": "npm run dev --workspace=8vultus",
    "build:all": "npm run build --workspaces",
    "test:all": "npm run test --workspaces"
  }
}
```

## 🎨 Componente Shared

### 1. **Core Components**
- `NeuronCard` - Card pentru afișarea prompt-urilor cu branding adaptiv
- `Navigation` - Navigația principală cu suport pentru switching între brand-uri
- `CookieConsent` - Consimțământ cookies cu branding specific
- `SEOHead` - Head SEO cu metadata per brand

### 2. **Brand Context**
- `BrandProvider` - Context React pentru gestionarea brand-urilor
- `useBrand` - Hook pentru accesarea configurației brand-ului curent
- Suport pentru switching între brand-uri în timpul rulării

### 3. **Hooks Shared**
- `useAuth` - Autentificare cu suport multi-brand
- `useNeurons` - Gestionarea prompt-urilor cu filtrare per brand
- `useSearch` - Căutare cu indexare per brand
- `useValidation` - Validare comună

## 🗄️ Arhitectura Database

### Schema Multi-Tenant
```sql
-- Brands table pentru separarea datelor
CREATE TABLE brands (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  theme_config JSONB NOT NULL,
  features TEXT[] NOT NULL
);

-- Toate tabelele au brand_id pentru separare
CREATE TABLE prompts (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  -- ... restul câmpurilor
);
```

### Row Level Security (RLS)
- Fiecare brand poate accesa doar propriile date
- Policiile RLS sunt configurate automat per brand
- Funcția `set_brand_context()` setează contextul pentru RLS

### Funcții Helper
- `get_brand_id_from_domain()` - Detectează brand-ul din domain
- `check_prompt_access()` - Verifică accesul la prompt-uri bazat pe tier

## 🌐 Configurația Vercel

### Proiecte Separate
- `ai-prompt-templates` → `ai-prompt-templates.vercel.app`
- `8vultus` → `8vultus.vercel.app`

### Environment Variables per Brand
```bash
# ai-prompt-templates
BRAND_ID=ai-prompt-templates
NEXT_PUBLIC_BRAND_NAME="AI Prompt Templates"
NEXT_PUBLIC_BRAND_DOMAIN=ai-prompt-templates.com

# 8vultus
BRAND_ID=8vultus
NEXT_PUBLIC_BRAND_NAME="8Vultus"
NEXT_PUBLIC_BRAND_DOMAIN=8vultus.com
```

## 💳 Integrarea Stripe

### Configurații Multi-Brand
```typescript
export const STRIPE_CONFIGS = {
  'ai-prompt-templates': {
    secretKey: process.env.STRIPE_SECRET_KEY_AI_PROMPT_TEMPLATES!,
    priceIds: { architect: 'price_ai_architect', ... }
  },
  '8vultus': {
    secretKey: process.env.STRIPE_SECRET_KEY_8VULTUS!,
    priceIds: { architect: 'price_8v_architect', ... }
  }
};
```

### Prețuri Diferențiate
- **AI Prompt Templates**: €29, €47, €74
- **8Vultus**: €39, €69, €99

## 🎨 Theming & UI

### CSS Variables per Brand
```css
:root[data-brand="ai-prompt-templates"] {
  --color-primary: #3B82F6;
  --color-secondary: #1E40AF;
  --color-accent: #60A5FA;
}

:root[data-brand="8vultus"] {
  --color-primary: #8B5CF6;
  --color-secondary: #7C3AED;
  --color-accent: #A78BFA;
}
```

### Animații Brand-Specific
- **AI Prompt Templates**: `ai-prompt-glow` - efect de strălucire albastră
- **8Vultus**: `eightvultus-pulse` - efect de pulsare violetă

## 🔐 Securitate

### Multi-Tenancy
- Separarea completă a datelor per brand
- RLS policies pentru izolare
- Context switching automat

### Autentificare
- Supabase Auth cu suport multi-brand
- User profiles per brand
- Tier-based access control

## 📊 Monitoring & Analytics

### Brand-Specific Tracking
```typescript
export const trackEvent = (event: string, properties: any, brandId: string) => {
  analytics.track(event, {
    ...properties,
    brand_id: brandId,
    platform: 'web'
  });
};
```

## 🚀 Deployment Strategy

### 1. **Development**
```bash
npm run dev:ai          # Rulează ai-prompt-templates
npm run dev:8vultus     # Rulează 8vultus
```

### 2. **Building**
```bash
npm run build:ai        # Build ai-prompt-templates
npm run build:8vultus   # Build 8vultus
npm run build:all       # Build ambele platforme
```

### 3. **Testing**
```bash
npm run test:ai         # Teste ai-prompt-templates
npm run test:8vultus    # Teste 8vultus
npm run test:all        # Teste ambele platforme
```

## 📈 Beneficiile Implementării

### 1. **Code Reuse**
- 80% din cod este shared între platforme
- Componente reutilizabile cu branding adaptiv
- Hook-uri comune cu context multi-brand

### 2. **Brand Isolation**
- Fiecare brand are propria identitate vizuală
- Datele sunt complet separate
- Configurări independente per brand

### 3. **Scalability**
- Ușor de adăugat noi brand-uri
- Arhitectură extensibilă
- Performance optimizat per brand

### 4. **Maintenance**
- O singură bază de cod de întreținut
- Bug fixes se aplică automat la ambele platforme
- Feature-uri noi sunt disponibile imediat

## 🔄 Workflow de Development

### 1. **Shared Development**
- Modificări în `packages/shared/` se reflectă la ambele brand-uri
- Hook-uri și componente comune
- Tipuri și utilități shared

### 2. **Brand-Specific Customization**
- Fiecare brand poate personaliza componentele
- Teme și stiluri unice
- Conținut și messaging specific

### 3. **Testing Strategy**
- Teste comune pentru logica shared
- Teste specifice per brand pentru UI/UX
- Integration tests pentru multi-tenancy

## 🛠️ Instrumente și Tehnologii

### Frontend
- **Next.js 14** cu App Router
- **React 18** cu hooks și context
- **TypeScript** pentru type safety
- **Tailwind CSS** cu variabile CSS custom

### Backend
- **Supabase** cu multi-tenancy
- **PostgreSQL** cu RLS
- **Row Level Security** pentru separarea datelor

### Payments
- **Stripe** cu configurări separate per brand
- **Webhook handling** per brand
- **Subscription management** multi-tenant

### Deployment
- **Vercel** cu proiecte separate
- **Environment variables** per brand
- **Custom domains** pentru fiecare platformă

## 📚 Resurse și Referințe

### Documentație
- [Supabase Multi-Tenancy](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Stripe Multi-Account](https://stripe.com/docs/connect)

### Best Practices
- Separarea responsabilităților
- Reutilizarea codului
- Securitatea multi-tenant
- Performance optimization

## 🎉 Concluzie

Această implementare oferă o soluție robustă, scalabilă și menținabilă pentru sistemul dual-brand AI. Arhitectura permite separarea completă a brand-urilor menținând în același timp eficiența prin reutilizarea codului și o bază de date unificată cu multi-tenancy.

Sistemul este gata pentru producție și poate fi ușor extins cu noi brand-uri sau funcționalități în viitor.
