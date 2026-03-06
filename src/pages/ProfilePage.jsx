import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'
import toast from 'react-hot-toast'
import { User, Lock, Building2, Save } from 'lucide-react'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    business_name: user?.business_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || 'India',
    gstin: user?.gstin || '',
    currency: user?.currency || 'INR',
    invoice_prefix: user?.invoice_prefix || 'INV',
  })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const setPw = (k) => (e) => setPwForm(p => ({ ...p, [k]: e.target.value }))

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await authAPI.updateProfile(form)
      updateUser(data.user)
      toast.success('Profile updated!')
    } catch { toast.error('Update failed') }
    setSaving(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) return toast.error('Passwords do not match')
    if (pwForm.new_password.length < 8) return toast.error('Password must be at least 8 characters')
    setSaving(true)
    try {
      await authAPI.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      toast.success('Password changed!')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    setSaving(false)
  }

  const TABS = [
    { key: 'profile', icon: User, label: 'Profile' },
    { key: 'business', icon: Building2, label: 'Business' },
    { key: 'security', icon: Lock, label: 'Security' },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      <h1 className="font-display font-800 text-2xl text-white mb-8">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-ink-900 rounded-xl p-1 w-fit mb-8">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all ${
              tab === key ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-ink-200'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleProfileSave} className="card p-6 flex flex-col gap-5">
          <h3 className="font-display font-600 text-white">Personal Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input bg-ink-800 cursor-not-allowed" value={user?.email} disabled />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="label">Country</label>
              <input className="input" value={form.country} onChange={set('country')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input className="input" placeholder="Street address" value={form.address} onChange={set('address')} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" placeholder="Mumbai" value={form.city} onChange={set('city')} />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" placeholder="Maharashtra" value={form.state} onChange={set('state')} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /> : <><Save size={15} /> Save Changes</>}
            </button>
          </div>
        </form>
      )}

      {tab === 'business' && (
        <form onSubmit={handleProfileSave} className="card p-6 flex flex-col gap-5">
          <h3 className="font-display font-600 text-white">Business Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Business Name</label>
              <input className="input" placeholder="Your Studio / Agency" value={form.business_name} onChange={set('business_name')} />
            </div>
            <div>
              <label className="label">GSTIN</label>
              <input className="input" placeholder="27AAABB1234C1Z5" value={form.gstin} onChange={set('gstin')} />
            </div>
            <div>
              <label className="label">Default Currency</label>
              <select className="input cursor-pointer" value={form.currency} onChange={set('currency')}>
                {['INR', 'USD', 'EUR', 'GBP', 'AED'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Invoice Number Prefix</label>
              <input className="input font-mono" placeholder="INV" value={form.invoice_prefix} onChange={set('invoice_prefix')} />
              <p className="text-xs text-ink-500 mt-1">e.g. "INV" → INV-2024-0001</p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /> : <><Save size={15} /> Save Changes</>}
            </button>
          </div>
        </form>
      )}

      {tab === 'security' && (
        <form onSubmit={handlePasswordChange} className="card p-6 flex flex-col gap-5">
          <h3 className="font-display font-600 text-white">Change Password</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Current Password</label>
              <input className="input" type="password" value={pwForm.current_password} onChange={setPw('current_password')} required />
            </div>
            <div>
              <label className="label">New Password</label>
              <input className="input" type="password" placeholder="Min 8 characters" value={pwForm.new_password} onChange={setPw('new_password')} required />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input className="input" type="password" value={pwForm.confirm} onChange={setPw('confirm')} required />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /> : <><Lock size={15} /> Change Password</>}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
