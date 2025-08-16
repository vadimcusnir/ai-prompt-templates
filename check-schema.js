const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tthyfqqdkifnerlsefmn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0aHlmcXFka2lmbmVybHNlZm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTIzMjc0MCwiZXhwIjoyMDcwODA4NzQwfQ.5Sl-fUlsdgnmi-MhBAhG_tCbOkWlCjFZR0yl7RME-M8'
);

async function checkSchema() {
  try {
    console.log('🔍 Checking prompts table structure...');
    
    // Get first prompt to see structure
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📋 Table structure:');
      console.log('Columns:', Object.keys(data[0]));
      console.log('\n📊 Sample data:');
      console.log(JSON.stringify(data[0], null, 2));
    }
    
    // Check all prompts titles
    const { data: allPrompts, error: allError } = await supabase
      .from('prompts')
      .select('id, title, cognitive_category, difficulty_tier, base_price_cents, is_published')
      .order('created_at', { ascending: false });
    
    if (!allError && allPrompts) {
      console.log('\n📚 All prompts in database:');
      allPrompts.forEach((prompt, index) => {
        const price = prompt.base_price_cents ? `€${(prompt.base_price_cents / 100).toFixed(2)}` : 'No price';
        console.log(`${index + 1}. ${prompt.title}`);
        console.log(`   Category: ${prompt.cognitive_category}, Tier: ${prompt.difficulty_tier}`);
        console.log(`   Price: ${price}, Published: ${prompt.is_published ? 'Yes' : 'No'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Schema check error:', error);
  }
}

checkSchema();