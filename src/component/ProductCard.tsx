import { Heart, ShoppingCart } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { Product } from '../types'
import { formatMoney } from '../lib/money'
import { useAuth } from '../context/useAuth'
import { useWishlist } from '../context/useWishlist'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isWishlisted, pendingProductIds, toggleProduct } = useWishlist()
  const wishlisted = isWishlisted(product.id)
  const wishlistPending = pendingProductIds.includes(product.id)

  function handleCartClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (onAddToCart) {
      onAddToCart(product)
    }
  }

  function handleWishlistClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/auth')
      return
    }
    void toggleProduct(product.id)
  }

  const formattedPrice = formatMoney(product.priceMinor, product.currency)

  return (
    <article className="product-card">
      <Link
        to={`/products/${product.id}`}
        className="product-card__image-link"
        aria-label={product.name}
      >
        <div className="product-card__image-wrap">
          <img
            className="product-card__image"
            src={product.imageUrl ?? '/product-placeholder.svg'}
            alt={product.name}
            loading="lazy"
          />
          {product.inventoryQuantity <= 0 && (
            <span className="product-card__stock-badge">Out of stock</span>
          )}
        </div>
      </Link>

      <button
        type="button"
        className={`product-card__wishlist-btn${wishlisted ? ' is-wishlisted' : ''}`}
        aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        aria-pressed={wishlisted}
        title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        disabled={wishlistPending}
        onClick={handleWishlistClick}
      >
        <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
      </button>

      <div className="product-card__info">
        <Link to={`/products/${product.id}`} className="product-card__title-link">
          <h3 className="product-card__name" title={product.name}>
            {product.name}
          </h3>
        </Link>

        <div className="product-card__bottom">
          <span className="product-card__price">{formattedPrice}</span>

          <button
            type="button"
            className="product-card__cart-btn"
            aria-label={product.inventoryQuantity > 0 ? `Add ${product.name} to cart` : `${product.name} is out of stock`}
            title={product.inventoryQuantity > 0 ? 'Add to cart' : 'Out of stock'}
            onClick={handleCartClick}
            disabled={product.inventoryQuantity <= 0}
          >
            <ShoppingCart size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  )
}
