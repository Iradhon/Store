export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          phone: string | null
          role: 'customer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          user_id?: string
          product_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          product_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wishlist_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          full_name: string
          phone: string
          address_line_1: string
          address_line_2: string | null
          city: string
          state_region: string | null
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          label?: string
          full_name: string
          phone: string
          address_line_1: string
          address_line_2?: string | null
          city: string
          state_region?: string | null
          postal_code: string
          country: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          full_name?: string
          phone?: string
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          state_region?: string | null
          postal_code?: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          sku: string | null
          slug: string
          name: string
          category: string
          description: string
          image_url: string | null
          image_urls: string[]
          price_minor: number
          currency: string
          inventory_quantity: number
          is_published: boolean
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku?: string | null
          slug: string
          name: string
          category: string
          description?: string
          image_url?: string | null
          image_urls?: string[]
          price_minor: number
          currency: string
          inventory_quantity?: number
          is_published?: boolean
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string | null
          slug?: string
          name?: string
          category?: string
          description?: string
          image_url?: string | null
          image_urls?: string[]
          price_minor?: number
          currency?: string
          inventory_quantity?: number
          is_published?: boolean
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_fk'
            columns: ['category']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['name']
          },
        ]
      }
      orders: {
        Row: {
          id: string
          user_id: string
          shipping_address: Json
          shipping_method: string | null
          currency: string
          subtotal_minor: number
          shipping_minor: number
          discount_minor: number
          tax_minor: number
          total_minor: number
          payment_status: 'not_configured' | 'pending' | 'authorized' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          fulfillment_status: 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_provider: string | null
          provider_reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shipping_address: Json
          shipping_method?: string | null
          currency: string
          subtotal_minor: number
          shipping_minor?: number
          discount_minor?: number
          tax_minor?: number
          total_minor: number
          payment_status?: 'not_configured' | 'pending' | 'authorized' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          fulfillment_status?: 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_provider?: string | null
          provider_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shipping_address?: Json
          shipping_method?: string | null
          currency?: string
          subtotal_minor?: number
          shipping_minor?: number
          discount_minor?: number
          tax_minor?: number
          total_minor?: number
          payment_status?: 'not_configured' | 'pending' | 'authorized' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          fulfillment_status?: 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_provider?: string | null
          provider_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          product_image_url: string | null
          quantity: number
          unit_price_minor: number
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          product_image_url?: string | null
          quantity: number
          unit_price_minor: number
          currency: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          product_image_url?: string | null
          quantity?: number
          unit_price_minor?: number
          currency?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      set_default_address: {
        Args: { target_address_id: string | null }
        Returns: undefined
      }
    }
    Enums: { app_role: 'customer' | 'admin' }
    CompositeTypes: { [_ in never]: never }
  }
}
