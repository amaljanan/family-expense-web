import { useMemo } from 'react'
import { TrendingDown, TrendingUp, Wallet, PiggyBank, Plus, ArrowRight, KeyRound, LogOut } from 'lucide-react'
import { fmt, pct, MONTHS, dateLabel } from '../utils/format'
import { getCategoryById } from '../data/categories'
import MonthSelector from '../components/MonthSelector'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const TOOLTIP = {
  backgroundColor: '#fff', border: '1px solid #e2e8f0',
  borderRadius: '10px', fontSize: '12px', color: '#0f172a',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
}

function StatCard({ label, value, sub, iconBg, iconColor, icon: Icon }) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function PersonCard({ name, spent, salary, color, bgColor, emoji }) {
  const remaining = Math.max(0, salary - spent)
  const usedPct = salary > 0 ? Math.min(100, pct(spent, salary)) : 0
  return (
    <div className="card flex-1 overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${bgColor}`}>
            {emoji}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{name}</p>
            {salary > 0 && <p className="text-[10px] text-slate-400">{fmt(salary)} salary</p>}
          </div>
        </div>
        <p className="text-lg font-bold" style={{ color }}>{fmt(spent)}</p>
        <p className="text-[11px] text-slate-400 mb-2">spent this month</p>
        {salary > 0 && (
          <>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${usedPct}%`, backgroundColor: color }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">{usedPct}% used</span>
              <span className="text-[10px] text-slate-500 font-medium">{fmt(remaining)} left</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RecentItem({ expense, member1 }) {
  const cat = getCategoryById(expense.category)
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
           style={{ backgroundColor: cat.color + '18' }}>
        {cat.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {expense.description || cat.label}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-medium" style={{ color: cat.color }}>{cat.label}</span>
          <span className="text-slate-300 text-xs">·</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            expense.paid_by === member1 ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
          }`}>{expense.paid_by}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-slate-800">{fmt(expense.amount)}</p>
        <p className="text-[10px] text-slate-400">{dateLabel(expense.expense_date)}</p>
      </div>
    </div>
  )
}

export default function Dashboard({ monthExpenses, salary1, salary2, member1, member2, emoji1, emoji2, familyName, month, setMonth, year, setYear, onAddExpense, onChangePw, onLogout }) {
  const totalSalary   = salary1 + salary2
  const spent1        = useMemo(() => monthExpenses.filter(e => e.paid_by === member1).reduce((s, e) => s + e.amount, 0), [monthExpenses, member1])
  const spent2        = useMemo(() => monthExpenses.filter(e => e.paid_by === member2).reduce((s, e) => s + e.amount, 0), [monthExpenses, member2])
  const totalSpent    = spent1 + spent2
  const totalSavings  = Math.max(0, totalSalary - totalSpent)

  const categoryData = useMemo(() => {
    const map = {}
    monthExpenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount })
    return Object.entries(map).map(([id, value]) => ({ ...getCategoryById(id), value }))
      .sort((a, b) => b.value - a.value).slice(0, 6)
  }, [monthExpenses])

  const recent = monthExpenses.slice(0, 5)

  return (
    <div className="animate-fade-in">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 px-4 pt-12 pb-28">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">{familyName} 👋</h1>
            <p className="text-blue-200/70 text-xs mt-1">{MONTHS[month - 1]} {year} Overview</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onChangePw} title="Change password"
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-150">
              <KeyRound className="w-4 h-4 text-white" />
            </button>
            <button onClick={onLogout} title="Logout"
                    className="w-10 h-10 bg-white/20 hover:bg-red-500/60 rounded-full flex items-center justify-center transition-colors duration-150">
              <LogOut className="w-4 h-4 text-white" />
            </button>
            <button onClick={onAddExpense}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-150">
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Total spent hero */}
        {totalSpent > 0 && (
          <div className="mt-5 bg-white/10 rounded-2xl p-4">
            <p className="text-blue-200 text-xs font-medium">Total Spent</p>
            <p className="text-3xl font-bold text-white mt-1">{fmt(totalSpent)}</p>
            {totalSalary > 0 && (
              <div className="mt-2">
                <div className="w-full h-1.5 bg-white/20 rounded-full">
                  <div className="h-full bg-white/80 rounded-full transition-all duration-500"
                       style={{ width: `${Math.min(100, pct(totalSpent, totalSalary))}%` }} />
                </div>
                <p className="text-blue-200/70 text-xs mt-1">
                  {pct(totalSpent, totalSalary)}% of {fmt(totalSalary)} salary
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content overlapping header */}
      <div className="px-4 -mt-16 space-y-4">
        <MonthSelector month={month} setMonth={setMonth} year={year} setYear={setYear} />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Combined Salary" value={totalSalary > 0 ? fmt(totalSalary) : '—'}
            sub={totalSalary > 0 ? 'this month' : 'Tap Salary tab →'}
            iconBg="bg-blue-100" iconColor="text-blue-600" icon={Wallet} />
          <StatCard label="Total Expenses" value={fmt(totalSpent)}
            sub={`${monthExpenses.length} transaction${monthExpenses.length !== 1 ? 's' : ''}`}
            iconBg="bg-red-100" iconColor="text-red-500" icon={TrendingDown} />
          <StatCard label="Savings" value={totalSalary > 0 ? fmt(totalSavings) : '—'}
            sub={totalSalary > 0 ? `${100 - Math.min(100, pct(totalSpent, totalSalary))}% saved` : 'Add salary first'}
            iconBg="bg-emerald-100" iconColor="text-emerald-600" icon={PiggyBank} />
          <StatCard label="Transactions" value={monthExpenses.length}
            sub={monthExpenses.filter(e => e.is_recurring).length > 0
              ? `${monthExpenses.filter(e => e.is_recurring).length} recurring`
              : 'this month'}
            iconBg="bg-violet-100" iconColor="text-violet-600" icon={TrendingUp} />
        </div>

        {/* Person cards */}
        <div className={`flex gap-3 ${!member2 ? 'justify-center' : ''}`}>
          <PersonCard name={member1} spent={spent1} salary={salary1}
                      color="#2563eb" bgColor="bg-blue-100" emoji={emoji1} />
          {member2 && (
            <PersonCard name={member2} spent={spent2} salary={salary2}
                        color="#db2777" bgColor="bg-pink-100" emoji={emoji2} />
          )}
        </div>

        {/* Category spending */}
        {categoryData.length > 0 && (
          <div className="card p-4">
            <p className="section-title mb-4">Spending by Category</p>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" innerRadius={28} outerRadius={54} paddingAngle={3}>
                      {categoryData.map(c => <Cell key={c.id} fill={c.color} />)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} contentStyle={TOOLTIP} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {categoryData.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="text-sm">{c.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600 truncate">{c.label}</span>
                        <span className="text-xs font-semibold text-slate-800 ml-1">{pct(c.value, totalSpent)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full mt-0.5">
                        <div className="h-full rounded-full" style={{ width: `${pct(c.value, totalSpent)}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent expenses */}
        <div className="card p-4 mb-2">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Recent Expenses</p>
            {monthExpenses.length > 5 && (
              <span className="text-xs text-blue-600 flex items-center gap-1 font-medium">
                See all <ArrowRight className="w-3 h-3" />
              </span>
            )}
          </div>
          {recent.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-3xl mb-2">🏖️</p>
              <p className="text-slate-400 text-sm">No expenses yet</p>
              <button onClick={onAddExpense}
                      className="mt-3 text-xs text-blue-600 font-medium flex items-center gap-1 mx-auto">
                <Plus className="w-3.5 h-3.5" /> Add first expense
              </button>
            </div>
          ) : (
            recent.map(e => <RecentItem key={e.id} expense={e} member1={member1} />)
          )}
        </div>
      </div>
    </div>
  )
}
