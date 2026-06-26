import { useState } from 'react'
import { Lock, User, Eye, EyeOff } from 'lucide-react'
import { login, setFamily } from '../lib/auth'

export default function Login({ onSuccess, onCreateFamily }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username || !password) return
    setLoading(true)
    setError('')
    try {
      const family = await login(username, password)
      setFamily(family)
      onSuccess(family)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const clearErr = () => setError('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900
                    flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center
                          justify-center mx-auto mb-4 shadow-2xl ring-1 ring-white/30">
            <span className="text-4xl">💰</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Family Finance</h1>
          <p className="text-blue-200 text-sm mt-1">Track your family expenses</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <p className="font-semibold text-slate-800">Sign In</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl
                            focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100
                            transition-all duration-200 px-4">
              <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); clearErr() }}
                placeholder="Username"
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                className="flex-1 bg-transparent py-3 text-slate-800 placeholder-slate-400 outline-none text-base"
              />
            </div>

            {/* Password */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl
                            focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100
                            transition-all duration-200 px-4">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); clearErr() }}
                placeholder="Password"
                className="flex-1 bg-transparent py-3 text-slate-800 placeholder-slate-400 outline-none text-base"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0 p-1 -mr-1"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-blue-200/70 text-sm">
            New here?{' '}
            <button onClick={onCreateFamily}
                    className="text-white font-semibold underline underline-offset-2 hover:text-blue-200 transition-colors">
              Create a family account
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
