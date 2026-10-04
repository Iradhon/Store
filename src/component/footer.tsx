import './styles/footer.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__container">
        <div className="site-footer__columns">
          <div className="site-footer__brand">
            <a className="site-footer__logo" href="/">
              STORE
            </a>
            <p>Quality products, delivered with care.</p>
          </div>

          <nav className="site-footer__section" aria-label="Shop">
            <h2>Shop</h2>
            <a href="/products">All Products</a>
          </nav>

          <nav className="site-footer__section" aria-label="Account">
            <h2>Account</h2>
            <a href="/auth">Sign In</a>
            <a href="/orders">Order History</a>
          </nav>

          <div className="site-footer__section">
            <h2>Support</h2>
            <a href="mailto:support@store.com">Contact: support@store.com</a>
          </div>
        </div>

        <div className="site-footer__copyright">
          © {new Date().getFullYear()} STORE. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
