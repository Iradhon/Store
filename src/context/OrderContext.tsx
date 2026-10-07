import { useEffect, useState, type ReactNode } from 'react'
import type { Order } from '../types'
import { OrderContext } from './useOrder'

const ORDERS_STORAGE_KEY = 'store_orders_v1'

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
    } catch (e) {
      console.error('Failed to persist orders:', e)
    }
  }, [orders])

  function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Order {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: 'processing',
    }

    setOrders((prev) => [newOrder, ...prev])
    return newOrder
  }

  function getOrder(orderId: string): Order | undefined {
    return orders.find((o) => o.id === orderId)
  }

  return (
    <OrderContext.Provider value={{ orders, createOrder, getOrder }}>
      {children}
    </OrderContext.Provider>
  )
}
