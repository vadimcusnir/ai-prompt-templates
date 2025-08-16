import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAccessibleContent } from '@/lib/pricing'

export async function GET(request: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)
  
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const tier = searchParams.get('tier') as 'explorer' | 'architect' | 'initiate' | 'master' || 'explorer'

  try {
    let query = supabase
      .from('prompts')
      .select('*')

    if (category) {
      query = query.eq('cognitive_category', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,preview_content.ilike.%${search}%`)
    }

    const { data: prompts, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Apply access gating based on user tier
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
        // Don't send full content to client unless they have access
        full_content: hasFullAccess ? prompt.full_content : undefined,
        // Format price for display
        formatted_price: `€${(prompt.price_cents / 100).toFixed(2)}`
      }
    }) || []

    return NextResponse.json({ 
      prompts: accessiblePrompts,
      total: accessiblePrompts.length 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  
  try {
    const promptData = await request.json()
    
    // Validate required fields
    const requiredFields = ['title', 'cognitive_category', 'difficulty_tier', 'preview_content', 'full_content', 'cognitive_depth_score', 'pattern_complexity', 'price_cents']
    
    for (const field of requiredFields) {
      if (!promptData[field] && promptData[field] !== 0) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }
    
    // Generate slug from title if not provided
    if (!promptData.slug) {
      promptData.slug = promptData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }
    
    // Set defaults
    promptData.digital_root = 2 // Enforce digital root 2
    promptData.view_count = 0
    promptData.download_count = 0
    promptData.average_rating = 0
    promptData.total_ratings = 0
    promptData.total_downloads = 0
    
    const { data, error } = await supabase
      .from('prompts')
      .insert(promptData)
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prompt: data }, { status: 201 })

  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
  }
}