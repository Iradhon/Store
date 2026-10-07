import { createContext, useContext } from 'react'
import type { CartItem, Product } from '../types'

export interface CartContextType {
  items: CartItem[]
  totalItemsCount: number
  subtotal: number
  shippingCost: number
  estimatedTax: number
  orderTotal: number
  discountAmount: number
  appliedPromoCode: string | null
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  applyPromoCode: (code: string) => { success: boolean; message: string }
  removePromoCode: () => void
}

export const CartContext = createContext<CartContextType | undefined>(undefined)

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
