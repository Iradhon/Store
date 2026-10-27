import { createContext, useContext } from 'react'

export interface WishlistContextType {
  productIds: string[]
  isLoading: boolean
  error: string | null
  notice: string | null
  noticeTone: 'success' | 'error'
  pendingProductIds: string[]
  isWishlisted: (productId: string) => boolean
  toggleProduct: (productId: string) => Promise<{ success: boolean; error?: string }>
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider')
  return context
}
