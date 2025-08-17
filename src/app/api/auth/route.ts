// 📄 FIȘIER: src/app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { validateAndSanitize, AuthSchema } from '@/lib/validation'
import { logger, logSecurity, logError } from '@/lib/logger'

// Validare strictă a variabilelor de mediu
function validateEnvironmentVariables() {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
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

// Rate limiting strict pentru autentificare (5 attempts per 15 min)
const rateLimitedHandler = withRateLimit(async (request: NextRequest) => {
  const startTime = Date.now()
  
  try {
    // Verificare Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      logSecurity('Invalid content type in auth request', { contentType })
      return NextResponse.json({ 
        success: false,
        error: 'Content-Type must be application/json' 
      }, { status: 400 })
    }

    const requestData = await request.json()
    
    // Validare strictă a datelor de autentificare
    const validation = validateAndSanitize(AuthSchema, requestData)
    
    if (!validation.success) {
      logSecurity('Invalid auth data', { 
        errors: validation.errors,
        action: requestData.action,
        email: requestData.email ? 'provided' : 'missing'
      })
      
      return NextResponse.json({ 
        success: false,
        error: 'Invalid authentication data',
        details: validation.errors 
      }, { status: 400 })
    }
    
    const { email, password, action } = validation.data
    const supabase = createSecureSupabaseClient()
    
    // Logging de securitate pentru încercări de autentificare
    logSecurity('Authentication attempt', { 
      action, 
      email: email.substring(0, 3) + '***@' + email.split('@')[1],
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
    })
    
    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            subscription_tier: 'explorer',
            created_at: new Date().toISOString(),
            signup_ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
          }
        }
      })
      
      if (error) {
        logError('Signup failed', { 
          email: email.substring(0, 3) + '***@' + email.split('@')[1],
          error: error.message 
        })
        throw error
      }
      
      const duration = Date.now() - startTime
      logger.performance('POST /api/auth signup', duration, { 
        userId: data.user?.id,
        email: email.substring(0, 3) + '***@' + email.split('@')[1]
      })
      
      return NextResponse.json({ 
        success: true, 
        user: data.user,
        message: 'User created successfully' 
      })
    }
    
    if (action === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        logError('Signin failed', { 
          email: email.substring(0, 3) + '***@' + email.split('@')[1],
          error: error.message 
        })
        throw error
      }
      
      const duration = Date.now() - startTime
      logger.performance('POST /api/auth signin', duration, { 
        userId: data.user?.id,
        email: email.substring(0, 3) + '***@' + email.split('@')[1]
      })
      
      return NextResponse.json({ 
        success: true,
        user: data.user, 
        session: data.session,
        message: 'Login successful'
      })
    }
    
    logSecurity('Invalid auth action', { action })
    return NextResponse.json({ 
      success: false,
      error: 'Invalid action' 
    }, { status: 400 })
    
  } catch (error: unknown) {
    const duration = Date.now() - startTime
    logError('Auth API error', { 
      duration,
              error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ 
      success: false,
      error: 'Authentication failed' 
    }, { status: 500 })
  }
}, RATE_LIMIT_CONFIGS.auth)

export const POST = rateLimitedHandler

export const GET = async () => {
  return NextResponse.json({ 
    message: 'Auth API is running',
    endpoints: ['POST /api/auth (signup/signin)'],
    rateLimit: RATE_LIMIT_CONFIGS.auth
  })
}