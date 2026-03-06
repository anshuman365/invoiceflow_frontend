import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { invoicesAPI, clientsAPI } from '../api'
import toast from 'react-hot-toast'
import { Plus, Trash2, ArrowLeft, Sparkles, Save } from 'lucide-react'
import { aiAPI } from '../api'
import { fmtCurrency } from '../utils'

const emptyItem = () => ({ description: '', quantity: 1, unit: 'hrs', rate: '', amount: 0 })

export default function CreateInvoicePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [clients, setClients] = useState([])
  const [aiEnabled, setAiEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [aiLoading, setAiLoading] = useState(null) // index of item being AI-enhanced

  const today = new Date().toISOString().split('T')[0]
  const due30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    client_id: '',
    issue_date: today,
    due_date: due30,
    tax_name: 'GST',
    tax_rate: 18,
    discount_type: 'percentage',
    discount_value: 0,
    currency: 'INR',
    notes: '',
    terms: 'Payment is due within 30 days. Late payments may incur a 2% monthly fee.',
    items: [emptyItem()],
  })

  // Load clients & AI status
  useEffect(() => {
    const init = async () => {
      try {
        const [cl, ai] = await Promise.all([
          clientsAPI.list({ per_page: 100 }),
          aiAPI.status(),
        ])
        setClients(cl.data.clients)
        setAiEnabled(ai.data.ai_enabled)
      } catch {}
    }
    init()
  }, [])

  // Load invoice for edit
  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await invoicesAPI.get(id)
        const inv = data.invoice
        setForm({
          client_id: inv.client_id || inv.client?.id || '',
          issue_date: inv.issue_date,
          due_date: inv.due_date,
          tax_name: inv.tax_name,
          tax_rate: inv.tax_rate,
          discount_type: inv.discount_type,
          discount_value: inv.discount_value,
          currency: inv.currency,
          notes: inv.notes || '',
          terms: inv.terms || '',
          items: inv.items.map(i => ({ ...i, amount: i.amount })),
        })
      } catch { toast.error('Failed to load invoice') }
      setLoading(false)
    }
    load()
  }, [id, isEdit])

  // Recalculate item amounts
  const updateItem = (idx, field, value) => {
    setForm(prev => {
      const items = [...prev.items]
      items[idx] = { ...items[idx], [field]: value }
      if (field === 'quantity' || field === 'rate') {
        items[idx].amount = parseFloat(items[idx].quantity || 0) * parseFloat(items[idx].rate || 0)
      }
      return { ...prev, items }
    })
  }

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, emptyItem()] }))
  const removeItem = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))

  // Totals
  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.quantity) * parseFloat(i.rate) || 0), 0)
  const discountAmt = form.discount_type === 'percentage'
    ? subtotal * (parseFloat(form.discount_value) / 100)
    : parseFloat(form.discount_value) || 0
  const taxable = subtotal - discountAmt
  const taxAmt = taxable * (parseFloat(form.tax_rate) / 100)
  const total = taxable + taxAmt

  // AI enhance description
  const aiEnhance = async (idx) => {
    const desc = form.items[idx].description
    if (!desc.trim()) return toast.error('Enter a description first')
    setAiLoading(idx)
    try {
      const { data } = await aiAPI.generateDescription(desc)
      updateItem(idx, 'description', data.description)
      toast.success('Description enhanced!')
    } catch { toast.error('AI enhancement failed') }
    setAiLoading(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.client_id) return toast.error('Select a client')
    if (form.items.some(i => !i.description || !i.rate)) return toast.error('Fill all item fields')
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        items: form.items.map(i => ({
          description: i.description,
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          rate: parseFloat(i.rate),
        })),
      }
      if (isEdit) {
        await invoicesAPI.update(id, payload)
        toast.success('Invoice updated')
        navigate(`/invoices/${id}`)
      } else {
        const { data } = await invoicesAPI.create(payload)
        toast.success('Invoice created!')
        navigate(`/invoices/${data.invoice.id}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save invoice')
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 text-ink-400 hover:text-white hover:bg-ink-800 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">
            {isEdit ? 'Edit Invoice' : 'New Invoice'}
          </h1>
          <p className="text-ink-400 text-sm mt-0.5">
            {isEdit ? 'Update invoice details' : 'Fill in the details below'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Client & Dates */}
        <div className="card p-6">
          <h3 className="font-display font-600 text-white mb-5">Invoice Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="label">Client *</label>
              <select className="input cursor-pointer" value={form.client_id}
                onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} required>
                <option value="">Select client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Issue Date</label>
              <input className="input" type="date" value={form.issue_date}
                onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date}
                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="input cursor-pointer" value={form.currency}
                onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                {['INR', 'USD', 'EUR', 'GBP', 'AED'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tax Name</label>
              <input className="input" value={form.tax_name}
                onChange={e => setForm(p => ({ ...p, tax_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Tax Rate (%)</label>
              <input className="input" type="number" min="0" max="100" step="0.01" value={form.tax_rate}
                onChange={e => setForm(p => ({ ...p, tax_rate: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-600 text-white">Line Items</h3>
            <button type="button" onClick={addItem} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs">
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Header */}
            <div className="hidden lg:grid grid-cols-12 gap-3 px-1">
              {['Description', 'Qty', 'Unit', 'Rate', 'Amount', ''].map((h, i) => (
                <div key={i} className={`text-xs font-display font-600 text-ink-400 uppercase tracking-wider ${
                  i === 0 ? 'col-span-5' : i === 4 ? 'col-span-2 text-right' : i === 5 ? 'col-span-1' : 'col-span-1'
                }`}>{h}</div>
              ))}
            </div>

            {form.items.map((item, idx) => (
              <div key={idx} className="bg-ink-900 border border-ink-800 rounded-xl p-4">
                <div className="grid grid-cols-12 gap-3 items-start">
                  {/* Description */}
                  <div className="col-span-12 lg:col-span-5">
                    <label className="label lg:hidden">Description</label>
                    <div className="relative">
                      <input
                        className="input pr-10"
                        placeholder="e.g. Web development services"
                        value={item.description}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                        required
                      />
                      {aiEnabled && (
                        <button type="button" onClick={() => aiEnhance(idx)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-acid rounded-lg transition-colors"
                          title="AI enhance description">
                          {aiLoading === idx
                            ? <div className="w-3.5 h-3.5 border border-acid border-t-transparent rounded-full animate-spin" />
                            : <Sparkles size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Qty */}
                  <div className="col-span-4 lg:col-span-1">
                    <label className="label lg:hidden">Qty</label>
                    <input className="input text-center" type="number" min="0.01" step="0.01"
                      value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                  </div>
                  {/* Unit */}
                  <div className="col-span-4 lg:col-span-1">
                    <label className="label lg:hidden">Unit</label>
                    <select className="input cursor-pointer" value={item.unit}
                      onChange={e => updateItem(idx, 'unit', e.target.value)}>
                      {['hrs', 'days', 'pcs', 'months', 'words', 'pages', 'fixed'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  {/* Rate */}
                  <div className="col-span-4 lg:col-span-2">
                    <label className="label lg:hidden">Rate</label>
                    <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                      value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} required />
                  </div>
                  {/* Amount */}
                  <div className="col-span-11 lg:col-span-2">
                    <label className="label lg:hidden">Amount</label>
                    <div className="input bg-ink-800 text-acid font-mono text-right cursor-not-allowed">
                      {fmtCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0), form.currency)}
                    </div>
                  </div>
                  {/* Delete */}
                  <div className="col-span-1 flex items-end justify-end pb-0.5">
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)}
                        className="p-1.5 text-ink-500 hover:text-coral hover:bg-coral/10 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm text-ink-300">
                <span>Subtotal</span>
                <span className="font-mono">{fmtCurrency(subtotal, form.currency)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-300">
                <span className="flex-1">Discount</span>
                <select className="bg-ink-800 border border-ink-700 rounded-lg px-2 py-0.5 text-xs text-ink-300 cursor-pointer"
                  value={form.discount_type} onChange={e => setForm(p => ({ ...p, discount_type: e.target.value }))}>
                  <option value="percentage">%</option>
                  <option value="fixed">Fixed</option>
                </select>
                <input className="w-20 bg-ink-800 border border-ink-700 rounded-lg px-2 py-0.5 text-xs text-center text-white outline-none focus:border-acid/60"
                  type="number" min="0" step="0.01" value={form.discount_value}
                  onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))} />
                <span className="font-mono w-20 text-right">- {fmtCurrency(discountAmt, form.currency)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-300">
                <span>{form.tax_name} ({form.tax_rate}%)</span>
                <span className="font-mono">+ {fmtCurrency(taxAmt, form.currency)}</span>
              </div>
              <div className="flex justify-between font-display font-bold text-lg text-white border-t border-ink-700 pt-3 mt-1">
                <span>Total</span>
                <span className="text-acid font-mono">{fmtCurrency(total, form.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="card p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Notes (visible to client)</label>
              <textarea className="input resize-none" rows={3} placeholder="Thank you for your business!"
                value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div>
              <label className="label">Terms & Conditions</label>
              <textarea className="input resize-none" rows={3} placeholder="Payment terms..."
                value={form.terms} onChange={e => setForm(p => ({ ...p, terms: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
            {submitting
              ? <div className="w-4 h-4 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
              : <><Save size={16} /> {isEdit ? 'Save Changes' : 'Create Invoice'}</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
