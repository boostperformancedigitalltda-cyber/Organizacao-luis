'use client'

import { useState, useEffect } from 'react'
import { getMonthCalendar, dateKey, isSameDay, addDays, isSameMonth } from '@/lib/date'
import { loadDayPlan, calcProgress, getCatInfo } from '@/lib/planner'
import { loadGoals, goalProgress, getGoalCat } from '@/lib/goals'

const DAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const today = () => new Date()

function DayCell({ date, plan, isCurrentMonth, onSelect, isSelected }) {
  if (!date) return <div />

  const isToday = isSameDay(date, today())
  const { pct, total } = calcProgress(plan?.blocks || [], plan?.completed || {})
  const planned = plan?.planned && total > 0
  const isPast = date < today() && !isToday

  // Category dots (up to 3 unique categories)
  const cats = planned
    ? [...new Set((plan.blocks || []).map((b) => b.category))].slice(0, 3)
    : []

  return (
    <button
      onClick={() => onSelect(date)}
      className={`relative flex flex-col items-center py-1.5 rounded-xl border transition-all min-h-[56px] ${
        isSelected
          ? 'bg-indigo-50 border-indigo-200 shadow-sm'
          : isToday
          ? 'bg-white border-indigo-300 shadow-sm'
          : isPast && !isCurrentMonth
          ? 'bg-transparent border-transparent opacity-30'
          : isCurrentMonth
          ? 'bg-white border-slate-100 hover:border-slate-200'
          : 'bg-transparent border-transparent opacity-40'
      }`}
    >
      <span className={`text-xs font-bold leading-none mb-1 ${
        isToday ? 'text-indigo-600' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
      }`}>
        {date.getDate()}
      </span>

      {/* Completion indicator */}
      {planned && (
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold mb-1 ${
          pct === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {pct === 100 ? '✓' : `${pct}%`}
        </div>
      )}

      {/* Category dots */}
      {cats.length > 0 && (
        <div className="flex gap-0.5">
          {cats.map((catId) => {
            const cat = getCatInfo(catId)
            return <span key={catId} className={`w-1 h-1 rounded-full ${cat.dot}`} />
          })}
        </div>
      )}
    </button>
  )
}

function MonthSummary({ days, plans }) {
  const totalPlanned = days.filter((d) => d && plans[dateKey(d)]?.planned).length
  const totalDone = days.filter((d) => {
    if (!d) return false
    const p = plans[dateKey(d)]
    if (!p?.planned) return false
    const { pct } = calcProgress(p.blocks || [], p.completed || {})
    return pct === 100
  }).length

  const totalBlocks = days.reduce((s, d) => {
    if (!d) return s
    return s + (plans[dateKey(d)]?.blocks?.length || 0)
  }, 0)

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
        <p className="text-xl font-bold text-indigo-600">{totalPlanned}</p>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Dias planejados</p>
      </div>
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
        <p className="text-xl font-bold text-emerald-600">{totalDone}</p>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Dias 100%</p>
      </div>
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
        <p className="text-xl font-bold text-slate-700">{totalBlocks}</p>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Blocos totais</p>
      </div>
    </div>
  )
}

function SelectedDayPanel({ date, plan }) {
  if (!plan?.planned || !plan.blocks?.length) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
        <p className="text-3xl mb-2">📋</p>
        <p className="text-sm text-slate-500 font-medium">
          {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <p className="text-xs text-slate-400 mt-1">Nenhum planejamento registrado</p>
      </div>
    )
  }

  const { count, total, pct } = calcProgress(plan.blocks, plan.completed || {})

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-slate-800 capitalize">
          {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          pct === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {count}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {plan.blocks.map((block) => {
          const cat = getCatInfo(block.category)
          const done = plan.completed?.[block.uid]
          return (
            <div key={block.uid} className={`flex items-center gap-2.5 py-1.5 transition-opacity ${done ? 'opacity-40' : ''}`}>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cat.dot}`} />
              <span className="text-sm">{block.icon}</span>
              <p className={`text-sm flex-1 ${done ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                {block.title}
              </p>
              <span className="text-xs text-slate-400">{block.startTime}</span>
              {done && <span className="text-emerald-500 text-xs">✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MonthView() {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [plans, setPlans] = useState({})
  const [goals, setGoals] = useState([])
  const [selected, setSelected] = useState(() => new Date())

  const cells = getMonthCalendar(currentDate)
  const allDays = cells.filter(Boolean)

  useEffect(() => {
    const loaded = {}
    // Load plans for current month + a buffer of days
    cells.forEach((d) => {
      if (d) loaded[dateKey(d)] = loadDayPlan(dateKey(d))
    })
    setPlans(loaded)
    setGoals(loadGoals())
  }, [currentDate]) // eslint-disable-line

  const prevMonth = () => {
    const d = new Date(currentDate)
    d.setMonth(d.getMonth() - 1)
    setCurrentDate(d)
  }
  const nextMonth = () => {
    const d = new Date(currentDate)
    d.setMonth(d.getMonth() + 1)
    setCurrentDate(d)
  }

  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // Goals for this month
  const monthGoals = goals.filter((g) => {
    if (g.period === 'mensal') {
      return g.targetMonth?.startsWith(
        `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      )
    }
    return g.status !== 'concluida'
  }).slice(0, 3)

  const selectedPlan = selected ? plans[dateKey(selected)] : null

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 capitalize">{monthLabel}</h1>
          <p className="text-sm text-slate-500">Visão mensal</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 font-bold transition-colors">‹</button>
          <button
            onClick={() => { setCurrentDate(new Date()); setSelected(new Date()) }}
            className="px-2.5 py-1 text-xs font-semibold text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
          >Hoje</button>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 font-bold transition-colors">›</button>
        </div>
      </div>

      {/* Summary */}
      <MonthSummary days={allDays} plans={plans} />

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 mb-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_HEADERS.map((h) => (
            <div key={h} className="text-center text-[10px] font-bold text-slate-400 py-1">{h}</div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => (
            <DayCell
              key={i}
              date={date}
              plan={date ? plans[dateKey(date)] : null}
              isCurrentMonth={date ? isSameMonth(date, currentDate) : false}
              isSelected={date ? isSameDay(date, selected) : false}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dia selecionado</p>
          <SelectedDayPanel date={selected} plan={selectedPlan} />
        </div>
      )}

      {/* Goals this month */}
      {monthGoals.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Metas do mês</p>
          <div className="space-y-2">
            {monthGoals.map((goal) => {
              const cat = getGoalCat(goal.category)
              const pct = goalProgress(goal)
              return (
                <div key={goal.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{cat.icon}</span>
                    <p className="text-sm font-semibold text-slate-800 flex-1">{goal.title}</p>
                    <span className="text-xs font-bold" style={{ color: goal.color }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: goal.color }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {goal.currentValue} / {goal.targetValue} {goal.unit}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
