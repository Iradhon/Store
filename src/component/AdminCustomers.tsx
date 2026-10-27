import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './styles/admin.css'

interface Customer {
  id: string
  display_name: string | null
  phone: string | null
  created_at: string
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadCustomers() {
      if (!supabase) {
        setError('Supabase is not configured.')
        setIsLoading(false)
        return
      }
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('id, display_name, phone, created_at')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })
      if (!active) return
      if (queryError) setError('Could not load customer profiles. Apply the latest Supabase migration and try again.')
      else setCustomers(data ?? [])
      setIsLoading(false)
    }
    void loadCustomers()
    return () => { active = false }
  }, [])

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return customers
    return customers.filter((customer) =>
      (customer.display_name ?? '').toLowerCase().includes(term)
      || (customer.phone ?? '').toLowerCase().includes(term)
      || customer.id.toLowerCase().includes(term),
    )
  }, [customers, search])

  return (
    <section className="admin-section">
      <header className="admin-page-heading">
        <div className="admin-page-heading__title"><Link className="admin-back" to="/admin" aria-label="Back to overview"><ArrowLeft size={21} /></Link><h1>Customers</h1></div>
      </header>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      <div className="admin-toolbar">
        <label className="admin-search"><Search size={18} /><input type="search" placeholder="Search customers..." value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search customers" /></label>
        <span className="admin-muted">{customers.length} {customers.length === 1 ? 'customer' : 'customers'}</span>
      </div>
      <div className="admin-panel admin-table-wrap">
        {isLoading ? <p className="admin-table-message" role="status">Loading customers...</p> : filteredCustomers.length === 0 ? (
          <div className="admin-table-message"><h2>{customers.length ? 'No matching customers' : 'No customer accounts yet'}</h2><p>{customers.length ? 'Try another search.' : 'Customer accounts will appear here after sign-up.'}</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Customer</th><th>Phone</th><th>Customer ID</th><th>Joined</th></tr></thead>
            <tbody>{filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td><strong>{customer.display_name || 'Unnamed customer'}</strong></td>
                <td>{customer.phone || '—'}</td>
                <td>{customer.id.slice(0, 8).toUpperCase()}</td>
                <td>{new Date(customer.created_at).toLocaleDateString()}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </section>
  )
}
