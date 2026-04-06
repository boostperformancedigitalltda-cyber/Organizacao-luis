'use client'

import { useState, useEffect } from 'react'
import {
  loadGoals, addGoal, removeGoal, updateGoalValue,
  getGoalCat, goalProgress, goalStatus,
} from '@/lib/goals'
import { loadTransactions, calcMonthSummary, fmt } from '@/lib/finance'
import AddGoalModal from './AddGoalModal'

function FinanceGoalBanner({ goal }) {
  const { entradas, saidas, saldo } = calcMonthSummary(loadTransactions())
  const isEconomia = goal.unit === 'R$' && goal.title.toLowerCase().includes('economi')
  const autoValue = isEconomia ? saldo : saidas
  const pct = goal.targetValue > 0 ? Math.min(100, Math.round((autoValue / goal.targetValue) * 100)) : 0

  return (
    <div className="mt-2 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">📊 Dados automáticos do mês</p>
      <div className="flex gap-3 text-xs">
        <div><span className="text-slate-500">Entradas: </span><span className="font-bold text-emerald-600">{fmt(entradas)}</span></div>
        <div><span className="text-slate-500">Saídas: </span><span className="font-bold text-red-500">{fmt(saidas)}</span></div>
        <div><span className="text-slate-500">Saldo: </span><span className="font-bold text-slate-700">{fmt(saldo)}</span></div>
      </div>
      <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden mt-2">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-emerald-600 mt-1">{pct}% da meta atingido automaticamente</p>
    </div>
  )
}

function GoalCard({ goal, onUpdateValue, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(goal.currentValue)
  const cat = getGoalCat(goal.category)
  const pct = goalProgress(goal)
  const status = goalStatus(goal)

  const handleSave = () => {
    onUpdateValue(goal.id, val)
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${goal.color}20` }}
        >
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-slate-800 leading-tight">{goal.title}</p>
            <button
              onClick={() => onRemove(goal.id)}
              className="text-slate-200 hover:text-rose-400 transition-colors text-xs flex-shrink-0"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${status.bg} ${status.color}`}>
              {status.label}
            </span>
            <span className="text-[10px] text-slate-400">• {goal.period}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </span>
          <span className="font-bold" style={{ color: goal.color }}>{pct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: goal.color }}
          />
        </div>
      </div>

      {/* Finance auto-data */}
      {goal.category === 'financeiro' && <FinanceGoalBanner goal={goal} />}

      {/* Edit value */}
      {editing ? (
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400"
          />
          <button onClick={handleSave} className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-semibold rounded-xl">
            OK
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl">
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setVal(goal.currentValue); setEditing(true) }}
          className="mt-1 text-xs text-indigo-500 hover:text-indigo-600 font-semibold transition-colors"
        >
          ✏️ Atualizar valor
        </button>
      )}
    </div>
  )
}

export default function GoalsView() {
  const [goals, setGoals] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    setGoals(loadGoals())
  }, [])

  const handleAdd = (data) => {
    const updated = addGoal(goals, data)
    setGoals(updated)
  }

  const handleUpdateValue = (id, val) => {
    const updated = updateGoalValue(goals, id, val)
    setGoals(updated)
  }

  const handleRemove = (id) => {
    const updated = removeGoal(goals, id)
    setGoals(updated)
  }

  // Filter by month
  const filtered = goals.filter((g) => {
    if (!monthFilter) return true
    return g.targetMonth >= monthFilter.slice(0, 7) || g.period !== 'mensal'
  })

  const active = filtered.filter((g) => g.status !== 'concluida')
  const done = filtered.filter((g) => g.status === 'concluida')

  // Group by category
  const grouped = active.reduce((acc, g) => {
    const cat = getGoalCat(g.category)
    if (!acc[cat.id]) acc[cat.id] = { cat, goals: [] }
    acc[cat.id].goals.push(g)
    return acc
  }, {})

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Metas</h1>
          <p className="text-sm text-slate-500">
            {active.length} ativas · {done.length} concluídas
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          + Nova
        </button>
      </div>

      {/* Month filter */}
      <div className="mb-4">
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 outline-none focus:border-indigo-400 transition"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-indigo-600">{active.length}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ativas</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-emerald-600">{done.length}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Concluídas</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-amber-500">
            {active.length > 0 ? Math.round(active.reduce((s, g) => s + goalProgress(g), 0) / active.length) : 0}%
          </p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Média</p>
        </div>
      </div>

      {/* Goals empty state */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-slate-500 font-medium">Nenhuma meta criada</p>
          <p className="text-slate-400 text-sm mt-1">Defina objetivos claros e acompanhe seu progresso</p>
          <button
            onClick={() => setAddOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:bg-indigo-600 transition-colors"
          >
            Criar primeira meta
          </button>
        </div>
      ) : (
        <>
          {/* Grouped active goals */}
          {Object.values(grouped).map(({ cat, goals: gs }) => (
            <div key={cat.id} className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>{cat.icon}</span> {cat.label}
              </p>
              <div className="space-y-3">
                {gs.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onUpdateValue={handleUpdateValue}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Done goals */}
          {done.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">✅ Concluídas</p>
              <div className="space-y-3">
                {done.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onUpdateValue={handleUpdateValue}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AddGoalModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
    </div>
  )
}
