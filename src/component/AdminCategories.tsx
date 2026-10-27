import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import './styles/admin.css'

type Category = Database['public']['Tables']['categories']['Row']

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    const { data, error: queryError } = await supabase.from('categories').select('*').order('name')
    if (queryError) setError('Could not load categories. Apply the latest Supabase migration and try again.')
    else {
      setCategories(data ?? [])
      setError(null)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { void loadCategories() }, [loadCategories])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return setError('Supabase is not configured.')
    const categoryName = name.trim()
    if (!categoryName) return

    setIsSaving(true)
    setError(null)
    setMessage(null)
    const result = editingId
      ? await supabase.from('categories').update({ name: categoryName }).eq('id', editingId)
      : await supabase.from('categories').insert({ name: categoryName })
    setIsSaving(false)

    if (result.error) {
      setError(result.error.code === '23505'
        ? 'A category with that name already exists.'
        : 'The category could not be saved. Check your permissions and try again.')
      return
    }

    setMessage(editingId ? 'Category updated.' : 'Category added.')
    setName('')
    setEditingId(null)
    await loadCategories()
  }

  function beginEdit(category: Category) {
    setEditingId(category.id)
    setName(category.name)
    setError(null)
    setMessage(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setName('')
  }

  async function deleteCategory(category: Category) {
    if (!supabase || !window.confirm(`Delete “${category.name}”? Products assigned to this category must be moved first.`)) return
    setError(null)
    setMessage(null)
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', category.id)
    if (deleteError) {
      setError(deleteError.code === '23503'
        ? 'This category is assigned to products. Reassign those products before deleting it.'
        : 'The category could not be deleted. Check your permissions and try again.')
      return
    }
    setMessage('Category deleted.')
    if (editingId === category.id) cancelEdit()
    await loadCategories()
  }

  return (
    <div className="admin-section admin-categories-page">
      <header className="admin-page-heading">
        <div className="admin-page-heading__title"><Link className="admin-back" to="/admin" aria-label="Back to overview"><ArrowLeft size={21} /></Link><h1>Categories</h1></div>
      </header>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      {message && <p className="admin-success" role="status">{message}</p>}

      <section className="admin-panel admin-category-form" aria-labelledby="add-category-heading">
        <h2 id="add-category-heading">{editingId ? 'Edit Category' : 'Add Category'}</h2>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <input aria-label="Category name" required maxLength={80} placeholder="Category name" value={name} onChange={(event) => setName(event.target.value)} />
          <button className="admin-button admin-button--primary" type="submit" disabled={isSaving}>{editingId ? <Save size={18} /> : <Plus size={18} />}{isSaving ? 'Saving…' : editingId ? 'Save' : 'Add'}</button>
          {editingId && <button className="admin-icon-button" type="button" onClick={cancelEdit} aria-label="Cancel edit"><X size={18} /></button>}
        </form>
      </section>

      <section className="admin-panel admin-category-list" aria-labelledby="all-categories-heading">
        <h2 id="all-categories-heading">All Categories</h2>
        {isLoading ? <p className="admin-muted" role="status">Loading categories…</p> : categories.length === 0 ? <p className="admin-muted">No categories have been added yet.</p> : (
          <ul>
            {categories.map((category) => (
              <li key={category.id}>
                <span>{category.name}</span>
                <div className="admin-category-list__actions">
                  <button className="admin-icon-button" type="button" onClick={() => beginEdit(category)} aria-label={`Edit ${category.name}`}><Pencil size={18} /></button>
                  <button className="admin-icon-button is-danger" type="button" onClick={() => void deleteCategory(category)} aria-label={`Delete ${category.name}`}><Trash2 size={18} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
