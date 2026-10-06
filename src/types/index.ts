export interface Product {
  id: string
  name: string
  category: string
  price: number
  description: string
  image: string
  rating?: number
  reviewsCount?: number
  inStock?: boolean
  featured?: boolean
  createdAt: string
}

export interface CartItem {
  product: Product
  quantity: number
}
