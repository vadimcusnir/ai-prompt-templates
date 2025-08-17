import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session for user identification
    const { data: { session } } = await supabase.auth.getSession()
    
    // Parse request body
    const body = await request.json()
    const { type, data, timestamp, sessionId } = body
    
    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Rate limiting check
    const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitKey = `analytics:${clientIp}:${type}`
    
    // Check rate limit (max 100 requests per minute per IP)
    const { data: rateLimitData } = await supabase
      .from('rate_limits')
      .select('count, reset_time')
      .eq('key', rateLimitKey)
      .single()
    
    const now = Date.now()
    const oneMinute = 60 * 1000
    
    if (rateLimitData) {
      if (now < rateLimitData.reset_time && rateLimitData.count >= 100) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        )
      }
      
      // Update rate limit
      if (now >= rateLimitData.reset_time) {
        await supabase
          .from('rate_limits')
          .upsert({
            key: rateLimitKey,
            count: 1,
            reset_time: now + oneMinute
          })
      } else {
        await supabase
          .from('rate_limits')
          .update({ count: rateLimitData.count + 1 })
          .eq('key', rateLimitKey)
      }
    } else {
      // Create new rate limit entry
      await supabase
        .from('rate_limits')
        .insert({
          key: rateLimitKey,
          count: 1,
          reset_time: now + oneMinute
        })
    }

    // Process analytics data based on type
    switch (type) {
      case 'events':
        await processEvents(data, session?.user?.id, sessionId)
        break
        
      case 'performance':
        await processPerformance(data, session?.user?.id, sessionId)
        break
        
      case 'errors':
        await processErrors(data, session?.user?.id, sessionId)
        break
        
      default:
        return NextResponse.json(
          { error: 'Unknown analytics type' },
          { status: 400 }
        )
    }

    // Log analytics collection
    logger.info('Analytics data collected', {
      type,
      count: data.length,
      userId: session?.user?.id,
      sessionId,
      clientIp
    })

    return NextResponse.json({ success: true, processed: data.length })

  } catch (error) {
    logger.error('Analytics API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processEvents(events: any[], userId?: string, sessionId?: string) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const processedEvents = events.map(event => ({
    event_name: event.name,
    properties: event.properties || {},
    timestamp: new Date(event.timestamp || Date.now()).toISOString(),
    user_id: userId,
    session_id: sessionId,
    page: event.page,
    user_agent: event.userAgent,
    referrer: event.referrer,
    created_at: new Date().toISOString()
  }))

  // Insert events in batches
  const batchSize = 100
  for (let i = 0; i < processedEvents.length; i += batchSize) {
    const batch = processedEvents.slice(i, i + batchSize)
    const { error } = await supabase
      .from('analytics_events')
      .insert(batch)
    
    if (error) {
      logger.error('Failed to insert analytics events', { error: error.message })
    }
  }
}

async function processPerformance(metrics: any[], userId?: string, sessionId?: string) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const processedMetrics = metrics.map(metric => ({
    metric_name: metric.name,
    value: metric.value,
    unit: metric.unit,
    metadata: metric.metadata || {},
    timestamp: new Date(metric.timestamp || Date.now()).toISOString(),
    user_id: userId,
    session_id: sessionId,
    created_at: new Date().toISOString()
  }))

  // Insert performance metrics in batches
  const batchSize = 100
  for (let i = 0; i < processedMetrics.length; i += batchSize) {
    const batch = processedMetrics.slice(i, i + batchSize)
    const { error } = await supabase
      .from('analytics_performance')
      .insert(batch)
    
    if (error) {
      logger.error('Failed to insert performance metrics', { error: error.message })
    }
  }
}

async function processErrors(errors: any[], userId?: string, sessionId?: string) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const processedErrors = errors.map(error => ({
    error_message: error.message,
    stack_trace: error.stack,
    component: error.component,
    metadata: error.metadata || {},
    timestamp: new Date(error.timestamp || Date.now()).toISOString(),
    user_id: userId,
    session_id: sessionId,
    created_at: new Date().toISOString()
  }))

  // Insert errors in batches
  const batchSize = 100
  for (let i = 0; i < processedErrors.length; i += batchSize) {
    const batch = processedErrors.slice(i, i + batchSize)
    const { error } = await supabase
      .from('analytics_errors')
      .insert(batch)
    
    if (error) {
      logger.error('Failed to insert error logs', { error: error.message })
    }
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'analytics-api'
  })
}
