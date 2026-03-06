import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', business_name: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md animate-fade-up">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-acid rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-ink-950" fill="currentColor" />
          </div>
          <span className="font-display font-extrabold text-white text-lg">InvoiceFlow</span>
        </div>

        <h2 className="font-display font-extrabold text-3xl text-white mb-2">Create account</h2>
        <p className="text-ink-400 mb-8">Start invoicing in minutes. Free to get started.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Full Name *</label>
              <input className="input" type="text" placeholder="Rahul Sharma" value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Business Name</label>
              <input className="input" type="text" placeholder="Sharma Studio" value={form.business_name} onChange={set('business_name')} />
            </div>
          </div>

          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>

          <div>
            <label className="label">Password *</label>
            <div className="relative">
              <input className="input pr-11" type={showPw ? 'text' : 'password'} placeholder="Min 8 characters"
                value={form.password} onChange={set('password')} required />
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
              : <> Create Account <ArrowRight size={16} /> </>
            }
          </button>
        </form>

        <p className="text-ink-400 text-sm mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-acid hover:underline font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
