import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Boxes, LayoutDashboard, ShoppingCart, Tag, UsersRound } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import './styles/admin.css'

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Boxes },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: UsersRound },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
]

export default function AdminLayout() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <main className="admin-page"><p role="status">Loading account…</p></main>
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="Admin navigation">
          <p className="admin-sidebar__label">Admin</p>
          <nav>
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin-sidebar__link${isActive ? ' is-active' : ''}`}>
                <Icon size={19} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <section className="admin-content">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
