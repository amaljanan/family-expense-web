import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Analytics from './pages/Analytics'
import Salary from './pages/Salary'
import BottomNav from './components/BottomNav'
import AddExpenseModal from './components/AddExpenseModal'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
          <span className="text-3xl">💰</span>
        </div>
        <p className="text-blue-700 text-2xl font-bold">Family Finance</p>
        <p className="text-slate-400 text-sm mt-1">Amal & Aiswarya</p>
        <div className="mt-6 flex gap-1 justify-center">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                 style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorBanner({ msg }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl
                    bg-red-600 text-white text-sm font-medium shadow-lg animate-fade-in">
      ⚠️ {msg}
    </div>
  )
}

export default function App() {
  const now = new Date()
  const [tab, setTab] = useState('dashboard')
  const [editingExpense, setEditingExpense] = useState(null) // null = closed, object = editing
  const [showAdd, setShowAdd] = useState(false)
  const [expenses, setExpenses] = useState([])
  const [salaries, setSalaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const fetchAll = useCallback(async () => {
    const [expRes, salRes] = await Promise.all([
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
      supabase.from('salaries').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
    ])
    if (expRes.error) setError(expRes.error.message)
    else setExpenses(expRes.data ?? [])
    if (salRes.error) setError(salRes.error.message)
    else setSalaries(salRes.data ?? [])
  }, [])

  useEffect(() => {
    fetchAll().finally(() => setLoading(false))
  }, [fetchAll])

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(t)
    }
  }, [error])

  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.expense_date)
    return d.getMonth() + 1 === month && d.getFullYear() === year
  })

  const getSalaryFor = (person) =>
    salaries.find(s => s.person === person && s.month === month && s.year === year)?.amount ?? 0

  const shared = {
    expenses, monthExpenses, salaries,
    amalSalary: getSalaryFor('Amal'),
    aiswaryaSalary: getSalaryFor('Aiswarya'),
    month, setMonth, year, setYear,
    onAddExpense: () => setShowAdd(true),
    onEditExpense: (expense) => setEditingExpense(expense),
    onRefresh: fetchAll,
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {error && <ErrorBanner msg={error} />}

      <main className="pb-nav max-w-lg mx-auto">
        {tab === 'dashboard'  && <Dashboard  {...shared} />}
        {tab === 'expenses'   && <Expenses   {...shared} />}
        {tab === 'analytics'  && <Analytics  {...shared} />}
        {tab === 'salary'     && <Salary     {...shared} onRefresh={fetchAll} />}
      </main>

      <BottomNav tab={tab} setTab={setTab} onAdd={() => setShowAdd(true)} />

      {showAdd && (
        <AddExpenseModal
          onClose={() => setShowAdd(false)}
          onSave={async (payload) => {
            const { error: err } = await supabase.from('expenses').insert([payload])
            if (err) { setError(err.message); return }
            await fetchAll()
            setShowAdd(false)
          }}
        />
      )}

      {editingExpense && (
        <AddExpenseModal
          initialData={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={async (payload) => {
            const { error: err } = await supabase
              .from('expenses')
              .update(payload)
              .eq('id', editingExpense.id)
            if (err) { setError(err.message); return }
            await fetchAll()
            setEditingExpense(null)
          }}
        />
      )}
    </div>
  )
}
