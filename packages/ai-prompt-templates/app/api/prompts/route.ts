import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { getAccessibleContent, type AccessTier } from '@/lib/access-gating'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { validateAndSanitize, PromptSchema, SearchSchema } from '@/lib/validation'
import { logger, logSecurity, logError } from '@/lib/logger'

// Mock data pentru dezvoltare - va fi înlocuit cu tabela prompts în producție
const MOCK_PROMPTS: Array<{
  id: number
  title: string
  slug: string
  preview_content: string
  full_content: string
  cognitive_category: string
  required_tier: AccessTier
  quality_score: number
  digital_root: number
  is_published: boolean
  created_at: string
  updated_at: string
}> = [
  {
    id: 1,
    title: 'Cognitive Depth Analysis Framework',
    slug: 'cognitive-depth-analysis-framework',
    preview_content: 'Advanced framework for analyzing cognitive depth in AI responses with multi-layered assessment capabilities',
    full_content: 'This comprehensive framework provides systematic approaches to evaluate and enhance the cognitive depth of AI-generated content...',
    cognitive_category: 'deep_analysis',
    required_tier: 'master',
    quality_score: 9,
    digital_root: 2,
    is_published: true,
    created_at: '2024-12-15T10:00:00Z',
    updated_at: '2024-12-15T10:00:00Z'
  },
  {
    id: 2,
    title: 'Consciousness Mapping Protocol',
    slug: 'consciousness-mapping-protocol',
    preview_content: 'Framework for mapping consciousness patterns in AI interactions and self-awareness',
    full_content: 'This protocol enables systematic mapping of consciousness patterns in AI systems...',
    cognitive_category: 'consciousness_mapping',
    required_tier: 'architect',
    quality_score: 10,
    digital_root: 2,
    is_published: true,
    created_at: '2024-12-14T10:00:00Z',
    updated_at: '2024-12-14T10:00:00Z'
  },
  {
    id: 3,
    title: 'Meaning Engineering System',
    slug: 'meaning-engineering-system',
    preview_content: 'Systematic approach to engineering meaning in AI prompts through progressive concept building',
    full_content: 'This system provides structured methods for building meaningful AI interactions...',
    cognitive_category: 'meaning_engineering',
    required_tier: 'initiate',
    quality_score: 7,
    digital_root: 2,
    is_published: true,
    created_at: '2024-12-13T10:00:00Z',
    updated_at: '2024-12-13T10:00:00Z'
  },
  {
    id: 4,
    title: 'Advanced Systems Integration',
    slug: 'advanced-systems-integration',
    preview_content: 'Comprehensive framework for integrating multiple AI systems with cognitive coherence',
    full_content: 'This framework enables seamless integration of multiple AI systems...',
    cognitive_category: 'advanced_systems',
    required_tier: 'master',
    quality_score: 8,
    digital_root: 2,
    is_published: true,
    created_at: '2024-12-12T10:00:00Z',
    updated_at: '2024-12-12T10:00:00Z'
  }
]

// Rate limiting pentru endpoint-ul de prompt-uri
const rateLimitedHandler = withRateLimit(RATE_LIMIT_CONFIGS.api, (request: NextRequest) => {
  // Extract IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `prompts_get:${ip}`
})(async (request: NextRequest) => {
  const startTime = Date.now()
  
  try {
    // Pentru dezvoltare, folosim mock data
    // În producție, va fi înlocuit cu:
    // const supabase = createServiceClient()
    // const { searchParams } = new URL(request.url)
    // let query = supabase.from('prompts').select('*').eq('is_published', true)
    
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const tier = (searchParams.get('tier') as AccessTier) || 'free'

    // Validare parametri de căutare
    const searchValidation = validateAndSanitize(SearchSchema, {
      search: search || undefined,
      category: category || undefined,
      tier: tier || 'free',
      difficulty: searchParams.get('difficulty') || undefined,
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

    // Filtrare mock data
    let filteredPrompts = [...MOCK_PROMPTS]

    if (category) {
      filteredPrompts = filteredPrompts.filter(prompt => prompt.cognitive_category === category)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredPrompts = filteredPrompts.filter(prompt => 
        prompt.title.toLowerCase().includes(searchLower) ||
        prompt.preview_content.toLowerCase().includes(searchLower)
      )
    }

    // Apply access gating
    const accessiblePrompts = filteredPrompts.map(prompt => {
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
    })

    // Simulează o întârziere pentru a imita un API real
    await new Promise(resolve => setTimeout(resolve, 100))

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
    // Pentru dezvoltare, simulăm crearea unui prompt
    // În producție, va fi înlocuit cu:
    // const supabase = createServiceClient()
    
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
    
    // Simulează crearea unui prompt nou
    const newPrompt = {
      id: MOCK_PROMPTS.length + 1,
      ...dataToInsert,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const duration = Date.now() - startTime
    logger.performance('POST /api/prompts', duration, { 
      promptId: newPrompt.id,
      title: newPrompt.title
    })

    return NextResponse.json({ prompt: newPrompt }, { status: 201 })

  } catch (error) {
    const duration = Date.now() - startTime
    logError('Unexpected error in POST /api/prompts', { 
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})