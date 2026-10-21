import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, Check, AlertCircle, ChevronRight, ArrowLeft, Minus, Plus } from 'lucide-react'
import type { Product } from '../types'
import { useCart } from '../context/useCart'
import { useCatalog } from '../context/useCatalog'
import { formatMoney } from '../lib/money'
import ProductCard from './ProductCard'
import './styles/productDetail.css'
import './styles/product.css'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [quantitySelection, setQuantitySelection] = useState({ productId: id, value: 1 })
  const quantity = quantitySelection.productId === id ? quantitySelection.value : 1
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const { products, isLoading, error } = useCatalog()
  const { addToCart } = useCart()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  if (isLoading) return <div className="product-not-found" role="status">Loading product…</div>
  if (error) return <div className="product-not-found" role="alert">{error}</div>

  const product = products.find((item) => item.id === id)
  if (!product) {
    return (
      <div className="product-not-found">
        <div className="product-not-found__container">
          <h2>Product Not Found</h2>
          <p>This product is not in the current published catalog.</p>
          <Link to="/products" className="product-not-found__btn">
            <ArrowLeft size={16} />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    )
  }

  const relatedProducts = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4)

  function handleAddToCart(item: Product = product!, amount: number = quantity) {
    addToCart(item, amount)
    setToastMessage(`Added ${amount} × ${item.name} to your cart`)
    window.setTimeout(() => setToastMessage(null), 2500)
  }

  function handleQuantityChange(delta: number) {
    setQuantitySelection((current) => {
      const currentQuantity = current.productId === id ? current.value : 1
      return {
        productId: id,
        value: Math.max(1, Math.min(currentQuantity + delta, 99, product!.inventoryQuantity)),
      }
    })
  }

  const available = product.inventoryQuantity > 0

  return (
    <div className="product-detail-page">
      {toastMessage && <div className="product-toast" role="status">{toastMessage}</div>}

      <div className="product-detail__container">
        <nav className="product-detail__breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <Link to="/products">Products</Link>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        <div className="product-detail__main">
          <div className="product-detail__media">
            <div className="product-detail__image-wrap">
              <img
                src={product.imageUrl ?? '/product-placeholder.svg'}
                alt={product.name}
                className="product-detail__image"
              />
            </div>
          </div>

          <div className="product-detail__info">
            <div className="product-detail__category-badge">{product.category}</div>
            <h1 className="product-detail__title">{product.name}</h1>

            <div className="product-detail__price-row">
              <span className="product-detail__price">
                {formatMoney(product.priceMinor, product.currency)}
              </span>
              <span className="product-detail__stock-badge">
                {available ? <Check size={14} /> : <AlertCircle size={14} />}
                <span>{available ? 'Available' : 'Out of stock'}</span>
              </span>
            </div>

            <p className="product-detail__description">{product.description}</p>

            <div className="product-detail__actions-section">
              <div className="product-detail__quantity-group">
                <span className="product-detail__label">Quantity:</span>
                <div className="product-quantity-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={!available || quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="stepper-value" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={!available || quantity >= Math.min(99, product.inventoryQuantity)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="product-detail__buttons">
                <button
                  type="button"
                  className="btn-add-to-cart"
                  onClick={() => handleAddToCart(product, quantity)}
                  disabled={!available}
                >
                  <ShoppingCart size={18} />
                  <span>{available ? 'Add to Cart' : 'Unavailable'}</span>
                </button>
              </div>
            </div>

            <p className="product-detail__availability-note">
              Checkout is unavailable until payment, delivery, and tax rules are configured.
            </p>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="product-detail__related">
            <div className="related-header">
              <h2 className="related-title">More from {product.category}</h2>
              <Link to="/products" className="view-btn">
                <span>View All</span>
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="product-directory__grid">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
