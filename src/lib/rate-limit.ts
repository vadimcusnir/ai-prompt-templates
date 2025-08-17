import { createClient } from '@supabase/supabase-js';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

// In-memory store for development (replace with Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Get current rate limit data
  const current = rateLimitStore.get(identifier);
  
  if (!current || current.resetTime < now) {
    // First request or window expired
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs
    });
    
    return {
      success: true,
      remaining: config.max - 1,
      resetTime: now + config.windowMs
    };
  }
  
  if (current.count >= config.max) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
      message: config.message
    };
  }
  
  // Increment count
  current.count++;
  rateLimitStore.set(identifier, current);
  
  return {
    success: true,
    remaining: config.max - current.count,
    resetTime: current.resetTime
  };
}

// Cleanup expired entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

// Production Redis implementation
export async function rateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // This would use Redis in production
  // For now, fallback to in-memory
  return rateLimit(identifier, config);
}

// IP-based rate limiting
export async function rateLimitByIP(
  ip: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimit(`ip:${ip}`, config);
}

// User-based rate limiting
export async function rateLimitByUser(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimit(`user:${userId}`, config);
}

// Endpoint-based rate limiting
export async function rateLimitByEndpoint(
  endpoint: string,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimit(`${endpoint}:${identifier}`, config);
}
