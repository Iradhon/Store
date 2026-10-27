import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { useCatalog } from '../context/useCatalog'
import { useWishlist } from '../context/useWishlist'
import { getAddToCartFeedback } from '../lib/cartFeedback'
import ProductCard from './ProductCard'

export default function AccountWishlist() {
  const { productIds, isLoading: wishlistLoading, error, toggleProduct, pendingProductIds } = useWishlist()
  const { products, isLoading: catalogLoading, error: catalogError } = useCatalog()
  const { addToCart } = useCart()
  const [feedback, setFeedback] = useState<string | null>(null)
  const productsById = new Map(products.map((product) => [product.id, product]))
  const wishlistedProducts = productIds.flatMap((id) => {
    const product = productsById.get(id)
    return product ? [product] : []
  })
  const missingProductIds = productIds.filter((id) => !productsById.has(id))

  return (
    <div>
      <h1 className="account-page-title">Wishlist</h1>
      {feedback && <p className="account-feedback" role="status">{feedback}</p>}
      {wishlistLoading || catalogLoading ? (
        <p className="account-muted" role="status">Loading your saved products…</p>
      ) : error || catalogError ? (
        <section className="account-panel"><p className="account-feedback" role="alert">{error ?? catalogError}</p></section>
      ) : productIds.length === 0 ? (
        <section className="account-panel account-empty-state">
          <h2 className="account-panel__heading">Your wishlist is empty</h2>
          <p>Save products you like and they will appear here.</p>
          <Link className="account-button" to="/products">Browse products</Link>
        </section>
      ) : (
        <>
          {wishlistedProducts.length > 0 && <div className="account-wishlist-grid">
            {wishlistedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(item) => {
                  const result = addToCart(item, 1)
                  setFeedback(getAddToCartFeedback(item, 1, result).message)
                }}
              />
            ))}
          </div>}
          {missingProductIds.length > 0 && (
            <section className="account-panel account-wishlist__missing" aria-label="Unavailable saved products">
              <h2 className="account-panel__heading">Unavailable products</h2>
              <p className="account-muted">Some saved products are no longer in the current catalog.</p>
              {missingProductIds.map((id) => (
                <div className="account-recent-order" key={id}>
                  <span>Product unavailable</span>
                  <button className="account-link-button account-link-button--danger" type="button" disabled={pendingProductIds.includes(id)} onClick={() => void toggleProduct(id)}>Remove</button>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
