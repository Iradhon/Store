import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Heart, LayoutDashboard, MapPin, Package, UserRound } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import './styles/account.css'

const accountLinks = [
  { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package, end: false },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart, end: false },
  { to: '/account/profile', label: 'Profile & Password', icon: UserRound, end: false },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin, end: false },
]

export default function AccountLayout() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <div className="account-loading" role="status">Loading your account…</div>
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />

  return (
    <div className="account-shell">
      <aside className="account-sidebar" aria-label="Account navigation">
        <p className="account-sidebar__eyebrow">MY ACCOUNT</p>
        <nav className="account-sidebar__nav">
          {accountLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `account-sidebar__link${isActive ? ' is-active' : ''}`}>
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="account-content" aria-live="polite">
        <Outlet />
      </section>
    </div>
  )
}
