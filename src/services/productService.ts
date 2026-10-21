import type { Product } from '../types'
import type { Database } from '../types/database'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

type ProductRow = Database['public']['Tables']['products']['Row']

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    category: row.category,
    priceMinor: Number(row.price_minor),
    currency: row.currency,
    description: row.description,
    imageUrl: row.image_url,
    inventoryQuantity: row.inventory_quantity,
    isPublished: row.is_published,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getPublishedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) throw new Error('The product catalog is not configured.')

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (error) throw new Error('The product catalog could not be loaded.')
  return (data ?? []).map(mapProduct)
}
