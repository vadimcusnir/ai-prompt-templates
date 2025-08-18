// Client-side Stripe configuration (no secret keys)
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY,
} as const;

// Tier pricing mapping based on digital root 2 algorithm
export const TIER_PRICES = {
  explorer: 2900, // €29.00 in cents - digital root 2 (2+9=11, 1+1=2)
  architect: 11000, // €110.00 in cents - digital root 2 (1+1+0=2)  
  initiate: 20000, // €200.00 in cents - digital root 2 (2+0+0=2)
  master: 29900, // €299.00 in cents - digital root 2 (2+9+9=20, 2+0=2)
} as const;

export const TIER_NAMES = {
  explorer: 'Explorer',
  architect: 'Architect', 
  initiate: 'Initiate',
  master: 'Master',
} as const;

export const TIER_DESCRIPTIONS = {
  explorer: 'Essential cognitive frameworks for beginners',
  architect: 'Advanced frameworks with premium templates',
  initiate: 'Professional-grade content and priority support',
  master: 'Complete access with exclusive frameworks and 1-on-1 consultations',
} as const;

export const TIER_FEATURES = {
  explorer: [
    '50+ Basic Cognitive Frameworks',
    'PDF Downloads',
    'Community Access',
    'Email Support'
  ],
  architect: [
    '200+ Advanced Frameworks',
    'Interactive Templates',
    'Priority Community Access',
    'Video Tutorials',
    'Advanced Search & Filters'
  ],
  initiate: [
    '500+ Professional Frameworks',
    'Custom Template Builder',
    'VIP Community Access',
    'Live Workshops',
    'Priority Support',
    'Framework Analytics'
  ],
  master: [
    'Unlimited Framework Access',
    'Exclusive Master-Level Content',
    'Personal AI Assistant Integration',
    '1-on-1 Consultation Sessions',
    'Custom Framework Development',
    'White-label Solutions',
    'API Access'
  ],
} as const;

export type UserTier = keyof typeof TIER_PRICES;

export function getTierPrice(tier: UserTier): number {
  return TIER_PRICES[tier];
}

export function getTierName(tier: UserTier): string {
  return TIER_NAMES[tier];
}

export function getTierDescription(tier: UserTier): string {
  return TIER_DESCRIPTIONS[tier];
}

export function getTierFeatures(tier: UserTier): readonly string[] {
  return TIER_FEATURES[tier];
}

export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export function isTierAccessible(userTier: UserTier, requiredTier: UserTier): boolean {
  const tierOrder: UserTier[] = ['explorer', 'architect', 'initiate', 'master'];
  const userTierIndex = tierOrder.indexOf(userTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  
  return userTierIndex >= requiredTierIndex;
}