import { useState, useMemo } from 'react'
import { IndianRupee, CheckCircle, Edit3, Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fmt, MONTHS } from '../utils/format'
import MonthSelector from '../components/MonthSelector'

function SalaryEntry({ person, salary, month, year, onRefresh, color, bgColor, emoji, familyId }) {
  const [editing, setEditing] = useState(!salary)
  const [value, setValue] = useState(salary?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    const amt = parseFloat(value)
    if (!value || isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return }
    setSaving(true); setError(null)
    const { error: err } = await supabase.from('salaries').upsert(
      { person, month, year, amount: amt, family_id: familyId },
      { onConflict: 'family_id,person,month,year' }
    )
    if (err) setError(err.message)
    else { await onRefresh(); setEditing(false) }
    setSaving(false)
  }

  return (
    <div className="card overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${bgColor}`}>
            {emoji}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800">{person}</p>
            <p className="text-xs text-slate-400">{MONTHS[month - 1]} {year}</p>
          </div>
          {!editing && salary > 0 && (
            <button onClick={() => { setValue(salary.toString()); setEditing(true) }}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg
                               bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors duration-150">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className={`flex items-center bg-slate-50 border rounded-xl transition-all duration-200
                            focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100
                            ${error ? 'border-red-400' : 'border-slate-200'}`}>
              <span className="pl-4 flex items-center">
                <IndianRupee className="w-4 h-4 text-blue-500 flex-shrink-0" />
              </span>
              <input type="number" inputMode="decimal" placeholder="Enter salary amount"
                     value={value} onChange={e => { setValue(e.target.value); setError(null) }}
                     onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus
                     className="flex-1 bg-transparent py-3 px-3 text-lg font-bold text-slate-800
                                placeholder-slate-300 outline-none" />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              {salary > 0 && (
                <button onClick={() => setEditing(false)} className="btn-ghost flex-1 text-sm py-2.5">Cancel</button>
              )}
              <button onClick={handleSave} disabled={saving}
                      className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Salary'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color }} />
            <p className="text-2xl font-bold" style={{ color }}>{fmt(salary)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SalaryHistory({ salaries, person, color }) {
  const history = useMemo(() =>
    salaries.filter(s => s.person === person)
      .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))
      .slice(0, 6),
  [salaries, person])

  if (history.length === 0) return null
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium mb-2">{person}'s History</p>
      <div className="space-y-2">
        {history.map(s => (
          <div key={s.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-600">{MONTHS[s.month - 1]} {s.year}</span>
            <span className="text-sm font-bold" style={{ color }}>{fmt(s.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Salary({ salaries, month, setMonth, year, setYear, onRefresh, member1 = 'Amal', member2 = 'Aiswarya', emoji1 = '👨', emoji2 = '👩', familyId }) {
  const getSalaryFor = (person) =>
    salaries.find(s => s.person === person && s.month === month && s.year === year)?.amount ?? 0

  const salary1  = getSalaryFor(member1)
  const salary2  = getSalaryFor(member2)
  const combined = salary1 + salary2

  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Salary</h1>
        <p className="text-blue-200 text-sm mt-0.5">Monthly income tracker</p>
      </div>

      <div className="px-4 pt-3 space-y-4">
        <MonthSelector month={month} setMonth={setMonth} year={year} setYear={setYear} />

        {/* Combined income */}
        {combined > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Combined Family Income</p>
                <p className="text-2xl font-bold text-white">{fmt(combined)}</p>
                <p className="text-blue-200/70 text-xs">{MONTHS[month - 1]} {year}</p>
              </div>
            </div>
          </div>
        )}

        <SalaryEntry person={member1} salary={salary1} month={month} year={year} familyId={familyId}
                     onRefresh={onRefresh} color="#2563eb" bgColor="bg-blue-100" emoji={emoji1} />
        <SalaryEntry person={member2} salary={salary2} month={month} year={year} familyId={familyId}
                     onRefresh={onRefresh} color="#db2777" bgColor="bg-pink-100" emoji={emoji2} />

        {salaries.length > 0 && (
          <div className="card p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Salary History</h3>
            <SalaryHistory salaries={salaries} person={member1} color="#2563eb" />
            <SalaryHistory salaries={salaries} person={member2} color="#db2777" />
          </div>
        )}

        {/* Tips */}
        <div className="card p-4 mb-4 bg-gradient-to-br from-emerald-50 to-white">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">💡 Finance Tips</h3>
          <div className="space-y-3">
            {[
              { icon: '📊', tip: '50/30/20 Rule', desc: '50% needs, 30% wants, 20% savings' },
              { icon: '📈', tip: 'SIP Early',      desc: 'Start SIPs early to benefit from compounding' },
              { icon: '🛡️', tip: 'Emergency Fund', desc: 'Keep 3–6 months of expenses as reserve' },
            ].map(t => (
              <div key={t.tip} className="flex items-start gap-2.5">
                <span className="text-base">{t.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.tip}</p>
                  <p className="text-xs text-slate-500">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
