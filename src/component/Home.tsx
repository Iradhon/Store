import { useState } from 'react'
import { ArrowRight, Truck, Shield, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { products } from '../data/products'
import type { Product } from '../types'
import { useCart } from '../context/useCart'
import ProductCard from './ProductCard'
import './styles/home.css'
import './styles/product.css'

function Home() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const { addToCart } = useCart()

  const featuredProducts = products.filter((p) => p.featured).slice(0, 4)

  function handleAddToCart(product: Product) {
    addToCart(product, 1)
    setToastMessage(`Added "${product.name}" to cart`)
    setTimeout(() => {
      setToastMessage(null)
    }, 2500)
  }

  return (
    <div className="home-page">
      {toastMessage && (
        <div className="product-toast" role="status">
          <span>{toastMessage}</span>
        </div>
      )}

      <section className="home-hero">
        <div className="home-container home-hero__inner">
          <div className="home-hero__content">
            <h1 className="home-title">Experience Quality, Redefined</h1>

            <p className="home-subtitle">
              Discover our curated collection of premium products. Simple, clean, and built to last.
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

      <section className="home-features">
        <div className="home-container">
          <div className="home-features__grid">
            <div className="home-feature">
              <div className="home-feature__icon">
                <Truck strokeWidth={2} />
              </div>
              <div className="home-feature__content">
                <h3 className="home-feature__title">Free Shipping</h3>
                <p className="home-feature__text">On all orders</p>
              </div>
            </div>

            <div className="home-feature">
              <div className="home-feature__icon">
                <Shield strokeWidth={2} />
              </div>
              <div className="home-feature__content">
                <h3 className="home-feature__title">Secure Payments</h3>
                <p className="home-feature__text">Protected checkout</p>
              </div>
            </div>

            <div className="home-feature">
              <div className="home-feature__icon">
                <ShoppingBag strokeWidth={2} />
              </div>
              <div className="home-feature__content">
                <h3 className="home-feature__title">Quality Products</h3>
                <p className="home-feature__text">Curated selection</p>
              </div>
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
        <div className="product-grid">
          {featuredProducts.map((product) => (
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
          <p className="create-text">Create an account today and enjoy a seamless shopping experience.</p>
          <Link to="/auth" className="create-btn">
            Join the Community
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home