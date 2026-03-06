import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      // Small delay to ensure token is stored before navigation triggers API calls
      setTimeout(() => navigate('/dashboard', { replace: true }), 50)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-ink-900 border-r border-ink-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, #b8ff57 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-acid rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-ink-950" fill="currentColor" />
            </div>
            <span className="font-display font-extrabold text-white text-xl">InvoiceFlow</span>
          </div>
          <div>
            <h1 className="font-display font-extrabold text-5xl text-white leading-tight mb-6">
              Invoice<br /><span className="text-acid">smarter.</span><br />Get paid faster.
            </h1>
            <p className="text-ink-300 text-lg leading-relaxed max-w-sm">
              Professional invoicing for freelancers. Create, send, and track invoices with Razorpay payments built in.
            </p>
          </div>
          <div className="flex gap-6">
            {[['∞', 'Invoices'], ['⚡', 'Razorpay'], ['📊', 'Analytics']].map(([icon, label]) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs text-ink-400 font-mono">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-acid rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-ink-950" fill="currentColor" />
            </div>
            <span className="font-display font-extrabold text-white text-lg">InvoiceFlow</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl text-white mb-2">Sign in</h2>
          <p className="text-ink-400 mb-8">Welcome back. Enter your credentials.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-11" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 mt-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
                : <> Sign in <ArrowRight size={16} /> </>}
            </button>
          </form>
          <p className="text-ink-400 text-sm mt-6 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-acid hover:underline font-semibold">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
