import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ShieldCheck,
  Tag,
  Check,
  X,
} from 'lucide-react'
import { useCart } from '../context/useCart'
import './styles/cart.css'

export default function Cart() {
  const {
    items,
    totalItemsCount,
    subtotal,
    shippingCost,
    estimatedTax,
    orderTotal,
    discountAmount,
    appliedPromoCode,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyPromoCode,
    removePromoCode,
  } = useCart()

  const [promoInput, setPromoInput] = useState('')
  const [promoFeedback, setPromoFeedback] = useState<{ success: boolean; message: string } | null>(
    null,
  )

  function handleApplyPromo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!promoInput.trim()) return

    const result = applyPromoCode(promoInput)
    setPromoFeedback(result)
    if (result.success) {
      setPromoInput('')
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

  if (items.length === 0) {
    return (
      <section className="cart-page" aria-labelledby="cart-title">
        <div className="cart-empty">
          <div className="cart-empty__icon" aria-hidden="true">
            <ShoppingBag size={32} />
          </div>
          <h1 id="cart-title" className="cart-empty__title">
            Your Cart is Empty
          </h1>
          <p className="cart-empty__message">
            Looks like you haven't added any quality items to your cart yet. Discover our curated collection!
          </p>
          <Link className="cart-empty__action" to="/products">
            <span>Explore Products</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="cart-page" aria-labelledby="cart-heading">
      <div className="cart-container">
        <div className="cart-header">
          <div>
            <h1 id="cart-heading" className="cart-title">
              Shopping Cart
            </h1>
            <p className="cart-subtitle">
              You have {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in your cart.
            </p>
          </div>
          <button
            type="button"
            className="cart-clear-btn"
            onClick={clearCart}
            aria-label="Clear all items from cart"
          >
            <Trash2 size={16} />
            <span>Clear Cart</span>
          </button>
        </div>

        <div className="cart-layout">
          {/* Left Column: Cart Items List */}
          <div className="cart-items-section">
            <div className="cart-items-list">
              {items.map(({ product, quantity }) => {
                const itemTotal = product.price * quantity

                return (
                  <article className="cart-item" key={product.id}>
                    <Link
                      to={`/products/${product.id}`}
                      className="cart-item__image-link"
                      aria-label={product.name}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="cart-item__image"
                      />
                    </Link>

                    <div className="cart-item__details">
                      <div className="cart-item__header">
                        <div>
                          <span className="cart-item__category">{product.category}</span>
                          <Link
                            to={`/products/${product.id}`}
                            className="cart-item__title-link"
                          >
                            <h2 className="cart-item__title">{product.name}</h2>
                          </Link>
                        </div>
                        <button
                          type="button"
                          className="cart-item__remove-btn"
                          onClick={() => removeFromCart(product.id)}
                          aria-label={`Remove ${product.name} from cart`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="cart-item__footer">
                        <div className="cart-item__stepper">
                          <button
                            type="button"
                            className="cart-stepper-btn"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="cart-stepper-val">{quantity}</span>
                          <button
                            type="button"
                            className="cart-stepper-btn"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="cart-item__pricing">
                          <span className="cart-item__unit-price">
                            {formatCurrency(product.price)} each
                          </span>
                          <span className="cart-item__total-price">
                            {formatCurrency(itemTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="cart-items-footer">
              <Link to="/products" className="cart-continue-btn">
                <ArrowLeft size={16} />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="cart-summary-section" aria-label="Order Summary">
            <div className="cart-summary-card">
              <h2 className="cart-summary-title">Order Summary</h2>

              {/* Promo Code Form */}
              <div className="cart-promo">
                {appliedPromoCode ? (
                  <div className="cart-promo__applied">
                    <div className="cart-promo__tag">
                      <Tag size={14} />
                      <span>Code: <strong>{appliedPromoCode}</strong> applied</span>
                    </div>
                    <button
                      type="button"
                      className="cart-promo__remove"
                      onClick={removePromoCode}
                      aria-label="Remove promo code"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <form className="cart-promo__form" onSubmit={handleApplyPromo}>
                    <input
                      type="text"
                      className="cart-promo__input"
                      placeholder="Promo code (e.g. SAVE10)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                    />
                    <button type="submit" className="cart-promo__btn">
                      Apply
                    </button>
                  </form>
                )}

                {promoFeedback && !appliedPromoCode && (
                  <p
                    className={`cart-promo__msg ${
                      promoFeedback.success ? 'cart-promo__msg--success' : 'cart-promo__msg--error'
                    }`}
                  >
                    {promoFeedback.message}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="cart-breakdown">
                <div className="cart-breakdown__row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="cart-breakdown__row cart-breakdown__row--discount">
                    <span>Discount ({appliedPromoCode})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="cart-breakdown__row">
                  <span>Estimated Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="cart-shipping-free">FREE</span>
                    ) : (
                      formatCurrency(shippingCost)
                    )}
                  </span>
                </div>

                {shippingCost > 0 && subtotal < 50 && (
                  <p className="cart-shipping-hint">
                    Add {formatCurrency(50 - subtotal)} more for free shipping!
                  </p>
                )}

                <div className="cart-breakdown__row">
                  <span>Estimated Tax (8%)</span>
                  <span>{formatCurrency(estimatedTax)}</span>
                </div>

                <div className="cart-breakdown__divider" />

                <div className="cart-breakdown__total">
                  <span>Total</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
              </div>

              {/* Checkout Action */}
              <Link to="/checkout" className="cart-checkout-btn">
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </Link>

              {/* Trust Badges */}
              <div className="cart-trust-badges">
                <div className="trust-badge">
                  <ShieldCheck size={16} className="trust-badge__icon" />
                  <span>Secure 256-bit encrypted checkout</span>
                </div>
                <div className="trust-badge">
                  <Check size={16} className="trust-badge__icon" />
                  <span>30-day money back guarantee</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}