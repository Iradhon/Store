import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  ChevronRight,
  ArrowLeft,
  Minus,
  Plus,
} from 'lucide-react'
import { products } from '../data/products'
import type { Product } from '../types'
import { useCart } from '../context/useCart'
import ProductCard from './ProductCard'
import './styles/productDetail.css'
import './styles/product.css'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [prevId, setPrevId] = useState(id)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Reset quantity during render if product ID changes (idiomatic React Compiler pattern)
  if (prevId !== id) {
    setPrevId(id)
    setQuantity(1)
  }

  // Scroll to top when product ID changes (synchronizing with external browser window)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  const product = products.find((p) => p.id === id)

  const { addToCart } = useCart()

  if (!product) {
    return (
      <div className="product-not-found">
        <div className="product-not-found__container">
          <h2>Product Not Found</h2>
          <p>The product you are looking for does not exist or may have been removed.</p>
          <Link to="/products" className="product-not-found__btn">
            <ArrowLeft size={16} />
            <span>Back to All Products</span>
          </Link>
        </div>
      </div>
    )
  }

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  function handleAddToCart(p: Product = product!, qty: number = quantity) {
    addToCart(p, qty)
    setToastMessage(`Added ${qty}x "${p.name}" to cart`)
    setTimeout(() => {
      setToastMessage(null)
    }, 2500)
  }

  function handleBuyNow() {
    handleAddToCart(product!, quantity)
    navigate('/cart')
  }

  function handleQuantityChange(delta: number) {
    setQuantity((prev) => Math.max(1, Math.min(prev + delta, 99)))
  }

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price)

  return (
    <div className="product-detail-page">
      {toastMessage && (
        <div className="product-toast" role="status">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="product-detail__container">
        {/* Breadcrumb Navigation */}
        <nav className="product-detail__breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <Link to="/products">Products</Link>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="product-detail__main">
          {/* Left Column: Image Gallery */}
          <div className="product-detail__media">
            <div className="product-detail__image-wrap">
              <img
                src={product.image}
                alt={product.name}
                className="product-detail__image"
              />
            </div>
          </div>

          {/* Right Column: Product Information & Purchase Controls */}
          <div className="product-detail__info">
            <div className="product-detail__category-badge">{product.category}</div>

            <h1 className="product-detail__title">{product.name}</h1>

            <div className="product-detail__rating-row">
              <div className="product-detail__stars" aria-label={`Rated ${product.rating ?? 4.8} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={16}
                    className="product-detail__star"
                    fill="currentColor"
                  />
                ))}
              </div>
              <span className="product-detail__rating-score">{product.rating ?? 4.8}</span>
              <span className="product-detail__rating-count">
                ({product.reviewsCount ?? 42} reviews)
              </span>
            </div>

            <div className="product-detail__price-row">
              <span className="product-detail__price">{formattedPrice}</span>
              <span className="product-detail__stock-badge">
                <Check size={14} />
                <span>In Stock • Ready to ship</span>
              </span>
            </div>

            <p className="product-detail__description">{product.description}</p>

            {/* Quantity Stepper & Actions */}
            <div className="product-detail__actions-section">
              <div className="product-detail__quantity-group">
                <span className="product-detail__label">Quantity:</span>
                <div className="product-quantity-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="stepper-value" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleQuantityChange(1)}
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
                >
                  <ShoppingCart size={18} />
                  <span>Add to Cart</span>
                </button>

                <button
                  type="button"
                  className="btn-buy-now"
                  onClick={handleBuyNow}
                >
                  <span>Buy Now</span>
                </button>
              </div>
            </div>

            {/* Product Value Propositions */}
            <div className="product-detail__perks">
              <div className="perk-item">
                <Truck size={18} className="perk-icon" />
                <div>
                  <h4>Free Worldwide Shipping</h4>
                  <p>On all orders over $50. Tracked & insured delivery.</p>
                </div>
              </div>
              <div className="perk-item">
                <RotateCcw size={18} className="perk-icon" />
                <div>
                  <h4>30-Day Money-Back Guarantee</h4>
                  <p>Hassle-free returns if you are not completely satisfied.</p>
                </div>
              </div>
              <div className="perk-item">
                <ShieldCheck size={18} className="perk-icon" />
                <div>
                  <h4>2-Year Official Warranty</h4>
                  <p>Full manufacturer warranty coverage included.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="product-detail__related">
            <div className="related-header">
              <h2 className="related-title">You might also like</h2>
              <Link to="/products" className="view-btn">
                <span>View All</span>
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="product-directory__grid">
              {relatedProducts.map((related) => (
                <ProductCard
                  key={related.id}
                  product={related}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
