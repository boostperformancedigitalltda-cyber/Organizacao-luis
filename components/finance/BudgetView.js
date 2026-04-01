'use client'

import { useState } from 'react'
import { CATEGORIES, fmt, loadBudgets, saveBudgets } from '@/lib/finance'

export default function BudgetView({ byCat }) {
  const [budgets, setBudgets] = useState(() => loadBudgets())
  const [editing, setEditing] = useState(null)
  const [tempVal, setTempVal] = useState('')

  const handleSaveBudget = (catId) => {
    const val = parseFloat(tempVal) || 0
    const updated = { ...budgets, [catId]: val }
    setBudgets(updated)
    saveBudgets(updated)
    setEditing(null)
  }

  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Orçamento por categoria</p>
      <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const budget = budgets[cat.id] || 0
          const spent = byCat.find((c) => c.id === cat.id)?.total || 0
          const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0
          const over = budget > 0 && spent > budget

          return (
            <div
              key={cat.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${over ? 'border-rose-200' : 'border-slate-100'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm font-semibold text-slate-700">{cat.label}</span>
                  {over && (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">Excedido</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${over ? 'text-rose-500' : 'text-slate-500'}`}>
                    {fmt(spent)} / {budget > 0 ? fmt(budget) : '–'}
                  </span>
                  {editing === cat.id ? (
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={tempVal}
                        onChange={(e) => setTempVal(e.target.value)}
                        placeholder="0"
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveBudget(cat.id)}
                        className="px-2 py-1 bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditing(cat.id); setTempVal(budget || '') }}
                      className="text-xs text-slate-400 hover:text-indigo-500 transition-colors"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              </div>

              {budget > 0 && (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-rose-500' : 'bg-indigo-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}

              {budget === 0 && (
                <p className="text-xs text-slate-300 italic">Sem orçamento definido</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
