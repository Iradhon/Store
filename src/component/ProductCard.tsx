import { ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../types'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  function handleCartClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (onAddToCart) {
      onAddToCart(product)
    }
  }

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price)

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
            src={product.image}
            alt={product.name}
            loading="lazy"
          />
        </div>
      </Link>

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
            aria-label={`Add ${product.name} to cart`}
            onClick={handleCartClick}
          >
            <ShoppingCart size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  )
}
