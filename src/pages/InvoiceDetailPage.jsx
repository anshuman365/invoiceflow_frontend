import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { invoicesAPI, paymentsAPI, aiAPI } from '../api'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, Download, Copy, Trash2, IndianRupee, Sparkles, Edit, ExternalLink } from 'lucide-react'
import StatusBadge from '../components/ui/StatusBadge'
import { fmtCurrency, fmtDate } from '../utils'

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [manualPayment, setManualPayment] = useState({ amount: '', method: 'bank_transfer', notes: '' })
  const [aiSummary, setAiSummary] = useState(null)

  const load = async () => {
    try {
      const { data } = await invoicesAPI.get(id)
      setInvoice(data.invoice)
    } catch { toast.error('Invoice not found'); navigate('/invoices') }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const action = (key, fn) => async () => {
    setActionLoading(key)
    try { await fn() } catch (err) { toast.error(err.response?.data?.message || 'Action failed') }
    setActionLoading(null)
  }

  const handleSend = action('send', async () => {
    await invoicesAPI.send(id)
    toast.success('Invoice sent to client!')
    load()
  })

  const handleDuplicate = action('dup', async () => {
    const { data } = await invoicesAPI.duplicate(id)
    toast.success('Invoice duplicated')
    navigate(`/invoices/${data.invoice.id}`)
  })

  const handleCancel = action('cancel', async () => {
    if (!confirm('Cancel this invoice?')) return
    await invoicesAPI.delete(id)
    toast.success('Invoice cancelled')
    load()
  })

  const handleDownload = async () => {
    try {
      const { data } = await invoicesAPI.downloadPdf(id)
      const url = URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url; a.download = `${invoice.invoice_number}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('PDF download failed') }
  }

  const handleManualPay = async () => {
    try {
      await paymentsAPI.record({
        invoice_id: invoice.id,
        amount: manualPayment.amount || invoice.amount_due,
        method: manualPayment.method,
        notes: manualPayment.notes,
      })
      toast.success('Payment recorded!')
      setShowPayModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to record payment') }
  }

  const loadAiSummary = async () => {
    try {
      const { data } = await aiAPI.invoiceSummary(id)
      setAiSummary(data.summary)
    } catch { toast.error('AI summary failed') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!invoice) return null

  const canEdit = !['paid', 'cancelled'].includes(invoice.status)
  const canSend = ['draft', 'sent', 'viewed', 'overdue'].includes(invoice.status)
  const portalUrl = `/portal/invoice/${invoice.portal_token}`

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/invoices')} className="p-2 text-ink-400 hover:text-white hover:bg-ink-800 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-800 text-2xl text-white font-mono">{invoice.invoice_number}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-ink-400 text-sm mt-0.5">
              {invoice.client?.name}{invoice.client?.company ? ` · ${invoice.client.company}` : ''}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <button onClick={() => navigate(`/invoices/${id}/edit`)} className="btn-ghost flex items-center gap-1.5">
              <Edit size={15} /> Edit
            </button>
          )}
          {canSend && (
            <button onClick={handleSend} disabled={actionLoading === 'send'} className="btn-ghost flex items-center gap-1.5">
              {actionLoading === 'send'
                ? <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                : <Send size={15} />} Send
            </button>
          )}
          <button onClick={handleDownload} className="btn-ghost flex items-center gap-1.5">
            <Download size={15} /> PDF
          </button>
          <button onClick={handleDuplicate} disabled={actionLoading === 'dup'} className="btn-ghost flex items-center gap-1.5">
            {actionLoading === 'dup'
              ? <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
              : <Copy size={15} />} Duplicate
          </button>
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <button onClick={() => setShowPayModal(true)} className="btn-primary flex items-center gap-1.5">
              <IndianRupee size={15} /> Record Payment
            </button>
          )}
          {canEdit && (
            <button onClick={handleCancel} className="btn-danger flex items-center gap-1.5">
              <Trash2 size={15} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Portal link */}
      <div className="flex items-center gap-3 bg-ink-900 border border-ink-700 rounded-xl p-4 mb-6">
        <ExternalLink size={16} className="text-acid shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-ink-400 mb-0.5">Client Payment Portal</p>
          <p className="text-sm text-ink-200 font-mono truncate">{window.location.origin}{portalUrl}</p>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(window.location.origin + portalUrl); toast.success('Link copied!') }}
          className="btn-ghost px-3 py-1.5 text-xs shrink-0">
          Copy Link
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main invoice */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* From / To */}
          <div className="card p-6 grid grid-cols-2 gap-6">
            <div>
              <p className="label mb-2">Issue Date</p>
              <p className="text-white font-600">{fmtDate(invoice.issue_date)}</p>
            </div>
            <div>
              <p className="label mb-2">Due Date</p>
              <p className={`font-600 ${invoice.status === 'overdue' ? 'text-coral' : 'text-white'}`}>
                {fmtDate(invoice.due_date)}
              </p>
            </div>
            <div>
              <p className="label mb-2">Bill To</p>
              <p className="text-white font-600">{invoice.client?.name}</p>
              {invoice.client?.company && <p className="text-ink-400 text-sm">{invoice.client.company}</p>}
              <p className="text-ink-400 text-sm">{invoice.client?.email}</p>
            </div>
            <div>
              <p className="label mb-2">Currency</p>
              <p className="text-white font-600">{invoice.currency}</p>
            </div>
          </div>

          {/* Line items */}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-800">
                  {['Description', 'Qty', 'Rate', 'Amount'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-display font-600 text-ink-400 uppercase tracking-wider ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, i) => (
                  <tr key={i} className="border-b border-ink-800/50 last:border-0">
                    <td className="px-5 py-3.5 text-sm text-white">{item.description}</td>
                    <td className="px-5 py-3.5 text-sm text-ink-300 whitespace-nowrap">{item.quantity} {item.unit}</td>
                    <td className="px-5 py-3.5 text-sm text-ink-300 whitespace-nowrap font-mono">{fmtCurrency(item.rate, invoice.currency)}</td>
                    <td className="px-5 py-3.5 text-sm text-white font-mono text-right whitespace-nowrap">{fmtCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-ink-800 p-5">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm text-ink-300">
                    <span>Subtotal</span>
                    <span className="font-mono">{fmtCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-ink-300">
                      <span>Discount</span>
                      <span className="font-mono text-coral">- {fmtCurrency(invoice.discount_amount, invoice.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-ink-300">
                    <span>{invoice.tax_name} ({invoice.tax_rate}%)</span>
                    <span className="font-mono">+ {fmtCurrency(invoice.tax_amount, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between font-display font-700 text-lg text-white border-t border-ink-700 pt-3">
                    <span>Total</span>
                    <span className="text-acid font-mono">{fmtCurrency(invoice.total, invoice.currency)}</span>
                  </div>
                  {invoice.amount_paid > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-400">
                        <span>Paid</span>
                        <span className="font-mono">- {fmtCurrency(invoice.amount_paid, invoice.currency)}</span>
                      </div>
                      <div className="flex justify-between font-600 text-white">
                        <span>Balance Due</span>
                        <span className="font-mono text-coral">{fmtCurrency(invoice.amount_due, invoice.currency)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(invoice.notes || invoice.terms) && (
            <div className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {invoice.notes && (
                <div>
                  <p className="label mb-2">Notes</p>
                  <p className="text-ink-300 text-sm">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="label mb-2">Terms</p>
                  <p className="text-ink-300 text-sm">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Payment summary */}
          <div className="card p-5">
            <p className="label mb-4">Payment Summary</p>
            <div className={`rounded-xl p-4 text-center mb-4 ${invoice.status === 'paid' ? 'bg-green-900/20 border border-green-700/30' : 'bg-ink-900'}`}>
              <p className="text-xs text-ink-400 mb-1">
                {invoice.status === 'paid' ? 'Paid in Full' : 'Amount Due'}
              </p>
              <p className={`font-display font-800 text-2xl ${invoice.status === 'paid' ? 'text-green-400' : 'text-acid'}`}>
                {fmtCurrency(invoice.status === 'paid' ? invoice.total : invoice.amount_due, invoice.currency)}
              </p>
              {invoice.status === 'paid' && invoice.paid_at && (
                <p className="text-xs text-green-500 mt-1">{fmtDate(invoice.paid_at)}</p>
              )}
            </div>
          </div>

          {/* AI Summary */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="label">AI Summary</p>
              <button onClick={loadAiSummary} className="p-1 text-ink-400 hover:text-acid transition-colors">
                <Sparkles size={14} />
              </button>
            </div>
            {aiSummary
              ? <p className="text-ink-300 text-sm leading-relaxed">{aiSummary}</p>
              : <p className="text-ink-500 text-xs">Click ✨ to generate a plain-English summary of this invoice</p>
            }
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <p className="label mb-4">Timeline</p>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Created', date: invoice.created_at, color: 'bg-ink-600' },
                { label: 'Sent', date: invoice.sent_at, color: 'bg-blue-500' },
                { label: 'Viewed', date: invoice.viewed_at, color: 'bg-purple-500' },
                { label: 'Paid', date: invoice.paid_at, color: 'bg-green-500' },
              ].map(({ label, date, color }) => (
                <div key={label} className={`flex items-center gap-3 ${!date ? 'opacity-30' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${date ? color : 'bg-ink-700'}`} />
                  <span className="text-xs text-ink-400 w-14">{label}</span>
                  <span className="text-xs text-ink-300">{date ? fmtDate(date) : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-fade-up">
            <h3 className="font-display font-700 text-white text-lg mb-5">Record Payment</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Amount ({invoice.currency})</label>
                <input className="input" type="number" step="0.01"
                  placeholder={invoice.amount_due}
                  value={manualPayment.amount}
                  onChange={e => setManualPayment(p => ({ ...p, amount: e.target.value }))} />
                <p className="text-xs text-ink-500 mt-1">Leave empty to record full amount due: {fmtCurrency(invoice.amount_due, invoice.currency)}</p>
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select className="input cursor-pointer" value={manualPayment.method}
                  onChange={e => setManualPayment(p => ({ ...p, method: e.target.value }))}>
                  {['bank_transfer', 'upi', 'cash', 'cheque', 'other'].map(m => (
                    <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input className="input" placeholder="Reference number, UTR ID..."
                  value={manualPayment.notes}
                  onChange={e => setManualPayment(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPayModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleManualPay} className="btn-primary flex-1">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
