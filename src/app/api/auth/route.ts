// 📄 FIȘIER: src/app/api/auth/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json();
    
    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            subscription_tier: 'explorer',
            created_at: new Date().toISOString()
          }
        }
      });
      
      if (error) throw error;
      return NextResponse.json({ 
        success: true, 
        user: data.user,
        message: 'User created successfully' 
      });
    }
    
    if (action === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return NextResponse.json({ 
        success: true,
        user: data.user, 
        session: data.session,
        message: 'Login successful'
      });
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Invalid action' 
    }, { status: 400 });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Auth API is running',
    endpoints: ['POST /api/auth (signup/signin)']
  });
}