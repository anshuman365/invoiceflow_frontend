import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, IndianRupee, Clock, AlertCircle, Users, Plus, ArrowRight } from 'lucide-react'
import StatusBadge from '../components/ui/StatusBadge'
import { fmtCurrency, fmtDate } from '../utils'

const PERIODS = [
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [period, setPeriod] = useState('month')
  const [summary, setSummary] = useState(null)
  const [chart, setChart] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [s, c] = await Promise.all([
          dashboardAPI.summary(period),
          dashboardAPI.monthlyChart(),
        ])
        setSummary(s.data)
        setChart(c.data.chart_data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [period])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-ink-800 border border-ink-700 rounded-xl p-3 text-xs font-mono">
        <p className="text-ink-300 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: ₹{p.value?.toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    )
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const s = summary?.summary || {}

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-acid">{user?.full_name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-ink-400 text-sm mt-1">Here's what's happening with your business</p>
        </div>
        <button onClick={() => navigate('/invoices/new')} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {/* Period filter */}
      <div className="flex gap-1 bg-ink-900 rounded-xl p-1 w-fit mb-8">
        {PERIODS.map(({ key, label }) => (
          <button key={key} onClick={() => setPeriod(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              period === key ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-ink-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Invoiced', value: fmtCurrency(s.total_invoiced), icon: TrendingUp, color: 'text-acid', bg: 'bg-acid/10' },
          { label: 'Total Collected', value: fmtCurrency(s.total_paid), icon: IndianRupee, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Outstanding', value: fmtCurrency(s.total_outstanding), icon: Clock, color: 'text-amber', bg: 'bg-amber/10' },
          { label: 'Overdue', value: fmtCurrency(s.overdue_amount), icon: AlertCircle, color: 'text-coral', bg: 'bg-coral/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card animate-fade-up">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xs text-ink-400 font-mono">{label}</p>
            <p className={`font-display font-extrabold text-xl ${color} mt-0.5`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display font-bold text-white mb-1">Revenue Overview</h3>
          <p className="text-ink-400 text-xs mb-6">Last 12 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradInvoiced" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b8ff57" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#b8ff57" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#4a4a7a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4a4a7a', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#b8ff57" strokeWidth={2} fill="url(#gradInvoiced)" />
              <Area type="monotone" dataKey="paid" name="Paid" stroke="#4ade80" strokeWidth={2} fill="url(#gradPaid)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-white mb-1">Invoice Status</h3>
          <p className="text-ink-400 text-xs mb-5">All time breakdown</p>
          <div className="flex flex-col gap-3">
            {Object.entries(summary?.status_counts || {}).map(([status, count]) => (
              count > 0 && (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="font-mono text-sm font-semibold text-white">{count}</span>
                </div>
              )
            ))}
          </div>

          {/* Quick stats */}
          <div className="border-t border-ink-800 mt-5 pt-5">
            <div className="flex items-center gap-2 text-ink-300 text-sm">
              <Users size={14} className="text-acid" />
              <span>{s.total_clients} active clients</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      {summary?.recent_invoices?.length > 0 && (
        <div className="card mt-6">
          <div className="flex items-center justify-between p-6 pb-0">
            <h3 className="font-display font-bold text-white">Recent Invoices</h3>
            <button onClick={() => navigate('/invoices')}
              className="text-acid text-sm hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-800">
                  {['Invoice', 'Client', 'Amount', 'Due', 'Status'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-display font-semibold text-ink-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.recent_invoices.map(inv => (
                  <tr key={inv.id} className="table-row cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                    <td className="px-6 py-4 font-mono text-sm text-acid">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-white">{inv.client?.name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">{fmtCurrency(inv.total)}</td>
                    <td className="px-6 py-4 text-sm text-ink-300">{fmtDate(inv.due_date)}</td>
                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
