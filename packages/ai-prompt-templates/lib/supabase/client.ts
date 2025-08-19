import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Client-side Supabase client with Google OAuth support
export const supabase = createClientComponentClient()
