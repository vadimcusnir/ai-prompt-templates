const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tthyfqqdkifnerlsefmn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0aHlmcXFka2lmbmVybHNlZm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTIzMjc0MCwiZXhwIjoyMDcwODA4NzQwfQ.5Sl-fUlsdgnmi-MhBAhG_tCbOkWlCjFZR0yl7RME-M8'
);

async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  console.log('URL: https://tthyfqqdkifnerlsefmn.supabase.co');
  console.log('Using service role key...');
  
  try {
    // Test connection by trying to access auth users (should work with service key)
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('👥 Users in database:', data.users?.length || 0);
    
    // Now try to check if prompts table exists
    const { data: promptsData, error: promptsError } = await supabase
      .from('prompts')
      .select('count', { count: 'exact' })
      .limit(0);
    
    if (promptsError) {
      console.log('❌ Prompts table does not exist:', promptsError.message);
    } else {
      console.log('✅ Prompts table exists');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection error:', error);
  }
}

async function checkPrompts() {
  try {
    console.log('\n📊 Testing prompts table access...');
    const { data, error, count } = await supabase
      .from('prompts')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.log('❌ Prompts table not accessible:', error.message);
      return;
    }
    
    console.log('✅ Prompts table accessible');
    console.log(`📊 Total prompts: ${count}`);
    
    if (data && data.length > 0) {
      console.log('📋 Sample prompt:', {
        title: data[0].title,
        category: data[0].cognitive_category,
        price: `€${data[0].base_price_cents / 100}`
      });
    }
    
  } catch (error) {
    console.error('❌ Prompts table error:', error.message);
  }
}

// Run tests
async function main() {
  const connected = await testConnection();
  
  if (connected) {
    await checkPrompts();
  }
}

main();