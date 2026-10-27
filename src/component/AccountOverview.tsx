import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useOrder } from '../context/useOrder'
import { useWishlist } from '../context/useWishlist'
import { useCatalog } from '../context/useCatalog'
import { formatMoney } from '../lib/money'

export default function AccountOverview() {
  const { user } = useAuth()
  const { orders, isLoading: ordersLoading, error: ordersError } = useOrder()
  const { productIds, isLoading: wishlistLoading, error: wishlistError } = useWishlist()
  const { products } = useCatalog()
  const paidTotals = orders
    .filter((order) => order.paymentStatus === 'paid')
    .reduce<Record<string, number>>((totals, order) => {
      totals[order.currency] = (totals[order.currency] ?? 0) + order.totalMinor
      return totals
    }, {})
  const displayCurrency = orders[0]?.currency ?? products[0]?.currency
  const totalSpent = Object.entries(paidTotals).map(([currency, amount]) => formatMoney(amount, currency)).join(' · ')
  const firstName = user?.fullName?.trim().split(/\s+/)[0]

  return (
    <div>
      <h1 className="account-page-title">Welcome{firstName ? `, ${firstName}` : ''}</h1>

      <div className="account-stats">
        <article className="account-stat">
          <span className="account-stat__label">Orders</span>
          <strong className="account-stat__value">{ordersLoading || ordersError ? '—' : orders.length}</strong>
        </article>
        <article className="account-stat">
          <span className="account-stat__label">Total spent</span>
          <strong className="account-stat__value">{ordersLoading || ordersError ? '—' : totalSpent || (displayCurrency ? formatMoney(0, displayCurrency) : '—')}</strong>
        </article>
        <article className="account-stat">
          <span className="account-stat__label">Wishlist</span>
          <strong className="account-stat__value">{wishlistLoading || wishlistError ? '—' : productIds.length}</strong>
        </article>
      </div>

      <section className="account-panel">
        <div className="account-toolbar">
          <h2 className="account-panel__heading">Recent orders</h2>
          {orders.length > 0 && <Link className="account-link-button" to="/account/orders">View all orders</Link>}
        </div>
        {ordersLoading ? (
          <p className="account-muted" role="status">Loading order history…</p>
        ) : ordersError ? (
          <p className="account-feedback" role="alert">{ordersError}</p>
        ) : orders.length === 0 ? (
          <p className="account-muted">No orders yet. <Link to="/products">Start shopping</Link></p>
        ) : (
          <div className="account-recent-list">
            {orders.slice(0, 3).map((order) => (
              <Link className="account-recent-order" key={order.id} to={`/account/orders/${order.id}`}>
                <span className="account-recent-order__details">
                  <span className="account-recent-order__id">Order #{order.id.slice(0, 8)}</span>
                  <span className="account-muted">{new Date(order.createdAt).toLocaleDateString()}</span>
                </span>
                <span className="account-recent-order__total">
                  <span className="account-recent-order__amount">{formatMoney(order.totalMinor, order.currency)}</span>
                  <span className="account-recent-order__status">{order.fulfillmentStatus.replaceAll('_', ' ')}</span>
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
