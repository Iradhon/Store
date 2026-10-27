import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useOrder } from '../context/useOrder'
import { formatMoney } from '../lib/money'
import './styles/admin.css'

export default function AdminOrders() {
  const { orders, isLoading, error, refresh } = useOrder()

  return (
    <div className="admin-section">
      <header className="admin-page-heading">
        <div className="admin-page-heading__title"><Link className="admin-back" to="/admin" aria-label="Back to overview"><ArrowLeft size={21} /></Link><h1>Orders</h1></div>
        <button className="admin-button" type="button" onClick={() => void refresh()}>Refresh</button>
      </header>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      {isLoading ? <p className="admin-muted" role="status">Loading orders…</p> : orders.length === 0 ? (
        <div className="admin-panel admin-empty"><h2>No orders yet</h2><p>Orders will appear here as customers place them.</p></div>
      ) : (
        <div className="admin-panel admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Fulfillment</th><th /></tr></thead>
            <tbody>{orders.map((order) => (
              <tr key={order.id}>
                <td><strong>#{order.id.slice(0, 8).toUpperCase()}</strong></td>
                <td>{order.shippingAddress.fullName || order.shippingAddress.email || 'Customer'}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>{formatMoney(order.totalMinor, order.currency)}</td>
                <td><span className="admin-status">{order.paymentStatus.replaceAll('_', ' ')}</span></td>
                <td><span className="admin-status">{order.fulfillmentStatus.replaceAll('_', ' ')}</span></td>
                <td><Link className="admin-icon-button" to={`/orders/${order.id}`} aria-label={`View order ${order.id}`}><ExternalLink size={17} /></Link></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
