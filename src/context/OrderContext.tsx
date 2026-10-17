import { useEffect, useState, type ReactNode } from 'react'
import type { Order } from '../types'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { OrderContext } from './useOrder'

const ORDERS_STORAGE_KEY = 'store_orders_v1'

async function syncOrderToSupabase(order: Order) {
  if (!isSupabaseConfigured || !supabase) return

  try {
    const { error: orderError } = await supabase.from('orders').insert({
      id: order.id,
      user_id: order.userId ?? null,
      shipping_address: order.shippingAddress,
      shipping_method: order.shippingMethod,
      payment_method: order.paymentMethod,
      subtotal: order.subtotal,
      shipping_cost: order.shippingCost,
      discount_amount: order.discountAmount,
      tax: order.tax,
      total: order.total,
      status: order.status,
      created_at: order.createdAt,
    })

    if (orderError) {
      console.warn('Supabase order insert error:', orderError)
      return
    }

    const orderItems = order.items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_image: item.product.image,
      quantity: item.quantity,
      unit_price: item.product.price,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) {
      console.warn('Supabase order_items insert error:', itemsError)
    }
  } catch (err) {
    console.warn('Failed to sync order to Supabase:', err)
  }
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Persist local orders
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
    syncOrderToSupabase(newOrder)

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
