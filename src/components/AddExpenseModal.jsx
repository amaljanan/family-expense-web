import { useState } from 'react'
import { X, IndianRupee } from 'lucide-react'
import { CATEGORIES } from '../data/categories'

const TODAY = new Date().toISOString().split('T')[0]

export default function AddExpenseModal({ onClose, onSave, initialData, member1 = 'Amal', member2 = 'Aiswarya', emoji1 = '👨', emoji2 = '👩' }) {
  const isEditing = !!initialData

  const [form, setForm] = useState({
    amount: initialData?.amount?.toString() ?? '',
    category: initialData?.category ?? '',
    description: initialData?.description ?? '',
    paid_by: initialData?.paid_by ?? member1,
    expense_date: initialData?.expense_date ?? TODAY,
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount'
    if (!form.category) e.category = 'Select a category'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    await onSave({ ...form, amount: parseFloat(form.amount) })
    setSaving(false)
  }

  const selectedCat = CATEGORIES.find(c => c.id === form.category)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
         style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-white rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Coloured top strip */}
        <div className={`h-1 w-full ${isEditing ? 'bg-emerald-500' : 'bg-blue-600'}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditing ? 'Update transaction details' : 'Record a new transaction'}
            </p>
          </div>
          <button onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full
                             bg-slate-100 hover:bg-slate-200 transition-colors duration-150">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: '65vh' }}>
          {/* Amount */}
          <div>
            <label className="label">Amount</label>
            <div className={`flex items-center bg-slate-50 border rounded-xl transition-all duration-200
                            focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100
                            ${errors.amount ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-100' : 'border-slate-200'}`}>
              <span className="pl-4 pr-1 text-slate-400 font-semibold text-lg select-none flex items-center">
                <IndianRupee className="w-4 h-4 text-blue-500" />
              </span>
              <input type="number" inputMode="decimal" placeholder="0" value={form.amount}
                     onChange={e => set('amount', e.target.value)} autoFocus
                     className="flex-1 bg-transparent py-3 pr-4 text-xl font-bold text-slate-800
                                placeholder-slate-300 outline-none" />
            </div>
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {/* Category grid */}
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-4 gap-2 overflow-y-auto pr-1" style={{ maxHeight: '180px' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => set('category', cat.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all duration-150 active:scale-95 ${
                          form.category === cat.id
                            ? 'border-blue-300 bg-blue-50 shadow-sm'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}>
                  <span className="text-xl leading-none">{cat.emoji}</span>
                  <span className="text-[9px] text-slate-600 text-center leading-tight line-clamp-2">{cat.label}</span>
                </button>
              ))}
            </div>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
            {selectedCat && (
              <div className="mt-2 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                <span className="text-base">{selectedCat.emoji}</span>
                <span className="text-sm font-medium" style={{ color: selectedCat.color }}>{selectedCat.label}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="label">Description <span className="text-slate-400 font-normal">(optional)</span></label>
            <input type="text" placeholder="What was this for?" value={form.description}
                   onChange={e => set('description', e.target.value)} className="input-field" />
          </div>

          {/* Date */}
          <div>
            <label className="label">Date</label>
            <input type="date" value={form.expense_date} max={TODAY}
                   onChange={e => set('expense_date', e.target.value)}
                   className="input-field [color-scheme:light]" />
          </div>

          {/* Paid by */}
          <div>
            <label className="label">Paid by</label>
            <div className={`grid gap-3 ${member2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {[
                { name: member1, emoji: emoji1, active: 'bg-blue-50 border-blue-400 text-blue-700' },
                ...(member2 ? [{ name: member2, emoji: emoji2, active: 'bg-pink-50 border-pink-400 text-pink-700' }] : []),
              ].map(p => (
                <button key={p.name} onClick={() => set('paid_by', p.name)}
                        className={`py-3 rounded-xl border font-semibold transition-all duration-150 active:scale-95 text-sm ${
                          form.paid_by === p.name ? p.active : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}>
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving}
                  className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-60 text-white ${
                    isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}>
            {saving ? 'Saving…' : isEditing ? 'Update' : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  )
}
