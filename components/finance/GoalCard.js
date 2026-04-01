'use client'

import { useState } from 'react'
import { fmt } from '@/lib/finance'

export default function GoalCard({ goal, saldo, onSave }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')

  const pct = goal > 0 ? Math.min(100, Math.round((Math.max(0, saldo) / goal) * 100)) : 0

  const handleSave = () => {
    const val = parseFloat(input.replace(',', '.'))
    if (!isNaN(val) && val > 0) onSave(val)
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-ink">Meta de economia</p>
        <button
          onClick={() => { setEditing(true); setInput(goal > 0 ? goal.toString() : '') }}
          className="text-xs text-brand-500 font-semibold hover:text-brand-700"
        >
          {goal > 0 ? 'Editar' : 'Definir meta'}
        </button>
      </div>

      {editing ? (
        <div className="flex gap-2">
          <input
            type="number" inputMode="decimal" placeholder="Ex: 1500"
            value={input} onChange={(e) => setInput(e.target.value)}
            className="flex-1 border border-surface-200 rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand-400"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button onClick={handleSave} className="bg-brand-500 text-white px-4 rounded-xl text-sm font-bold hover:bg-brand-600">
            Salvar
          </button>
        </div>
      ) : goal > 0 ? (
        <>
          <div className="flex justify-between text-xs text-ink-muted mb-2">
            <span>{fmt(Math.max(0, saldo))} guardado</span>
            <span className="font-semibold">{pct}% da meta</span>
          </div>
          <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-ink-subtle">Meta: <span className="font-semibold text-ink">{fmt(goal)}</span></p>
            {pct >= 100 && <p className="text-xs text-emerald-600 font-bold">🎯 Meta atingida!</p>}
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-subtle">Defina uma meta mensal de economia</p>
      )}
    </div>
  )
}
