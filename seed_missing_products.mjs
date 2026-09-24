import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMissingProducts() {
  const { data: categories } = await supabase.from('categories').select('*');
  const { data: collections } = await supabase.from('collections').select('*');
  const { data: products } = await supabase.from('products').select('*');

  let added = 0;

  // Add for missing categories
  for (const cat of categories || []) {
    const count = products?.filter(p => p.category_id === cat.id).length || 0;
    if (count === 0) {
      console.log(`Adding product for category: ${cat.slug}`);
      await supabase.from('products').insert({
        title: `Exquisite ${cat.name} Piece`,
        slug: `exquisite-${cat.slug}-${Date.now()}`,
        description: `A stunning handcrafted piece from our ${cat.name} collection.`,
        price: 1599.00,
        material: '18K Yellow Gold',
        image_url: 'https://images.unsplash.com/photo-1599643478524-fb66f70a9a51?q=80&w=1000&auto=format&fit=crop',
        category_id: cat.id,
        is_featured: true,
        is_new_arrival: true
      });
      added++;
    }
  }

  // Fetch updated products
  const { data: updatedProducts } = await supabase.from('products').select('*');

  // Add for missing collections
  for (const col of collections || []) {
    const count = updatedProducts?.filter(p => p.collection_id === col.id).length || 0;
    if (count === 0) {
      console.log(`Adding product for collection: ${col.slug}`);
      const cat = categories && categories.length > 0 ? categories[0] : null;
      await supabase.from('products').insert({
        title: `Signature ${col.name} Jewel`,
        slug: `signature-${col.slug}-${Date.now()}`,
        description: `A masterfully crafted piece exclusive to the ${col.name} collection.`,
        price: 2499.00,
        material: '18K Rose Gold',
        image_url: 'https://images.unsplash.com/photo-1599643478524-fb66f70a9a51?q=80&w=1000&auto=format&fit=crop',
        category_id: cat ? cat.id : null,
        collection_id: col.id,
        is_featured: true,
        is_new_arrival: true
      });
      added++;
    }
  }

  console.log(`Done! Added ${added} products.`);
}

seedMissingProducts().catch(console.error);
