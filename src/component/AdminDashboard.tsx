import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, Plus, ShoppingCart, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './styles/admin.css'

interface DashboardCounts {
  products: number
  orders: number
  pendingOrders: number
  categories: number
}

const initialCounts: DashboardCounts = { products: 0, orders: 0, pendingOrders: 0, categories: 0 }

export default function AdminDashboard() {
  const [counts, setCounts] = useState(initialCounts)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadCounts() {
      if (!supabase) {
        setError('Supabase is not configured.')
        setIsLoading(false)
        return
      }
      const [products, orders, pendingOrders, categories] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('fulfillment_status', 'unfulfilled'),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
      ])
      if (!active) return
      const failed = [products, orders, pendingOrders, categories].some((result) => result.error)
      if (failed) setError('Some dashboard totals could not be loaded. Apply the latest Supabase migration and try again.')
      setCounts({
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0,
        categories: categories.count ?? 0,
      })
      setIsLoading(false)
    }
    void loadCounts()
    return () => { active = false }
  }, [])

  const cards = [
    { label: 'Products', value: counts.products, icon: Boxes, tone: '' },
    { label: 'Total Orders', value: counts.orders, icon: ShoppingCart, tone: '' },
    { label: 'Pending Orders', value: counts.pendingOrders, icon: ShoppingCart, tone: 'is-pending' },
    { label: 'Categories', value: counts.categories, icon: Tag, tone: '' },
  ]

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      {isLoading && <p className="admin-muted" role="status">Loading store totals…</p>}
      <div className="admin-stat-grid">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article className="admin-stat-card" key={label}>
            <div className={`admin-stat-card__label ${tone}`}><Icon size={19} /><span>{label}</span></div>
            <strong>{isLoading ? '—' : value}</strong>
          </article>
        ))}
      </div>
      <section className="admin-panel admin-quick-actions" aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading">Quick Actions</h2>
        <div className="admin-quick-actions__links">
          <Link className="admin-button admin-button--primary" to="/admin/products?new=1"><Plus size={18} />Add Product</Link>
          <Link className="admin-button" to="/admin/products"><Boxes size={18} />Manage Products</Link>
          <Link className="admin-button" to="/admin/orders"><ShoppingCart size={18} />Manage Orders</Link>
          <Link className="admin-button" to="/admin/categories"><Tag size={18} />Manage Categories</Link>
        </div>
      </section>
    </div>
  )
}
