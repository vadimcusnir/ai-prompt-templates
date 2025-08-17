import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { logger, logSecurity, logError } from '@/lib/logger'

// Validare strictă a variabilelor de mediu
function validateEnvironmentVariables() {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  // Validare format URL Supabase
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format')
  }

  // Validare format service role key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY!.startsWith('eyJ')) {
    throw new Error('Invalid SUPABASE_SERVICE_ROLE_KEY format')
  }

  // Validare webhook secret
  if (!process.env.STRIPE_WEBHOOK_SECRET!.startsWith('whsec_')) {
    throw new Error('Invalid STRIPE_WEBHOOK_SECRET format')
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

// Rate limiting strict pentru webhook-uri (10 requests per minute)
const rateLimitedHandler = withRateLimit(async (request: NextRequest) => {
  const startTime = Date.now()
  
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      logSecurity('Missing Stripe signature or webhook secret', { 
        hasSignature: !!signature,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
      })
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      logSecurity('Webhook signature verification failed', { 
        error: err instanceof Error ? err.message : 'Unknown error'
      })
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Logging de securitate pentru webhook-uri
    logSecurity('Stripe webhook received', { 
      eventType: event.type,
      eventId: event.id,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
    })

    const supabase = createSecureSupabaseClient()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        
        if (session.payment_status === 'paid') {
          const { userId, tier } = session.metadata || {}
          
          if (!userId || !tier) {
            logSecurity('Missing metadata in webhook', { 
              sessionId: session.id,
              metadata: session.metadata 
            })
            break
          }

          // Update user tier in Supabase
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              tier,
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)

          if (updateError) {
            logError('Failed to update user tier', { 
              userId, 
              tier, 
              error: updateError.message 
            })
            return NextResponse.json(
              { error: 'Failed to update user tier' },
              { status: 500 }
            )
          }

          // Create payment record
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              user_id: userId,
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent,
              amount: session.amount_total,
              currency: session.currency,
              tier,
              status: 'completed',
              created_at: new Date().toISOString()
            })

          if (paymentError) {
            logError('Failed to create payment record', { 
              userId, 
              sessionId: session.id, 
              error: paymentError.message 
            })
          }

          logger.info(`Successfully upgraded user ${userId} to tier ${tier}`)
        }
        break

      case 'payment_intent.succeeded':
        logger.info('PaymentIntent succeeded', { 
          paymentIntentId: event.data.object.id 
        })
        break

      case 'payment_intent.payment_failed':
        logger.warn('PaymentIntent failed', { 
          paymentIntentId: event.data.object.id 
        })
        break

      default:
        logger.info(`Unhandled event type: ${event.type}`, { 
          eventId: event.id 
        })
    }

    const duration = Date.now() - startTime
    logger.performance('POST /api/stripe/webhook', duration, { 
      eventType: event.type,
      eventId: event.id
    })

    return NextResponse.json({ received: true })

  } catch (error) {
    const duration = Date.now() - startTime
    logError('Webhook error', { 
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}, RATE_LIMIT_CONFIGS.stripe)

export const POST = rateLimitedHandler