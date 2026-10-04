import { Search, Handbag, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import './styles/nav.css'

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__container">
        <div className="navbar__inner">
          <a className="navbar__brand" href="/">
            <span>STORE</span>
          </a>

          <nav className="navbar__nav" aria-label="Main navigation">
            <a className="navbar__link" href="/products">
              All Products
            </a>
          </nav>

          <form role="search" className="navbar__search">
            <div className="navbar__search-wrap">
              <Search className="navbar__search-icon" strokeWidth={1.75} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search products"
                className="navbar__search-input"
                placeholder="Search products..."
              />
            </div>
          </form>

          <div className="navbar__actions">
            <Link className="navbar__cart" to="/cart" aria-label="Cart">
              <Handbag />
            </Link>
            <a className="navbar__signin" href="/auth">
              Sign In
            </a>
            <button className="navbar__menu" aria-label="Open menu">
              <Menu />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}