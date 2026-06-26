import { useState } from 'react'
import { X, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { changePassword } from '../lib/auth'

function PasswordField({ label, value, onChange, show, onToggle, disabled }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="input-field pr-12"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function ChangePasswordModal({ familyId, onClose }) {
  const [oldPw,     setOldPw]     = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [show,      setShow]      = useState({ old: false, new: false, confirm: false })
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  const toggle = field => setShow(s => ({ ...s, [field]: !s[field] }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (newPw.length < 6) { setError('New password must be at least 6 characters.'); return }
    if (newPw !== confirmPw) { setError('New passwords do not match.'); return }
    setLoading(true)
    try {
      await changePassword(familyId, oldPw, newPw)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <p className="font-semibold text-slate-800">Change Password</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-800">Password changed!</p>
            <p className="text-sm text-slate-500 mt-1">Use your new password next time you sign in.</p>
            <button onClick={onClose} className="btn-primary mt-6 w-full">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField label="Current Password" value={oldPw} onChange={e => setOldPw(e.target.value)}
              show={show.old} onToggle={() => toggle('old')} disabled={loading} />
            <PasswordField label="New Password" value={newPw} onChange={e => setNewPw(e.target.value)}
              show={show.new} onToggle={() => toggle('new')} disabled={loading} />
            <PasswordField label="Confirm New Password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              show={show.confirm} onToggle={() => toggle('confirm')} disabled={loading} />

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading || !oldPw || !newPw || !confirmPw}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
