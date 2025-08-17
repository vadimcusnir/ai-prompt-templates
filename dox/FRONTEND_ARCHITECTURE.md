# 🧠 Frontend Architecture - AI-PROMPT-TEMPLATES

## 🌐 Overview

Această documentație definește arhitectura completă a frontend-ului pentru platforma AI-PROMPT-TEMPLATES, cu maparea la entități DB și controlul accesului per rol.

## 🏗️ Structura de Rute

### 📍 Public Root Layer
```
/                           → Home (hero, CTA, top neuroni)
/search                      → Search (FTS: title, summary, tags)
/pricing                     → Abonamente (Free/Architect/Initiate/Elite)
/bundles                     → Listă bundles (preț root-2, CTA)
/bundles/:slug               → Bundle detail + preview neuroni
/library                     → Librărie principală (cu sidebar tree)
/library/:path*              → Nod ierarhic (pag. neuroni)
/n/:slug                     → Neuron Preview (public: v_neuron_public)
/legal/terms                 → Terms of Service
/legal/privacy               → Privacy Policy
/legal/cookies               → Cookie Policy
/404                        → Not found
/403                        → Forbidden
```

### 🔐 Authentication & Onboarding
```
/auth/sign-in                → Email + magic link / password
/auth/sign-up                → Înregistrare cont nou
/auth/magic-link             → Confirmare magic link
/auth/reset                  → Resetare parolă
```

### 🧠 Neuron Full Access (Gated)
```
/n/:slug/read                → Livrare via RPC: content_full + watermark
                              → Verifică: entitlement OR elite OR pool @ plan
                              → Dacă fail → arată motiv + upsell
```

### 💳 Checkout & Monetizare
```
/checkout/neuron/:slug       → Stripe one-off neuron
/checkout/bundle/:slug       → Stripe one-off bundle
/checkout/subscribe/:tier    → Stripe subscribe page pentru Architect/Initiate/Elite
/checkout/success            → Confirmare plată
/checkout/canceled           → Anulare/timeout plată
```

### 👤 User Dashboard
```
/account                     → Overview: plan activ, stats personale, ultimii unlocks
/account/subscription        → Plan curent, schimbare, anulare
/account/purchases           → Lista cumpărături one-off/bundle + receipts
/account/entitlements        → Neuroni deținuți (entitlement materializat)
/account/receipts            → Bonuri achiziții (snapshot version, titlu, preț)
/account/settings            → Profil, parolă, email, delete account
```

### 🧮 Admin / Operator Panel
```
/studio                      → Dashboard general
/studio/neurons              → Listare neuroni + create/edit
/studio/neurons/:id          → Editare neuron (versiuni, publish, preț root-2)
/studio/tree                 → Sidebar builder (drag&drop, poziții)
/studio/bundles              → Listare pachete + compoziție
/studio/bundles/:id          → Editare bundle
/studio/plans                → Definire planuri (10/40/70/100, stripe IDs)
/studio/pool                 → Pool curent per tier (score, evergreen, refresh)
/studio/analytics            → Views, unlocks 14d, top neuroni
/studio/alerts               → Alert log (cap > 9974€, pool mismatch, access leaks)
/studio/receipts             → Audit bonuri (snapshot legal)
/studio/settings             → pricing_rules + settings (cap, root, webhook)
/studio/guard                → Audit privilegii (fuga de content_full RLS)
/studio/users                → Utilizatori, subs, purchases (role=admin only)
```

## 🔐 Controlul Accesului per Rol

### 📊 Matricea de Acces

| Ruta | Public | Authenticated | Admin | Entități DB |
|------|--------|---------------|-------|--------------|
| `/` | ✅ | ✅ | ✅ | `v_neuron_public`, `v_tree_public` |
| `/search` | ✅ | ✅ | ✅ | `rpc_search_neurons()` |
| `/pricing` | ✅ | ✅ | ✅ | `v_plans_public` |
| `/bundles` | ✅ | ✅ | ✅ | `v_bundle_public` |
| `/bundles/:slug` | ✅ | ✅ | ✅ | `v_bundle_public` + `v_neuron_public` |
| `/library` | ✅ | ✅ | ✅ | `v_tree_public` + `v_neuron_public` |
| `/library/:path*` | ✅ | ✅ | ✅ | `v_tree_public` + `v_neuron_public` |
| `/n/:slug` | ✅ | ✅ | ✅ | `v_neuron_public` |
| `/n/:slug/read` | ❌ | ✅ | ✅ | `rpc_get_neuron_full()` |
| `/auth/*` | ✅ | ❌ | ❌ | `auth.users` |
| `/checkout/*` | ❌ | ✅ | ✅ | `rpc_create_checkout_session()` |
| `/account/*` | ❌ | ✅ | ✅ | `rpc_get_my_active_plan()`, `rpc_list_my_entitlements()` |
| `/studio/*` | ❌ | ❌ | ✅ | Toate tabelele prin `f_is_admin()` |

## 🗄️ Maparea la Entități DB

### 📖 Views Publice (Read-Only)
```sql
-- Acces public la neuroni (doar preview)
v_neuron_public → SELECT * FROM neurons WHERE published=true AND deleted_at IS NULL

-- Acces public la structura ierarhică
v_tree_public → SELECT * FROM library_tree WHERE deleted_at IS NULL

-- Acces public la bundle-uri
v_bundle_public → SELECT * FROM bundles WHERE deleted_at IS NULL

-- Acces public la planuri
v_plans_public → SELECT * FROM plans ORDER BY f_plan_rank(code)
```

### 🔒 RPC Functions (Authenticated/Admin)
```sql
-- Căutare în neuroni
rpc_search_neurons(q, limit, offset) → FTS pe v_neuron_public

-- Acces la conținutul complet
rpc_get_neuron_full(neuron_id) → content_full + watermark + analytics

-- Planul activ al user-ului
rpc_get_my_active_plan() → user_subscriptions + plans

-- Entitlements-urile user-ului
rpc_list_my_entitlements() → user_entitlements + neurons

-- Download asset-uri
rpc_get_neuron_asset_download(asset_id) → neuron_assets + verificare acces
```

### 🛡️ Tabele Protejate (RLS + Admin Only)
```sql
-- Neuroni (conținut complet)
neurons → RLS: published=true OR authenticated user OR admin

-- Bundle-uri
bundles → RLS: deleted_at IS NULL OR authenticated user OR admin

-- Planuri
plans → RLS: public read, admin write

-- User data
user_subscriptions → RLS: self-only OR admin
user_purchases → RLS: self-only OR admin
user_entitlements → RLS: self-only OR admin
purchase_receipts → RLS: self-only OR admin
```

## 🎯 Componente Frontend

### 🏠 Public Components
```typescript
// HomePage
interface HomePageProps {
  featuredNeurons: NeuronPreview[];
  heroStats: { totalNeurons: number; totalUsers: number };
}

// SearchPage
interface SearchPageProps {
  query: string;
  results: NeuronPreview[];
  totalCount: number;
}

// PricingPage
interface PricingPageProps {
  plans: Plan[];
  userTier?: UserTier;
}

// LibraryPage
interface LibraryPageProps {
  tree: LibraryTreeNode[];
  neurons: NeuronPreview[];
  currentPath: string[];
}
```

### 🔐 Authenticated Components
```typescript
// NeuronReader
interface NeuronReaderProps {
  neuronId: string;
  userTier: UserTier;
  hasAccess: boolean;
}

// CheckoutForm
interface CheckoutFormProps {
  type: 'neuron' | 'bundle' | 'subscription';
  itemId: string;
  user: User;
}

// UserDashboard
interface UserDashboardProps {
  user: User;
  activePlan: UserSubscription;
  entitlements: UserEntitlement[];
  recentPurchases: UserPurchase[];
}
```

### 🧮 Admin Components
```typescript
// StudioDashboard
interface StudioDashboardProps {
  stats: {
    totalNeurons: number;
    totalUsers: number;
    totalRevenue: number;
    activeSubscriptions: number;
  };
  alerts: SystemAlert[];
  recentJobs: JobAudit[];
}

// NeuronEditor
interface NeuronEditorProps {
  neuronId?: string;
  neuron?: Neuron;
  categories: string[];
  tags: string[];
}

// BundleManager
interface BundleManagerProps {
  bundles: Bundle[];
  neurons: NeuronPreview[];
}
```

## 🚀 Implementarea Rutei

### 📁 Structura de Fișiere
```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    → Home
│   │   ├── search/
│   │   │   └── page.tsx               → Search
│   │   ├── pricing/
│   │   │   └── page.tsx               → Pricing
│   │   ├── bundles/
│   │   │   ├── page.tsx               → Bundles list
│   │   │   └── [slug]/
│   │   │       └── page.tsx           → Bundle detail
│   │   ├── library/
│   │   │   ├── page.tsx               → Library root
│   │   │   └── [...path]/
│   │   │       └── page.tsx           → Library path
│   │   ├── n/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx           → Neuron preview
│   │   │       └── read/
│   │   │           └── page.tsx       → Neuron full content
│   │   └── legal/
│   │       ├── terms/
│   │       │   └── page.tsx           → Terms
│   │       ├── privacy/
│   │       │   └── page.tsx           → Privacy
│   │       └── cookies/
│   │           └── page.tsx           → Cookies
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── page.tsx               → Sign in
│   │   ├── sign-up/
│   │   │   └── page.tsx               → Sign up
│   │   ├── magic-link/
│   │   │   └── page.tsx               → Magic link
│   │   └── reset/
│   │       └── page.tsx               → Password reset
│   ├── (checkout)/
│   │   ├── neuron/
│   │   │   └── [slug]/
│   │   │       └── page.tsx           → Neuron checkout
│   │   ├── bundle/
│   │   │   └── [slug]/
│   │   │       └── page.tsx           → Bundle checkout
│   │   ├── subscribe/
│   │   │   └── [tier]/
│   │   │       └── page.tsx           → Subscription checkout
│   │   ├── success/
│   │   │   └── page.tsx               → Success
│   │   └── canceled/
│   │       └── page.tsx               → Canceled
│   ├── (dashboard)/
│   │   ├── account/
│   │   │   ├── page.tsx               → Account overview
│   │   │   ├── subscription/
│   │   │   │   └── page.tsx           → Subscription management
│   │   │   ├── purchases/
│   │   │   │   └── page.tsx           → Purchase history
│   │   │   ├── entitlements/
│   │   │   │   └── page.tsx           → My content
│   │   │   ├── receipts/
│   │   │   │   └── page.tsx           → Receipts
│   │   │   └── settings/
│   │   │       └── page.tsx           → Account settings
│   │   └── studio/
│   │       ├── page.tsx               → Studio dashboard
│   │       ├── neurons/
│   │       │   ├── page.tsx           → Neurons list
│   │       │   └── [id]/
│   │       │       └── page.tsx       → Neuron editor
│   │       ├── tree/
│   │       │   └── page.tsx           → Tree builder
│   │       ├── bundles/
│   │       │   ├── page.tsx           → Bundles list
│   │       │   └── [id]/
│   │       │       └── page.tsx       → Bundle editor
│   │       ├── plans/
│   │       │   └── page.tsx           → Plans management
│   │       ├── pool/
│   │       │   └── page.tsx           → Pool management
│   │       ├── analytics/
│   │       │   └── page.tsx           → Analytics
│   │       ├── alerts/
│   │       │   └── page.tsx           → Alerts
│   │       ├── receipts/
│   │       │   └── page.tsx           → Receipts audit
│   │       ├── settings/
│   │       │   └── page.tsx           → Studio settings
│   │       ├── guard/
│   │       │   └── page.tsx           → Security audit
│   │       └── users/
│   │           └── page.tsx           → User management
│   ├── globals.css
│   ├── layout.tsx
│   └── providers.tsx
├── components/
│   ├── (public)/
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   ├── SearchBar.tsx
│   │   ├── NeuronCard.tsx
│   │   ├── BundleCard.tsx
│   │   ├── PlanCard.tsx
│   │   └── LibraryTree.tsx
│   ├── (auth)/
│   │   ├── AuthForm.tsx
│   │   ├── MagicLinkForm.tsx
│   │   └── PasswordResetForm.tsx
│   ├── (dashboard)/
│   │   ├── DashboardLayout.tsx
│   │   ├── UserStats.tsx
│   │   ├── EntitlementsList.tsx
│   │   └── PurchaseHistory.tsx
│   ├── (studio)/
│   │   ├── StudioLayout.tsx
│   │   ├── NeuronEditor.tsx
│   │   ├── BundleEditor.tsx
│   │   ├── TreeBuilder.tsx
│   │   └── AnalyticsDashboard.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── ...
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── rpc.ts                       → RPC functions
│   ├── auth.ts
│   ├── stripe.ts
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useNeurons.ts
│   ├── useBundles.ts
│   ├── usePlans.ts
│   └── useStudio.ts
└── types/
    ├── neuron.ts
    ├── bundle.ts
    ├── plan.ts
    ├── user.ts
    └── studio.ts
```

## 🔒 Middleware de Securitate

### 🛡️ Route Protection
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Public routes - no protection needed
  const publicRoutes = ['/', '/search', '/pricing', '/bundles', '/library', '/n', '/legal'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return res;
  }

  // Auth routes - redirect if already authenticated
  if (pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/account', req.url));
  }

  // Protected routes - require authentication
  if (pathname.startsWith('/checkout') || pathname.startsWith('/account')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }
  }

  // Admin routes - require admin role
  if (pathname.startsWith('/studio')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }
    
    // Check admin role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    
    if (userRole?.role !== 'admin') {
      return NextResponse.redirect(new URL('/403', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 🔐 RLS Policies în Frontend
```typescript
// hooks/useNeurons.ts
export function useNeurons() {
  const { user, userTier } = useAuth();
  
  const getNeuronPreview = async (slug: string) => {
    // Public access - uses v_neuron_public
    const { data, error } = await supabase
      .from('v_neuron_public')
      .select('*')
      .eq('slug', slug)
      .single();
    
    return { data, error };
  };

  const getNeuronFull = async (neuronId: string) => {
    if (!user) throw new Error('Authentication required');
    
    // Authenticated access - uses RPC with RLS
    const { data, error } = await supabase.rpc('get_neuron_full', {
      p_neuron_id: neuronId
    });
    
    return { data, error };
  };

  const createNeuron = async (neuronData: CreateNeuronData) => {
    if (!user) throw new Error('Authentication required');
    
    // Authenticated access - RLS will filter by user
    const { data, error } = await supabase
      .from('neurons')
      .insert([neuronData])
      .select()
      .single();
    
    return { data, error };
  };

  return {
    getNeuronPreview,
    getNeuronFull,
    createNeuron
  };
}
```

## 🎨 State Management

### 🔄 Auth Context
```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  userTier: UserTier;
  activePlan: UserSubscription | null;
  entitlements: UserEntitlement[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [activePlan, setActivePlan] = useState<UserSubscription | null>(null);
  const [entitlements, setEntitlements] = useState<UserEntitlement[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user data including tier and entitlements
  const refreshUserData = async () => {
    if (!user) return;
    
    // Get active plan
    const { data: plan } = await supabase.rpc('get_my_active_plan');
    setActivePlan(plan);
    
    // Get entitlements
    const { data: userEntitlements } = await supabase.rpc('list_my_entitlements');
    setEntitlements(userEntitlements || []);
    
    // Determine user tier from plan
    if (plan) {
      setUserTier(plan.plan_tier);
    } else {
      setUserTier('free');
    }
  };

  // ... rest of context implementation
}
```

### 🧠 Neuron State
```typescript
// hooks/useNeurons.ts
export function useNeurons() {
  const [neurons, setNeurons] = useState<NeuronPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchNeurons = async (query: string, limit = 20, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('search_neurons', {
        p_query: query,
        p_limit: limit,
        p_offset: offset
      });
      
      if (error) throw error;
      setNeurons(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getNeuronBySlug = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('v_neuron_public')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neuron not found');
      return null;
    }
  };

  return {
    neurons,
    loading,
    error,
    searchNeurons,
    getNeuronBySlug
  };
}
```

## 🚀 Performance & SEO

### 📊 Static Generation
```typescript
// app/page.tsx
export async function generateStaticParams() {
  // Generate static paths for popular neurons
  const { data: popularNeurons } = await supabase
    .from('v_neuron_public')
    .select('slug')
    .eq('published', true)
    .limit(100);
  
  return popularNeurons?.map(neuron => ({
    slug: neuron.slug,
  })) || [];
}

// app/library/[...path]/page.tsx
export async function generateStaticParams() {
  // Generate static paths for library tree
  const { data: treeNodes } = await supabase
    .from('v_tree_public')
    .select('path')
    .limit(1000);
  
  return treeNodes?.map(node => ({
    path: node.path.split('.').filter(Boolean),
  })) || [];
}
```

### 🔍 SEO Optimization
```typescript
// components/SEOHead.tsx
interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
}

export function SEOHead({
  title,
  description,
  keywords = [],
  image,
  type = 'website',
  publishedTime,
  modifiedTime
}: SEOHeadProps) {
  return (
    <Head>
      <title>{title} | AI Prompt Templates</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      
      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
    </Head>
  );
}
```

## 🧪 Testing Strategy

### 🔍 Unit Tests
```typescript
// __tests__/components/NeuronCard.test.tsx
import { render, screen } from '@testing-library/react';
import { NeuronCard } from '@/components/NeuronCard';

describe('NeuronCard', () => {
  const mockNeuron = {
    id: '1',
    slug: 'test-neuron',
    title: 'Test Neuron',
    summary: 'Test summary',
    required_tier: 'free' as const,
    price_cents: 0,
    category: 'test',
    tags: ['test', 'example']
  };

  it('renders neuron information correctly', () => {
    render(<NeuronCard neuron={mockNeuron} />);
    
    expect(screen.getByText('Test Neuron')).toBeInTheDocument();
    expect(screen.getByText('Test summary')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('shows correct tier badge', () => {
    render(<NeuronCard neuron={mockNeuron} />);
    
    expect(screen.getByText('Free')).toBeInTheDocument();
  });
});
```

### 🚀 Integration Tests
```typescript
// __tests__/integration/search.test.tsx
import { test, expect } from '@playwright/test';

test('search functionality works end-to-end', async ({ page }) => {
  await page.goto('/search');
  
  // Type search query
  await page.fill('[data-testid="search-input"]', 'AI frameworks');
  await page.click('[data-testid="search-button"]');
  
  // Wait for results
  await page.waitForSelector('[data-testid="search-results"]');
  
  // Verify results contain expected content
  const results = await page.locator('[data-testid="neuron-card"]').count();
  expect(results).toBeGreaterThan(0);
  
  // Click on first result
  await page.click('[data-testid="neuron-card"]:first-child');
  
  // Should navigate to neuron page
  await expect(page).toHaveURL(/\/n\/.+/);
});
```

## 📱 Responsive Design

### 🎨 Breakpoints
```css
/* tailwind.config.js */
module.exports = {
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
};

/* Component responsive patterns */
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4 
  gap-4
">
  {/* Responsive grid */}
</div>
```

### 📱 Mobile-First Components
```typescript
// components/MobileNavigation.tsx
export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="lg:hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-gray-600 hover:text-gray-900"
      >
        <MenuIcon className="h-6 w-6" />
      </button>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg">
          {/* Mobile menu items */}
        </div>
      )}
    </div>
  );
}
```

## 🚀 Deployment & CI/CD

### 🔄 Build Process
```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:e2e": "playwright test",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "studio:seed": "supabase db seed"
  }
}
```

### 🚀 Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
    "STRIPE_SECRET_KEY": "@stripe-secret-key",
    "STRIPE_WEBHOOK_SECRET": "@stripe-webhook-secret"
  },
  "functions": {
    "app/api/stripe/webhook/route.ts": {
      "maxDuration": 30
    }
  }
}
```

## 📊 Analytics & Monitoring

### 📈 User Behavior Tracking
```typescript
// lib/analytics.ts
export const trackEvent = (event: string, properties: Record<string, any>) => {
  // Track user interactions
  if (typeof window !== 'undefined') {
    // Client-side tracking
    window.gtag?.('event', event, properties);
  }
  
  // Server-side tracking
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, properties })
  });
};

// Usage examples
trackEvent('neuron_preview', { neuron_id: '123', user_tier: 'free' });
trackEvent('neuron_unlock', { neuron_id: '123', user_tier: 'architect' });
trackEvent('checkout_started', { type: 'neuron', item_id: '123' });
trackEvent('checkout_completed', { type: 'neuron', item_id: '123', amount: 2900 });
```

### 🚨 Error Monitoring
```typescript
// lib/errorBoundary.tsx
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to error tracking service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We've been notified and are working on a fix.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 🎯 Concluzie

Această arhitectură frontend oferă:

✅ **Securitate completă** cu RLS și middleware
✅ **Performanță optimizată** cu static generation și caching
✅ **UX consistent** cu design system și responsive design
✅ **Monitorizare completă** cu analytics și error tracking
✅ **Scalabilitate** cu componentizare și state management
✅ **SEO optimizat** pentru toate paginile publice
✅ **Testing comprehensiv** cu unit și integration tests
✅ **Deployment automatizat** cu CI/CD și monitoring

Platforma este gata pentru implementare și poate fi extinsă ușor cu noi funcționalități în viitor.
