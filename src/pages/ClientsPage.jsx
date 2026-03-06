import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientsAPI } from '../api'
import toast from 'react-hot-toast'
import { Plus, Search, Users, X, Building2 } from 'lucide-react'
import { fmtCurrency } from '../utils'

const emptyForm = {
  name: '', email: '', phone: '', company: '', website: '',
  billing_address: '', billing_city: '', billing_state: '',
  billing_country: 'India', currency: 'INR', payment_terms: 30, gstin: '', notes: '',
}

export default function ClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await clientsAPI.list({ search, page, per_page: 15 })
      setClients(data.clients)
      setTotal(data.total)
    } catch { toast.error('Failed to load clients') }
    setLoading(false)
  }, [search, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await clientsAPI.create(form)
      toast.success('Client added!')
      setShowModal(false)
      setForm(emptyForm)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create client') }
    setSaving(false)
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">Clients</h1>
          <p className="text-ink-400 text-sm mt-1">{total} client{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input className="input pl-10 max-w-sm" placeholder="Search by name, email, company..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-acid border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={40} className="text-ink-700 mb-4" />
          <p className="text-ink-300 font-600">No clients yet</p>
          <p className="text-ink-500 text-sm mt-1">Add your first client to start invoicing</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Add Client</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map(client => (
              <div key={client.id} className="card p-5 hover:border-ink-600 transition-colors cursor-pointer animate-fade-up"
                onClick={() => navigate(`/clients/${client.id}`)}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-ink-700 rounded-xl flex items-center justify-center shrink-0">
                    {client.company
                      ? <Building2 size={18} className="text-acid" />
                      : <span className="font-display font-bold text-acid text-sm">{client.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-600 text-white truncate">{client.name}</p>
                    {client.company && <p className="text-xs text-ink-400 truncate">{client.company}</p>}
                    <p className="text-xs text-ink-500 truncate mt-0.5">{client.email}</p>
                  </div>
                </div>
                {client.stats && (
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-ink-800">
                    <div className="text-center">
                      <p className="text-xs text-ink-500">Invoiced</p>
                      <p className="text-sm font-600 text-white mt-0.5">{fmtCurrency(client.stats.total_invoiced)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-ink-500">Paid</p>
                      <p className="text-sm font-600 text-green-400 mt-0.5">{fmtCurrency(client.stats.total_paid)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-ink-500">Due</p>
                      <p className={`text-sm font-600 mt-0.5 ${client.stats.outstanding > 0 ? 'text-coral' : 'text-ink-400'}`}>
                        {fmtCurrency(client.stats.outstanding)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {total > 15 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-ghost px-4 py-2 text-sm disabled:opacity-40">← Prev</button>
              <span className="text-ink-400 text-sm">{page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total} className="btn-ghost px-4 py-2 text-sm disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="card w-full max-w-2xl p-6 my-4 animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-white text-lg">Add New Client</h3>
              <button onClick={() => setShowModal(false)} className="text-ink-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Name *</label>
                  <input className="input" placeholder="Rahul Sharma" value={form.name} onChange={set('name')} required />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input className="input" type="email" placeholder="rahul@company.com" value={form.email} onChange={set('email')} required />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
                </div>
                <div>
                  <label className="label">Company</label>
                  <input className="input" placeholder="ACME Corp" value={form.company} onChange={set('company')} />
                </div>
                <div>
                  <label className="label">GSTIN</label>
                  <input className="input" placeholder="27AAABB1234C1Z5" value={form.gstin} onChange={set('gstin')} />
                </div>
                <div>
                  <label className="label">Payment Terms (days)</label>
                  <input className="input" type="number" min="1" value={form.payment_terms} onChange={set('payment_terms')} />
                </div>
                <div>
                  <label className="label">City</label>
                  <input className="input" placeholder="Mumbai" value={form.billing_city} onChange={set('billing_city')} />
                </div>
                <div>
                  <label className="label">State</label>
                  <input className="input" placeholder="Maharashtra" value={form.billing_state} onChange={set('billing_state')} />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input resize-none" rows={2} placeholder="Any notes about this client..." value={form.notes} onChange={set('notes')} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /> : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
