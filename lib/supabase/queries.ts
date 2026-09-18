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

  if (categoryError || !category) {
    console.error('Error fetching category:', categoryError);
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
