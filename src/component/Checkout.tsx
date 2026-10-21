import { Link } from 'react-router-dom'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { useCart } from '../context/useCart'
import './styles/checkout.css'

export default function Checkout() {
  const { items } = useCart()

  return (
    <section className="checkout-page" aria-labelledby="checkout-title">
      <div className="checkout-container">
        <Link to="/cart" className="checkout-back-link">
          <ArrowLeft size={16} />
          <span>Return to Cart</span>
        </Link>
        <div className="checkout-empty__card" role="status">
          <LockKeyhole size={32} aria-hidden="true" />
          <h1 id="checkout-title">Checkout is not available yet</h1>
          <p>
            {items.length > 0
              ? 'No order or charge will be created. Payment, launch market, tax, and delivery rules must be configured before checkout can open.'
              : 'Your cart is empty. Add products before checkout is enabled.'}
          </p>
          <Link to={items.length > 0 ? '/cart' : '/products'} className="checkout-empty__btn">
            {items.length > 0 ? 'Review Cart' : 'Browse Products'}
          </Link>
        </div>
      </div>
    </section>
  )
}
