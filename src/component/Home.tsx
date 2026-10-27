import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { useCart } from '../context/useCart'
import { useCatalog } from '../context/useCatalog'
import { getAddToCartFeedback } from '../lib/cartFeedback'
import ProductCard from './ProductCard'
import './styles/home.css'
import './styles/product.css'

function Home() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastTone, setToastTone] = useState<'success' | 'alert'>('success')
  const { products, isLoading, error } = useCatalog()
  const { addToCart } = useCart()

  const featuredProducts = products.filter((product) => product.featured).slice(0, 4)

  function handleAddToCart(product: Product) {
    const feedback = getAddToCartFeedback(product, 1, addToCart(product, 1))
    setToastTone(feedback.tone)
    setToastMessage(feedback.message)
    setTimeout(() => {
      setToastMessage(null)
    }, 2500)
  }

  return (
    <div className="home-page">
      {toastMessage && (
        <div className={`product-toast product-toast--${toastTone}`} role={toastTone === 'alert' ? 'alert' : 'status'}>
          <span>{toastMessage}</span>
        </div>
      )}

      <section className="home-hero">
        <div className="home-container home-hero__inner">
          <div className="home-hero__content">
            <h1 className="home-title">Experience Quality, Redefined</h1>

            <p className="home-subtitle">
              Browse products currently available in our catalog.
            </p>

            <div className="home-cta">
              <Link to="/products" className="h-btn home-button">
                <span>Shop Now</span>
                <ArrowRight strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="products">
        <div className="featured-header">
          <h2 className="product-title">Featured Products</h2>
          <Link className="view-btn" to="/products">
            <span>View All</span>
            <ArrowRight strokeWidth={2.5} />
          </Link>
        </div>
        {isLoading && <p role="status">Loading products…</p>}
        {error && <p role="alert">{error}</p>}
        {!isLoading && !error && featuredProducts.length === 0 && (
          <p>No featured products are currently published.</p>
        )}
        <div className="product-grid">
          {!isLoading && !error && featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </section>

      <section className="create-account">
        <div className="create">
          <h2 className="create-title">Ready to get started?</h2>
          <p className="create-text">Create an account to manage your profile and view account orders.</p>
          <Link to="/auth" className="create-btn">
            Join the Community
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
