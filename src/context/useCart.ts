import { createContext, useContext } from 'react'
import type { CartItem, Product } from '../types'

export interface CartContextType {
  items: CartItem[]
  totalItemsCount: number
  distinctProductCount: number
  subtotalMinorByCurrency: Record<string, number>
  isCatalogLoading: boolean
  catalogError: string | null
  cartNotice: string | null
  clearCartNotice: () => void
  addToCart: (product: Product, quantity?: number) => AddToCartResult
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

export interface AddToCartResult {
  addedQuantity: number
  remainingQuantity: number
  inventoryRemainingQuantity: number
}

export const CartContext = createContext<CartContextType | undefined>(undefined)

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
