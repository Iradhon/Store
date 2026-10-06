import './styles/footer.css'
import { Link } from 'react-router-dom'

const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__container">
        <div className="site-footer__columns">
          <div className="site-footer__brand">
            <Link className="site-footer__logo" to="/">
              STORE
            </Link>
            <p>Quality products, delivered with care.</p>
          </div>

          <nav className="site-footer__section" aria-label="Shop">
            <h2>Shop</h2>
            <Link to="/products">All Products</Link>
          </nav>

          <nav className="site-footer__section" aria-label="Account">
            <h2>Account</h2>
            <Link to="/auth">Sign In</Link>
            <Link to="/orders">Order History</Link>
          </nav>

          <div className="site-footer__section">
            <h2>Support</h2>
            <a href="mailto:honoreirad50@gmail.com">Contact: honoreirad50@gmail.com</a>
          </div>
        </div>

        <div className="site-footer__copyright">
          © {CURRENT_YEAR} STORE. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
