import { LayoutDashboard, Receipt, BarChart3, Wallet, Plus } from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Home',     Icon: LayoutDashboard },
  { id: 'expenses',  label: 'Expenses', Icon: Receipt },
  { id: null,        label: 'Add',      Icon: Plus },
  { id: 'analytics', label: 'Reports',  Icon: BarChart3 },
  { id: 'salary',    label: 'Salary',   Icon: Wallet },
]

export default function BottomNav({ tab, setTab, onAdd }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 shadow-lg"
         style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 pt-2 pb-2">
        {tabs.map(({ id, label, Icon }) => {
          if (id === null) {
            return (
              <button key="add" onClick={onAdd}
                      className="flex flex-col items-center gap-0.5 -mt-5 focus:outline-none">
                <span className="w-[52px] h-[52px] flex items-center justify-center rounded-full
                                 bg-blue-600 shadow-lg shadow-blue-200
                                 active:scale-90 transition-transform duration-150 border-4 border-slate-50">
                  <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                </span>
                <span className="text-[10px] text-blue-600 font-medium">{label}</span>
              </button>
            )
          }
          const active = tab === id
          return (
            <button key={id} onClick={() => setTab(id)}
                    className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl
                               transition-all duration-150 active:scale-90 focus:outline-none">
              <div className={`p-1.5 rounded-xl transition-colors duration-150 ${active ? 'bg-blue-50' : ''}`}>
                <Icon className={`w-5 h-5 transition-colors duration-150 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-150 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
