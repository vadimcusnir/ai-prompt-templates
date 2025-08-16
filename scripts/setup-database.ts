import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function setupDatabase() {
  console.log('🚀 Setting up AI-Prompt-Templates database...')
  
  try {
    // Read and execute schema
    const schemaPath = join(process.cwd(), 'sql', '01_initial_schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error)
        // Continue with next statement
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying database structure...')
    
    const tables = ['prompts', 'bundles', 'user_subscriptions', 'user_purchases']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.error(`❌ Table ${table} not accessible:`, error.message)
      } else {
        console.log(`✅ Table ${table} is ready`)
      }
    }
    
    console.log('\n🎉 Database setup completed!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Test connection first
async function testConnection() {
  console.log('🔗 Testing Supabase connection...')
  
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      process.exit(1)
    }
    
    console.log('✅ Supabase connection successful')
    return true
    
  } catch (error) {
    console.error('❌ Connection error:', error)
    process.exit(1)
  }
}

// Alternative method using direct SQL execution
async function setupDatabaseDirect() {
  console.log('🚀 Setting up database with direct SQL execution...')
  
  try {
    // Create enums
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TYPE IF NOT EXISTS cognitive_category AS ENUM (
          'deep_analysis',
          'meaning_engineering', 
          'cognitive_frameworks',
          'consciousness_mapping',
          'advanced_systems'
        );
      `
    })
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TYPE IF NOT EXISTS difficulty_tier AS ENUM (
          'foundation', 'advanced', 'expert', 'architect'
        );
      `
    })
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TYPE IF NOT EXISTS access_tier AS ENUM (
          'explorer', 'architect', 'initiate', 'master'
        );
      `
    })
    
    console.log('✅ Enums created')
    
    // Create main prompts table
    const { error: promptsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS prompts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          cognitive_category cognitive_category NOT NULL,
          difficulty_tier difficulty_tier NOT NULL,
          required_tier access_tier DEFAULT 'explorer',
          preview_content TEXT NOT NULL,
          full_content TEXT NOT NULL,
          implementation_guide TEXT,
          use_cases JSONB DEFAULT '{}',
          meta_tags TEXT[] DEFAULT '{}',
          cognitive_depth_score INTEGER CHECK (cognitive_depth_score BETWEEN 1 AND 10),
          pattern_complexity INTEGER CHECK (pattern_complexity BETWEEN 1 AND 5),
          meaning_layers TEXT[] DEFAULT '{}',
          anti_surface_features TEXT[] DEFAULT '{}',
          base_price_cents INTEGER NOT NULL,
          digital_root INTEGER CHECK (digital_root = 2),
          meta_title TEXT,
          meta_description TEXT,
          keywords TEXT[] DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          published_at TIMESTAMPTZ,
          is_published BOOLEAN DEFAULT FALSE,
          quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10)
        );
      `
    })
    
    if (promptsError) {
      console.error('❌ Error creating prompts table:', promptsError)
    } else {
      console.log('✅ Prompts table created')
    }
    
    console.log('🎉 Essential database structure ready!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
  }
}

// Main execution
async function main() {
  await testConnection()
  await setupDatabaseDirect()
}

if (require.main === module) {
  main()
}

export { setupDatabase, testConnection }