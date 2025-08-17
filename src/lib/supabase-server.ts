import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Server-side Supabase client (use only in server components)
export const createServerClient = () => createServerComponentClient({ cookies })

// Validare strictă a variabilelor de mediu
function validateEnvironmentVariables() {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env file and ensure all required variables are set.'
    )
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

// Client securizat pentru server-side operations
export function createServiceClient() {
  // Validare doar în production sau când este necesar
  if (process.env.NODE_ENV === 'production') {
    validateEnvironmentVariables()
  } else if (process.env.NODE_ENV === 'development') {
    // Log warning în development pentru awareness
    console.warn('⚠️  Using service role key in development environment')
    
    // Validare și în development pentru a prinde erori timpuriu
    try {
      validateEnvironmentVariables()
    } catch (error) {
      console.error('❌ Environment validation failed:', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Creare client cu configurații de securitate
  const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'ai-prompt-templates-server'
      }
    }
  })

  return client
}

// Client pentru operații publice (fără service role)
export function createPublicClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-key-not-set'
  )
}

// Funcție de verificare a conexiunii
export async function testConnection() {
  try {
    const client = createServiceClient()
    const { data, error } = await client.from('prompts').select('count').limit(1)
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }
    
    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown connection error' 
    }
  }
}

// Funcție de cleanup pentru conexiuni
export function cleanupConnections() {
  // În viitor, implementați cleanup pentru conexiuni persistente
  // Pentru moment, clientul Supabase se cleanup automat
}