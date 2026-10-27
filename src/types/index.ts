export interface Product {
  id: string
  slug: string
  sku: string | null
  name: string
  category: string
  priceMinor: number
  currency: string
  description: string
  imageUrl: string | null
  imageUrls: string[]
  inventoryQuantity: number
  isPublished: boolean
  featured: boolean
  createdAt: string
  updatedAt: string
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

export type PaymentStatus = 'not_configured' | 'pending' | 'authorized' | 'paid' | 'failed' | 'cancelled' | 'refunded'
export type FulfillmentStatus = 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: string
  productId: string | null
  productName: string
  productSku: string | null
  productImageUrl: string | null
  quantity: number
  unitPriceMinor: number
  currency: string
}

export interface Order {
  id: string
  userId: string
  createdAt: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  shippingMethod: string | null
  currency: string
  subtotalMinor: number
  shippingMinor: number
  discountMinor: number
  taxMinor: number
  totalMinor: number
  paymentStatus: PaymentStatus
  fulfillmentStatus: FulfillmentStatus
}

export interface UserProfile {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  phone?: string
  role?: 'admin' | 'customer'
  createdAt?: string
}
