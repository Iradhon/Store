import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Check, MapPin, Plus, X } from 'lucide-react'
import type { Database } from '../types/database'
import { useAuth } from '../context/useAuth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

type AddressRow = Database['public']['Tables']['addresses']['Row']

interface AddressFormValues {
  label: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  stateRegion: string
  postalCode: string
  country: string
  isDefault: boolean
}

const emptyForm = (): AddressFormValues => ({
  label: 'Home',
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  country: '',
  isDefault: false,
})

function rowToForm(address: AddressRow): AddressFormValues {
  return {
    label: address.label,
    fullName: address.full_name,
    phone: address.phone,
    addressLine1: address.address_line_1,
    addressLine2: address.address_line_2 ?? '',
    city: address.city,
    stateRegion: address.state_region ?? '',
    postalCode: address.postal_code,
    country: address.country,
    isDefault: address.is_default,
  }
}

export default function AccountAddresses() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<AddressRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<AddressFormValues>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadAddresses = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setAddresses([])
      setLoadError('Address storage is not configured.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setLoadError(null)
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) {
      setAddresses([])
      setLoadError('Saved addresses could not be loaded. Apply the latest Supabase migrations and try again.')
    } else {
      setAddresses(data ?? [])
    }
    setIsLoading(false)
  }, [user])

  useEffect(() => { void loadAddresses() }, [loadAddresses])

  function beginAdd() {
    setEditingId(null)
    setForm({ ...emptyForm(), fullName: user?.fullName ?? '', phone: user?.phone ?? '', isDefault: addresses.length === 0 })
    setShowForm(true)
    setMessage(null)
    setErrorMessage(null)
  }

  function beginEdit(address: AddressRow) {
    setEditingId(address.id)
    setForm(rowToForm(address))
    setShowForm(true)
    setMessage(null)
    setErrorMessage(null)
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !user) return
    setSaving(true)
    setMessage(null)
    setErrorMessage(null)

    const values = {
      label: form.label.trim() || 'Home',
      full_name: form.fullName.trim(),
      phone: form.phone.trim(),
      address_line_1: form.addressLine1.trim(),
      address_line_2: form.addressLine2.trim() || null,
      city: form.city.trim(),
      state_region: form.stateRegion.trim() || null,
      postal_code: form.postalCode.trim(),
      country: form.country.trim(),
    }

    let addressId = editingId
    let saveError: string | null = null
    if (editingId) {
      const { error } = await supabase.from('addresses').update(values).eq('id', editingId)
      if (error) saveError = 'This address could not be updated. Please try again.'
    } else {
      const { data, error } = await supabase.from('addresses').insert(values).select('id').single()
      if (error || !data) saveError = 'This address could not be saved. Please try again.'
      else addressId = data.id
    }

    if (!saveError && addressId && (form.isDefault || addresses.some((address) => address.id === editingId && address.is_default))) {
      const targetAddressId = form.isDefault ? addressId : null
      const { error } = await supabase.rpc('set_default_address', { target_address_id: targetAddressId })
      if (error) saveError = 'The address was saved, but its default status could not be updated.'
    }

    setSaving(false)
    await loadAddresses()
    if (saveError) {
      if (addressId && !editingId) setEditingId(addressId)
      setErrorMessage(saveError)
      return
    }
    setShowForm(false)
    setEditingId(null)
    setMessage(editingId ? 'Address updated.' : 'Address added.')
  }

  async function makeDefault(addressId: string) {
    if (!supabase) return
    setWorkingId(addressId)
    setErrorMessage(null)
    const { error } = await supabase.rpc('set_default_address', { target_address_id: addressId })
    setWorkingId(null)
    if (error) setErrorMessage('The default address could not be changed. Please try again.')
    else {
      setMessage('Default address updated.')
      await loadAddresses()
    }
  }

  async function deleteAddress(address: AddressRow) {
    if (!supabase) return
    setWorkingId(address.id)
    setErrorMessage(null)
    const nextDefault = address.is_default ? addresses.find((item) => item.id !== address.id) : undefined
    if (nextDefault) {
      const { error } = await supabase.rpc('set_default_address', { target_address_id: nextDefault.id })
      if (error) {
        setWorkingId(null)
        setErrorMessage('The default address could not be reassigned, so this address was kept.')
        return
      }
    }
    const { error } = await supabase.from('addresses').delete().eq('id', address.id)
    setWorkingId(null)
    setConfirmDeleteId(null)
    if (error) setErrorMessage('This address could not be removed. Please try again.')
    else {
      setMessage('Address removed.')
      await loadAddresses()
    }
  }

  function updateField<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <div>
      <section className="account-panel">
        <div className="account-toolbar">
          <div>
            <h1 className="account-panel__heading account-addresses__title">Saved Addresses</h1>
            <p className="account-muted">Manage your delivery addresses</p>
          </div>
          {!showForm && <button className="account-button" type="button" onClick={beginAdd}><Plus size={17} /> Add Address</button>}
        </div>

        {message && <p className="account-feedback" role="status">{message}</p>}
        {errorMessage && <p className="account-feedback" role="alert">{errorMessage}</p>}

        {showForm && (
          <form className="account-address-form" onSubmit={(event) => void saveAddress(event)}>
            <div className="account-form__row">
              <label className="account-form__field">Address label<input maxLength={40} required value={form.label} onChange={(event) => updateField('label', event.target.value)} placeholder="Home, Work" /></label>
              <label className="account-form__field">Full name<input autoComplete="name" maxLength={120} required value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} /></label>
            </div>
            <label className="account-form__field">Phone<input autoComplete="tel" maxLength={32} required type="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} /></label>
            <label className="account-form__field">Address line 1<input autoComplete="address-line1" maxLength={200} required value={form.addressLine1} onChange={(event) => updateField('addressLine1', event.target.value)} /></label>
            <label className="account-form__field">Address line 2 <span className="account-muted">(optional)</span><input autoComplete="address-line2" maxLength={200} value={form.addressLine2} onChange={(event) => updateField('addressLine2', event.target.value)} /></label>
            <div className="account-form__row">
              <label className="account-form__field">City<input autoComplete="address-level2" maxLength={100} required value={form.city} onChange={(event) => updateField('city', event.target.value)} /></label>
              <label className="account-form__field">State / Province <span className="account-muted">(optional)</span><input autoComplete="address-level1" maxLength={100} value={form.stateRegion} onChange={(event) => updateField('stateRegion', event.target.value)} /></label>
            </div>
            <div className="account-form__row">
              <label className="account-form__field">Postal code<input autoComplete="postal-code" maxLength={24} required value={form.postalCode} onChange={(event) => updateField('postalCode', event.target.value)} /></label>
              <label className="account-form__field">Country<input autoComplete="country-name" maxLength={100} required value={form.country} onChange={(event) => updateField('country', event.target.value)} /></label>
            </div>
            <label className="account-check-row"><input checked={form.isDefault} type="checkbox" onChange={(event) => updateField('isDefault', event.target.checked)} /> Set as my default address</label>
            <div className="account-address-card__actions">
              <button className="account-button" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save address' : 'Add address'}</button>
              <button className="account-button account-button--secondary" type="button" onClick={() => setShowForm(false)}><X size={16} /> Cancel</button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="account-muted" role="status">Loading saved addresses…</p>
        ) : loadError ? (
          <p className="account-feedback" role="alert">{loadError} <button className="account-link-button" type="button" onClick={() => void loadAddresses()}>Retry</button></p>
        ) : addresses.length === 0 && !showForm ? (
          <div className="account-empty-state"><MapPin size={25} /><p>No saved addresses</p></div>
        ) : (
          <div className="account-address-list">
            {addresses.map((address) => (
              <article className={`account-address-card${address.is_default ? ' is-default' : ''}`} key={address.id}>
                <div className="account-address-card__top">
                  <h3>{address.label}</h3>
                  {address.is_default && <span className="account-address-card__badge"><Check size={13} /> Default</span>}
                </div>
                <p className="account-address-card__body">
                  <strong>{address.full_name}</strong><br />
                  {address.phone}<br />
                  {address.address_line_1}{address.address_line_2 ? `, ${address.address_line_2}` : ''}<br />
                  {address.city}{address.state_region ? `, ${address.state_region}` : ''} {address.postal_code}<br />
                  {address.country}
                </p>
                <div className="account-address-card__actions">
                  {!address.is_default && <button className="account-link-button" type="button" disabled={workingId === address.id} onClick={() => void makeDefault(address.id)}>Set as default</button>}
                  <button className="account-link-button" type="button" onClick={() => beginEdit(address)}>Edit</button>
                  {confirmDeleteId === address.id ? (
                    <><span className="account-muted">Remove this address?</span><button className="account-link-button account-link-button--danger" type="button" disabled={workingId === address.id} onClick={() => void deleteAddress(address)}>Confirm</button><button className="account-link-button" type="button" onClick={() => setConfirmDeleteId(null)}>Cancel</button></>
                  ) : (
                    <button className="account-link-button account-link-button--danger" type="button" onClick={() => setConfirmDeleteId(address.id)}>Remove</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
