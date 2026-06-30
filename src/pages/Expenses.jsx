import { useState, useMemo } from 'react'
import { Search, Trash2, Pencil, Filter, X, RefreshCw } from 'lucide-react'
import { fmt, dateLabel, MONTHS } from '../utils/format'
import { getCategoryById, CATEGORIES } from '../data/categories'
import MonthSelector from '../components/MonthSelector'
import { supabase } from '../lib/supabase'

function ExpenseItem({ expense, onDelete, onEdit, member1 = 'Amal' }) {
  const cat = getCategoryById(expense.category)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this expense?')) return
    setDeleting(true)
    await supabase.from('expenses').delete().eq('id', expense.id)
    onDelete()
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100
                     hover:border-slate-200 hover:shadow-sm mb-2 transition-all duration-200
                     ${deleting ? 'opacity-40' : ''}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
           style={{ backgroundColor: cat.color + '18' }}>
        {cat.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {expense.description || cat.label}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs font-medium" style={{ color: cat.color }}>{cat.label}</span>
          <span className="text-slate-300 text-xs">·</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            expense.paid_by === member1 ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
          }`}>{expense.paid_by}</span>
          {expense.is_recurring && (
            <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-medium">🔄 Recurring</span>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">{dateLabel(expense.expense_date)}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <p className="text-sm font-bold text-slate-800 mr-1">{fmt(expense.amount)}</p>
        <button onClick={() => onEdit(expense)}
                className="w-7 h-7 flex items-center justify-center rounded-lg
                           text-slate-400 hover:text-blue-600 hover:bg-blue-50
                           transition-colors duration-150 active:scale-90">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleDelete} disabled={deleting}
                className="w-7 h-7 flex items-center justify-center rounded-lg
                           text-slate-400 hover:text-red-500 hover:bg-red-50
                           transition-colors duration-150 active:scale-90">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function Expenses({ monthExpenses, month, setMonth, year, setYear, onAddExpense, onEditExpense, onRefresh, member1 = 'Amal', member2 = 'Aiswarya', emoji1 = '👨', emoji2 = '👩' }) {
  const [search, setSearch] = useState('')
  const [filterPerson, setFilterPerson] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    let list = monthExpenses
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        (e.description ?? '').toLowerCase().includes(q) ||
        getCategoryById(e.category).label.toLowerCase().includes(q)
      )
    }
    if (filterPerson !== 'all') list = list.filter(e => e.paid_by === filterPerson)
    if (filterCategory !== 'all') list = list.filter(e => e.category === filterCategory)
    return list
  }, [monthExpenses, search, filterPerson, filterCategory])

  const total1 = useMemo(() => monthExpenses.filter(e => e.paid_by === member1).reduce((s, e) => s + e.amount, 0), [monthExpenses, member1])
  const total2 = useMemo(() => monthExpenses.filter(e => e.paid_by === member2).reduce((s, e) => s + e.amount, 0), [monthExpenses, member2])
  const total  = total1 + total2

  const activeFilters = (filterPerson !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0)

  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach(e => {
      const key = e.expense_date
      if (!groups[key]) groups[key] = []
      groups[key].push(e)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Expenses</h1>
        <p className="text-blue-200 text-sm mt-0.5">{MONTHS[month - 1]} {year}</p>
      </div>

      <div className="px-4 -mt-2 space-y-3 pt-3">
        <MonthSelector month={month} setMonth={setMonth} year={year} setYear={setYear} />

        {/* Summary strip */}
        <div className={`grid gap-2 ${member2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <div className="card p-3 text-center">
            <p className="text-[11px] text-slate-400 font-medium">Total</p>
            <p className="text-sm font-bold text-slate-800">{fmt(total)}</p>
          </div>
          <div className="card p-3 text-center border-t-2 border-blue-400">
            <p className="text-[11px] text-blue-500 font-medium">{emoji1} {member1}</p>
            <p className="text-sm font-bold text-blue-600">{fmt(total1)}</p>
          </div>
          {member2 && (
            <div className="card p-3 text-center border-t-2 border-pink-400">
              <p className="text-[11px] text-pink-500 font-medium">{emoji2} {member2}</p>
              <p className="text-sm font-bold text-pink-600">{fmt(total2)}</p>
            </div>
          )}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="flex items-center flex-1 bg-slate-50 border border-slate-200 rounded-xl
                          focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100
                          transition-all duration-200">
            <Search className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
            <input type="text" placeholder="Search expenses…" value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="flex-1 bg-transparent py-2.5 px-2 text-sm text-slate-800
                              placeholder-slate-400 outline-none" />
            {search && (
              <button onClick={() => setSearch('')} className="mr-3 flex-shrink-0">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(f => !f)}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-1.5 transition-colors duration-150 ${
                    activeFilters > 0
                      ? 'bg-blue-50 border-blue-300 text-blue-600'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}>
            <Filter className="w-4 h-4" />
            {activeFilters > 0 && (
              <span className="w-4 h-4 bg-blue-600 rounded-full text-[10px] text-white flex items-center justify-center">{activeFilters}</span>
            )}
          </button>
          <button onClick={onRefresh}
                  className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors duration-150">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="card p-4 space-y-3 animate-slide-up">
            <div>
              <label className="label">Person</label>
              <div className="flex gap-2">
                {[['all', 'Everyone'], [member1, `${emoji1} ${member1}`], ...(member2 ? [[member2, `${emoji2} ${member2}`]] : [])].map(([v, l]) => (
                  <button key={v} onClick={() => setFilterPerson(v)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 border ${
                            filterPerson === v
                              ? 'bg-blue-50 border-blue-300 text-blue-700'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Category</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                      className="input-field text-sm">
                <option value="all">All categories</option>
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setFilterPerson('all'); setFilterCategory('all') }}
                      className="text-xs text-red-500 flex items-center gap-1 font-medium">
                <X className="w-3 h-3" /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Expense list */}
        {filtered.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="text-3xl mb-2">{search ? '🔍' : '📭'}</p>
            <p className="text-slate-400 text-sm">{search ? 'No matching expenses' : 'No expenses this month'}</p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
            {grouped.map(([date, items]) => (
              <div key={date} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-400 px-2 font-medium">{dateLabel(date)}</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                {items.map(e => (
                  <ExpenseItem key={e.id} expense={e} onDelete={onRefresh} onEdit={onEditExpense} member1={member1} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
