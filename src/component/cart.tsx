import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft, ShoppingBag, Trash2, Minus, Plus } from 'lucide-react'
import { useCart } from '../context/useCart'
import { formatMoney } from '../lib/money'
import './styles/cart.css'

export default function Cart() {
  const {
    items,
    totalItemsCount,
    subtotalMinorByCurrency,
    isCatalogLoading,
    catalogError,
    cartNotice,
    clearCartNotice,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart()

  if (items.length > 0 && isCatalogLoading) {
    return <section className="cart-page" role="status">Checking your cart against the current catalog…</section>
  }

  if (items.length === 0) {
    return (
      <section className="cart-page" aria-labelledby="cart-title">
        <div className="cart-empty">
          <div className="cart-empty__icon" aria-hidden="true"><ShoppingBag size={32} /></div>
          <h1 id="cart-title" className="cart-empty__title">Your Cart is Empty</h1>
          <p className="cart-empty__message">Add products from the current catalog to get started.</p>
          <Link className="cart-empty__action" to="/products">
            <span>Browse Products</span>
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
            <h1 id="cart-heading" className="cart-title">Shopping Cart</h1>
            <p className="cart-subtitle">{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}</p>
          </div>
          <button type="button" className="cart-clear-btn" onClick={clearCart} aria-label="Clear all items from cart">
            <Trash2 size={16} />
            <span>Clear Cart</span>
          </button>
        </div>

        {cartNotice && <p className="cart-notice" role="status">{cartNotice} <button type="button" onClick={clearCartNotice}>Dismiss</button></p>}
        {catalogError && <p className="cart-notice" role="alert">The catalog could not be refreshed. Product prices and availability may have changed.</p>}

        <div className="cart-layout">
          <div className="cart-items-section">
            <div className="cart-items-list">
              {items.map(({ product, quantity }) => {
                const itemTotalMinor = product.priceMinor * quantity
                return (
                  <article className="cart-item" key={product.id}>
                    <Link to={`/products/${product.id}`} className="cart-item__image-link" aria-label={product.name}>
                      <img src={product.imageUrl ?? '/product-placeholder.svg'} alt={product.name} className="cart-item__image" />
                    </Link>

                    <div className="cart-item__details">
                      <div className="cart-item__header">
                        <div>
                          <span className="cart-item__category">{product.category}</span>
                          <Link to={`/products/${product.id}`} className="cart-item__title-link">
                            <h2 className="cart-item__title">{product.name}</h2>
                          </Link>
                        </div>
                        <button type="button" className="cart-item__remove-btn" onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name} from cart`}>
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="cart-item__footer">
                        <div className="cart-item__stepper">
                          <button type="button" className="cart-stepper-btn" onClick={() => updateQuantity(product.id, quantity - 1)} aria-label="Decrease quantity">
                            <Minus size={14} />
                          </button>
                          <span className="cart-stepper-val">{quantity}</span>
                          <button type="button" className="cart-stepper-btn" onClick={() => updateQuantity(product.id, quantity + 1)} disabled={quantity >= Math.min(99, product.inventoryQuantity)} aria-label="Increase quantity">
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="cart-item__pricing">
                          <span className="cart-item__unit-price">{formatMoney(product.priceMinor, product.currency)} each</span>
                          <span className="cart-item__total-price">{formatMoney(itemTotalMinor, product.currency)}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="cart-items-footer">
              <Link to="/products" className="cart-continue-btn"><ArrowLeft size={16} /><span>Continue Shopping</span></Link>
            </div>
          </div>

          <aside className="cart-summary-section" aria-label="Cart Summary">
            <div className="cart-summary-card">
              <h2 className="cart-summary-title">Cart Summary</h2>
              <div className="cart-breakdown">
                {Object.entries(subtotalMinorByCurrency).map(([currency, amountMinor]) => (
                  <div className="cart-breakdown__row" key={currency}>
                    <span>Current catalog subtotal ({currency})</span>
                    <span>{formatMoney(amountMinor, currency)}</span>
                  </div>
                ))}
              </div>
              <p className="cart-checkout-note">
                Shipping, tax, and final prices depend on the launch market. Checkout is disabled until those rules and a payment provider are configured.
              </p>
              <Link to="/checkout" className="cart-checkout-btn">
                <span>Continue to Checkout</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
