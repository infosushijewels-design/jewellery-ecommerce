import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing env vars', !!supabaseUrl, !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log('Total products:', prodCount);

  const { data: categories } = await supabase.from('categories').select('*');
  const { data: collections } = await supabase.from('collections').select('*');
  const { data: products } = await supabase.from('products').select('*');

  console.log('\n--- Categories ---');
  for (const cat of categories || []) {
    const count = products?.filter(p => p.category_id === cat.id).length || 0;
    console.log(`${cat.slug}: ${count} products`);
  }

  console.log('\n--- Collections ---');
  for (const col of collections || []) {
    const count = products?.filter(p => p.collection_id === col.id).length || 0;
    console.log(`${col.slug}: ${count} products`);
  }
}

checkData();
