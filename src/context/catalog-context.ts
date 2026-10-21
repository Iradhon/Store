import { createContext } from 'react'
import type { Product } from '../types'

export interface CatalogContextValue {
  products: Product[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export const CatalogContext = createContext<CatalogContextValue | undefined>(undefined)
