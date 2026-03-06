import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoicesAPI } from '../api'
import toast from 'react-hot-toast'
import { Plus, Search, Filter, FileText, Download } from 'lucide-react'
import StatusBadge from '../components/ui/StatusBadge'
import { fmtCurrency, fmtDate } from '../utils'

const STATUSES = ['', 'draft', 'sent', 'viewed', 'paid', 'overdue', 'partial', 'cancelled']

export default function InvoicesPage() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await invoicesAPI.list({ search, status, page, per_page: perPage })
      setInvoices(data.invoices)
      setTotal(data.total)
    } catch { toast.error('Failed to load invoices') }
    setLoading(false)
  }, [search, status, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, status])

  const downloadPdf = async (e, inv) => {
    e.stopPropagation()
    try {
      const { data } = await invoicesAPI.downloadPdf(inv.id)
      const url = URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url; a.download = `${inv.invoice_number}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('PDF download failed') }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">Invoices</h1>
          <p className="text-ink-400 text-sm mt-1">{total} invoice{total !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => navigate('/invoices/new')} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="input pl-10" placeholder="Search invoice number..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <select className="input pl-10 pr-8 appearance-none cursor-pointer min-w-40"
            value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.filter(Boolean).map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-acid border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText size={40} className="text-ink-700 mb-4" />
            <p className="text-ink-300 font-semibold">No invoices found</p>
            <p className="text-ink-500 text-sm mt-1">Create your first invoice to get started</p>
            <button onClick={() => navigate('/invoices/new')} className="btn-primary mt-4">
              Create Invoice
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-800">
                    {['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Amount', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-display font-semibold text-ink-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="table-row cursor-pointer"
                      onClick={() => navigate(`/invoices/${inv.id}`)}>
                      <td className="px-5 py-4 font-mono text-sm text-acid font-medium">{inv.invoice_number}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-white font-medium">{inv.client?.name}</p>
                        {inv.client?.company && <p className="text-xs text-ink-400">{inv.client.company}</p>}
                      </td>
                      <td className="px-5 py-4 text-sm text-ink-300 whitespace-nowrap">{fmtDate(inv.issue_date)}</td>
                      <td className="px-5 py-4 text-sm text-ink-300 whitespace-nowrap">{fmtDate(inv.due_date)}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-white whitespace-nowrap">{fmtCurrency(inv.total)}</p>
                        {inv.amount_due > 0 && inv.status !== 'paid' && (
                          <p className="text-xs text-coral">Due: {fmtCurrency(inv.amount_due)}</p>
                        )}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                      <td className="px-5 py-4">
                        <button onClick={(e) => downloadPdf(e, inv)}
                          className="p-1.5 text-ink-400 hover:text-acid rounded-lg hover:bg-ink-700 transition-colors">
                          <Download size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {total > perPage && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-ink-800">
                <p className="text-xs text-ink-400">
                  Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40">← Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page * perPage >= total} className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
