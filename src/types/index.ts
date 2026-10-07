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

export interface ShippingAddress {
  fullName: string
  email: string
  phone: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export type ShippingMethod = 'standard' | 'express'
export type PaymentMethod = 'card' | 'paypal'

export interface Order {
  id: string
  createdAt: string
  items: CartItem[]
  shippingAddress: ShippingAddress
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethod
  subtotal: number
  shippingCost: number
  discountAmount: number
  tax: number
  total: number
  status: 'processing' | 'shipped' | 'delivered'
}
