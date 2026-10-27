import { useEffect, useRef, useState, type ReactNode } from 'react'
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
  const itemsRef = useRef(items)
  const [cartNotice, setCartNotice] = useState<string | null>(null)

  function commitItems(nextItems: CartItem[]) {
    itemsRef.current = nextItems
    setItems(nextItems)
  }

  useEffect(() => {
    if (isCatalogLoading || catalogError) return

    const currentProducts = new Map(products.map((product) => [product.id, product]))
    const nextItems: CartItem[] = []
    let removedCount = 0
    let reducedQuantity = 0
    let changed = false

    for (const item of items) {
      const currentProduct = currentProducts.get(item.product.id)
      const quantity = currentProduct ? Math.min(item.quantity, currentProduct.inventoryQuantity, 99) : 0
      if (!currentProduct || quantity <= 0) {
        removedCount += 1
        reducedQuantity += item.quantity
        changed = true
        continue
      }
      if (quantity < item.quantity) reducedQuantity += item.quantity - quantity
      if (item.product.updatedAt !== currentProduct.updatedAt || quantity !== item.quantity) changed = true
      nextItems.push({ product: currentProduct, quantity })
    }

    if (changed) {
      // oxlint-disable-next-line react/set-state-in-effect -- Reconcile persisted cart snapshots after loading the authoritative catalog.
      commitItems(nextItems)
      if (reducedQuantity > 0) {
        setCartNotice(removedCount > 0
          ? `${removedCount} unavailable ${removedCount === 1 ? 'product was' : 'products were'} removed and cart quantities were adjusted to current stock.`
          : 'Cart quantities were reduced to match current stock.')
      }
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
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { addedQuantity: 0, remainingQuantity: 0, inventoryRemainingQuantity: product.inventoryQuantity }
    }

    const currentItems = itemsRef.current
    const existingIndex = currentItems.findIndex((item) => item.product.id === product.id)
    const maxQuantity = Math.min(99, Math.max(0, product.inventoryQuantity))
    const alreadyInCart = existingIndex >= 0 ? currentItems[existingIndex].quantity : 0
    const availableToAdd = Math.max(0, maxQuantity - alreadyInCart)
    const addedQuantity = Math.min(quantity, availableToAdd)

    if (addedQuantity > 0) {
      if (existingIndex >= 0) {
        const updated = [...currentItems]
        updated[existingIndex] = { product, quantity: alreadyInCart + addedQuantity }
        commitItems(updated)
      } else {
        commitItems([...currentItems, { product, quantity: addedQuantity }])
      }
    }

    const quantityInCart = alreadyInCart + addedQuantity
    return {
      addedQuantity,
      remainingQuantity: Math.max(0, maxQuantity - quantityInCart),
      inventoryRemainingQuantity: Math.max(0, product.inventoryQuantity - quantityInCart),
    }
  }

  function removeFromCart(productId: string) {
    commitItems(itemsRef.current.filter((item) => item.product.id !== productId))
  }

  function updateQuantity(productId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      removeFromCart(productId)
      return
    }

    commitItems(itemsRef.current.flatMap((item) => {
      if (item.product.id !== productId) return [item]
      const maxQuantity = Math.min(99, item.product.inventoryQuantity)
      return maxQuantity === 0 ? [] : [{ ...item, quantity: Math.min(quantity, maxQuantity) }]
    }))
  }

  function clearCart() {
    commitItems([])
    setCartNotice(null)
  }

  const totalItemsCount = items.reduce((total, item) => total + item.quantity, 0)
  const distinctProductCount = items.length
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
        distinctProductCount,
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
