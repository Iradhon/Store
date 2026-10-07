import { useEffect, useState, type ReactNode } from 'react'
import type { CartItem, Product } from '../types'
import { CartContext } from './useCart'

const CART_STORAGE_KEY = 'store_cart_v1'

const VALID_PROMOS: Record<string, number> = {
  SAVE10: 0.1, // 10% discount
  STORE20: 0.2, // 20% discount
  WELCOME: 15, // $15 flat discount
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null)

  // Persist cart to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.error('Failed to persist cart:', e)
    }
  }, [items])

  function addToCart(product: Product, quantity = 1) {
    if (quantity <= 0) return

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id)

      if (existingIndex > -1) {
        const updated = [...prevItems]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        }
        return updated
      }

      return [...prevItems, { product, quantity }]
    })
  }

  function removeFromCart(productId: string) {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.min(quantity, 99) } : item,
      ),
    )
  }

  function clearCart() {
    setItems([])
    setAppliedPromoCode(null)
  }

  function applyPromoCode(code: string) {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      return { success: false, message: 'Please enter a promo code.' }
    }

    if (VALID_PROMOS[trimmed] !== undefined) {
      setAppliedPromoCode(trimmed)
      return { success: true, message: `Promo code "${trimmed}" applied!` }
    }

    return { success: false, message: 'Invalid promo code. Try "SAVE10" or "STORE20".' }
  }

  function removePromoCode() {
    setAppliedPromoCode(null)
  }

  // Calculated totals
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  // Free shipping on orders over $50, else $10 flat (if cart has items)
  const shippingCost = items.length === 0 ? 0 : subtotal >= 50 ? 0 : 10

  // Calculate discount
  let discountAmount = 0
  if (appliedPromoCode && VALID_PROMOS[appliedPromoCode]) {
    const promoVal = VALID_PROMOS[appliedPromoCode]
    discountAmount = promoVal < 1 ? subtotal * promoVal : Math.min(subtotal, promoVal)
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount)
  const estimatedTax = items.length === 0 ? 0 : taxableAmount * 0.08 // 8% sales tax
  const orderTotal = Math.max(0, taxableAmount + shippingCost + estimatedTax)

  return (
    <CartContext.Provider
      value={{
        items,
        totalItemsCount,
        subtotal,
        shippingCost,
        estimatedTax,
        orderTotal,
        discountAmount,
        appliedPromoCode,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyPromoCode,
        removePromoCode,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
