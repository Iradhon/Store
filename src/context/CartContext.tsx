import { useEffect, useState, type ReactNode } from 'react'
import type { CartItem, Product } from '../types'
import { CartContext } from './useCart'
import { useCatalog } from './useCatalog'

const CART_STORAGE_KEY = 'store_cart_v2'

function readCart(): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is CartItem =>
      typeof item === 'object' && item !== null &&
      'product' in item && typeof item.product === 'object' && item.product !== null &&
      'id' in item.product && typeof item.product.id === 'string' &&
      'priceMinor' in item.product && typeof item.product.priceMinor === 'number' &&
      'quantity' in item && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99,
    )
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, isLoading: isCatalogLoading, error: catalogError } = useCatalog()
  const [items, setItems] = useState<CartItem[]>(readCart)
  const [cartNotice, setCartNotice] = useState<string | null>(null)

  useEffect(() => {
    if (isCatalogLoading || catalogError) return

    const currentProducts = new Map(products.map((product) => [product.id, product]))
    const nextItems: CartItem[] = []
    let removedCount = 0
    let changed = false

    for (const item of items) {
      const currentProduct = currentProducts.get(item.product.id)
      const quantity = currentProduct ? Math.min(item.quantity, currentProduct.inventoryQuantity, 99) : 0
      if (!currentProduct || quantity <= 0) {
        removedCount += 1
        changed = true
        continue
      }
      if (item.product.updatedAt !== currentProduct.updatedAt || quantity !== item.quantity) changed = true
      nextItems.push({ product: currentProduct, quantity })
    }

    if (changed) {
      // oxlint-disable-next-line react/set-state-in-effect -- Reconcile persisted cart snapshots after loading the authoritative catalog.
      setItems(nextItems)
      if (removedCount > 0) setCartNotice(`${removedCount} unavailable cart ${removedCount === 1 ? 'item was' : 'items were'} removed.`)
    }
  }, [catalogError, isCatalogLoading, items, products])

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Cart state remains usable for the current page session when storage is unavailable.
    }
  }, [items])

  function addToCart(product: Product, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity <= 0 || product.inventoryQuantity <= 0) return

    setItems((previousItems) => {
      const existingIndex = previousItems.findIndex((item) => item.product.id === product.id)
      const maxQuantity = Math.min(99, product.inventoryQuantity)

      if (existingIndex >= 0) {
        const updated = [...previousItems]
        const oldItem = updated[existingIndex]
        updated[existingIndex] = {
          product,
          quantity: Math.min(oldItem.quantity + quantity, maxQuantity),
        }
        return updated
      }

      return [...previousItems, { product, quantity: Math.min(quantity, maxQuantity) }]
    })
  }

  function removeFromCart(productId: string) {
    setItems((current) => current.filter((item) => item.product.id !== productId))
  }

  function updateQuantity(productId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems((current) => current.flatMap((item) => {
      if (item.product.id !== productId) return [item]
      const maxQuantity = Math.min(99, item.product.inventoryQuantity)
      return maxQuantity === 0 ? [] : [{ ...item, quantity: Math.min(quantity, maxQuantity) }]
    }))
  }

  function clearCart() {
    setItems([])
    setCartNotice(null)
  }

  const totalItemsCount = items.reduce((total, item) => total + item.quantity, 0)
  const subtotalMinorByCurrency = items.reduce<Record<string, number>>((totals, item) => {
    totals[item.product.currency] = (totals[item.product.currency] ?? 0) + item.product.priceMinor * item.quantity
    return totals
  }, {})
  const clearCartNotice = () => setCartNotice(null)

  return (
    <CartContext.Provider
      value={{
        items,
        totalItemsCount,
        subtotalMinorByCurrency,
        isCatalogLoading,
        catalogError,
        cartNotice,
        clearCartNotice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
