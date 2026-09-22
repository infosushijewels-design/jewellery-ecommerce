import { createClient } from './server';
import { Database } from './database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Collection = Database['public']['Tables']['collections']['Row'];

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching featured products:', error);
  }

  if (data && data.length > 0) {
    return data;
  }

  // Fallback: return latest products if none explicitly marked as featured
  const fallback = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  return fallback.data || [];
}

export async function getNewArrivals(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_new_arrival', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching new arrivals:', error);
  }

  if (data && data.length > 0) {
    return data;
  }

  // Fallback: return latest products if none explicitly marked as new arrival
  const fallback = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  return fallback.data || [];
}

export async function getProductsByCategorySlug(slug: string): Promise<{ category: Category | null, products: Product[] }> {
  const supabase = await createClient();
  
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  // Inactive categories are hidden from the storefront (is_active is undefined before migration 008)
  if (categoryError || !category || category.is_active === false) {
    if (categoryError) console.error('Error fetching category:', categoryError);
    return { category: null, products: [] };
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', category.id)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('Error fetching products by category:', productsError);
    return { category, products: [] };
  }

  return { category, products: products || [] };
}

export async function getProductsByCollectionSlug(slug: string): Promise<{ collection: Collection | null, products: Product[] }> {
  const supabase = await createClient();
  
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .single();

  if (collectionError || !collection) {
    console.error('Error fetching collection:', collectionError);
    return { collection: null, products: [] };
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('collection_id', collection.id)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('Error fetching products by collection:', productsError);
    return { collection, products: [] };
  }

  return { collection, products: products || [] };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }
  return data;
}

export async function getAllCollections(): Promise<Collection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
  return data || [];
}

/**
 * Active admin-managed legal page by slug, or null (also null if migration 009
 * hasn't been applied yet, so built-in pages fall back to their default content).
 */
export async function getLegalPage(slug: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('legal_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/** Lightweight category list (id, name, slug) for catalog filtering. */
export async function getCategoryList(): Promise<{ id: string; name: string; slug: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('categories').select('id, name, slug').order('name');
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

/**
 * Storefront search: every term must match (word-prefix) the product's title,
 * material, badge, description, category or collection. Ranked by relevance.
 * The catalogue is small, so matching runs in memory for accurate plural and
 * partial-word handling ("rings" → Ring, not Earrings).
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const { scoreProduct } = await import('@/lib/catalogSearch');
  const supabase = await createClient();
  const [productsRes, categoriesRes, collectionsRes] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }).limit(1000),
    supabase.from('categories').select('id, name'),
    supabase.from('collections').select('id, name'),
  ]);
  if (productsRes.error) {
    console.error('Error searching products:', productsRes.error);
    return [];
  }
  const categoryName = new Map((categoriesRes.data || []).map((c) => [c.id, c.name]));
  const collectionName = new Map((collectionsRes.data || []).map((c) => [c.id, c.name]));

  return (productsRes.data || [])
    .map((p) => ({
      p,
      score: scoreProduct(p, query, [
        (p.category_id && categoryName.get(p.category_id)) || '',
        (p.collection_id && collectionName.get(p.collection_id)) || '',
      ].filter(Boolean)),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ p }) => p);
}
