// Plan configuration according to backend (10/40/70/100%, digital root=2)
export type PlanTier = 'free' | 'explorer' | 'architect' | 'initiate' | 'master' | 'elite'

// Types for new functionalities
export interface TrialConfig {
  enabled: boolean
  days: number
  features: string[]
  noCreditCard: boolean
}

export interface MoneyBackGuarantee {
  enabled: boolean
  days: number
  conditions: string[]
}

export interface SupportLevel {
  email: boolean
  chat: boolean
  phone: boolean
  responseTime: string
  priority: 'standard' | 'priority' | 'dedicated'
}

export interface SLAInfo {
  uptime: string
  responseTime: string
  supportResponse: string
  compensation: string
}

export interface UsageExample {
  title: string
  description: string
  screenshot: string
  plan: PlanTier
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface CustomerTestimonial {
  id: string
  name: string
  company: string
  role: string
  rating: number
  comment: string
  avatar: string
  plan: PlanTier
  verified: boolean
}

export interface EnterpriseContact {
  enabled: boolean
  minPrice: number
  features: string[]
  contactForm: boolean
  customPricing: boolean
}

export interface PlanConfig {
  name: string
  description: string
  percentAccess: number
  monthlyPrice: number // în cenți
  annualPrice: number  // în cenți
  features: string[]
  stripeMonthlyId: string | null
  stripeAnnualId: string | null
  trial: TrialConfig
  support: SupportLevel
  sla: SLAInfo
  usageExamples: UsageExample[]
}

export const SUBSCRIPTION_PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    name: 'Free',
    description: 'Essential cognitive frameworks for beginners',
    percentAccess: 10,
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '10% of complete library',
      'Access to basic frameworks',
      'Community access',
      'Email support'
    ],
    stripeMonthlyId: null,
    stripeAnnualId: null,
    trial: {
      enabled: false,
      days: 0,
      features: [],
      noCreditCard: false
    },
    support: {
      email: true,
      chat: false,
      phone: false,
      responseTime: '24 hours',
      priority: 'standard'
    },
    sla: {
      uptime: '99.5%',
      responseTime: '24 hours',
      supportResponse: 'Business hours',
      compensation: 'N/A'
    },
    usageExamples: [
      {
        title: 'Basic Prompt Engineering',
        description: 'Create simple prompts for common AI tasks',
        screenshot: '/examples/free-basic-prompt.jpg',
        plan: 'free',
        difficulty: 'beginner'
      }
    ],
  },
  explorer: {
    name: 'Explorer',
    description: 'Basic cognitive frameworks for beginners',
    percentAccess: 20,
    monthlyPrice: 2900, // €29.00 (2+9=11, 1+1=2)
    annualPrice: 29000, // €290.00 (2+9+0=11, 1+1=2)
    features: [
      '20% of complete library',
      '100+ basic frameworks',
      'Interactive templates',
      'Community access',
      'Basic tutorials',
      'Search & filters'
    ],
    stripeMonthlyId: 'price_explorer_monthly',
    stripeAnnualId: 'price_explorer_annual',
    trial: {
      enabled: true,
      days: 7,
      features: ['Full access to Explorer features', 'No credit card required'],
      noCreditCard: true
    },
    support: {
      email: true,
      chat: true,
      phone: false,
      responseTime: '12 hours',
      priority: 'standard'
    },
    sla: {
      uptime: '99.7%',
      responseTime: '12 hours',
      supportResponse: 'Business hours + weekends',
      compensation: 'Up to 5% of monthly fee'
    },
    usageExamples: [
      {
        title: 'Interactive Template Builder',
        description: 'Build custom prompts with drag-and-drop interface',
        screenshot: '/examples/explorer-template-builder.jpg',
        plan: 'explorer',
        difficulty: 'beginner'
      },
      {
        title: 'Advanced Search & Filters',
        description: 'Find the perfect framework with intelligent search',
        screenshot: '/examples/explorer-search.jpg',
        plan: 'explorer',
        difficulty: 'intermediate'
      }
    ],
  },
  architect: {
    name: 'Architect',
    description: 'Advanced frameworks with premium templates',
    percentAccess: 40,
    monthlyPrice: 2900, // €29.00 (2+9=11, 1+1=2)
    annualPrice: 29000, // €290.00 (2+9+0=11, 1+0=2)
    features: [
      '40% of complete library',
      '200+ advanced frameworks',
      'Interactive templates',
      'Priority community access',
      'Video tutorials',
      'Advanced search & filters'
    ],
    stripeMonthlyId: 'price_architect_monthly',
    stripeAnnualId: 'price_architect_annual',
    trial: {
      enabled: true,
      days: 14,
      features: ['Full access to Architect features', 'Premium templates included'],
      noCreditCard: false
    },
    support: {
      email: true,
      chat: true,
      phone: false,
      responseTime: '8 hours',
      priority: 'priority'
    },
    sla: {
      uptime: '99.8%',
      responseTime: '8 hours',
      supportResponse: '24/7',
      compensation: 'Up to 15% of monthly fee'
    },
    usageExamples: [
      {
        title: 'Premium Template Library',
        description: 'Access to 200+ advanced cognitive frameworks',
        screenshot: '/examples/architect-premium-templates.jpg',
        plan: 'architect',
        difficulty: 'intermediate'
      },
      {
        title: 'Video Tutorials',
        description: 'Learn advanced techniques with expert guidance',
        screenshot: '/examples/architect-video-tutorials.jpg',
        plan: 'architect',
        difficulty: 'intermediate'
      }
    ],
  },
  initiate: {
    name: 'Initiate',
    description: 'Professional-grade content and priority support',
    percentAccess: 70,
    monthlyPrice: 4700, // €47.00 (4+7=11, 1+1=2)
    annualPrice: 47000, // €470.00 (4+7+0=11, 1+1=2)
    features: [
      '70% of complete library',
      '500+ professional frameworks',
      'Custom template builder',
      'VIP community access',
      'Live workshops',
      'Priority support',
      'Framework analytics'
    ],
    stripeMonthlyId: 'price_initiate_monthly',
    stripeAnnualId: 'price_initiate_annual',
    trial: {
      enabled: true,
      days: 21,
      features: ['Full access to Initiate features', 'Custom template builder', 'Live workshops'],
      noCreditCard: false
    },
    support: {
      email: true,
      chat: true,
      phone: true,
      responseTime: '4 hours',
      priority: 'priority'
    },
    sla: {
      uptime: '99.9%',
      responseTime: '4 hours',
      supportResponse: '24/7',
      compensation: 'Up to 20% of monthly fee'
    },
    usageExamples: [
      {
        title: 'Custom Template Builder',
        description: 'Create your own cognitive frameworks from scratch',
        screenshot: '/examples/initiate-custom-builder.jpg',
        plan: 'initiate',
        difficulty: 'advanced'
      },
      {
        title: 'Live Workshops',
        description: 'Interactive sessions with AI experts',
        screenshot: '/examples/initiate-workshops.jpg',
        plan: 'initiate',
        difficulty: 'advanced'
      }
    ],
  },
  master: {
    name: 'Master',
    description: 'Advanced professional frameworks and exclusive content',
    percentAccess: 90,
    monthlyPrice: 7400, // €74.00 (7+4=11, 1+1=2)
    annualPrice: 74000, // €740.00 (7+4+0=11, 1+1=2)
    features: [
      '90% of complete library',
      '800+ master frameworks',
      'Advanced template builder',
      'VIP community access',
      'Live workshops',
      'Priority support',
      'Framework analytics',
      'Custom integrations'
    ],
    stripeMonthlyId: 'price_master_monthly',
    stripeAnnualId: 'price_master_annual',
    trial: {
      enabled: true,
      days: 30,
      features: ['Full access to Master features', 'Advanced template builder', 'Custom integrations'],
      noCreditCard: false
    },
    support: {
      email: true,
      chat: true,
      phone: true,
      responseTime: '2 hours',
      priority: 'dedicated'
    },
    sla: {
      uptime: '99.95%',
      responseTime: '2 hours',
      supportResponse: '24/7',
      compensation: 'Up to 25% of monthly fee'
    },
    usageExamples: [
      {
        title: 'Advanced Template Builder',
        description: 'Professional-grade framework creation tools',
        screenshot: '/examples/master-advanced-builder.jpg',
        plan: 'master',
        difficulty: 'advanced'
      },
      {
        title: 'Custom Integrations',
        description: 'Connect with your existing tools and workflows',
        screenshot: '/examples/master-integrations.jpg',
        plan: 'master',
        difficulty: 'advanced'
      }
    ],
  },
  elite: {
    name: 'Elite',
    description: 'Complete access with exclusive frameworks',
    percentAccess: 100,
    monthlyPrice: 7400, // €74.00 (7+4=11, 1+1=2)
    annualPrice: 74000, // €740.00 (7+4+0=11, 1+1=2)
    features: [
      '100% of complete library',
      'Exclusive Elite frameworks',
      'Personal AI Assistant',
      '1-on-1 consultation sessions',
      'Custom framework development',
      'White-label solutions',
      'Complete API access'
    ],
    stripeMonthlyId: 'price_elite_monthly',
    stripeAnnualId: 'price_elite_annual',
    trial: {
      enabled: true,
      days: 30,
      features: ['Full access to Elite features', 'Personal AI Assistant', '1-on-1 consultation'],
      noCreditCard: false
    },
    support: {
      email: true,
      chat: true,
      phone: true,
      responseTime: '1 hour',
      priority: 'dedicated'
    },
    sla: {
      uptime: '99.99%',
      responseTime: '1 hour',
      supportResponse: '24/7',
      compensation: 'Up to 50% of monthly fee'
    },
    usageExamples: [
      {
        title: 'Personal AI Assistant',
        description: 'Your dedicated AI expert for cognitive frameworks',
        screenshot: '/examples/elite-ai-assistant.jpg',
        plan: 'elite',
        difficulty: 'advanced'
      },
      {
        title: '1-on-1 Consultation',
        description: 'Direct access to AI framework specialists',
        screenshot: '/examples/elite-consultation.jpg',
        plan: 'elite',
        difficulty: 'advanced'
      }
    ],
  }
} as const

// Bundles according to backend (digital root=2)
export interface BundleConfig {
  name: string
  description: string
  price: number // in cents
  items: number
  features: string[]
  stripeId: string
}

export const BUNDLES: Record<string, BundleConfig> = {
  starter: {
    name: 'Starter Pack',
    description: '5 essential frameworks for beginners',
    price: 11900, // €119.00 (1+1+9=11, 1+1=2)
    items: 5,
    features: [
      '5 selected frameworks',
      'Permanent access',
      'PDF downloads',
      'Implementation guides'
    ],
    stripeId: 'price_bundle_starter'
  },
  professional: {
    name: 'Professional Pack',
    description: '15 frameworks for advanced developers',
    price: 29900, // €299.00 (2+9+9=20, 2+0=2)
    items: 15,
    features: [
      '15 professional frameworks',
      'Permanent access',
      'Video tutorials',
      'Priority support',
      'Custom templates'
    ],
    stripeId: 'price_bundle_professional'
  },
  enterprise: {
    name: 'Enterprise Pack',
    description: '50 frameworks for teams and companies',
    price: 74000, // €740.00 (7+4+0=11, 1+1=2)
    items: 50,
    features: [
      '50 enterprise frameworks',
      'Permanent access',
      'Team collaboration tools',
      'White-label solutions',
      'Dedicated support',
      'Custom integrations'
    ],
    stripeId: 'price_bundle_enterprise'
  }
} as const

// Configurations for new functionalities
export const MONEY_BACK_GUARANTEE: MoneyBackGuarantee = {
  enabled: true,
  days: 30,
  conditions: [
    'Satisfaction guarantee for all paid plans',
    'Full refund within 30 days',
    'No questions asked policy',
    'Keep any downloaded content'
  ]
}

export const ENTERPRISE_CONTACT: EnterpriseContact = {
  enabled: true,
  minPrice: 100000, // €1000/lună
  features: [
    'Custom pricing based on usage',
    'Dedicated account manager',
    'White-label solutions',
    'Custom integrations',
    'SLA guarantees',
    'On-premise deployment options',
    'Training and certification programs'
  ],
  contactForm: true,
  customPricing: true
}

export const CUSTOMER_TESTIMONIALS: CustomerTestimonial[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    company: 'TechCorp Solutions',
    role: 'AI Research Lead',
    rating: 5,
    comment: 'AI-Prompt-Templates has completely transformed how we develop cognitive frameworks. The quality and diversity of content is exceptional.',
    avatar: '/testimonials/sarah-johnson.jpg',
    plan: 'elite',
    verified: true
  },
  {
    id: '2',
    name: 'Michael Chen',
    company: 'Innovation Labs',
    role: 'Senior Developer',
    rating: 5,
    comment: 'The Architect plan gives me exactly what I need for my projects. The templates are professional and easy to implement.',
    avatar: '/testimonials/michael-chen.jpg',
    plan: 'architect',
    verified: true
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    company: 'AI Solutions',
    role: 'Product Manager',
    rating: 5,
    comment: 'The support and video tutorials from the Initiate plan are invaluable. The team responds quickly and provides personalized solutions.',
    avatar: '/testimonials/emily-rodriguez.jpg',
    plan: 'initiate',
    verified: true
  },
  {
    id: '4',
    name: 'David Thompson',
    company: 'StartupHub',
    role: 'Founder',
    rating: 5,
    comment: 'For a startup, the Explorer plan is perfect. It allows us to test concepts without investing too much initially.',
    avatar: '/testimonials/david-thompson.jpg',
    plan: 'explorer',
    verified: true
  }
]

export const INTEGRATION_DETAILS = {
  apis: [
    {
      name: 'REST API',
      description: 'Full access to all frameworks via REST endpoints',
      documentation: '/api/docs',
      rateLimit: '1000 requests/hour',
      authentication: 'Bearer token'
    },
    {
      name: 'GraphQL API',
      description: 'Flexible data querying for complex integrations',
      documentation: '/graphql/docs',
      rateLimit: '500 requests/hour',
      authentication: 'Bearer token'
    },
    {
      name: 'Webhook Support',
      description: 'Real-time notifications for content updates',
      documentation: '/webhooks/docs',
      rateLimit: 'Unlimited',
      authentication: 'Signature verification'
    }
  ],
  sdks: [
    {
      name: 'JavaScript/TypeScript',
      description: 'Official SDK for Node.js and browser environments',
      npm: '@ai-prompt-templates/sdk',
      github: 'github.com/ai-prompt-templates/js-sdk'
    },
    {
      name: 'Python',
      description: 'Python SDK with async support',
      pip: 'ai-prompt-templates',
      github: 'github.com/ai-prompt-templates/python-sdk'
    },
    {
      name: 'React Components',
      description: 'Ready-to-use React components',
      npm: '@ai-prompt-templates/react',
      github: 'github.com/ai-prompt-templates/react-components'
    }
  ],
  platforms: [
    {
      name: 'Zapier',
      description: 'Connect with 5000+ apps automatically',
      status: 'Available',
      setup: '5 minutes'
    },
    {
      name: 'Make (Integromat)',
      description: 'Visual workflow automation',
      status: 'Available',
      setup: '10 minutes'
    },
    {
      name: 'n8n',
      description: 'Open-source workflow automation',
      status: 'Available',
      setup: '15 minutes'
    }
  ]
}

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
  
  const tierOrder: PlanTier[] = ['free', 'explorer', 'architect', 'initiate', 'master', 'elite']
  const currentIndex = tierOrder.indexOf(currentTier)
  const targetIndex = tierOrder.indexOf(targetTier)
  return targetIndex > currentIndex
}

export function isCurrentPlan(currentTier: PlanTier | null, targetTier: PlanTier): boolean {
  return currentTier === targetTier
}

// New functions for added functionalities
export function getTrialInfo(tier: PlanTier): TrialConfig | null {
  const plan = SUBSCRIPTION_PLANS[tier]
  if (!plan || !plan.trial) return null
  return plan.trial.enabled ? plan.trial : null
}

export function getSupportInfo(tier: PlanTier): SupportLevel | null {
  const plan = SUBSCRIPTION_PLANS[tier]
  if (!plan || !plan.support) return null
  return plan.support
}

export function getSLAInfo(tier: PlanTier): SLAInfo | null {
  const plan = SUBSCRIPTION_PLANS[tier]
  if (!plan || !plan.sla) return null
  return plan.sla
}

export function getUsageExamples(tier: PlanTier): UsageExample[] {
  const plan = SUBSCRIPTION_PLANS[tier]
  if (!plan || !plan.usageExamples) return []
  return plan.usageExamples
}

export function getTestimonialsForPlan(plan: PlanTier): CustomerTestimonial[] {
  return CUSTOMER_TESTIMONIALS.filter(t => t.plan === plan)
}

export function getIntegrationDetails() {
  return INTEGRATION_DETAILS
}
