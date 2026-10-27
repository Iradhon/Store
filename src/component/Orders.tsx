import { Link, useLocation } from 'react-router-dom'
import { Package, ArrowRight, MapPin, RefreshCw } from 'lucide-react'
import { useOrder } from '../context/useOrder'
import { useAuth } from '../context/useAuth'
import { formatMoney } from '../lib/money'
import './styles/orders.css'

export default function Orders() {
  const location = useLocation()
  const orderBasePath = location.pathname.startsWith('/account') ? '/account/orders' : '/orders'
  const { orders, isLoading, error, refresh } = useOrder()
  const { user } = useAuth()

  if (!user) {
    return (
      <section className="orders-page">
        <div className="orders-container orders-empty">
          <h1>Sign in to view your orders</h1>
          <p>Order history is private to the account that placed the order.</p>
          <Link to="/auth" className="orders-empty__btn">Sign In</Link>
        </div>
      </section>
    )
  }

  if (isLoading) {
    return <section className="orders-page" aria-live="polite">Loading order history…</section>
  }

  if (error) {
    return (
      <section className="orders-page">
        <div className="orders-container orders-empty" role="alert">
          <h1>Order history unavailable</h1>
          <p>{error}</p>
          <button type="button" className="orders-empty__btn" onClick={() => void refresh()}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </section>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className="orders-empty">
            <div className="orders-empty__icon"><Package size={36} /></div>
            <h1>No orders recorded</h1>
            <p>Orders placed with this account will appear here.</p>
            <Link to="/products" className="orders-empty__btn">
              Browse Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <div>
            <h1 className="orders-title">Order History</h1>
            <p className="orders-subtitle">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
          </div>
          <Link to="/products" className="orders-shop-link"><span>Browse Products</span><ArrowRight size={16} /></Link>
        </div>

        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-history-card" key={order.id}>
              <div className="order-history-card__header">
                <div className="order-header-meta">
                  <div>
                    <span className="order-meta-title">Created</span>
                    <span className="order-meta-val">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="order-meta-title">Total</span>
                    <span className="order-meta-val">{formatMoney(order.totalMinor, order.currency)}</span>
                  </div>
                  <div>
                    <span className="order-meta-title">Payment</span>
                    <span className="order-meta-val">{order.paymentStatus.replaceAll('_', ' ')}</span>
                  </div>
                </div>
                <div className="order-header-right">
                  <span className="order-status-badge">{order.fulfillmentStatus.replaceAll('_', ' ')}</span>
                  <span className="order-id-label">#{order.id}</span>
                </div>
              </div>

              <div className="order-history-card__body">
                <div className="order-history-items">
                  {order.items.map((item) => (
                    <div className="order-history-item" key={item.id}>
                      <div className="order-item-thumb">
                        <img src={item.productImageUrl ?? '/product-placeholder.svg'} alt="" />
                      </div>
                      <div className="order-item-desc">
                        <span className="order-item-name">{item.productName}</span>
                        <span className="order-item-qty">Qty: {item.quantity} · {formatMoney(item.unitPriceMinor, item.currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-history-card__actions">
                  <Link to={`${orderBasePath}/${order.id}`} className="order-view-receipt-btn">
                    <span>View Order</span><ArrowRight size={14} />
                  </Link>
                  <div className="order-shipping-summary">
                    <MapPin size={14} />
                    <span>{order.shippingAddress.city}, {order.shippingAddress.country}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
