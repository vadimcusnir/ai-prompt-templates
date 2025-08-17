// Configurare planuri conform backend (10/40/70/100%, digital root=2)
export type PlanTier = 'free' | 'architect' | 'initiate' | 'elite'

export interface PlanConfig {
  name: string
  description: string
  percentAccess: number
  monthlyPrice: number // în cenți
  annualPrice: number  // în cenți
  features: string[]
  stripeMonthlyId: string | null
  stripeAnnualId: string | null
}

export const SUBSCRIPTION_PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    name: 'Free',
    description: 'Essential cognitive frameworks for beginners',
    percentAccess: 10,
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '10% din librăria completă',
      'Acces la framework-uri de bază',
      'Community access',
      'Email support'
    ],
    stripeMonthlyId: null,
    stripeAnnualId: null
  },
  architect: {
    name: 'Arhitect',
    description: 'Advanced frameworks with premium templates',
    percentAccess: 40,
    monthlyPrice: 2900, // €29.00 (2+9=11, 1+1=2)
    annualPrice: 29000, // €290.00 (2+9+0=11, 1+1=2)
    features: [
      '40% din librăria completă',
      '200+ framework-uri avansate',
      'Interactive templates',
      'Priority community access',
      'Video tutorials',
      'Advanced search & filters'
    ],
    stripeMonthlyId: 'price_architect_monthly',
    stripeAnnualId: 'price_architect_annual'
  },
  initiate: {
    name: 'Inițiat',
    description: 'Professional-grade content and priority support',
    percentAccess: 70,
    monthlyPrice: 4700, // €47.00 (4+7=11, 1+1=2)
    annualPrice: 47000, // €470.00 (4+7+0=11, 1+1=2)
    features: [
      '70% din librăria completă',
      '500+ framework-uri profesionale',
      'Custom template builder',
      'VIP community access',
      'Live workshops',
      'Priority support',
      'Framework analytics'
    ],
    stripeMonthlyId: 'price_initiate_monthly',
    stripeAnnualId: 'price_initiate_annual'
  },
  elite: {
    name: 'Elite',
    description: 'Complete access with exclusive frameworks',
    percentAccess: 100,
    monthlyPrice: 7400, // €74.00 (7+4=11, 1+1=2)
    annualPrice: 74000, // €740.00 (7+4+0=11, 1+1=2)
    features: [
      '100% din librăria completă',
      'Framework-uri exclusive Elite',
      'Personal AI Assistant',
      '1-on-1 consultation sessions',
      'Custom framework development',
      'White-label solutions',
      'API access complet'
    ],
    stripeMonthlyId: 'price_elite_monthly',
    stripeAnnualId: 'price_elite_annual'
  }
} as const

// Bundles conform backend (digital root=2)
export interface BundleConfig {
  name: string
  description: string
  price: number // în cenți
  items: number
  features: string[]
  stripeId: string
}

export const BUNDLES: Record<string, BundleConfig> = {
  starter: {
    name: 'Starter Pack',
    description: '5 framework-uri esențiale pentru începători',
    price: 11900, // €119.00 (1+1+9=11, 1+1=2)
    items: 5,
    features: [
      '5 framework-uri selectate',
      'Acces permanent',
      'PDF downloads',
      'Implementation guides'
    ],
    stripeId: 'price_bundle_starter'
  },
  professional: {
    name: 'Professional Pack',
    description: '15 framework-uri pentru dezvoltatori avansați',
    price: 29900, // €299.00 (2+9+9=20, 2+0=2)
    items: 15,
    features: [
      '15 framework-uri profesionale',
      'Acces permanent',
      'Video tutorials',
      'Priority support',
      'Custom templates'
    ],
    stripeId: 'price_bundle_professional'
  },
  enterprise: {
    name: 'Enterprise Pack',
    description: '50 framework-uri pentru echipe și companii',
    price: 74000, // €740.00 (7+4+0=11, 1+1=2)
    items: 50,
    features: [
      '50 framework-uri enterprise',
      'Acces permanent',
      'Team collaboration tools',
      'White-label solutions',
      'Dedicated support',
      'Custom integrations'
    ],
    stripeId: 'price_bundle_enterprise'
  }
} as const

// Helper functions
export function getPlanConfig(tier: PlanTier): PlanConfig {
  return SUBSCRIPTION_PLANS[tier]
}

export function getBundleConfig(bundleKey: string): BundleConfig | undefined {
  return BUNDLES[bundleKey]
}

export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

export function calculateAnnualSavings(monthlyPrice: number): number {
  const annualTotal = monthlyPrice * 12
  const annualPrice = annualTotal * 0.83 // 17% discount
  return Math.round((annualTotal - annualPrice) / 100)
}

export function isPlanAccessible(currentTier: PlanTier | null, targetTier: PlanTier): boolean {
  if (targetTier === 'free') return true
  if (!currentTier) return true
  
  const tierOrder: PlanTier[] = ['free', 'architect', 'initiate', 'elite']
  const currentIndex = tierOrder.indexOf(currentTier)
  const targetIndex = tierOrder.indexOf(targetTier)
  return targetIndex > currentIndex
}

export function isCurrentPlan(currentTier: PlanTier | null, targetTier: PlanTier): boolean {
  return currentTier === targetTier
}
