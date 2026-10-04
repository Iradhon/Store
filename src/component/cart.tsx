import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import './styles/cart.css'

export default function Cart() {
  return (
    <section className="cart-page" aria-labelledby="cart-title">
      <div className="cart-empty">
        <div className="cart-empty__icon" aria-hidden="true">
          <ShoppingBag />
        </div>
        <h1 id="cart-title" className="cart-empty__title">
          Your Cart
        </h1>
        <p className="cart-empty__message">
          Sign in to view your cart and continue shopping.
        </p>
        <Link className="cart-empty__action" to="/auth">
          Sign In
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}