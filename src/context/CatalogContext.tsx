import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Product } from '../types'
import { getPublishedProducts } from '../services/productService'
import { CatalogContext } from './catalog-context'

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setProducts(await getPublishedProducts())
    } catch (cause) {
      setProducts([])
      setError(cause instanceof Error ? cause.message : 'The product catalog could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadCatalog() {
      try {
        const nextProducts = await getPublishedProducts()
        if (active) setProducts(nextProducts)
      } catch (cause) {
        if (active) {
          setProducts([])
          setError(cause instanceof Error ? cause.message : 'The product catalog could not be loaded.')
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadCatalog()
    return () => { active = false }
  }, [])

  return (
    <CatalogContext.Provider value={{ products, isLoading, error, refresh }}>
      {children}
    </CatalogContext.Provider>
  )
}
