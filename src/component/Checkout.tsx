import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Truck,
  AlertCircle,
} from 'lucide-react'
import { useCart } from '../context/useCart'
import { useOrder } from '../context/useOrder'
import type { ShippingAddress, ShippingMethod, PaymentMethod } from '../types'
import './styles/checkout.css'

export default function Checkout() {
  const {
    items,
    subtotal,
    shippingCost: baseShippingCost,
    estimatedTax,
    discountAmount,
    appliedPromoCode,
    clearCart,
  } = useCart()

  const { createOrder } = useOrder()
  const navigate = useNavigate()

  // Form State
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  })

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')

  // Mock Card State
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Calculations with chosen shipping method
  const expressExtra = shippingMethod === 'express' ? 15 : 0
  const finalShippingCost = baseShippingCost + expressExtra
  const finalTotal = Math.max(0, subtotal - discountAmount + finalShippingCost + estimatedTax)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <div className="checkout-empty__card">
          <h2>Your Cart is Empty</h2>
          <p>Please add items to your cart before proceeding to checkout.</p>
          <Link to="/products" className="checkout-empty__btn">
            <ArrowLeft size={16} />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    )
  }

  function handleInputChange(field: keyof ShippingAddress, value: string) {
    setShippingAddress((prev) => ({ ...prev, [field]: value }))
    if (formError) setFormError(null)
  }

  function handleSubmitOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Validate mandatory fields
    if (
      !shippingAddress.fullName.trim() ||
      !shippingAddress.email.trim() ||
      !shippingAddress.street.trim() ||
      !shippingAddress.city.trim() ||
      !shippingAddress.state.trim() ||
      !shippingAddress.zipCode.trim()
    ) {
      setFormError('Please fill in all required shipping address fields.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (paymentMethod === 'card') {
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim()) {
        setFormError('Please fill in all credit card payment details.')
        return
      }
    }

    setIsSubmitting(true)
    setFormError(null)

    // Simulate payment processing
    setTimeout(() => {
      const order = createOrder({
        items: [...items],
        shippingAddress,
        shippingMethod,
        paymentMethod,
        subtotal,
        shippingCost: finalShippingCost,
        discountAmount,
        tax: estimatedTax,
        total: finalTotal,
      })

      clearCart()
      setIsSubmitting(false)
      navigate(`/order-success/${order.id}`)
    }, 1200)
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Header Breadcrumbs */}
        <div className="checkout-header">
          <Link to="/cart" className="checkout-back-link">
            <ArrowLeft size={16} />
            <span>Return to Cart</span>
          </Link>
          <h1 className="checkout-title">Secure Checkout</h1>
        </div>

        {formError && (
          <div className="checkout-error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{formError}</span>
          </div>
        )}

        <form className="checkout-grid" onSubmit={handleSubmitOrder}>
          {/* Left Column: Form Details */}
          <div className="checkout-main-forms">
            {/* 1. Contact & Shipping Address */}
            <section className="checkout-section">
              <div className="checkout-section__header">
                <span className="checkout-section__number">1</span>
                <h2>Shipping Address</h2>
              </div>

              <div className="form-grid">
                <div className="form-field form-field--full">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={shippingAddress.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={shippingAddress.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={shippingAddress.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div className="form-field form-field--full">
                  <label htmlFor="street">Street Address *</label>
                  <input
                    id="street"
                    type="text"
                    required
                    placeholder="123 Main Street, Apt 4B"
                    value={shippingAddress.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="city">City *</label>
                  <input
                    id="city"
                    type="text"
                    required
                    placeholder="New York"
                    value={shippingAddress.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="state">State / Province *</label>
                  <input
                    id="state"
                    type="text"
                    required
                    placeholder="NY"
                    value={shippingAddress.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="zipCode">ZIP / Postal Code *</label>
                  <input
                    id="zipCode"
                    type="text"
                    required
                    placeholder="10001"
                    value={shippingAddress.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="country">Country *</label>
                  <select
                    id="country"
                    value={shippingAddress.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 2. Shipping Options */}
            <section className="checkout-section">
              <div className="checkout-section__header">
                <span className="checkout-section__number">2</span>
                <h2>Shipping Method</h2>
              </div>

              <div className="shipping-options">
                <label
                  className={`shipping-card ${
                    shippingMethod === 'standard' ? 'shipping-card--selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="standard"
                    checked={shippingMethod === 'standard'}
                    onChange={() => setShippingMethod('standard')}
                  />
                  <div className="shipping-card__content">
                    <div className="shipping-card__info">
                      <Truck size={18} />
                      <div>
                        <h3>Standard Delivery</h3>
                        <p>Estimated 3–5 business days</p>
                      </div>
                    </div>
                    <span className="shipping-card__price">
                      {baseShippingCost === 0 ? 'FREE' : formatCurrency(baseShippingCost)}
                    </span>
                  </div>
                </label>

                <label
                  className={`shipping-card ${
                    shippingMethod === 'express' ? 'shipping-card--selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="express"
                    checked={shippingMethod === 'express'}
                    onChange={() => setShippingMethod('express')}
                  />
                  <div className="shipping-card__content">
                    <div className="shipping-card__info">
                      <Truck size={18} />
                      <div>
                        <h3>Express Priority Delivery</h3>
                        <p>Estimated 1–2 business days with priority dispatch</p>
                      </div>
                    </div>
                    <span className="shipping-card__price">
                      {formatCurrency(baseShippingCost + 15)}
                    </span>
                  </div>
                </label>
              </div>
            </section>

            {/* 3. Payment Details */}
            <section className="checkout-section">
              <div className="checkout-section__header">
                <span className="checkout-section__number">3</span>
                <h2>Payment Details</h2>
              </div>

              <div className="payment-tabs">
                <button
                  type="button"
                  className={`payment-tab ${paymentMethod === 'card' ? 'payment-tab--active' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard size={18} />
                  <span>Credit / Debit Card</span>
                </button>
                <button
                  type="button"
                  className={`payment-tab ${paymentMethod === 'paypal' ? 'payment-tab--active' : ''}`}
                  onClick={() => setPaymentMethod('paypal')}
                >
                  <span>PayPal</span>
                </button>
              </div>

              {paymentMethod === 'card' ? (
                <div className="payment-card-fields">
                  <div className="form-field form-field--full">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input
                      id="cardNumber"
                      type="text"
                      maxLength={19}
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="cardExpiry">Expiration Date</label>
                      <input
                        id="cardExpiry"
                        type="text"
                        maxLength={5}
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="cardCvc">CVC / Security Code</label>
                      <input
                        id="cardCvc"
                        type="password"
                        maxLength={4}
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="paypal-notice">
                  <p>You will be directed to PayPal to complete your purchase securely.</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Order Summary & Place Order */}
          <aside className="checkout-sidebar">
            <div className="checkout-summary-card">
              <h2 className="summary-title">Order Items ({items.length})</h2>

              <div className="summary-items-list">
                {items.map(({ product, quantity }) => (
                  <div className="summary-item" key={product.id}>
                    <img src={product.image} alt={product.name} className="summary-item__img" />
                    <div className="summary-item__details">
                      <h4>{product.name}</h4>
                      <p>Qty: {quantity}</p>
                    </div>
                    <span className="summary-item__price">
                      {formatCurrency(product.price * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-breakdown">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="summary-row summary-row--discount">
                    <span>Discount ({appliedPromoCode})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="summary-row">
                  <span>Shipping ({shippingMethod})</span>
                  <span>{finalShippingCost === 0 ? 'FREE' : formatCurrency(finalShippingCost)}</span>
                </div>

                <div className="summary-row">
                  <span>Tax (8%)</span>
                  <span>{formatCurrency(estimatedTax)}</span>
                </div>

                <div className="summary-divider" />

                <div className="summary-total">
                  <span>Total Due</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="place-order-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Pay {formatCurrency(finalTotal)}</span>
                  </>
                )}
              </button>

              <div className="checkout-security-notes">
                <div className="security-note">
                  <ShieldCheck size={16} className="security-icon" />
                  <span>256-bit SSL encrypted transaction</span>
                </div>
                <div className="security-note">
                  <CheckCircle2 size={16} className="security-icon" />
                  <span>Full buyer protection guarantee</span>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  )
}
