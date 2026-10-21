import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Json, Database } from '../types/database'
import type { Order, OrderItem, ShippingAddress } from '../types'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { OrderContext } from './useOrder'

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderItemRow = Database['public']['Tables']['order_items']['Row']

function stringField(value: Json | undefined): string {
  return typeof value === 'string' ? value : ''
}

function mapAddress(value: Json): ShippingAddress {
  const address = typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, Json | undefined>
    : {}

  return {
    fullName: stringField(address.fullName),
    email: stringField(address.email),
    phone: stringField(address.phone),
    street: stringField(address.street),
    city: stringField(address.city),
    state: stringField(address.state),
    zipCode: stringField(address.zipCode),
    country: stringField(address.country),
  }
}

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productSku: row.product_sku,
    productImageUrl: row.product_image_url,
    quantity: row.quantity,
    unitPriceMinor: Number(row.unit_price_minor),
    currency: row.currency,
  }
}

function mapOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    items,
    shippingAddress: mapAddress(row.shipping_address),
    shippingMethod: row.shipping_method,
    currency: row.currency,
    subtotalMinor: Number(row.subtotal_minor),
    shippingMinor: Number(row.shipping_minor),
    discountMinor: Number(row.discount_minor),
    taxMinor: Number(row.tax_minor),
    totalMinor: Number(row.total_minor),
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
  }
}

async function fetchOrdersForUser(): Promise<{ orders: Order[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { orders: [], error: 'Order history is not configured.' }
  }

  try {
    const { data: orderRows, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (orderError) return { orders: [], error: 'Order history could not be loaded.' }
    if (!orderRows?.length) return { orders: [], error: null }

    const { data: itemRows, error: itemError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderRows.map((row) => row.id))

    if (itemError) return { orders: [], error: 'Order items could not be loaded.' }

    const itemsByOrder = new Map<string, OrderItem[]>()
    for (const row of itemRows ?? []) {
      const items = itemsByOrder.get(row.order_id) ?? []
      items.push(mapOrderItem(row))
      itemsByOrder.set(row.order_id, items)
    }

    return {
      orders: orderRows.map((row) => mapOrder(row, itemsByOrder.get(row.id) ?? [])),
      error: null,
    }
  } catch {
    return { orders: [], error: 'Order history could not be loaded.' }
  }
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const userId = user?.id ?? null
  const requestSequence = useRef(0)
  const [state, setState] = useState<{
    userId: string | null
    orders: Order[]
    isLoading: boolean
    error: string | null
  }>({ userId: null, orders: [], isLoading: true, error: null })

  const refresh = useCallback(async () => {
    if (isAuthLoading || !userId) return
    const requestId = ++requestSequence.current
    setState((current) => ({ ...current, userId, isLoading: true, error: null }))
    const result = await fetchOrdersForUser()
    if (requestSequence.current !== requestId) return
    setState({ userId, ...result, isLoading: false })
  }, [isAuthLoading, userId])

  useEffect(() => {
    if (isAuthLoading || !userId) return

    let active = true
    const requestId = ++requestSequence.current
    async function loadInitialOrders() {
      const result = await fetchOrdersForUser()
      if (!active || requestSequence.current !== requestId) return
      setState({ userId, ...result, isLoading: false })
    }

    void loadInitialOrders()
    return () => {
      active = false
      requestSequence.current += 1
    }
  }, [isAuthLoading, userId])

  const stateMatchesUser = state.userId === userId
  const orders = stateMatchesUser ? state.orders : []

  function getOrder(orderId: string) {
    return orders.find((order) => order.id === orderId)
  }

  return (
    <OrderContext.Provider value={{
      orders,
      isLoading: isAuthLoading || !stateMatchesUser || state.isLoading,
      error: stateMatchesUser ? state.error : null,
      refresh: () => refresh(),
      getOrder,
    }}>
      {children}
    </OrderContext.Provider>
  )
}
