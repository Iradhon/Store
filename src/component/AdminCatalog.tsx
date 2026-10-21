import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Edit3, Plus, RefreshCw, Save } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useCatalog } from '../context/useCatalog'
import { supabase } from '../lib/supabase'
import { mapProduct } from '../services/productService'
import { formatMoney } from '../lib/money'
import type { Product } from '../types'
import type { Database } from '../types/database'
import './styles/adminCatalog.css'

type ProductInsert = Database['public']['Tables']['products']['Insert']
interface ProductForm {
  name: string
  slug: string
  sku: string
  category: string
  description: string
  imageUrl: string
  price: string
  currency: string
  inventoryQuantity: string
  featured: boolean
  isPublished: boolean
}

const emptyForm: ProductForm = {
  name: '', slug: '', sku: '', category: '', description: '', imageUrl: '',
  price: '', currency: '', inventoryQuantity: '0', featured: false, isPublished: false,
}

function minorUnitsFromPrice(priceText: string, currency: string): number | null {
  if (!/^[A-Z]{3}$/.test(currency)) return null
  try {
    const fractionDigits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
    const match = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(priceText.trim())
    if (!match || fractionDigits > 6) return null
    const fraction = match[2] ?? ''
    if (fraction.length > fractionDigits && /[1-9]/.test(fraction.slice(fractionDigits))) return null
    const scale = 10n ** BigInt(fractionDigits)
    const whole = BigInt(match[1])
    const fractional = BigInt((fraction.slice(0, fractionDigits) + '0'.repeat(fractionDigits)).slice(0, fractionDigits) || '0')
    const minorUnits = whole * scale + fractional
    return minorUnits > 0n && minorUnits <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minorUnits) : null
  } catch {
    return null
  }
}

function priceInputFromMinor(minorUnits: number, currency: string): string {
  const fractionDigits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
  return (minorUnits / (10 ** fractionDigits)).toFixed(fractionDigits)
}

function toProductForm(product: Product): ProductForm {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku ?? '',
    category: product.category,
    description: product.description,
    imageUrl: product.imageUrl ?? '',
    price: priceInputFromMinor(product.priceMinor, product.currency),
    currency: product.currency,
    inventoryQuantity: String(product.inventoryQuantity),
    featured: product.featured,
    isPublished: product.isPublished,
  }
}

export default function AdminCatalog() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const userId = user?.id
  const userRole = user?.role
  const { refresh: refreshPublicCatalog } = useCatalog()
  const location = useLocation()
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    if (!supabase || !userId || userRole !== 'admin') return
    setIsLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (queryError) {
      setError('Could not load catalog records.')
    } else {
      setProducts((data ?? []).map(mapProduct))
    }
    setIsLoading(false)
  }, [userId, userRole])

  useEffect(() => {
    const client = supabase
    if (!client || !userId || userRole !== 'admin') return

    let active = true
    async function loadInitialProducts() {
      const { data, error: queryError } = await client!.from('products').select('*').order('created_at', { ascending: false })
      if (!active) return
      if (queryError) setError('Could not load catalog records.')
      else setProducts((data ?? []).map(mapProduct))
      setIsLoading(false)
    }

    void loadInitialProducts()
    return () => { active = false }
  }, [userId, userRole])

  if (isAuthLoading) return <main className="admin-catalog"><p role="status">Loading account…</p></main>
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  if (user.role !== 'admin') {
    return (
      <main className="admin-catalog">
        <h1>Catalog administration</h1>
        <p role="alert">Your account is not authorized to manage products.</p>
        <Link to="/">Return to the storefront</Link>
      </main>
    )
  }

  function beginEdit(product: Product) {
    setEditingId(product.id)
    setForm(toProductForm(product))
    setMessage(null)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }

    const currency = form.currency.trim().toUpperCase()
    const priceMinor = minorUnitsFromPrice(form.price, currency)
    const inventoryQuantity = Number(form.inventoryQuantity)
    if (priceMinor === null) {
      setError('Enter a valid price and three-letter ISO currency code.')
      return
    }
    if (!Number.isInteger(inventoryQuantity) || inventoryQuantity < 0) {
      setError('Inventory must be a non-negative whole number.')
      return
    }

    const payload: ProductInsert = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      sku: form.sku.trim() || null,
      category: form.category.trim(),
      description: form.description.trim(),
      image_url: form.imageUrl.trim() || null,
      price_minor: priceMinor,
      currency,
      inventory_quantity: inventoryQuantity,
      featured: form.featured,
      is_published: form.isPublished,
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)
    const result = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert(payload)
    setIsSaving(false)

    if (result.error) {
      setError(result.error.code === '23505'
        ? 'That product slug or SKU is already in use.'
        : 'The product could not be saved. Check your fields and catalog permissions.')
      return
    }

    setMessage(editingId ? 'Product updated.' : 'Product created.')
    resetForm()
    await Promise.all([loadProducts(), refreshPublicCatalog()])
  }

  async function togglePublished(product: Product) {
    if (!supabase) return
    setError(null)
    const { error: updateError } = await supabase
      .from('products')
      .update({ is_published: !product.isPublished })
      .eq('id', product.id)
    if (updateError) {
      setError('Could not change the product publication state.')
      return
    }
    await Promise.all([loadProducts(), refreshPublicCatalog()])
  }

  return (
    <main className="admin-catalog">
      <header className="admin-catalog__header">
        <div>
          <p className="admin-catalog__eyebrow">Store operations</p>
          <h1>Product catalog</h1>
          <p>Manage real catalog records. Only published products are visible to customers.</p>
        </div>
        <button type="button" className="admin-catalog__secondary" onClick={() => void loadProducts()} disabled={isLoading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {error && <p className="admin-catalog__alert" role="alert">{error}</p>}
      {message && <p className="admin-catalog__success" role="status">{message}</p>}

      <div className="admin-catalog__layout">
        <form className="admin-catalog__form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
          <label>Product name<input required maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>URL slug<input required maxLength={220} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
          <label>SKU<input maxLength={80} value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></label>
          <label>Category<input required maxLength={80} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
          <div className="admin-catalog__row">
            <label>Price<input required inputMode="decimal" type="number" min="0.01" step="any" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
            <label>Currency (ISO 4217)<input required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} /></label>
          </div>
          <label>Inventory quantity<input required type="number" min="0" step="1" value={form.inventoryQuantity} onChange={(event) => setForm({ ...form, inventoryQuantity: event.target.value })} /></label>
          <label>Image URL<input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></label>
          <label>Description<textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label className="admin-catalog__check"><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Featured on the home page</label>
          <label className="admin-catalog__check"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} /> Published in the storefront</label>
          <div className="admin-catalog__actions">
            <button type="submit" className="admin-catalog__primary" disabled={isSaving}>
              {editingId ? <Save size={16} /> : <Plus size={16} />}
              {isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
            </button>
            {editingId && <button type="button" className="admin-catalog__secondary" onClick={resetForm}>Cancel edit</button>}
          </div>
        </form>

        <section className="admin-catalog__list" aria-labelledby="admin-products-heading">
          <h2 id="admin-products-heading">Products ({products.length})</h2>
          {isLoading ? <p role="status">Loading products…</p> : products.length === 0 ? <p>No catalog records yet. Add the store’s actual products here.</p> : (
            <div className="admin-catalog__table-wrap">
              <table>
                <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>State</th><th>Actions</th></tr></thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td><strong>{product.name}</strong><small>{product.sku ?? product.slug}</small></td>
                      <td>{formatMoney(product.priceMinor, product.currency)}</td>
                      <td>{product.inventoryQuantity}</td>
                      <td>{product.isPublished ? 'Published' : 'Draft'}</td>
                      <td className="admin-catalog__table-actions">
                        <button type="button" onClick={() => beginEdit(product)} aria-label={`Edit ${product.name}`}><Edit3 size={16} /></button>
                        <button type="button" onClick={() => void togglePublished(product)}>{product.isPublished ? 'Unpublish' : 'Publish'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
