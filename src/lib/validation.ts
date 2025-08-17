import { z } from 'zod'

// Schema de bază pentru prompt-uri
export const PromptSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Title contains invalid characters'),
  
  cognitive_category: z.enum([
    'deep_analysis',
    'meaning_engineering', 
    'cognitive_frameworks',
    'consciousness_mapping',
    'advanced_systems'
  ]),
  
  difficulty_tier: z.enum([
    'foundation',
    'advanced',
    'expert',
    'architect'
  ]),
  
  preview_content: z.string()
    .min(10, 'Preview content must be at least 10 characters')
    .max(1000, 'Preview content must be less than 1000 characters')
    .refine(content => !content.includes('<script'), 'Preview content contains invalid HTML'),
  
  full_content: z.string()
    .min(50, 'Full content must be at least 50 characters')
    .max(50000, 'Full content must be less than 50000 characters')
    .refine(content => !content.includes('<script'), 'Full content contains invalid HTML'),
  
  cognitive_depth_score: z.number()
    .int('Cognitive depth score must be an integer')
    .min(1, 'Cognitive depth score must be at least 1')
    .max(10, 'Cognitive depth score must be at most 10'),
  
  pattern_complexity: z.number()
    .int('Pattern complexity must be an integer')
    .min(1, 'Pattern complexity must be at least 1')
    .max(5, 'Pattern complexity must be at most 5'),
  
  base_price_cents: z.number()
    .int('Price must be an integer')
    .min(100, 'Price must be at least 100 cents (€1)')
    .max(100000, 'Price must be at most 100000 cents (€1000)'),
  
  meaning_layers: z.array(z.string())
    .min(1, 'At least one meaning layer is required')
    .max(10, 'Maximum 10 meaning layers allowed')
    .refine(layers => layers.every(layer => 
      layer.length >= 3 && layer.length <= 500 && !layer.includes('<script')
    ), 'Meaning layers contain invalid content'),
  
  anti_surface_features: z.array(z.string())
    .min(1, 'At least one anti-surface feature is required')
    .max(10, 'Maximum 10 anti-surface features allowed')
    .refine(features => features.every(feature => 
      feature.length >= 3 && feature.length <= 500 && !feature.includes('<script')
    ), 'Anti-surface features contain invalid content'),
  
  required_tier: z.enum(['explorer', 'architect', 'initiate', 'master'])
    .default('explorer'),
  
  is_published: z.boolean().default(false),
  
  quality_score: z.number()
    .int('Quality score must be an integer')
    .min(1, 'Quality score must be at least 1')
    .max(10, 'Quality score must be at most 10')
    .default(5),
  
  meta_tags: z.array(z.string())
    .max(20, 'Maximum 20 meta tags allowed')
    .default([]),
  
  keywords: z.array(z.string())
    .max(50, 'Maximum 50 keywords allowed')
    .default([])
})

// Schema pentru actualizări (toate câmpurile opționale)
export const PromptUpdateSchema = PromptSchema.partial().extend({
  id: z.string().uuid('Invalid prompt ID format'),
  updated_at: z.string().datetime().optional()
})

// Schema pentru autentificare
export const AuthSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email too short')
    .max(254, 'Email too long'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase and number'),
  
  action: z.enum(['signin', 'signup'])
})

// Schema pentru Stripe checkout
export const StripeCheckoutSchema = z.object({
  tier: z.enum(['explorer', 'architect', 'initiate', 'master']),
  userId: z.string().uuid('Invalid user ID format')
})

// Schema pentru search și filtrare
export const SearchSchema = z.object({
  search: z.string().max(100, 'Search query too long').optional(),
  category: z.enum([
    'deep_analysis',
    'meaning_engineering',
    'cognitive_frameworks', 
    'consciousness_mapping',
    'advanced_systems'
  ]).optional(),
  tier: z.enum(['explorer', 'architect', 'initiate', 'master']).default('explorer'),
  difficulty: z.enum(['foundation', 'advanced', 'expert', 'architect']).optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  minScore: z.number().int().min(1).max(10).optional(),
  maxScore: z.number().int().min(1).max(10).optional()
})

// Funcție de validare cu sanitizare
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      return { success: false, errors }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

// Funcție de sanitizare HTML
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

// Funcție de validare UUID
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Funcție de validare email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Funcție de validare preț
export function isValidPrice(price: number): boolean {
  return Number.isInteger(price) && price >= 100 && price <= 100000
}

// Export tipuri
export type Prompt = z.infer<typeof PromptSchema>
export type PromptUpdate = z.infer<typeof PromptUpdateSchema>
export type AuthData = z.infer<typeof AuthSchema>
export type StripeCheckoutData = z.infer<typeof StripeCheckoutSchema>
export type SearchData = z.infer<typeof SearchSchema>
