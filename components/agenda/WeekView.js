'use client'

import { useState, useEffect } from 'react'
import { dateKey, startOfWeek, getWeekDays, addDays, getWeekNumber, getMonthCalendar, isSameDay, formatMonth } from '@/lib/date'
import { loadDayPlan, calcProgress, getCatInfo } from '@/lib/planner'
import { get } from '@/lib/storage'

function CompletionRing({ pct, size = 28 }) {
  const r = (size - 4) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct >= 100 ? '#10b981' : pct > 0 ? '#6366f1' : '#e2e8f0'}
        strokeWidth="2.5"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring-circle transition-all duration-500"
      />
    </svg>
  )
}

function DayColumn({ date, isToday, isSelected, onClick }) {
  const dk = dateKey(date)
  const plan = typeof window !== 'undefined' ? loadDayPlan(dk) : null
  const { pct } = plan ? calcProgress(plan.blocks || [], plan.completed || {}) : { pct: 0 }
  const dayAbbr = date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)
  const dayNum = date.getDate()

  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
        isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
      } ${isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
    >
      <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-indigo-500' : 'text-slate-400'}`}>
        {dayAbbr}
      </span>
      <span className={`text-base font-bold ${isToday ? 'text-indigo-600' : isSelected ? 'text-slate-800' : 'text-slate-600'}`}>
        {dayNum}
      </span>
      <div className="relative">
        <CompletionRing pct={pct} />
        {pct > 0 && (
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-500">
            {pct}
          </span>
        )}
      </div>
    </button>
  )
}

export default function WeekView() {
  const [today] = useState(new Date())
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()))
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [forceUpdate, setForceUpdate] = useState(0)

  const weekDays = getWeekDays(weekStart)
  const weekNum = getWeekNumber(weekStart)
  const monthLabel = weekStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  useEffect(() => {
    const dk = dateKey(selectedDay)
    const plan = loadDayPlan(dk)
    setSelectedPlan(plan)
  }, [selectedDay, forceUpdate])

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  // Week summary
  const weekStats = weekDays.reduce((acc, d) => {
    const dk = dateKey(d)
    const plan = typeof window !== 'undefined' ? loadDayPlan(dk) : null
    if (plan) {
      const { count } = calcProgress(plan.blocks || [], plan.completed || {})
      acc.blocksTotal += count
      acc.studyMins += (plan.blocks || [])
        .filter((b) => b.category === 'estudo' && (plan.completed || {})[b.uid])
        .reduce((s, b) => {
          const dur = (parseInt(b.endTime?.split(':')[0] || 0) * 60 + parseInt(b.endTime?.split(':')[1] || 0))
            - (parseInt(b.startTime?.split(':')[0] || 0) * 60 + parseInt(b.startTime?.split(':')[1] || 0))
          return s + Math.max(0, dur)
        }, 0)
      acc.workouts += (plan.blocks || []).filter((b) => b.category === 'treino' && (plan.completed || {})[b.uid]).length
    }
    return acc
  }, { blocksTotal: 0, studyMins: 0, workouts: 0 })

  // Month calendar
  const monthCells = getMonthCalendar(weekStart)

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-500 capitalize">Semana {weekNum} • {monthLabel}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={prevWeek} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600">‹</button>
          <button onClick={nextWeek} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600">›</button>
        </div>
      </div>

      {/* Week row */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 mb-4">
        <div className="flex gap-1">
          {weekDays.map((d) => (
            <DayColumn
              key={dateKey(d)}
              date={d}
              isToday={isSameDay(d, today)}
              isSelected={isSameDay(d, selectedDay)}
              onClick={() => setSelectedDay(d)}
            />
          ))}
        </div>
      </div>

      {/* Selected day blocks */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-50">
          <h2 className="text-sm font-bold text-slate-700 capitalize">
            {selectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
        </div>
        {selectedPlan && selectedPlan.blocks?.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {selectedPlan.blocks.map((block) => {
              const cat = getCatInfo(block.category)
              const isDone = selectedPlan.completed?.[block.uid]
              return (
                <div key={block.uid} className={`flex items-center gap-3 px-4 py-3 ${isDone ? 'opacity-50' : ''}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.dot}`} />
                  <span className="text-base leading-none">{block.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {block.title}
                    </p>
                    <p className="text-xs text-slate-400">{block.startTime} – {block.endTime}</p>
                  </div>
                  {isDone && <span className="text-emerald-500 text-sm">✓</span>}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm text-slate-400">Nenhum plano para este dia</p>
          </div>
        )}
      </div>

      {/* Week summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resumo da semana</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-indigo-600">{weekStats.blocksTotal}</p>
            <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">Blocos feitos</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-emerald-600">
              {Math.floor(weekStats.studyMins / 60)}h{weekStats.studyMins % 60 > 0 ? `${weekStats.studyMins % 60}m` : ''}
            </p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Estudo</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-amber-600">{weekStats.workouts}</p>
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">Treinos</p>
          </div>
        </div>
      </div>

      {/* Month mini calendar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 capitalize">
          {formatMonth(weekStart)}
        </p>
        <div className="grid grid-cols-7 gap-1">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-300 pb-1">{d}</div>
          ))}
          {monthCells.map((cell, i) => {
            if (!cell) return <div key={`empty-${i}`} />
            const dk = dateKey(cell)
            const plan = typeof window !== 'undefined' ? loadDayPlan(dk) : null
            const { pct } = plan ? calcProgress(plan.blocks || [], plan.completed || {}) : { pct: 0 }
            const isT = isSameDay(cell, today)
            const bg = pct >= 100 ? 'bg-emerald-400 text-white' : pct > 50 ? 'bg-indigo-300 text-white' : pct > 0 ? 'bg-indigo-100 text-indigo-700' : ''
            return (
              <button
                key={dk}
                onClick={() => { setSelectedDay(cell); setWeekStart(startOfWeek(cell)) }}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${bg} ${
                  isT ? 'ring-2 ring-indigo-500 ring-offset-1' : 'hover:bg-slate-50'
                } ${!bg ? 'text-slate-500' : ''}`}
              >
                {cell.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
