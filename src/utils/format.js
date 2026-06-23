export const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const fmt = (n) => INR.format(n ?? 0)

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export const shortMonth = (m) => MONTHS[m - 1]?.slice(0, 3) ?? ''

export const dateLabel = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const pct = (part, total) => (total === 0 ? 0 : Math.round((part / total) * 100))

export const savings = (salary, spent) => Math.max(0, salary - spent)
export const savingsPct = (salary, spent) => (salary === 0 ? 0 : Math.round(((salary - spent) / salary) * 100))
