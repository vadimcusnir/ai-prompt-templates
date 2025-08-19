import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { logger, logError } from '@/lib/logger'

// Mock data pentru dezvoltare - va fi înlocuit cu v_plans_public în producție
const MOCK_PLANS = [
  {
    code: 'free',
    name: 'Free',
    percent: 5,
    monthly: 0,
    annual: 0,
    features: [
      'Access to 5% of library',
      'Basic cognitive frameworks',
      'Community support',
      'Limited API calls'
    ]
  },
  {
    code: 'starter',
    name: 'Starter',
    percent: 15,
    monthly: 2900, // €29 - Digital Root 2 (2+9=11, 1+1=2)
    annual: 29000, // €290 - Digital Root 2 (2+9+0=11, 1+1=2)
    features: [
      'Access to 15% of library',
      'Intermediate frameworks',
      'Priority support',
      'Advanced API access',
      'Export capabilities'
    ]
  },
  {
    code: 'professional',
    name: 'Professional',
    percent: 35,
    monthly: 4700, // €47 - Digital Root 2 (4+7=11, 1+1=2)
    annual: 47000, // €470 - Digital Root 2 (4+7+0=11, 1+1=2)
    features: [
      'Access to 35% of library',
      'Expert frameworks',
      'Priority support',
      'Full API access',
      'Advanced analytics',
      'Team collaboration'
    ]
  },
  {
    code: 'elite',
    name: 'Elite',
    percent: 65,
    monthly: 8300, // €83 - Digital Root 2 (8+3=11, 1+1=2)
    annual: 83000, // €830 - Digital Root 2 (8+3+0=11, 1+1=2)
    features: [
      'Access to 65% of library',
      'Architect-level frameworks',
      '24/7 priority support',
      'Unlimited API access',
      'Advanced analytics',
      'Team collaboration',
      'Custom integrations',
      'White-label options'
    ]
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    percent: 100,
    monthly: 29900, // €299 - Digital Root 2 (2+9+9=20, 2+0=2)
    annual: 299000, // €2,990 - Digital Root 2 (2+9+9+0=20, 2+0=2)
    features: [
      'Access to 100% of library',
      'All frameworks including exclusive',
      'Dedicated account manager',
      'Custom framework development',
      'Advanced analytics & reporting',
      'Enterprise SSO',
      'Custom integrations',
      'White-label solutions',
      'Training & workshops'
    ]
  }
]

// Mock data pentru library total - va fi înlocuit cu v_library_total în producție
const MOCK_LIBRARY_TOTAL = {
  total_eur: 0, // În producție va fi citit din DB
  cap_eur: 997400 // €9,974 - Digital Root 2 (9+9+7+4+0+0=29, 2+9=11, 1+1=2)
}

// Rate limiting pentru endpoint-ul de pricing
const rateLimitedHandler = withRateLimit(RATE_LIMIT_CONFIGS.api, (request: NextRequest) => {
  // Extract IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `pricing_get:${ip}`
})(async (request: NextRequest) => {
  const startTime = Date.now()
  
  try {
    // Pentru dezvoltare, folosim mock data
    // În producție, va fi înlocuit cu:
    // const supabase = createServiceClient()
    // const [plansResponse, libraryTotalResponse] = await Promise.all([
    //   supabase.from('v_plans_public').select('code, name, percent, monthly, annual, features').order('percent', { ascending: true }),
    //   supabase.from('v_library_total').select('total_eur, cap_eur').single()
    // ])

    // Simulează o întârziere pentru a imita un API real
    await new Promise(resolve => setTimeout(resolve, 100))

    const duration = Date.now() - startTime
    logger.performance('GET /api/pricing', duration, { 
      plansCount: MOCK_PLANS.length,
      hasLibraryTotal: true
    })

    return NextResponse.json({
      plans: MOCK_PLANS,
      libraryTotal: MOCK_LIBRARY_TOTAL
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logError('Unexpected error in GET /api/pricing', { 
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const GET = rateLimitedHandler
