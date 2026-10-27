import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react'
import { useCatalog } from '../context/useCatalog'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'
import { mapProduct } from '../services/productService'
import { formatMoney } from '../lib/money'
import type { Product } from '../types'
import type { Database } from '../types/database'
import './styles/admin.css'

type ProductInsert = Database['public']['Tables']['products']['Insert']
type Category = Database['public']['Tables']['categories']['Row']
interface LocalImage { file: File; previewUrl: string }

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const maxImageSizeBytes = 5 * 1024 * 1024
const maxProductImages = 10

interface ProductForm {
  name: string
  slug: string
  sku: string
  category: string
  description: string
  imageUrls: string[]
  price: string
  currency: string
  inventoryQuantity: string
  featured: boolean
  isPublished: boolean
}

const emptyForm: ProductForm = {
  name: '', slug: '', sku: '', category: '', description: '', imageUrls: [],
  price: '', currency: '', inventoryQuantity: '0', featured: false, isPublished: true,
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

function getCurrencySymbol(currency: string): string {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
      .formatToParts(1)
      .find((part) => part.type === 'currency')?.value ?? ''
  } catch {
    return ''
  }
}

function slugFromName(name: string): string {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 220)
}

function toProductForm(product: Product): ProductForm {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku ?? '',
    category: product.category,
    description: product.description,
    imageUrls: product.imageUrls.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [],
    price: priceInputFromMinor(product.priceMinor, product.currency),
    currency: product.currency,
    inventoryQuantity: String(product.inventoryQuantity),
    featured: product.featured,
    isPublished: product.isPublished,
  }
}

export default function AdminCatalog() {
  const { user } = useAuth()
  const { refresh: refreshPublicCatalog } = useCatalog()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [localImages, setLocalImages] = useState<LocalImage[]>([])
  const [imageUrlDraft, setImageUrlDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const localPreviewUrls = useRef(new Set<string>())

  const loadProducts = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    const [productResult, categoryResult] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ])
    if (productResult.error) setError('Could not load products. Check your catalog permissions and Supabase configuration.')
    else setProducts((productResult.data ?? []).map(mapProduct))
    if (categoryResult.error) setError('Could not load categories. Apply the latest Supabase migration and try again.')
    else setCategories(categoryResult.data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { void loadProducts() }, [loadProducts])

  useEffect(() => () => {
    localPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url))
    localPreviewUrls.current.clear()
  }, [])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setForm(emptyForm)
      setLocalImages([])
      setImageUrlDraft('')
      setEditingId(null)
      setIsFormOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLocaleLowerCase()
    return !query || product.name.toLocaleLowerCase().includes(query) || product.sku?.toLocaleLowerCase().includes(query)
  })

  function beginCreate() {
    clearLocalImages()
    setForm(emptyForm)
    setImageUrlDraft('')
    setEditingId(null)
    setError(null)
    setMessage(null)
    setIsFormOpen(true)
  }

  function beginEdit(product: Product) {
    clearLocalImages()
    setForm(toProductForm(product))
    setImageUrlDraft('')
    setEditingId(product.id)
    setError(null)
    setMessage(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    clearLocalImages()
    setIsFormOpen(false)
    setEditingId(null)
    setImageUrlDraft('')
    setForm(emptyForm)
    setError(null)
  }

  function clearLocalImages() {
    localImages.forEach(({ previewUrl }) => {
      URL.revokeObjectURL(previewUrl)
      localPreviewUrls.current.delete(previewUrl)
    })
    setLocalImages([])
  }

  function addImageUrl() {
    const value = imageUrlDraft.trim()
    if (!value) return
    let parsedUrl: URL
    try {
      parsedUrl = new URL(value)
    } catch {
      setError('Enter a valid image URL beginning with https:// or http://.')
      return
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      setError('Image URLs must use http:// or https://.')
      return
    }
    if (form.imageUrls.includes(value)) {
      setError('That image URL is already in the list.')
      return
    }
    if (form.imageUrls.length + localImages.length >= maxProductImages) {
      setError(`A product can have up to ${maxProductImages} images.`)
      return
    }
    setError(null)
    setForm((current) => ({ ...current, imageUrls: [...current.imageUrls, value] }))
    setImageUrlDraft('')
  }

  function addLocalImages(files: FileList | null) {
    if (!files?.length) return
    const remainingSlots = maxProductImages - form.imageUrls.length - localImages.length
    const selectedFiles = Array.from(files)
    if (selectedFiles.length > remainingSlots) {
      setError(`A product can have up to ${maxProductImages} images.`)
      return
    }
    const nextImages: LocalImage[] = []
    for (const file of selectedFiles) {
      if (!allowedImageTypes.has(file.type)) {
        setError('Use a JPEG, PNG, WebP, or GIF image file.')
        continue
      }
      if (file.size > maxImageSizeBytes) {
        setError('Each image must be 5 MB or smaller.')
        continue
      }
      const previewUrl = URL.createObjectURL(file)
      localPreviewUrls.current.add(previewUrl)
      nextImages.push({ file, previewUrl })
    }
    if (nextImages.length) {
      setError(null)
      setLocalImages((current) => [...current, ...nextImages])
    }
  }

  function removeLocalImage(index: number) {
    const image = localImages[index]
    if (!image) return
    URL.revokeObjectURL(image.previewUrl)
    localPreviewUrls.current.delete(image.previewUrl)
    setLocalImages((current) => current.filter((_, imageIndex) => imageIndex !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return setError('Supabase is not configured.')

    const currency = form.currency.trim().toUpperCase()
    const priceMinor = minorUnitsFromPrice(form.price, currency)
    const inventoryQuantity = Number(form.inventoryQuantity)
    const slug = form.slug.trim().toLowerCase() || slugFromName(form.name)
    if (imageUrlDraft.trim()) return setError('Add the image URL with the plus button before saving.')
    if (priceMinor === null) return setError('Enter a valid price and three-letter ISO currency code.')
    if (!Number.isInteger(inventoryQuantity) || inventoryQuantity < 0) return setError('Stock quantity must be a non-negative whole number.')
    if (!categories.some((category) => category.name === form.category)) return setError('Choose a category or add one first.')
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return setError('Enter a product name that can be used to create a URL slug, or set a custom slug in advanced options.')

    setIsSaving(true)
    setError(null)
    const uploadedImageUrls: string[] = []
    const uploadedImagePaths: string[] = []
    try {
      if (localImages.length && !user?.id) throw new Error('Sign in again before uploading product images.')
      for (const { file } of localImages) {
        const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
        const path = `${user!.id}/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        })
        if (uploadError) throw new Error('Image upload failed. Apply the latest Supabase migrations and check storage permissions.')
        uploadedImagePaths.push(path)
        uploadedImageUrls.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)
      }
    } catch (uploadError) {
      if (uploadedImagePaths.length) await supabase.storage.from('product-images').remove(uploadedImagePaths)
      setIsSaving(false)
      setError(uploadError instanceof Error ? uploadError.message : 'One or more images could not be uploaded.')
      return
    }

    const imageUrls = [...form.imageUrls, ...uploadedImageUrls]

    const payload: ProductInsert = {
      name: form.name.trim(),
      slug,
      sku: form.sku.trim() || null,
      category: form.category,
      description: form.description.trim(),
      image_url: imageUrls[0] ?? null,
      image_urls: imageUrls,
      price_minor: priceMinor,
      currency,
      inventory_quantity: inventoryQuantity,
      featured: form.featured,
      is_published: form.isPublished,
    }

    const result = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert(payload)
    setIsSaving(false)

    if (result.error) {
      if (uploadedImagePaths.length) await supabase.storage.from('product-images').remove(uploadedImagePaths)
      setError(result.error.code === '23505'
        ? 'That product slug or SKU is already in use. You can change either in advanced options.'
        : result.error.code === '42703' || result.error.code === 'PGRST204'
          ? 'Apply the latest Supabase migrations before saving products.'
          : 'The product could not be saved. Check your fields and catalog permissions.')
      return
    }
    setMessage(editingId ? 'Product updated.' : 'Product added.')
    clearLocalImages()
    setIsFormOpen(false)
    setEditingId(null)
    await Promise.all([loadProducts(), refreshPublicCatalog()])
  }

  async function deleteProduct(product: Product) {
    if (!supabase || !window.confirm(`Delete "${product.name}"? This action cannot be undone.`)) return
    setError(null)
    setMessage(null)
    const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id)
    if (deleteError) {
      setError('The product could not be deleted. Check your catalog permissions and try again.')
      return
    }
    setMessage('Product deleted.')
    await Promise.all([loadProducts(), refreshPublicCatalog()])
  }

  const currencySymbol = getCurrencySymbol(form.currency.trim().toUpperCase())

  return (
    <div className="admin-section">
      {isFormOpen ? (
        <div className="admin-product-editor">
          <header className="admin-product-editor__heading">
            <button className="admin-back" type="button" onClick={closeForm} aria-label="Back to products" disabled={isSaving}><ArrowLeft size={22} /></button>
            <h1>{editingId ? 'Edit Product' : 'Add Product'}</h1>
          </header>
          <form className="admin-panel admin-product-form" onSubmit={(event) => void handleSubmit(event)} aria-busy={isSaving}>
            <fieldset className="admin-product-fields" disabled={isSaving}>
            <label className="admin-field">Product Name<input required maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className="admin-field">Description<textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>

            <div className="admin-editor-row">
              <label className="admin-field">Price{currencySymbol ? ` (${currencySymbol})` : ''}<span className="admin-price-field"><input required inputMode="decimal" type="number" min="0.01" step="any" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /><input className="admin-currency-code" aria-label="Currency code" required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" placeholder="USD" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} /></span></label>
              <label className="admin-field">Stock Quantity<input required type="number" min="0" step="1" value={form.inventoryQuantity} onChange={(event) => setForm({ ...form, inventoryQuantity: event.target.value })} /></label>
            </div>

            <fieldset className="admin-category-picker">
              <legend>Categories</legend>
              {categories.length ? <div className="admin-category-chips">{categories.map((category) => <button key={category.id} type="button" className={form.category === category.name ? 'is-selected' : ''} aria-pressed={form.category === category.name} onClick={() => setForm({ ...form, category: category.name })}>{category.name}</button>)}</div> : <p className="admin-muted">Add a category first. <Link to="/admin/categories" onClick={closeForm}>Manage categories</Link></p>}
            </fieldset>

            <fieldset className="admin-image-picker">
              <legend>Product Images</legend>
              <div className="admin-image-url-entry">
                <input type="url" inputMode="url" placeholder="https://example.com/image.jpg" value={imageUrlDraft} onChange={(event) => setImageUrlDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addImageUrl() } }} aria-label="Product image URL" />
                <button className="admin-image-add" type="button" onClick={addImageUrl} disabled={!imageUrlDraft.trim() || form.imageUrls.length + localImages.length >= maxProductImages} aria-label="Add image URL"><Plus size={19} /></button>
              </div>
              <label className="admin-local-upload"><ImagePlus size={17} /><span>Upload from device</span><small>JPEG, PNG, WebP, or GIF - 5 MB max</small><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={form.imageUrls.length + localImages.length >= maxProductImages} onChange={(event) => { addLocalImages(event.currentTarget.files); event.currentTarget.value = '' }} /></label>
              {(form.imageUrls.length > 0 || localImages.length > 0) && <div className="admin-image-previews">{form.imageUrls.map((url, index) => <div className="admin-image-preview" key={`${url}-${index}`}><img src={url} alt={`Product image ${index + 1}`} /><button type="button" onClick={() => setForm((current) => ({ ...current, imageUrls: current.imageUrls.filter((_, imageIndex) => imageIndex !== index) }))} aria-label={`Remove image ${index + 1}`}><X size={16} /></button></div>)}{localImages.map((image, index) => <div className="admin-image-preview" key={image.previewUrl}><img src={image.previewUrl} alt={`Uploaded product image ${form.imageUrls.length + index + 1}`} /><button type="button" onClick={() => removeLocalImage(index)} aria-label={`Remove uploaded image ${form.imageUrls.length + index + 1}`}><X size={16} /></button></div>)}</div>}
              <small className="admin-field-hint">Use a URL or upload an image. Up to 10 images; the first is used in product listings.</small>
            </fieldset>

            <details className="admin-product-advanced">
              <summary>Advanced options</summary>
              <div className="admin-editor-row">
                <label className="admin-field">URL Slug<input maxLength={220} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder={slugFromName(form.name) || 'product-name'} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
                <label className="admin-field">SKU (optional)<input maxLength={80} value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></label>
              </div>
              <div className="admin-publishing-options"><label><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Featured on home page</label><label><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} /> Published in store</label></div>
            </details>
            </fieldset>

            {error && <p className="admin-alert" role="alert">{error}</p>}
            <footer className="admin-product-form__actions"><button className="admin-button admin-button--primary" type="submit" disabled={isSaving || categories.length === 0}>{editingId ? <Save size={16} /> : <Plus size={16} />}{isSaving ? 'Saving…' : editingId ? 'Update Product' : 'Add Product'}</button><button className="admin-button" type="button" onClick={closeForm} disabled={isSaving}>Cancel</button></footer>
          </form>
        </div>
      ) : (
        <>
          <header className="admin-page-heading admin-products-heading">
            <div className="admin-page-heading__title"><Link className="admin-back" to="/admin" aria-label="Back to overview"><ArrowLeft size={21} /></Link><h1>Products</h1></div>
            <button className="admin-button admin-button--primary" type="button" onClick={beginCreate}><Plus size={18} />Add Product</button>
          </header>

          {error && <p className="admin-alert" role="alert">{error}</p>}
          {message && <p className="admin-success" role="status">{message}</p>}

          <div className="admin-toolbar">
            <label className="admin-search"><Search size={18} /><input type="search" placeholder="Search products..." value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search products" /></label>
            <span className="admin-muted">{products.length} {products.length === 1 ? 'product' : 'products'}</span>
          </div>

          <div className="admin-panel admin-table-wrap">
            {isLoading ? <p className="admin-table-message" role="status">Loading products...</p> : filteredProducts.length === 0 ? (
              <div className="admin-table-message"><h2>{products.length ? 'No matching products' : 'No products yet'}</h2><p>{products.length ? 'Try another search.' : 'Add your first product to the catalog.'}</p></div>
            ) : (
              <table className="admin-table admin-products-table">
                <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
                <tbody>{filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.imageUrl ? <img className="admin-product-thumb" src={product.imageUrl} alt="" /> : <span className="admin-product-thumb admin-product-thumb--empty">-</span>}</td>
                    <td><strong>{product.name}</strong><small>{product.category}{product.sku ? ` | ${product.sku}` : ''}</small></td>
                    <td>{formatMoney(product.priceMinor, product.currency)}</td>
                    <td><span className="admin-stock">{product.inventoryQuantity}</span></td>
                    <td><div className="admin-row-actions"><button className="admin-icon-button" type="button" onClick={() => beginEdit(product)} aria-label={`Edit ${product.name}`}><Pencil size={18} /></button><button className="admin-icon-button is-danger" type="button" onClick={() => void deleteProduct(product)} aria-label={`Delete ${product.name}`}><Trash2 size={18} /></button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
