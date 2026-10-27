import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, CreditCard, MapPin, Package } from 'lucide-react'
import { useOrder } from '../context/useOrder'
import { formatMoney } from '../lib/money'
import './styles/orderSuccess.css'

export default function OrderDetails() {
  const location = useLocation()
  const ordersPath = location.pathname.startsWith('/account') ? '/account/orders' : '/orders'
  const { orderId } = useParams<{ orderId: string }>()
  const { getOrder, isLoading, error } = useOrder()
  const order = orderId ? getOrder(orderId) : undefined

  if (isLoading) return <div className="order-success-page" role="status">Loading order…</div>

  if (error || !order) {
    return (
      <div className="order-success-page">
        <div className="order-not-found-card">
          <h1>Order not found</h1>
          <p>{error ?? 'This order is unavailable for the signed-in account.'}</p>
          <Link to={ordersPath} className="btn-primary">View Order History</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="order-success-page">
      <div className="order-success-container">
        <header className="order-success-header">
          <div className="order-success-icon"><Package size={36} /></div>
          <h1 className="order-success-title">Order Details</h1>
          <p className="order-success-subtitle">Order #{order.id}</p>
          <div className="order-id-badge">
            <span>Created:</span>
            <strong>{new Date(order.createdAt).toLocaleString()}</strong>
          </div>
        </header>

        <div className="order-details-grid">
          <div className="order-info-cards">
            <section className="order-card">
              <div className="order-card__header"><MapPin size={18} /><h2>Shipping Address</h2></div>
              <p className="order-card__name">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
              <p>{order.shippingAddress.country}</p>
            </section>

            <section className="order-card">
              <div className="order-card__header"><CreditCard size={18} /><h2>Order Status</h2></div>
              <p>Payment: <strong>{order.paymentStatus.replaceAll('_', ' ')}</strong></p>
              <p>Fulfillment: <strong>{order.fulfillmentStatus.replaceAll('_', ' ')}</strong></p>
              {order.shippingMethod && <p>Delivery method: {order.shippingMethod}</p>}
            </section>
          </div>

          <section className="order-card order-card--items">
            <div className="order-card__header"><Package size={18} /><h2>Items ({order.items.length})</h2></div>
            <div className="order-items-list">
              {order.items.map((item) => (
                <div className="order-item-row" key={item.id}>
                  <img src={item.productImageUrl ?? '/product-placeholder.svg'} alt="" className="order-item-img" />
                  <div className="order-item-info">
                    <h3>{item.productName}</h3>
                    <span className="order-item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="order-item-price">{formatMoney(item.unitPriceMinor * item.quantity, item.currency)}</span>
                </div>
              ))}
            </div>
            <div className="order-totals-breakdown">
              <div className="totals-row"><span>Subtotal</span><span>{formatMoney(order.subtotalMinor, order.currency)}</span></div>
              <div className="totals-row"><span>Shipping</span><span>{formatMoney(order.shippingMinor, order.currency)}</span></div>
              <div className="totals-row"><span>Tax</span><span>{formatMoney(order.taxMinor, order.currency)}</span></div>
              <div className="totals-divider" />
              <div className="totals-row totals-row--final"><span>Order Total</span><span>{formatMoney(order.totalMinor, order.currency)}</span></div>
            </div>
          </section>
        </div>

        <div className="order-success-actions">
          <Link to={ordersPath} className="btn-secondary"><ArrowLeft size={16} /><span>Order History</span></Link>
          <Link to="/products" className="btn-primary"><span>Browse Products</span></Link>
        </div>
      </div>
    </div>
  )
}
