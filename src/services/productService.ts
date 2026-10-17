import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { products as localProducts } from '../data/products'
import type { Product } from '../types'

export async function getProducts(): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: Number(item.price),
          description: item.description,
          image: item.image,
          rating: item.rating ? Number(item.rating) : 4.8,
          reviewsCount: item.reviews_count ? Number(item.reviews_count) : 0,
          inStock: item.in_stock ?? true,
          featured: item.featured ?? false,
          createdAt: item.created_at,
        }))
      }
    } catch (err) {
      console.warn('Supabase fetch products error, using local fallback:', err)
    }
  }

  // Fallback to local data
  return localProducts
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          category: data.category,
          price: Number(data.price),
          description: data.description,
          image: data.image,
          rating: data.rating ? Number(data.rating) : 4.8,
          reviewsCount: data.reviews_count ? Number(data.reviews_count) : 0,
          inStock: data.in_stock ?? true,
          featured: data.featured ?? false,
          createdAt: data.created_at,
        }
      }
    } catch (err) {
      console.warn('Supabase fetch product by id error, using local fallback:', err)
    }
  }

  return localProducts.find((p) => p.id === id)
}
