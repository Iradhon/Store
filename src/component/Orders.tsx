import { Link } from 'react-router-dom'
import { Package, ArrowRight, MapPin } from 'lucide-react'
import { useOrder } from '../context/useOrder'
import './styles/orders.css'

export default function Orders() {
  const { orders } = useOrder()

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className="orders-empty">
            <div className="orders-empty__icon">
              <Package size={36} />
            </div>
            <h2>No Orders Yet</h2>
            <p>
              When you place an order with us, you will be able to track and view your order history right here.
            </p>
            <Link to="/products" className="orders-empty__btn">
              <span>Start Shopping</span>
              <ArrowRight size={16} />
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
            <p className="orders-subtitle">
              You have placed {orders.length} {orders.length === 1 ? 'order' : 'orders'}.
            </p>
          </div>
          <Link to="/products" className="orders-shop-link">
            <span>Shop More</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-history-card" key={order.id}>
              <div className="order-history-card__header">
                <div className="order-header-meta">
                  <div>
                    <span className="order-meta-title">Order Placed</span>
                    <span className="order-meta-val">{formatDate(order.createdAt)}</span>
                  </div>
                  <div>
                    <span className="order-meta-title">Total</span>
                    <span className="order-meta-val">{formatCurrency(order.total)}</span>
                  </div>
                  <div>
                    <span className="order-meta-title">Ship To</span>
                    <span className="order-meta-val">{order.shippingAddress.fullName}</span>
                  </div>
                </div>

                <div className="order-header-right">
                  <span className={`order-status-badge order-status-badge--${order.status}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <span className="order-id-label">#{order.id}</span>
                </div>
              </div>

              <div className="order-history-card__body">
                <div className="order-history-items">
                  {order.items.map(({ product, quantity }) => (
                    <div className="order-history-item" key={product.id}>
                      <Link to={`/products/${product.id}`} className="order-item-thumb">
                        <img src={product.image} alt={product.name} />
                      </Link>
                      <div className="order-item-desc">
                        <Link to={`/products/${product.id}`} className="order-item-name">
                          {product.name}
                        </Link>
                        <span className="order-item-qty">Qty: {quantity} • {formatCurrency(product.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-history-card__actions">
                  <Link to={`/order-success/${order.id}`} className="order-view-receipt-btn">
                    <span>View Receipt</span>
                    <ArrowRight size={14} />
                  </Link>

                  <div className="order-shipping-summary">
                    <MapPin size={14} />
                    <span>
                      {order.shippingAddress.city}, {order.shippingAddress.country}
                    </span>
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
