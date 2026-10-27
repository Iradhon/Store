import { useEffect, useRef, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { WishlistContext } from './useWishlist'

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const userId = user?.id ?? null
  const requestSequence = useRef(0)
  const [state, setState] = useState<{
    userId: string | null
    productIds: string[]
    isLoading: boolean
    error: string | null
  }>({ userId: null, productIds: [], isLoading: false, error: null })
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [noticeTone, setNoticeTone] = useState<'success' | 'error'>('success')

  useEffect(() => {
    if (isAuthLoading) return

    const requestId = ++requestSequence.current
    if (!userId) {
      setState({ userId: null, productIds: [], isLoading: false, error: null })
      setPendingProductIds([])
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      setState({
        userId,
        productIds: [],
        isLoading: false,
        error: 'Wishlist storage is not configured.',
      })
      return
    }

    setState({ userId, productIds: [], isLoading: true, error: null })
    setPendingProductIds([])
    let active = true
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('wishlist_items')
          .select('product_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (!active || requestSequence.current !== requestId) return
        setState({
          userId,
          productIds: data?.map((item) => item.product_id) ?? [],
          isLoading: false,
          error: error ? 'Your wishlist could not be loaded. Apply the latest Supabase migrations and try again.' : null,
        })
      } catch {
        if (!active || requestSequence.current !== requestId) return
        setState({ userId, productIds: [], isLoading: false, error: 'Your wishlist could not be loaded. Check your connection and try again.' })
      }
    })()

    return () => {
      active = false
      requestSequence.current += 1
    }
  }, [isAuthLoading, userId])

  function showNotice(message: string, tone: 'success' | 'error') {
    setNotice(message)
    setNoticeTone(tone)
    window.setTimeout(() => setNotice((current) => current === message ? null : current), 3500)
  }

  async function toggleProduct(productId: string) {
    if (!userId) {
      const error = 'Sign in to save products to your wishlist.'
      showNotice(error, 'error')
      return { success: false, error }
    }
    if (!supabase || state.userId !== userId || state.isLoading) {
      const error = state.error ?? 'Your wishlist is still loading. Please try again.'
      showNotice(error, 'error')
      return { success: false, error }
    }
    if (pendingProductIds.includes(productId)) return { success: false, error: 'This wishlist update is already in progress.' }

    const removing = state.productIds.includes(productId)
    setPendingProductIds((current) => [...current, productId])
    let resultError = false
    try {
      const result = removing
        ? await supabase.from('wishlist_items').delete().eq('user_id', userId).eq('product_id', productId)
        : await supabase.from('wishlist_items').insert({ product_id: productId })
      resultError = Boolean(result.error)
    } catch {
      resultError = true
    }
    setPendingProductIds((current) => current.filter((id) => id !== productId))

    if (resultError) {
      const error = 'Your wishlist could not be updated. Please try again.'
      showNotice(error, 'error')
      return { success: false, error }
    }

    setState((current) => {
      if (current.userId !== userId) return current
      const productIds = removing
        ? current.productIds.filter((id) => id !== productId)
        : current.productIds.includes(productId) ? current.productIds : [productId, ...current.productIds]
      return { ...current, productIds }
    })
    showNotice(removing ? 'Removed from your wishlist.' : 'Saved to your wishlist.', 'success')
    return { success: true }
  }

  const stateMatchesUser = state.userId === userId
  const value = {
    productIds: stateMatchesUser ? state.productIds : [],
    isLoading: isAuthLoading || Boolean(userId && (!stateMatchesUser || state.isLoading)),
    error: stateMatchesUser ? state.error : null,
    notice,
    noticeTone,
    pendingProductIds,
    isWishlisted: (productId: string) => stateMatchesUser && state.productIds.includes(productId),
    toggleProduct,
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
