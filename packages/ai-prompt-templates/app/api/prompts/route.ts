import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { getAccessibleContent } from '@/lib/access-gating'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { validateAndSanitize, PromptSchema, SearchSchema } from '@/lib/validation'
import { logger, logSecurity, logError } from '@/lib/logger'

// Rate limiting pentru endpoint-ul de prompt-uri
const rateLimitedHandler = withRateLimit(RATE_LIMIT_CONFIGS.api, (request: NextRequest) => {
  // Extract IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `prompts_get:${ip}`
})(async (request: NextRequest) => {
  const startTime = Date.now()
  
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const tier = searchParams.get('tier') as 'explorer' | 'architect' | 'initiate' | 'master' || 'explorer'

    // Validare parametri de căutare
    const searchValidation = validateAndSanitize(SearchSchema, {
      search,
      category,
      tier,
      difficulty: searchParams.get('difficulty'),
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      minScore: searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : undefined,
      maxScore: searchParams.get('maxScore') ? parseInt(searchParams.get('maxScore')!) : undefined
    })

    if (!searchValidation.success) {
      const errors = (searchValidation as { success: false; errors: string[] }).errors;
      logSecurity('Invalid search parameters', { 
        params: searchParams.toString(), 
        errors
      })
      return NextResponse.json({ 
        error: 'Invalid search parameters',
        details: errors 
      }, { status: 400 })
    }

    let query = supabase
      .from('prompts')
      .select('*')
      .eq('is_published', true)

    if (category) {
      query = query.eq('cognitive_category', category)
    }

    if (search) {
      query = query.textSearch('title,preview_content', search)
    }

    const { data: prompts, error } = await query.order('created_at', { ascending: false })

    if (error) {
      logError('Database query failed', { error: error.message, query: 'prompts select' })
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Apply access gating
    const accessiblePrompts = prompts?.map(prompt => {
      const { content, hasFullAccess } = getAccessibleContent(
        prompt.full_content,
        tier,
        prompt.required_tier
      )
      
      return {
        ...prompt,
        content,
        hasFullAccess,
        full_content: hasFullAccess ? prompt.full_content : undefined
      }
    }) || []

    const duration = Date.now() - startTime
    logger.performance('GET /api/prompts', duration, { 
      count: accessiblePrompts.length,
      tier,
      category: category || 'all'
    })

    return NextResponse.json({ prompts: accessiblePrompts })

  } catch (error) {
    const duration = Date.now() - startTime
    logError('Unexpected error in GET /api/prompts', { 
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const GET = rateLimitedHandler

export const POST = withRateLimit(RATE_LIMIT_CONFIGS.api, (request: NextRequest) => {
  // Extract IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `prompts_post:${ip}`
})(async (request: NextRequest) => {
  const startTime = Date.now()
  
  try {
    const supabase = createServiceClient()
    
    // Verificare Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      logSecurity('Invalid content type', { contentType })
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 })
    }
    
    const promptData = await request.json()
    
    // Validare strictă a datelor
    const validation = validateAndSanitize(PromptSchema, promptData)
    
    if (!validation.success) {
      const errors = (validation as { success: false; errors: string[] }).errors;
      logSecurity('Invalid prompt data', { 
        errors,
        dataKeys: Object.keys(promptData)
      })
      
      return NextResponse.json({ 
        error: 'Invalid prompt data',
        details: errors 
      }, { status: 400 })
    }
    
    const sanitizedData = validation.data
    
    // Generate slug from title
    const slug = sanitizedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    // Set defaults
    const dataToInsert = {
      ...sanitizedData,
      slug,
      digital_root: 2, // Enforce digital root 2
      required_tier: sanitizedData.required_tier || 'explorer',
      is_published: sanitizedData.is_published || false,
      quality_score: sanitizedData.quality_score || 5
    }
    
    const { data, error } = await supabase
      .from('prompts')
      .insert(dataToInsert)
      .select()
      .single()

    if (error) {
      logError('Database insert failed', { 
        error: error.message, 
        data: { title: sanitizedData.title, category: sanitizedData.cognitive_category }
      })
      return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.performance('POST /api/prompts', duration, { 
      promptId: data.id,
      title: data.title
    })

    return NextResponse.json({ prompt: data }, { status: 201 })

  } catch (error) {
    const duration = Date.now() - startTime
    logError('Unexpected error in POST /api/prompts', { 
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})