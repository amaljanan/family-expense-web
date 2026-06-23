import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { MONTHS } from '../utils/format'

export default function MonthSelector({ month, setMonth, year, setYear }) {
  const prev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const next = () => {
    const now = new Date()
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  const isCurrentMonth = () => {
    const now = new Date()
    return month === now.getMonth() + 1 && year === now.getFullYear()
  }

  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />

      <button onClick={prev}
              className="w-7 h-7 flex items-center justify-center rounded-lg
                         hover:bg-slate-100 active:scale-90 transition-all duration-150">
        <ChevronLeft className="w-4 h-4 text-slate-500" />
      </button>

      <div className="flex-1 text-center">
        <span className="font-semibold text-slate-800">{MONTHS[month - 1]}</span>
        <span className="text-slate-400 ml-2 text-sm">{year}</span>
        {isCurrentMonth() && (
          <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
            Current
          </span>
        )}
      </div>

      <button onClick={next} disabled={isCurrentMonth()}
              className="w-7 h-7 flex items-center justify-center rounded-lg
                         hover:bg-slate-100 active:scale-90 transition-all duration-150
                         disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </button>
    </div>
  )
}
