import { NextRequest } from 'next/server'

interface RateLimitConfig {
  limit: number
  windowMs: number
  blockDuration?: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
  blockedUntil?: number
}

// Rate limit storage - în production folosiți Redis sau similar
const rateLimitMap = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = { limit: 100, windowMs: 15 * 60 * 1000 }
): { allowed: boolean; remaining: number; resetTime: number; blocked: boolean } {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const now = Date.now()
  const key = `rate_limit:${ip}`
  
  let entry = rateLimitMap.get(key)
  
  // Check if IP is blocked
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockedUntil,
      blocked: true
    }
  }
  
  // Reset or create new entry
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + config.windowMs }
    rateLimitMap.set(key, entry)
  }
  
  // Check limit
  if (entry.count >= config.limit) {
    // Block IP for 1 hour if limit exceeded
    const blockDuration = config.blockDuration || 60 * 60 * 1000
    entry.blockedUntil = now + blockDuration
    rateLimitMap.set(key, entry)
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockedUntil,
      blocked: true
    }
  }
  
  // Increment counter
  entry.count++
  rateLimitMap.set(key, entry)
  
  return {
    allowed: true,
    remaining: Math.max(0, config.limit - entry.count),
    resetTime: entry.resetTime,
    blocked: false
  }
}

// Rate limiting middleware pentru API routes
export function withRateLimit<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>,
  config: RateLimitConfig = { limit: 100, windowMs: 15 * 60 * 1000 }
) {
  return async (request: NextRequest, ...args: T) => {
    const rateLimitResult = checkRateLimit(request, config)
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: rateLimitResult.blocked 
            ? 'Too many requests. IP blocked temporarily.' 
            : 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
    
    // Add rate limit headers to response
    const response = await handler(request, ...args)
    
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Limit', config.limit.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
    }
    
    return response
  }
}

// Configurații specifice pentru diferite endpoint-uri
export const RATE_LIMIT_CONFIGS = {
  auth: { limit: 5, windowMs: 15 * 60 * 1000, blockDuration: 60 * 60 * 1000 }, // 5 attempts per 15 min
  prompts: { limit: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 min
  stripe: { limit: 10, windowMs: 60 * 1000, blockDuration: 30 * 60 * 1000 }, // 10 requests per minute
  admin: { limit: 50, windowMs: 15 * 60 * 1000 }, // 50 requests per 15 min
  default: { limit: 100, windowMs: 15 * 60 * 1000 } // Default limit
}
