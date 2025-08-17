import { NextRequest, NextResponse } from 'next/server'
import { stripe, TIER_PRICES, getTierName, getTierDescription } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { validateAndSanitize, StripeCheckoutSchema } from '@/lib/validation'
import { logger, logSecurity, logError } from '@/lib/logger'

// Validare strictă a variabilelor de mediu
function validateEnvironmentVariables() {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  // Validare format URL
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
    new URL(process.env.NEXT_PUBLIC_SITE_URL!)
  } catch {
    throw new Error('Invalid URL format in environment variables')
  }

  // Validare format service role key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY!.startsWith('eyJ')) {
    throw new Error('Invalid SUPABASE_SERVICE_ROLE_KEY format')
  }
}

// Client Supabase securizat
function createSecureSupabaseClient() {
  if (process.env.NODE_ENV === 'production') {
    validateEnvironmentVariables()
  } else if (process.env.NODE_ENV === 'development') {
    try {
      validateEnvironmentVariables()
    } catch (error) {
      logger.warn('Environment validation failed in development', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  )
}

// Rate limiting strict pentru Stripe (10 requests per minute)
const rateLimitedHandler = withRateLimit(async (request: NextRequest) => {
  const startTime = Date.now()
  
  try {
    // Verificare Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      logSecurity('Invalid content type in Stripe request', { contentType })
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    const requestData = await request.json()
    
    // Validare strictă a datelor
    const validation = validateAndSanitize(StripeCheckoutSchema, requestData)
    
    if (!validation.success) {
      logSecurity('Invalid Stripe checkout data', { 
        errors: validation.errors,
        dataKeys: Object.keys(requestData)
      })
      
      return NextResponse.json(
        { error: 'Invalid checkout data', details: validation.errors },
        { status: 400 }
      )
    }
    
    const { tier, userId } = validation.data
    
    // Validare suplimentară pentru tier
    if (!TIER_PRICES[tier as keyof typeof TIER_PRICES]) {
      logSecurity('Invalid tier in Stripe request', { tier, userId })
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      )
    }

    const supabase = createSecureSupabaseClient()

    // Get user details from Supabase
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)
    
    if (userError || !user) {
      logSecurity('User not found in Stripe request', { userId, error: userError?.message })
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Logging de securitate pentru încercări de checkout
    logSecurity('Stripe checkout attempt', { 
      userId,
      tier,
      email: user.user.email?.substring(0, 3) + '***@' + user.user.email?.split('@')[1],
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `AI-Prompt-Templates ${getTierName(tier)} Tier`,
              description: getTierDescription(tier),
              images: ['https://ai-prompt-templates.com/logo.png'],
            },
            unit_amount: TIER_PRICES[tier as keyof typeof TIER_PRICES],
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true&tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      customer_email: user.user.email,
      metadata: {
        userId,
        tier,
        type: 'tier_upgrade',
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
      },
    })

    const duration = Date.now() - startTime
    logger.performance('POST /api/stripe/create-checkout-session', duration, { 
      sessionId: session.id,
      tier,
      userId
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logError('Stripe checkout session creation error', { 
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}, RATE_LIMIT_CONFIGS.stripe)

export const POST = rateLimitedHandler