import { useParams, Link } from 'react-router-dom'
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  CreditCard,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react'
import { useOrder } from '../context/useOrder'
import './styles/orderSuccess.css'

export default function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>()
  const { getOrder } = useOrder()

  const order = orderId ? getOrder(orderId) : undefined

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

  if (!order) {
    return (
      <div className="order-success-page">
        <div className="order-not-found-card">
          <h2>Order Not Found</h2>
          <p>We couldn't find the details for order #{orderId}.</p>
          <Link to="/orders" className="btn-primary">
            View All Orders
          </Link>
        </div>
      </div>
    )
  }

  // Calculate estimated delivery date (4 business days from creation)
  const orderDate = new Date(order.createdAt)
  const estimatedDelivery = new Date(orderDate)
  estimatedDelivery.setDate(orderDate.getDate() + (order.shippingMethod === 'express' ? 2 : 4))
  const formattedDelivery = estimatedDelivery.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="order-success-page">
      <div className="order-success-container">
        {/* Success Celebration Header */}
        <div className="order-success-header">
          <div className="order-success-icon" aria-hidden="true">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="order-success-title">Thank You for Your Order!</h1>
          <p className="order-success-subtitle">
            A confirmation receipt has been sent to <strong>{order.shippingAddress.email}</strong>.
          </p>
          <div className="order-id-badge">
            <span>Order ID:</span>
            <strong>{order.id}</strong>
          </div>
        </div>

        {/* Estimated Delivery Notice */}
        <div className="delivery-banner">
          <div className="delivery-banner__icon">
            <Truck size={24} />
          </div>
          <div className="delivery-banner__text">
            <h3>Estimated Delivery: {formattedDelivery}</h3>
            <p>
              Your order is currently <strong>{order.status.toUpperCase()}</strong>. We will notify you once your package ships.
            </p>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="order-details-grid">
          {/* Shipping & Payment Summary */}
          <div className="order-info-cards">
            <div className="order-card">
              <div className="order-card__header">
                <MapPin size={18} />
                <h3>Shipping Address</h3>
              </div>
              <p className="order-card__name">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p>Tel: {order.shippingAddress.phone}</p>}
            </div>

            <div className="order-card">
              <div className="order-card__header">
                <CreditCard size={18} />
                <h3>Shipping & Payment</h3>
              </div>
              <div className="order-card__meta">
                <div>
                  <span className="order-meta-label">Shipping Method:</span>
                  <p>
                    {order.shippingMethod === 'express'
                      ? 'Express Priority (1–2 days)'
                      : 'Standard Delivery (3–5 days)'}
                  </p>
                </div>
                <div>
                  <span className="order-meta-label">Payment Method:</span>
                  <p>{order.paymentMethod === 'card' ? 'Credit / Debit Card' : 'PayPal'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Purchased Items List & Totals */}
          <div className="order-card order-card--items">
            <div className="order-card__header">
              <Package size={18} />
              <h3>Items Purchased ({order.items.length})</h3>
            </div>

            <div className="order-items-list">
              {order.items.map(({ product, quantity }) => (
                <div className="order-item-row" key={product.id}>
                  <img src={product.image} alt={product.name} className="order-item-img" />
                  <div className="order-item-info">
                    <h4>{product.name}</h4>
                    <span className="order-item-qty">Qty: {quantity}</span>
                  </div>
                  <span className="order-item-price">
                    {formatCurrency(product.price * quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="order-totals-breakdown">
              <div className="totals-row">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="totals-row totals-row--discount">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="totals-row">
                <span>Shipping</span>
                <span>{order.shippingCost === 0 ? 'FREE' : formatCurrency(order.shippingCost)}</span>
              </div>
              <div className="totals-row">
                <span>Sales Tax (8%)</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="totals-divider" />
              <div className="totals-row totals-row--final">
                <span>Total Paid</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="order-success-actions">
          <Link to="/orders" className="btn-secondary">
            <span>View All Orders</span>
          </Link>
          <Link to="/products" className="btn-primary">
            <ShoppingBag size={16} />
            <span>Continue Shopping</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
