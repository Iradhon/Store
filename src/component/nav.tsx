import { useState, useEffect } from 'react'
import { Search, Handbag, Menu, X, Home as HomeIcon, ShoppingBag, User } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import './styles/nav.css'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // Reset drawer state when navigating without triggering effect cascading render
  const [prevPathname, setPrevPathname] = useState(location.pathname)
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname)
    setIsMobileMenuOpen(false)
  }

  // Handle escape key and body scroll lock when drawer is open
  useEffect(() => {
    if (!isMobileMenuOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileMenuOpen])

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <header className="navbar">
      <div className="navbar__container">
        <div className="navbar__inner">
          <Link className="navbar__brand" to="/" aria-label="Store home">
            <span>STORE</span>
          </Link>

          <nav className="navbar__nav" aria-label="Main navigation">
            <Link className="navbar__link" to="/products">
              All Products
            </Link>
          </nav>

          <form role="search" className="navbar__search" onSubmit={handleSearch}>
            <div className="navbar__search-wrap">
              <Search className="navbar__search-icon" strokeWidth={1.75} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search products"
                className="navbar__search-input"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <div className="navbar__actions">
            <Link className="navbar__cart" to="/cart" aria-label="Cart">
              <Handbag />
            </Link>
            <Link className="navbar__signin" to="/auth">
              Sign In
            </Link>
            <button
              className="navbar__menu"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="mobile-drawer__overlay"
          aria-hidden="true"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <aside
        id="mobile-nav-drawer"
        className={`mobile-drawer ${isMobileMenuOpen ? 'mobile-drawer--open' : ''}`}
        aria-label="Mobile navigation menu"
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mobile-drawer__header">
          <Link className="navbar__brand" to="/" onClick={() => setIsMobileMenuOpen(false)}>
            <span>STORE</span>
          </Link>
          <button
            className="mobile-drawer__close"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mobile-drawer__content">
          <form role="search" className="mobile-drawer__search" onSubmit={handleSearch}>
            <div className="navbar__search-wrap">
              <Search className="navbar__search-icon" strokeWidth={1.75} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search products mobile"
                className="navbar__search-input"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <nav className="mobile-drawer__nav" aria-label="Mobile navigation links">
            <Link
              className="mobile-drawer__link"
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <HomeIcon size={18} />
              <span>Home</span>
            </Link>
            <Link
              className="mobile-drawer__link"
              to="/products"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShoppingBag size={18} />
              <span>All Products</span>
            </Link>
            <Link
              className="mobile-drawer__link"
              to="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Handbag size={18} />
              <span>My Cart</span>
            </Link>
            <Link
              className="mobile-drawer__link"
              to="/auth"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User size={18} />
              <span>Sign In / Account</span>
            </Link>
          </nav>
        </div>

        <div className="mobile-drawer__footer">
          <Link
            className="mobile-drawer__cta"
            to="/auth"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Sign In / Register
          </Link>
        </div>
      </aside>
    </header>
  )
}