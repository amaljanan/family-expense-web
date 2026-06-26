import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Pencil, Trash2, Check } from 'lucide-react'
import { fmt, pct, MONTHS, shortMonth } from '../utils/format'
import { getCategoryById, CATEGORIES } from '../data/categories'
import MonthSelector from '../components/MonthSelector'
import { supabase } from '../lib/supabase'

const TOOLTIP = {
  backgroundColor: '#fff', border: '1px solid #e2e8f0',
  borderRadius: '10px', fontSize: '12px', color: '#0f172a',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeeks(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const weeks = []
  let start = 1, wk = 1
  while (start <= daysInMonth) {
    const end = Math.min(start + 6, daysInMonth)
    weeks.push({ wk, start, end, label: `${start}–${end}` })
    start = end + 1; wk++
  }
  return weeks
}

function currentWeekIndex(year, month) {
  const today = new Date()
  if (today.getFullYear() !== year || today.getMonth() + 1 !== month) return 0
  return Math.min(Math.floor((today.getDate() - 1) / 7), 3)
}

function TabBar({ tab, setTab, tabs }) {
  return (
    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
      {tabs.map(t => (
        <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
          {t}
        </button>
      ))}
    </div>
  )
}

function SectionTitle({ title, sub }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// Category list with optional budget badges
function CategoryList({ breakdown, total, budgets = [], emptyMsg = 'No expenses' }) {
  if (breakdown.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-6">{emptyMsg}</p>
  }
  const top = breakdown[0]?.value ?? 1
  return (
    <div className="space-y-3">
      {breakdown.map((c, i) => {
        const sharePct = pct(c.value, total)
        const barWidth  = pct(c.value, top)
        const isTop     = i === 0
        const budget    = budgets.find(b => b.category_id === c.id)
        const limit     = budget ? parseFloat(budget.monthly_limit) : null
        const isOver    = limit !== null && c.value > limit
        const isNear    = limit !== null && !isOver && c.value > limit * 0.8
        const usedPct   = limit !== null ? Math.min(100, Math.round((c.value / limit) * 100)) : null

        return (
          <div key={c.id}
               className={`p-3 rounded-xl border transition-all duration-200 ${
                 isOver  ? 'border-red-200 bg-red-50/30' :
                 isNear  ? 'border-amber-200 bg-amber-50/30' :
                 isTop   ? 'border-orange-200 bg-orange-50' :
                           'border-slate-100 bg-white hover:border-slate-200'
               }`}>
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                i === 0 ? 'bg-orange-400 text-white' :
                i === 1 ? 'bg-slate-300 text-slate-700' :
                i === 2 ? 'bg-amber-500/70 text-white' :
                          'bg-slate-100 text-slate-400'
              }`}>{i + 1}</span>

              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                   style={{ backgroundColor: c.color + '18' }}>
                {c.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-slate-800 truncate">{c.label}</span>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-sm font-bold text-slate-900">{fmt(c.value)}</span>
                    {limit !== null && (
                      <span className="text-[10px] text-slate-400">/ {fmt(limit)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                         style={{ width: `${barWidth}%`, backgroundColor: c.color }} />
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0"
                        style={{ color: c.color }}>{sharePct}%</span>
                </div>
                {/* Budget status line */}
                {limit !== null && (
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mr-2">
                      <div className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-red-500' : isNear ? 'bg-amber-400' : 'bg-emerald-500'
                      }`} style={{ width: `${usedPct}%` }} />
                    </div>
                    <span className={`text-[10px] font-semibold flex-shrink-0 ${
                      isOver ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {isOver
                        ? `⚠ ${fmt(c.value - limit)} over!`
                        : `Budget ${usedPct}%`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Budget View ──────────────────────────────────────────────────────────────
function BudgetView({ monthExpenses, budgets, familyId, onBudgetRefresh, month, year }) {
  const [editing, setEditing]   = useState(null)
  const [inputVal, setInputVal] = useState('')
  const [saving, setSaving]     = useState(false)
  const [showAll, setShowAll]   = useState(false)

  const getBudget  = (catId) => budgets.find(b => b.category_id === catId)

  const spentMap = useMemo(() => {
    const m = {}
    monthExpenses.forEach(e => { m[e.category] = (m[e.category] ?? 0) + e.amount })
    return m
  }, [monthExpenses])

  const startEdit = (catId, currentLimit) => {
    setEditing(catId)
    setInputVal(currentLimit != null ? currentLimit.toString() : '')
  }
  const cancelEdit = () => { setEditing(null); setInputVal('') }

  const handleSave = async (catId) => {
    const amt = parseFloat(inputVal)
    if (!inputVal || isNaN(amt) || amt <= 0) { cancelEdit(); return }
    setSaving(true)
    const existing = getBudget(catId)
    if (existing) {
      await supabase.from('category_budgets').update({ monthly_limit: amt }).eq('id', existing.id)
    } else {
      await supabase.from('category_budgets').insert({ family_id: familyId, category_id: catId, monthly_limit: amt })
    }
    await onBudgetRefresh()
    setSaving(false)
    cancelEdit()
  }

  const handleRemove = async (catId) => {
    const existing = getBudget(catId)
    if (!existing) return
    await supabase.from('category_budgets').delete().eq('id', existing.id)
    await onBudgetRefresh()
    cancelEdit()
  }

  const budgetCatIds = new Set(budgets.map(b => b.category_id))
  const spentCatIds  = new Set(Object.keys(spentMap).filter(k => spentMap[k] > 0))

  const activeRows = CATEGORIES
    .filter(c => budgetCatIds.has(c.id) || spentCatIds.has(c.id))
    .map(c => ({ ...c, spent: spentMap[c.id] ?? 0, budget: getBudget(c.id) }))
    .sort((a, b) => {
      const aLimit = a.budget ? parseFloat(a.budget.monthly_limit) : null
      const bLimit = b.budget ? parseFloat(b.budget.monthly_limit) : null
      if (aLimit && !bLimit) return -1
      if (!aLimit && bLimit) return 1
      return b.spent - a.spent
    })

  const inactiveRows = CATEGORIES.filter(c => !budgetCatIds.has(c.id) && !spentCatIds.has(c.id))

  // Summary stats
  const totalBudget      = budgets.reduce((s, b) => s + parseFloat(b.monthly_limit), 0)
  const totalBudgetSpent = budgets.reduce((s, b) => s + (spentMap[b.category_id] ?? 0), 0)
  const overCount        = budgets.filter(b => (spentMap[b.category_id] ?? 0) > parseFloat(b.monthly_limit)).length
  const budgetUsedPct    = totalBudget > 0 ? Math.min(100, Math.round((totalBudgetSpent / totalBudget) * 100)) : 0

  const BudgetRow = ({ cat }) => {
    const limit    = cat.budget ? parseFloat(cat.budget.monthly_limit) : null
    const spent    = cat.spent
    const usedPct  = limit ? Math.min(100, Math.round((spent / limit) * 100)) : 0
    const isOver   = limit !== null && spent > limit
    const isNear   = limit !== null && !isOver && spent > limit * 0.8
    const isEdit   = editing === cat.id

    return (
      <div className={`rounded-xl border overflow-hidden transition-all duration-200 ${
        isOver ? 'border-red-200' : isNear ? 'border-amber-200' : 'border-slate-100'
      }`}>
        <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50/50 transition-colors"
                onClick={() => isEdit ? cancelEdit() : startEdit(cat.id, limit)}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
               style={{ backgroundColor: cat.color + '18' }}>
            {cat.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-slate-800 truncate">{cat.label}</span>
              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                <span className="text-sm font-bold text-slate-900">{fmt(spent)}</span>
                {limit !== null && <span className="text-xs text-slate-400">/ {fmt(limit)}</span>}
              </div>
            </div>
            {limit !== null ? (
              <>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    isOver ? 'bg-red-500' : isNear ? 'bg-amber-400' : 'bg-emerald-500'
                  }`} style={{ width: `${usedPct}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`text-[10px] font-semibold ${
                    isOver ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {isOver ? `⚠ ${fmt(spent - limit)} over!` : `${usedPct}% used`}
                  </span>
                  {!isOver && <span className="text-[10px] text-slate-400">{fmt(limit - spent)} left</span>}
                </div>
              </>
            ) : (
              <span className="text-[11px] text-blue-500 font-medium">Tap to set monthly limit</span>
            )}
          </div>
          <Pencil className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        </button>

        {isEdit && (
          <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50/60">
            <p className="text-xs text-slate-500 mt-2.5 mb-2">Monthly limit for <b>{cat.label}</b></p>
            <div className="flex gap-2">
              <div className="flex items-center flex-1 bg-white border border-slate-200 rounded-xl
                              focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <span className="pl-3 text-slate-400 font-semibold text-sm">₹</span>
                <input type="number" inputMode="decimal" placeholder="e.g. 10000"
                       value={inputVal} onChange={e => setInputVal(e.target.value)}
                       onKeyDown={e => { if (e.key === 'Enter') handleSave(cat.id); if (e.key === 'Escape') cancelEdit() }}
                       autoFocus
                       className="flex-1 bg-transparent py-2.5 px-2 text-sm font-bold text-slate-800 outline-none" />
              </div>
              <button onClick={() => handleSave(cat.id)} disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl
                                 hover:bg-blue-700 disabled:opacity-50 transition-colors">
                <Check className="w-4 h-4" />
              </button>
              {cat.budget && (
                <button onClick={() => handleRemove(cat.id)}
                        className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Summary card */}
      {budgets.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-blue-700 p-4">
            <p className="text-violet-100 text-xs font-medium uppercase tracking-wide">
              {MONTHS[month - 1]} {year} · Budget Overview
            </p>
            <p className="text-3xl font-bold text-white mt-1">{fmt(totalBudgetSpent)}</p>
            <p className="text-violet-200 text-sm mt-0.5">of {fmt(totalBudget)} total budget</p>
          </div>
          <div className="p-4">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all duration-700 ${
                totalBudgetSpent > totalBudget ? 'bg-red-500' :
                totalBudgetSpent > totalBudget * 0.8 ? 'bg-amber-400' : 'bg-emerald-500'
              }`} style={{ width: `${budgetUsedPct}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">{budgets.length} categories budgeted</span>
              <div className="flex gap-3">
                {overCount > 0 && (
                  <span className="text-red-500 font-semibold">⚠ {overCount} over limit</span>
                )}
                <span className={`font-semibold ${
                  budgetUsedPct > 100 ? 'text-red-600' :
                  budgetUsedPct > 80  ? 'text-amber-600' : 'text-emerald-600'
                }`}>{budgetUsedPct}% used</span>
              </div>
            </div>

            {/* Per-budget quick stats */}
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-emerald-600">
                  {budgets.filter(b => (spentMap[b.category_id] ?? 0) <= parseFloat(b.monthly_limit) * 0.8).length}
                </p>
                <p className="text-[10px] text-slate-400">On track</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-500">
                  {budgets.filter(b => {
                    const s = spentMap[b.category_id] ?? 0
                    const l = parseFloat(b.monthly_limit)
                    return s > l * 0.8 && s <= l
                  }).length}
                </p>
                <p className="text-[10px] text-slate-400">Near limit</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-500">{overCount}</p>
                <p className="text-[10px] text-slate-400">Over limit</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-5 text-center">
          <p className="text-3xl mb-2">💰</p>
          <p className="text-sm font-semibold text-slate-800 mb-1">No budgets set yet</p>
          <p className="text-xs text-slate-400">Tap any category below to set a monthly spending limit</p>
        </div>
      )}

      {/* Categories with activity or existing budgets */}
      <div className="card p-4">
        <SectionTitle
          title="Category Limits"
          sub={activeRows.length > 0 ? 'Tap to set or edit · Green = on track · Red = over' : 'Set limits for any category below'}
        />
        <div className="space-y-2">
          {activeRows.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No expenses this month yet</p>
          )}
          {activeRows.map(cat => <BudgetRow key={cat.id} cat={cat} />)}
        </div>

        {/* Inactive categories */}
        {inactiveRows.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button onClick={() => setShowAll(v => !v)}
                    className="w-full flex items-center justify-between text-xs font-medium
                               text-slate-500 hover:text-slate-700 transition-colors py-1">
              <span>Other categories — set limits in advance ({inactiveRows.length})</span>
              <span className="text-blue-500">{showAll ? 'Hide ▲' : 'Show ▼'}</span>
            </button>
            {showAll && (
              <div className="mt-3 space-y-1.5">
                {inactiveRows.map(cat => (
                  <div key={cat.id} className="rounded-xl border border-slate-100 overflow-hidden">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors"
                            onClick={() => editing === cat.id ? cancelEdit() : startEdit(cat.id, null)}>
                      <span className="text-base">{cat.emoji}</span>
                      <span className="flex-1 text-sm text-slate-600 text-left">{cat.label}</span>
                      <span className="text-xs text-blue-500 font-medium">+ Set limit</span>
                    </button>
                    {editing === cat.id && (
                      <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50/60">
                        <div className="flex gap-2 mt-2">
                          <div className="flex items-center flex-1 bg-white border border-slate-200 rounded-xl
                                          focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                            <span className="pl-3 text-slate-400 text-sm">₹</span>
                            <input type="number" inputMode="decimal" placeholder="Monthly limit"
                                   value={inputVal} onChange={e => setInputVal(e.target.value)}
                                   onKeyDown={e => { if (e.key === 'Enter') handleSave(cat.id); if (e.key === 'Escape') cancelEdit() }}
                                   autoFocus
                                   className="flex-1 bg-transparent py-2.5 px-2 text-sm font-bold text-slate-800 outline-none" />
                          </div>
                          <button onClick={() => handleSave(cat.id)} disabled={saving}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl
                                             hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Monthly View ─────────────────────────────────────────────────────────────
function MonthlyView({ monthExpenses, salary1, salary2, month, year, expenses, member1, member2, emoji1, emoji2, budgets }) {
  const totalSalary = salary1 + salary2
  const spent1      = useMemo(() => monthExpenses.filter(e => e.paid_by === member1).reduce((s, e) => s + e.amount, 0), [monthExpenses, member1])
  const spent2      = useMemo(() => monthExpenses.filter(e => e.paid_by === member2).reduce((s, e) => s + e.amount, 0), [monthExpenses, member2])
  const totalSpent  = spent1 + spent2
  const totalSaved  = Math.max(0, totalSalary - totalSpent)
  const spendPct    = totalSalary > 0 ? Math.round((totalSpent / totalSalary) * 100) : null
  const savePct     = totalSalary > 0 ? Math.round((totalSaved / totalSalary) * 100) : null

  const categoryBreakdown = useMemo(() => {
    const map = {}
    monthExpenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount })
    return Object.entries(map).map(([id, v]) => ({ ...getCategoryById(id), value: v }))
      .sort((a, b) => b.value - a.value)
  }, [monthExpenses])

  const monthlyTrend = useMemo(() => {
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      const m = d.getMonth() + 1, y = d.getFullYear()
      const s1 = expenses.filter(e => { const ed = new Date(e.expense_date); return e.paid_by === member1 && ed.getMonth() + 1 === m && ed.getFullYear() === y }).reduce((s, e) => s + e.amount, 0)
      const s2 = member2 ? expenses.filter(e => { const ed = new Date(e.expense_date); return e.paid_by === member2 && ed.getMonth() + 1 === m && ed.getFullYear() === y }).reduce((s, e) => s + e.amount, 0) : 0
      const pt = { label: shortMonth(m), total: s1 + s2, [member1]: s1 }
      if (member2) pt[member2] = s2
      result.push(pt)
    }
    return result
  }, [expenses, month, year, member1, member2])

  const prevMonthSpent = monthlyTrend[monthlyTrend.length - 2]?.total ?? 0
  const vsLastMonth    = prevMonthSpent > 0 ? Math.round(((totalSpent - prevMonthSpent) / prevMonthSpent) * 100) : null

  return (
    <div className="space-y-4">
      {/* Hero summary */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
          <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">{MONTHS[month - 1]} {year} — Total Spent</p>
          <p className="text-3xl font-bold text-white mt-1">{fmt(totalSpent)}</p>
          <div className="flex items-center gap-3 mt-1">
            {totalSalary > 0 && (
              <p className="text-blue-200 text-sm">{spendPct}% of {fmt(totalSalary)} salary</p>
            )}
            {vsLastMonth !== null && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                vsLastMonth > 0 ? 'bg-red-400/30 text-red-100' : 'bg-emerald-400/30 text-emerald-100'
              }`}>
                {vsLastMonth > 0 ? '▲' : '▼'} {Math.abs(vsLastMonth)}% vs last month
              </span>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {[
            { label: `${emoji1} ${member1}'s Salary`, value: salary1, color: '#2563eb', show: salary1 > 0 },
            { label: `${emoji2} ${member2}'s Salary`, value: salary2, color: '#db2777', show: !!member2 && salary2 > 0 },
          ].filter(r => r.show).map(row => (
            <div key={row.label} className="flex justify-between">
              <span className="text-sm text-slate-500">{row.label}</span>
              <span className="text-sm font-bold" style={{ color: row.color }}>{fmt(row.value)}</span>
            </div>
          ))}

          {totalSalary > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">💰 Savings this month</span>
                <span className="text-sm font-bold text-emerald-600">{fmt(totalSaved)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-red-400 transition-all duration-700"
                     style={{ width: `${Math.min(100, spendPct)}%` }} />
                <div className="h-full bg-emerald-400 transition-all duration-700"
                     style={{ width: `${Math.max(0, 100 - spendPct)}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[11px]">
                <span className="text-red-500 font-medium">Spent {spendPct}%</span>
                <span className="text-emerald-600 font-medium">Saved {savePct}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Person comparison */}
      {member2 && (
        <div className="card p-4">
          <SectionTitle title={`${emoji1} ${member1} vs ${emoji2} ${member2}`} sub="Spending comparison this month" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: member1, spent: spent1, salary: salary1, color: '#2563eb', bg: 'bg-blue-50', border: 'border-blue-200', emoji: emoji1 },
              { name: member2, spent: spent2, salary: salary2, color: '#db2777', bg: 'bg-pink-50', border: 'border-pink-200', emoji: emoji2 },
            ].map(p => (
              <div key={p.name} className={`${p.bg} border ${p.border} rounded-2xl p-3`}>
                <p className="text-base mb-1">{p.emoji} <span className="text-sm font-semibold text-slate-700">{p.name}</span></p>
                <p className="text-xl font-bold" style={{ color: p.color }}>{fmt(p.spent)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{pct(p.spent, totalSpent)}% of total</p>
                {p.salary > 0 && (
                  <>
                    <div className="w-full h-1.5 bg-white/70 rounded-full mt-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct(p.spent, p.salary))}%`, backgroundColor: p.color }} />
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: p.color }}>{pct(p.spent, p.salary)}% of salary</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category breakdown — ranked, with budget badges */}
      <div className="card p-4">
        <SectionTitle
          title="Where is money going?"
          sub={`${categoryBreakdown.length} categories · ${MONTHS[month - 1]} ${year}${budgets.length > 0 ? ' · budget tracked' : ''}`}
        />
        {categoryBreakdown.length > 0 && (
          <div className="flex items-center gap-3 mb-4 bg-slate-50 rounded-xl p-3">
            <div className="w-28 h-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="value" innerRadius={30} outerRadius={52} paddingAngle={2}>
                    {categoryBreakdown.map(c => <Cell key={c.id} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP} formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              {categoryBreakdown.slice(0, 4).map(c => {
                const budget = budgets.find(b => b.category_id === c.id)
                const isOver = budget && c.value > parseFloat(budget.monthly_limit)
                return (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-xs text-slate-600 truncate flex-1">{c.emoji} {c.label}</span>
                    <span className="text-xs font-bold text-slate-800 flex-shrink-0">{pct(c.value, totalSpent)}%</span>
                    {isOver && <span className="text-[9px] text-red-500 font-bold">⚠</span>}
                  </div>
                )
              })}
              {categoryBreakdown.length > 4 && (
                <p className="text-[10px] text-slate-400">+{categoryBreakdown.length - 4} more</p>
              )}
            </div>
          </div>
        )}
        <CategoryList breakdown={categoryBreakdown} total={totalSpent} budgets={budgets} emptyMsg="No expenses this month" />
      </div>

      {/* 6-month trend */}
      <div className="card p-4">
        <SectionTitle title="6-Month Spending Trend" sub={member2 ? `${member1} & ${member2} combined` : `${member1}'s spending`} />
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend} barSize={14} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                     tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} width={38} />
              <Tooltip contentStyle={TOOLTIP} formatter={v => fmt(v)} />
              <Bar dataKey={member1} name={member1} fill="#2563eb" radius={[4, 4, 0, 0]} />
              {member2 && <Bar dataKey={member2} name={member2} fill="#db2777" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2 justify-center text-xs">
          <span className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> {member1}</span>
          {member2 && <span className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 rounded bg-pink-600 inline-block" /> {member2}</span>}
        </div>
      </div>

      {/* Insights */}
      {monthExpenses.length > 0 && (
        <div className="card p-4 mb-4">
          <SectionTitle title="💡 Key Insights" />
          <div className="space-y-2">
            {categoryBreakdown[0] && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                <span className="text-2xl">{categoryBreakdown[0].emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Highest spending: {categoryBreakdown[0].label}</p>
                  <p className="text-xs text-slate-500">{fmt(categoryBreakdown[0].value)} · {pct(categoryBreakdown[0].value, totalSpent)}% of all expenses</p>
                </div>
              </div>
            )}
            {/* Over-budget alert */}
            {budgets.filter(b => {
              const s = monthExpenses.filter(e => e.category === b.category_id).reduce((sum, e) => sum + e.amount, 0)
              return s > parseFloat(b.monthly_limit)
            }).length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Budget exceeded</p>
                  <p className="text-xs text-slate-500">
                    {budgets.filter(b => {
                      const s = monthExpenses.filter(e => e.category === b.category_id).reduce((sum, e) => sum + e.amount, 0)
                      return s > parseFloat(b.monthly_limit)
                    }).map(b => getCategoryById(b.category_id).label).join(', ')} {' '}
                    went over limit this month
                  </p>
                </div>
              </div>
            )}
            {member2 && spent1 !== spent2 && (
              <div className={`flex items-start gap-3 p-3 rounded-xl border ${spent1 > spent2 ? 'bg-blue-50 border-blue-100' : 'bg-pink-50 border-pink-100'}`}>
                <span className="text-2xl">{spent1 > spent2 ? emoji1 : emoji2}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {spent1 > spent2 ? member1 : member2} spent more this month
                  </p>
                  <p className="text-xs text-slate-500">
                    {fmt(Math.abs(spent1 - spent2))} more than {spent1 > spent2 ? member2 : member1}
                  </p>
                </div>
              </div>
            )}
            {savePct !== null && (
              <div className={`flex items-start gap-3 p-3 rounded-xl border ${savePct >= 20 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                <span className="text-2xl">{savePct >= 20 ? '🎉' : '⚠️'}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{savePct >= 20 ? 'Great savings rate!' : 'Low savings this month'}</p>
                  <p className="text-xs text-slate-500">Saving {savePct}% — target is 20%+</p>
                </div>
              </div>
            )}
            {vsLastMonth !== null && (
              <div className={`flex items-start gap-3 p-3 rounded-xl border ${vsLastMonth <= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <span className="text-2xl">{vsLastMonth <= 0 ? '📉' : '📈'}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {vsLastMonth <= 0 ? 'Spending reduced!' : 'Spending increased'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {Math.abs(vsLastMonth)}% {vsLastMonth > 0 ? 'more' : 'less'} than last month ({fmt(prevMonthSpent)})
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Weekly View ──────────────────────────────────────────────────────────────
function WeeklyView({ monthExpenses, month, year, salary1, salary2, member1, member2, emoji1, emoji2, budgets }) {
  const weeks = useMemo(() => getWeeks(year, month), [year, month])
  const [weekIdx, setWeekIdx] = useState(() => currentWeekIndex(year, month))

  const selWeek = weeks[weekIdx] ?? weeks[0]

  const weekExpenses = useMemo(() =>
    monthExpenses.filter(e => {
      const d = new Date(e.expense_date).getDate()
      return d >= selWeek.start && d <= selWeek.end
    }),
  [monthExpenses, selWeek])

  const week1     = useMemo(() => weekExpenses.filter(e => e.paid_by === member1).reduce((s, e) => s + e.amount, 0), [weekExpenses, member1])
  const week2     = useMemo(() => weekExpenses.filter(e => e.paid_by === member2).reduce((s, e) => s + e.amount, 0), [weekExpenses, member2])
  const totalWeek = week1 + week2

  const dailyData = useMemo(() => {
    const data = []
    for (let day = selWeek.start; day <= selWeek.end; day++) {
      const date     = new Date(year, month - 1, day)
      const dayLabel = DAY_LABELS[date.getDay()]
      const s1 = weekExpenses.filter(e => new Date(e.expense_date).getDate() === day && e.paid_by === member1).reduce((s, e) => s + e.amount, 0)
      const s2 = member2 ? weekExpenses.filter(e => new Date(e.expense_date).getDate() === day && e.paid_by === member2).reduce((s, e) => s + e.amount, 0) : 0
      const pt = { day: `${dayLabel} ${day}`, [member1]: s1, total: s1 + s2 }
      if (member2) pt[member2] = s2
      data.push(pt)
    }
    return data
  }, [weekExpenses, selWeek, year, month, member1, member2])

  const prevWeek = weeks[weekIdx - 1]
  const prevWeekTotal = useMemo(() => {
    if (!prevWeek) return null
    return monthExpenses.filter(e => {
      const d = new Date(e.expense_date).getDate()
      return d >= prevWeek.start && d <= prevWeek.end
    }).reduce((s, e) => s + e.amount, 0)
  }, [monthExpenses, prevWeek])

  const vsLastWeek = prevWeekTotal !== null && prevWeekTotal > 0
    ? Math.round(((totalWeek - prevWeekTotal) / prevWeekTotal) * 100) : null

  const weekCategoryBreakdown = useMemo(() => {
    const map = {}
    weekExpenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount })
    return Object.entries(map).map(([id, v]) => ({ ...getCategoryById(id), value: v }))
      .sort((a, b) => b.value - a.value)
  }, [weekExpenses])

  return (
    <div className="space-y-4">
      {/* Week selector */}
      <div className="card p-3">
        <p className="text-xs text-slate-400 font-medium mb-2 px-1">Select Week</p>
        <div className="flex gap-2">
          {weeks.map((w, i) => (
            <button key={w.wk} onClick={() => setWeekIdx(i)}
                    className={`flex-1 py-2 px-1 rounded-xl text-center transition-all duration-150 border ${
                      weekIdx === i
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}>
              <p className="text-[11px] font-bold">W{w.wk}</p>
              <p className="text-[9px] mt-0.5 opacity-80">{w.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Week hero */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-4">
          <p className="text-indigo-100 text-xs font-medium uppercase tracking-wide">
            Week {selWeek.wk} · {MONTHS[month - 1]} {selWeek.start}–{selWeek.end}
          </p>
          <p className="text-3xl font-bold text-white mt-1">{fmt(totalWeek)}</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-indigo-200 text-sm">{weekExpenses.length} transaction{weekExpenses.length !== 1 ? 's' : ''}</p>
            {vsLastWeek !== null && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                vsLastWeek > 0 ? 'bg-red-400/30 text-red-100' : 'bg-emerald-400/30 text-emerald-100'
              }`}>
                {vsLastWeek > 0 ? '▲' : '▼'} {Math.abs(vsLastWeek)}% vs W{prevWeek?.wk}
              </span>
            )}
          </div>
        </div>
        <div className={`${member2 ? 'grid grid-cols-2 divide-x divide-slate-100' : 'flex justify-center'} p-0`}>
          {[
            { name: member1, amount: week1, color: '#2563eb', bg: 'bg-blue-50', emoji: emoji1 },
            ...(member2 ? [{ name: member2, amount: week2, color: '#db2777', bg: 'bg-pink-50', emoji: emoji2 }] : []),
          ].map(p => (
            <div key={p.name} className={`${p.bg} p-3 text-center`}>
              <p className="text-xs text-slate-500">{p.emoji} {p.name}</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: p.color }}>{fmt(p.amount)}</p>
              {totalWeek > 0 && <p className="text-[10px] text-slate-400">{pct(p.amount, totalWeek)}% of week</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Daily bar chart */}
      <div className="card p-4">
        <SectionTitle title="Daily Spending" sub={`Week ${selWeek.wk}: ${MONTHS[month - 1]} ${selWeek.start}–${selWeek.end}`} />
        {dailyData.every(d => d.total === 0) ? (
          <p className="text-sm text-slate-400 text-center py-6">No spending this week</p>
        ) : (
          <>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} barSize={12} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                         tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} width={36} />
                  <Tooltip contentStyle={TOOLTIP} formatter={v => fmt(v)} />
                  <Bar dataKey={member1} name={member1} fill="#2563eb" radius={[3, 3, 0, 0]} />
                  {member2 && <Bar dataKey={member2} name={member2} fill="#db2777" radius={[3, 3, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-1 justify-center text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> {member1}</span>
              {member2 && <span className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 rounded bg-pink-600 inline-block" /> {member2}</span>}
            </div>
          </>
        )}
      </div>

      {/* Category breakdown for the week */}
      <div className="card p-4 mb-4">
        <SectionTitle title="Category Spending This Week" sub={weekCategoryBreakdown.length > 0 ? `${weekCategoryBreakdown.length} categories` : undefined} />
        <CategoryList breakdown={weekCategoryBreakdown} total={totalWeek} budgets={budgets} emptyMsg="No expenses this week" />
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Analytics({ expenses, monthExpenses, salary1, salary2, month, setMonth, year, setYear, member1 = 'Member', member2, emoji1 = '👤', emoji2 = '👤', budgets = [], familyId, onBudgetRefresh }) {
  const [tab, setTab] = useState('Monthly')

  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-blue-200 text-sm mt-0.5">Spending insights & budget tracking</p>
      </div>

      <div className="px-4 pt-3 space-y-4">
        <MonthSelector month={month} setMonth={setMonth} year={year} setYear={setYear} />
        <TabBar tab={tab} setTab={setTab} tabs={['Monthly', 'Weekly', 'Budget']} />

        {tab === 'Monthly' && (
          <MonthlyView
            monthExpenses={monthExpenses} salary1={salary1} salary2={salary2}
            month={month} year={year} expenses={expenses}
            member1={member1} member2={member2} emoji1={emoji1} emoji2={emoji2}
            budgets={budgets}
          />
        )}
        {tab === 'Weekly' && (
          <WeeklyView
            monthExpenses={monthExpenses} month={month} year={year}
            salary1={salary1} salary2={salary2}
            member1={member1} member2={member2} emoji1={emoji1} emoji2={emoji2}
            budgets={budgets}
          />
        )}
        {tab === 'Budget' && (
          <BudgetView
            monthExpenses={monthExpenses} budgets={budgets}
            familyId={familyId} onBudgetRefresh={onBudgetRefresh}
            month={month} year={year}
          />
        )}
      </div>
    </div>
  )
}
