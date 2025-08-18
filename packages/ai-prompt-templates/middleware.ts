import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

// Security headers configuration
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'off',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://*.supabase.co; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';"
};

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // CORS headers
  const origin = req.headers.get('origin');
  if (origin && (origin.includes('localhost') || origin.includes('vercel.app'))) {
    res.headers.set('Access-Control-Allow-Origin', origin);
  }
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: res.headers });
  }

  // Rate limiting
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitResult = await rateLimit(ip, rateLimitConfig);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: res.headers }
    );
  }

  // Bot protection
  const userAgent = req.headers.get('user-agent') || '';
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);
  
  if (isBot && !req.nextUrl.pathname.startsWith('/api/health')) {
    // Allow health checks for monitoring bots
    return NextResponse.json(
      { error: 'Bot access not allowed' },
      { status: 403, headers: res.headers }
    );
  }

  // SQL injection protection
  const url = req.nextUrl.toString();
  const sqlInjectionPattern = /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)\b)/i;
  
  if (sqlInjectionPattern.test(url)) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400, headers: res.headers }
    );
  }

  // XSS protection
  const xssPattern = /<script|javascript:|vbscript:|onload|onerror|onclick/i;
  if (xssPattern.test(url)) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400, headers: res.headers }
    );
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { pathname } = req.nextUrl;

    // Public routes - no protection needed
    const publicRoutes = ['/', '/search', '/pricing', '/bundles', '/library', '/n', '/legal', '/privacy', '/terms'];
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return res;
    }

    // Auth routes - redirect if already authenticated
    if (pathname.startsWith('/auth') && session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Protected routes - require authentication
    if (pathname.startsWith('/checkout') || pathname.startsWith('/dashboard') || pathname.startsWith('/account')) {
      if (!session) {
        return NextResponse.redirect(new URL('/auth/sign-in', req.url));
      }
    }

    // Admin routes - require admin role
    if (pathname.startsWith('/admin')) {
      if (!session) {
        return NextResponse.redirect(new URL('/auth/sign-in', req.url));
      }
      
      // Check admin role
      const { data: userRole, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      if (error || userRole?.role !== 'admin') {
        return NextResponse.redirect(new URL('/403', req.url));
      }
    }

    // API routes protection
    if (pathname.startsWith('/api/')) {
      // Public API routes
      const publicApiRoutes = ['/api/search', '/api/health', '/api/prompts'];
      if (publicApiRoutes.some(route => pathname.startsWith(route))) {
        return res;
      }

      // Protected API routes
      if (pathname.startsWith('/api/checkout') || pathname.startsWith('/api/account') || pathname.startsWith('/api/dashboard')) {
        if (!session) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: res.headers });
        }
      }

      // Admin API routes
      if (pathname.startsWith('/api/admin')) {
        if (!session) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: res.headers });
        }
        
        const { data: userRole, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        if (error || userRole?.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: res.headers });
        }
      }

      // Stripe webhook protection
      if (pathname.startsWith('/api/stripe/webhook')) {
        const signature = req.headers.get('stripe-signature');
        if (!signature) {
          return NextResponse.json({ error: 'Missing signature' }, { status: 400, headers: res.headers });
        }
        // Additional webhook validation will be done in the route handler
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: res.headers }
    );
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
