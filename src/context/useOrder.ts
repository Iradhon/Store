import { createContext, useContext } from 'react'
import type { Order } from '../types'

export interface OrderContextType {
  orders: Order[]
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => Order
  getOrder: (orderId: string) => Order | undefined
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function useOrder() {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider')
  }
  return context
}
