import { useState } from 'react'
import { ArrowLeft, ArrowRight, Lock, Eye, EyeOff, User, CheckCircle } from 'lucide-react'
import { hashPassword, setFamily } from '../lib/auth'
import { supabase } from '../lib/supabase'

const GENDER_EMOJI = { male: '👨', female: '👩' }

function FieldRow({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl
                    focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100
                    transition-all duration-200 px-4">
      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
      {children}
    </div>
  )
}

function MemberCard({ label, color, name, onName, gender, onGender }) {
  const isBlue = color === 'blue'
  const activeCls = isBlue
    ? 'bg-blue-600 border-blue-600 text-white'
    : 'bg-pink-600 border-pink-600 text-white'
  const bgCls = isBlue ? 'bg-blue-50 border-blue-100' : 'bg-pink-50 border-pink-100'
  const titleCls = isBlue ? 'text-blue-700' : 'text-pink-700'

  return (
    <div className={`mb-4 p-4 rounded-2xl border ${bgCls}`}>
      <p className={`text-sm font-semibold mb-3 ${titleCls}`}>{label}</p>
      <input
        type="text" value={name} onChange={e => onName(e.target.value)}
        placeholder="Full name" className="input-field mb-3"
      />
      <label className="label">Gender</label>
      <div className="grid grid-cols-2 gap-2">
        {[['male', '👨 Male'], ['female', '👩 Female']].map(([v, l]) => (
          <button key={v} type="button" onClick={() => onGender(v)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 ${
                    gender === v ? activeCls : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function CreateFamily({ onSuccess, onBack }) {
  const [step, setStep]     = useState(1)
  const [form, setForm]     = useState({
    username: '', password: '', confirmPw: '',
    memberCount: 2,
    name1: '', gender1: 'male',
    name2: '', gender2: 'female',
  })
  const [showPw,  setShowPw]  = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  function goNext() {
    if (!form.username.trim())           { setError('Username is required'); return }
    if (form.username.trim().length < 3) { setError('Username must be at least 3 characters'); return }
    if (!form.password)                  { setError('Password is required'); return }
    if (form.password.length < 6)        { setError('Password must be at least 6 characters'); return }
    if (form.password !== form.confirmPw){ setError('Passwords do not match'); return }
    setError('')
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name1.trim())                             { setError('Member 1 name is required'); return }
    if (form.memberCount === 2 && !form.name2.trim())   { setError('Member 2 name is required'); return }

    setLoading(true)
    setError('')
    try {
      const hash = await hashPassword(form.password)
      const m1   = form.name1.trim()
      const m2   = form.memberCount === 2 ? form.name2.trim() : null

      const { data, error: dbErr } = await supabase
        .from('families')
        .insert({
          username:      form.username.toLowerCase().trim(),
          password_hash: hash,
          family_name:   m2 ? `${m1} & ${m2}` : `${m1}'s Family`,
          member1:       m1,
          member2:       m2,
          member1_emoji: GENDER_EMOJI[form.gender1],
          member2_emoji: m2 ? GENDER_EMOJI[form.gender2] : null,
        })
        .select()
        .single()

      if (dbErr) {
        if (dbErr.code === '23505') throw new Error('Username already taken. Please choose another.')
        throw new Error(dbErr.message)
      }

      setFamily(data)
      onSuccess(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900
                    flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-3xl flex items-center
                          justify-center mx-auto mb-3 shadow-2xl ring-1 ring-white/30">
            <span className="text-3xl">💰</span>
          </div>
          <h1 className="text-xl font-bold text-white">Family Finance</h1>
          <p className="text-blue-200 text-sm mt-0.5">Create your family account</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {[1, 2].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
              s === step ? 'w-8 bg-white' : s < step ? 'w-8 bg-white/60' : 'w-4 bg-white/30'
            }`} />
          ))}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">

          {step === 1 ? (
            /* ── Step 1: Account ── */
            <div>
              <p className="font-semibold text-slate-800 mb-5">
                <span className="text-blue-600 mr-1">1.</span> Account Details
              </p>

              <div className="space-y-3">
                <div>
                  <label className="label">Username</label>
                  <FieldRow icon={User}>
                    <input type="text" value={form.username}
                      onChange={e => set('username', e.target.value)}
                      placeholder="e.g. ravipriya"
                      autoFocus autoCapitalize="none" autoCorrect="off"
                      className="flex-1 bg-transparent py-3 text-slate-800 placeholder-slate-400 outline-none text-base" />
                  </FieldRow>
                </div>

                <div>
                  <label className="label">Password</label>
                  <FieldRow icon={Lock}>
                    <input type={showPw ? 'text' : 'password'} value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="Min. 6 characters"
                      className="flex-1 bg-transparent py-3 text-slate-800 placeholder-slate-400 outline-none text-base" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                            className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </FieldRow>
                </div>

                <div>
                  <label className="label">Confirm Password</label>
                  <FieldRow icon={Lock}>
                    <input type={showCpw ? 'text' : 'password'} value={form.confirmPw}
                      onChange={e => set('confirmPw', e.target.value)}
                      placeholder="Re-enter password"
                      className="flex-1 bg-transparent py-3 text-slate-800 placeholder-slate-400 outline-none text-base" />
                    <button type="button" onClick={() => setShowCpw(v => !v)}
                            className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                      {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </FieldRow>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium mt-3">{error}</p>}

              <div className="flex gap-3 mt-5">
                <button onClick={onBack}
                        className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={goNext}
                        className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          ) : (
            /* ── Step 2: Members ── */
            <form onSubmit={handleSubmit}>
              <p className="font-semibold text-slate-800 mb-5">
                <span className="text-blue-600 mr-1">2.</span> Family Members
              </p>

              {/* Member count selector */}
              <div className="mb-4">
                <label className="label">How many earning members?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[[1, '1 Member'], [2, '2 Members']].map(([n, label]) => (
                    <button key={n} type="button" onClick={() => set('memberCount', n)}
                            className={`py-2.5 rounded-xl border font-semibold text-sm transition-all duration-150 ${
                              form.memberCount === n
                                ? 'bg-blue-50 border-blue-400 text-blue-700'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <MemberCard label="Member 1" color="blue"
                name={form.name1} onName={v => set('name1', v)}
                gender={form.gender1} onGender={v => set('gender1', v)} />

              {form.memberCount === 2 && (
                <MemberCard label="Member 2" color="pink"
                  name={form.name2} onName={v => set('name2', v)}
                  gender={form.gender2} onGender={v => set('gender2', v)} />
              )}

              {error && <p className="text-red-500 text-sm font-medium mb-3">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => { setStep(1); setError('') }}
                        className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button type="submit" disabled={loading}
                        className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                  {loading ? 'Creating…' : <><CheckCircle className="w-4 h-4" /> Create</>}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-blue-300/60 text-xs text-center mt-6">Private — family use only</p>
      </div>
    </div>
  )
}
