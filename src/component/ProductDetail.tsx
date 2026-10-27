import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Check, AlertCircle, ChevronRight, ArrowLeft, Minus, Plus, Heart } from 'lucide-react'
import type { Product } from '../types'
import { useCart } from '../context/useCart'
import { useCatalog } from '../context/useCatalog'
import { useAuth } from '../context/useAuth'
import { useWishlist } from '../context/useWishlist'
import { formatMoney } from '../lib/money'
import { getAddToCartFeedback } from '../lib/cartFeedback'
import ProductCard from './ProductCard'
import './styles/productDetail.css'
import './styles/product.css'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [quantitySelection, setQuantitySelection] = useState({ productId: id, value: 1 })
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const quantity = quantitySelection.productId === id ? quantitySelection.value : 1
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastTone, setToastTone] = useState<'success' | 'alert'>('success')
  const { products, isLoading, error } = useCatalog()
  const { addToCart, items } = useCart()
  const { user } = useAuth()
  const { isWishlisted, pendingProductIds, toggleProduct } = useWishlist()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setSelectedImageIndex(0)
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
  const productImages = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []
  const selectedImage = productImages[selectedImageIndex] ?? product.imageUrl ?? '/product-placeholder.svg'

  function handleAddToCart(item: Product = product!, amount = 1) {
    const result = addToCart(item, amount)
    const feedback = getAddToCartFeedback(item, amount, result)
    setToastTone(feedback.tone)
    setToastMessage(feedback.message)
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
  const productId = product.id
  const currentProductCartQuantity = items.find((item) => item.product.id === product.id)?.quantity ?? 0
  const wishlisted = isWishlisted(product.id)
  const wishlistPending = pendingProductIds.includes(product.id)

  function handleWishlistToggle() {
    if (!user) {
      navigate('/auth')
      return
    }
    void toggleProduct(productId)
  }

  return (
    <div className="product-detail-page">
      {toastMessage && <div className={`product-toast product-toast--${toastTone}`} role={toastTone === 'alert' ? 'alert' : 'status'}>{toastMessage}</div>}

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
                src={selectedImage}
                alt={product.name}
                className="product-detail__image"
              />
            </div>
            {productImages.length > 1 && <div className="product-detail__thumbnails" aria-label="Product images">{productImages.map((imageUrl, index) => <button key={`${imageUrl}-${index}`} type="button" className={selectedImageIndex === index ? 'is-selected' : ''} onClick={() => setSelectedImageIndex(index)} aria-label={`Show product image ${index + 1}`} aria-pressed={selectedImageIndex === index}><img src={imageUrl} alt="" loading="lazy" /></button>)}</div>}
          </div>

          <div className="product-detail__info">
            <div className="product-detail__category-badge">{product.category}</div>
            <div className="product-detail__title-row">
              <h1 className="product-detail__title">{product.name}</h1>
              <button
                className={`product-detail__wishlist-btn${wishlisted ? ' is-wishlisted' : ''}`}
                type="button"
                aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                aria-pressed={wishlisted}
                disabled={wishlistPending}
                onClick={handleWishlistToggle}
              >
                <Heart size={19} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="product-detail__price-row">
              <span className="product-detail__price">
                {formatMoney(product.priceMinor, product.currency)}
              </span>
              <span className={`product-detail__stock-badge${available ? '' : ' product-detail__stock-badge--out'}`}>
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

            {!available ? (
              <p className="product-detail__inventory-alert" role="alert">
                Sorry, this product is out of stock. Please check back later.
              </p>
            ) : currentProductCartQuantity >= Math.min(99, product.inventoryQuantity) ? (
              <p className="product-detail__inventory-alert" role="status">
                You have all currently available stock of this product in your cart.
              </p>
            ) : null}

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
