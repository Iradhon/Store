import { ArrowRight, Truck, Shield, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import './styles/home.css'

function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-container home-hero__inner">
          <div className="home-hero__content">
            <h1 className="home-title">Experience Quality, Redefined</h1>

            <p className="home-subtitle">
              Discover our curated collection of premium products. Simple, clean, and built to last.
            </p>

            <div className="home-cta">
              <button className="home-button">
                <span>Shop Now</span>
                <ArrowRight strokeWidth={2.5} />
              </button>
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
          {/* codes */}
        </div>
      </section>
      <section className="create-account">
        <div className="create">
          <h2 className='create-title'>Ready to get started?</h2>
          <p className="create-text">Create an account today and enjoy a seamless shopping experience.</p>
          <button className="create-btn">Join the Community</button>
        </div>
      </section>
    </div>
  )
}

export default Home;