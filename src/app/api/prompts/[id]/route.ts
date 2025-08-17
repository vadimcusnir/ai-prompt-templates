import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { getAccessibleContent } from '@/lib/access-gating'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { validateAndSanitize, PromptUpdateSchema } from '@/lib/validation'
import { logger, logSecurity, logError } from '@/lib/logger'
import { isValidUUID } from '@/lib/validation'

// Rate limiting pentru endpoint-ul de prompt-uri individuale
const rateLimitedGetHandler = withRateLimit(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now()
  
  try {
    const { id } = await params
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier') as 'explorer' | 'architect' | 'initiate' | 'master' || 'explorer'

    // Validare UUID
    if (!isValidUUID(id)) {
      logSecurity('Invalid UUID format in prompt request', { id })
      return NextResponse.json({ error: 'Invalid prompt ID format' }, { status: 400 })
    }

    const { data: prompt, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single()

    if (error) {
      logError('Prompt not found', { id, error: error.message })
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    // Apply access gating
    const { content, hasFullAccess } = getAccessibleContent(
      prompt.full_content,
      tier,
      prompt.required_tier
    )

    const accessiblePrompt = {
      ...prompt,
      content,
      hasFullAccess,
      full_content: hasFullAccess ? prompt.full_content : undefined
    }

    const duration = Date.now() - startTime
    logger.performance('GET /api/prompts/[id]', duration, { 
      promptId: id,
      tier,
      hasFullAccess
    })

    return NextResponse.json({ prompt: accessiblePrompt })

  } catch (error) {
    const duration = Date.now() - startTime
    logError('API error in GET /api/prompts/[id]', { 
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}, RATE_LIMIT_CONFIGS.prompts)

export const GET = rateLimitedGetHandler

// Rate limiting strict pentru operații de modificare (admin only)
const rateLimitedPutHandler = withRateLimit(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now()
  
  try {
    const { id } = await params
    const supabase = createServiceClient()
    
    // Validare UUID
    if (!isValidUUID(id)) {
      logSecurity('Invalid UUID format in prompt update', { id })
      return NextResponse.json({ error: 'Invalid prompt ID format' }, { status: 400 })
    }

    // Verificare Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      logSecurity('Invalid content type in prompt update', { contentType, promptId: id })
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 })
    }
    
    const promptData = await request.json()
    
    // Validare strictă a datelor de actualizare
    const validation = validateAndSanitize(PromptUpdateSchema, { ...promptData, id })
    
    if (!validation.success) {
      logSecurity('Invalid prompt update data', { 
        promptId: id,
        errors: validation.errors,
        dataKeys: Object.keys(promptData)
      })
      
      return NextResponse.json({ 
        error: 'Invalid prompt data',
        details: validation.errors 
      }, { status: 400 })
    }
    
    const sanitizedData = validation.data
    
    const { data, error } = await supabase
      .from('prompts')
      .update(sanitizedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('Prompt update failed', { 
        promptId: id, 
        error: error.message,
        updateData: { title: sanitizedData.title, category: sanitizedData.cognitive_category }
      })
      return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.performance('PUT /api/prompts/[id]', duration, { 
      promptId: id,
      title: data.title
    })

    return NextResponse.json({ prompt: data })

  } catch (error) {
    const duration = Date.now() - startTime
    logError('Unexpected error in PUT /api/prompts/[id]', { 
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 400 })
  }
}, RATE_LIMIT_CONFIGS.admin)

export const PUT = rateLimitedPutHandler

// Rate limiting strict pentru ștergere (admin only)
const rateLimitedDeleteHandler = withRateLimit(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now()
  
  try {
    const { id } = await params
    const supabase = createServiceClient()
    
    // Validare UUID
    if (!isValidUUID(id)) {
      logSecurity('Invalid UUID format in prompt deletion', { id })
      return NextResponse.json({ error: 'Invalid prompt ID format' }, { status: 400 })
    }

    // Logging de securitate pentru ștergeri
    logSecurity('Prompt soft-deletion attempt (marking as unpublished)', { 
      promptId: id,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
    })
    
    // Soft-delete: marchează ca nepublicat în loc să ștergi
    const { error } = await supabase
      .from('prompts')
      .update({ 
        published: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      logError('Prompt soft-deletion failed', { 
        promptId: id, 
        error: error.message 
      })
      return NextResponse.json({ error: 'Failed to soft-delete prompt' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.performance('DELETE /api/prompts/[id] (soft-delete)', duration, { promptId: id })

    return NextResponse.json({ success: true })

  } catch (error) {
    const duration = Date.now() - startTime
    logError('Unexpected error in DELETE /api/prompts/[id]', { 
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}, RATE_LIMIT_CONFIGS.admin)

export const DELETE = rateLimitedDeleteHandler
