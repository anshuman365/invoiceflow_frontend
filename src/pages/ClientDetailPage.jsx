import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { clientsAPI } from '../api'
import toast from 'react-hot-toast'
import { ArrowLeft, Mail, Phone, Building2, MapPin, FileText, Plus, Edit, X, Check } from 'lucide-react'
import StatusBadge from '../components/ui/StatusBadge'
import { fmtCurrency, fmtDate } from '../utils'

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [cd, inv] = await Promise.all([
        clientsAPI.get(id),
        clientsAPI.invoices(id),
      ])
      setClient(cd.data.client)
      setForm(cd.data.client)
      setInvoices(inv.data.invoices)
    } catch { toast.error('Client not found'); navigate('/clients') }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await clientsAPI.update(id, form)
      setClient(data.client)
      setEditing(false)
      toast.success('Client updated')
    } catch { toast.error('Update failed') }
    setSaving(false)
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" /></div>
  if (!client) return null

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/clients')} className="p-2 text-ink-400 hover:text-white hover:bg-ink-800 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-extrabold text-2xl text-white">{client.name}</h1>
            {!editing
              ? <button onClick={() => setEditing(true)} className="p-1.5 text-ink-400 hover:text-acid hover:bg-ink-800 rounded-lg transition-colors"><Edit size={15} /></button>
              : <div className="flex gap-1">
                  <button onClick={handleSave} disabled={saving} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"><Check size={15} /></button>
                  <button onClick={() => { setEditing(false); setForm(client) }} className="p-1.5 text-coral hover:bg-coral/10 rounded-lg transition-colors"><X size={15} /></button>
                </div>
            }
          </div>
          {client.company && <p className="text-ink-400 text-sm">{client.company}</p>}
        </div>
        <button onClick={() => navigate(`/invoices/new?client=${id}`)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client info */}
        <div className="flex flex-col gap-4">
          {/* Stats */}
          <div className="card p-5 grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Invoiced', value: fmtCurrency(client.stats?.total_invoiced), color: 'text-white' },
              { label: 'Paid', value: fmtCurrency(client.stats?.total_paid), color: 'text-green-400' },
              { label: 'Outstanding', value: fmtCurrency(client.stats?.outstanding), color: client.stats?.outstanding > 0 ? 'text-coral' : 'text-ink-400' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-xs text-ink-500 mb-1">{label}</p>
                <p className={`font-bold text-sm ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="card p-5">
            <p className="label mb-4">Contact Info</p>
            {editing ? (
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Name', key: 'name', type: 'text' },
                  { label: 'Email', key: 'email', type: 'email' },
                  { label: 'Phone', key: 'phone', type: 'text' },
                  { label: 'Company', key: 'company', type: 'text' },
                  { label: 'GSTIN', key: 'gstin', type: 'text' },
                  { label: 'City', key: 'billing_city', type: 'text' },
                  { label: 'State', key: 'billing_state', type: 'text' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="label text-xs">{label}</label>
                    <input className="input text-sm py-2" type={type} value={form[key] || ''} onChange={set(key)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[
                  { icon: Mail, value: client.email },
                  { icon: Phone, value: client.phone },
                  { icon: Building2, value: client.company },
                  { icon: MapPin, value: [client.billing_city, client.billing_state].filter(Boolean).join(', ') },
                ].map(({ icon: Icon, value }) => value ? (
                  <div key={value} className="flex items-center gap-2.5 text-sm text-ink-300">
                    <Icon size={14} className="text-ink-500 shrink-0" />
                    <span className="truncate">{value}</span>
                  </div>
                ) : null)}
                {client.gstin && (
                  <div className="flex items-center gap-2.5 text-sm text-ink-300">
                    <span className="text-ink-500 text-xs">GST</span>
                    <span className="font-mono text-xs">{client.gstin}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-ink-800">
              <h3 className="font-display font-600 text-white">
                Invoices <span className="text-ink-400 font-mono text-sm">({invoices.length})</span>
              </h3>
            </div>
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText size={32} className="text-ink-700 mb-3" />
                <p className="text-ink-400 text-sm">No invoices for this client yet</p>
                <button onClick={() => navigate('/invoices/new')} className="btn-ghost text-xs mt-3">Create Invoice</button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-800">
                    {['Invoice #', 'Date', 'Amount', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-display font-600 text-ink-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="table-row cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                      <td className="px-5 py-3.5 font-mono text-sm text-acid">{inv.invoice_number}</td>
                      <td className="px-5 py-3.5 text-sm text-ink-300">{fmtDate(inv.issue_date)}</td>
                      <td className="px-5 py-3.5 text-sm font-600 text-white">{fmtCurrency(inv.total)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
