'use client'

import { useState, useEffect } from 'react'
import { startOfWeek, getWeekDays, dateKey, addDays, getWeekNumber, isSameDay } from '@/lib/date'
import { loadDayPlan, saveDayPlan, getTemplateBlocks, calcProgress, getCatInfo, BLOCK_CATEGORIES } from '@/lib/planner'
import { loadAulas, getAulasByDow } from '@/lib/disponibilidade'
import { getRecurringForDate } from '@/lib/planner'
import { loadMaterias } from '@/lib/estudos'
import { syncRetroativo } from '@/lib/planejador'
import AgenteRotina from '@/components/ai/AgenteRotina'
import Modal from '@/components/ui/Modal'

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const today = () => new Date()

// SVG completion ring
function Ring({ pct, size = 36 }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct === 100 ? '#10b981' : pct > 0 ? '#6366f1' : '#e2e8f0'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  )
}

// Mini plan modal for future days
function DayPlanModal({ date, onClose }) {
  const dk = dateKey(date)
  const [plan, setPlan] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = loadDayPlan(dk)
    if (saved) {
      setPlan(saved)
      setBlocks(saved.blocks || [])
    } else {
      setBlocks(getTemplateBlocks(date))
    }
    setLoaded(true)
  }, [dk])

  const updateBlock = (uid, field, val) =>
    setBlocks((prev) => prev.map((b) => b.uid === uid ? { ...b, [field]: val } : b))

  const removeBlock = (uid) =>
    setBlocks((prev) => prev.filter((b) => b.uid !== uid))

  const addBlock = () => setBlocks((prev) => [...prev, {
    uid: `blk-${Date.now()}`,
    startTime: '08:00', endTime: '09:00',
    title: '', category: 'pessoal', icon: '📌', note: '',
  }])

  const handleSave = () => {
    const newPlan = {
      ...(plan || {}),
      date: date.toISOString(),
      blocks,
      completed: plan?.completed || {},
      planned: true,
    }
    saveDayPlan(dk, newPlan)
    onClose()
  }

  if (!loaded) return null

  const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <Modal open onClose={onClose} title={dayName} fullHeight>
      <div className="p-4 space-y-2">
        {blocks.map((block) => (
          <div key={block.uid} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span>{block.icon}</span>
              <input
                type="text" value={block.title}
                onChange={(e) => updateBlock(block.uid, 'title', e.target.value)}
                className="flex-1 text-sm font-semibold text-slate-800 bg-transparent outline-none"
                placeholder="Título do bloco"
              />
              <button onClick={() => removeBlock(block.uid)} className="text-slate-300 hover:text-rose-400 text-xs transition-colors">✕</button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input type="time" value={block.startTime}
                onChange={(e) => updateBlock(block.uid, 'startTime', e.target.value)}
                className="text-xs text-slate-500 bg-white rounded-lg px-2 py-1 border border-slate-200 outline-none" />
              <span className="text-xs text-slate-300">→</span>
              <input type="time" value={block.endTime}
                onChange={(e) => updateBlock(block.uid, 'endTime', e.target.value)}
                className="text-xs text-slate-500 bg-white rounded-lg px-2 py-1 border border-slate-200 outline-none" />
              <select value={block.category}
                onChange={(e) => updateBlock(block.uid, 'category', e.target.value)}
                className="ml-auto text-xs bg-white rounded-lg px-2 py-1 border border-slate-200 outline-none text-slate-600">
                {BLOCK_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        ))}

        <button onClick={addBlock}
          className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-400 transition-colors">
          + Adicionar bloco
        </button>
      </div>
      <div className="px-4 pb-6">
        <button onClick={handleSave}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors shadow-sm">
          Salvar planejamento
        </button>
      </div>
    </Modal>
  )
}

function toMin(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Expanded day detail panel
function DayDetail({ date, plan, aulas, onPlanDay }) {
  const dk = dateKey(date)
  const isToday = isSameDay(date, today())
  const isPast  = date < today() && !isToday
  const { count, total, pct } = calcProgress(plan?.blocks || [], plan?.completed || {})

  // JS getDay(): 0=Sun,1=Mon...6=Sat → disp dow: 0=Seg(Mon)...6=Dom(Sun)
  const dispDow = date.getDay() === 0 ? 6 : date.getDay() - 1
  const dayAulas = getAulasByDow(aulas, dispDow)

  // Blocos recorrentes para este dia (que ainda não estão no plano)
  const recurringBlocks = getRecurringForDate(dk)
  const planRecIds = new Set((plan?.blocks || []).map((b) => b._recurringId).filter(Boolean))
  const recurringExtra = recurringBlocks.filter((b) => !planRecIds.has(b._recurringId))

  // Aulas extras (não no plano ainda)
  const planAulaIds = new Set((plan?.blocks || []).map((b) => b._aulaId).filter(Boolean))
  const aulaBlocksExtra = dayAulas
    .filter((a) => !planAulaIds.has(a.id))
    .map((a) => ({
      uid: `aula-${a.id}`,
      startTime: a.start,
      endTime: a.end,
      title: a.nome,
      category: 'estudo',
      icon: '🎓',
      note: a.local || '',
      _aulaId: a.id,
    }))

  // Todos os blocos visíveis: plano + aulas + recorrentes
  const allBlocks = [
    ...(plan?.blocks || []),
    ...aulaBlocksExtra,
    ...recurringExtra,
  ].sort((a, b) => toMin(a.startTime) - toMin(b.startTime))

  const hasAnything = allBlocks.length > 0

  if (!plan || !plan.planned) {
    if (!hasAnything) {
      return (
        <div className="bg-slate-50 rounded-2xl p-5 text-center border border-slate-100 mt-2">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm font-semibold text-slate-600 mb-1">Dia não planejado</p>
          {!isPast && (
            <button onClick={onPlanDay}
              className="mt-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors">
              Planejar este dia →
            </button>
          )}
        </div>
      )
    }
    // Tem aulas/recorrentes mesmo sem plano explícito
    return (
      <div className="mt-2 space-y-1.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">Blocos automáticos</p>
        {allBlocks.map((block) => {
          const cat = getCatInfo(block.category)
          const isAula = !!block._aulaId
          return (
            <div key={block.uid}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${isAula ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.dot}`} />
              <span className="text-sm">{block.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isAula ? 'text-indigo-700' : 'text-slate-700'}`}>{block.title}</p>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">{block.startTime}</span>
            </div>
          )
        })}
        {!isPast && (
          <button onClick={onPlanDay}
            className="w-full py-2 text-xs text-indigo-500 font-semibold hover:text-indigo-600 transition-colors">
            ✏️ Planejar este dia
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-1.5">
      {/* Progress mini bar */}
      {plan?.planned && (
        <div className="flex items-center gap-3 px-1 mb-3">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-500">{count}/{total}</span>
        </div>
      )}

      {allBlocks.map((block) => {
        const cat = getCatInfo(block.category)
        const done = plan?.completed?.[block.uid]
        const isAula = !!block._aulaId
        const isRecorrente = !!block._recurringId
        return (
          <div key={block.uid}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
              isAula
                ? 'bg-indigo-50 border-indigo-100'
                : isRecorrente
                ? 'bg-slate-50 border-slate-100'
                : done ? 'bg-slate-50 border-slate-100 opacity-50' : 'bg-white border-slate-100 shadow-sm'
            }`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.dot}`} />
            <span className="text-sm">{block.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${done ? 'line-through text-slate-400' : isAula ? 'text-indigo-700' : 'text-slate-700'}`}>
                {block.title}
              </p>
              {isAula && block.note && <p className="text-[10px] text-indigo-400">{block.note}</p>}
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0">{block.startTime}</span>
            {done && <span className="text-emerald-500 text-xs">✓</span>}
          </div>
        )
      })}

      {!isPast && (
        <button onClick={onPlanDay}
          className="w-full py-2 text-xs text-indigo-500 font-semibold hover:text-indigo-600 transition-colors">
          ✏️ Editar planejamento
        </button>
      )}
    </div>
  )
}

export default function WeekPlanner() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today()))
  const [plans, setPlans] = useState({})
  const [aulas, setAulas] = useState([])
  const [expanded, setExpanded] = useState(() => dateKey(today()))
  const [planningDay, setPlanningDay] = useState(null)
  const [showAgente, setShowAgente] = useState(false)

  const days = getWeekDays(weekStart)

  const reload = (currentDays = days) => {
    const loaded = {}
    currentDays.forEach((d) => { loaded[dateKey(d)] = loadDayPlan(dateKey(d)) })
    setPlans(loaded)
  }

  // Load aulas, run sync retroativo, then reload plans
  useEffect(() => {
    const aulasLoaded = loadAulas()
    const materiasLoaded = loadMaterias()
    setAulas(aulasLoaded)
    syncRetroativo(materiasLoaded, aulasLoaded)
    reload()
  }, []) // eslint-disable-line

  // Reload plans when week changes
  useEffect(() => {
    reload()
  }, [weekStart]) // eslint-disable-line

  const prevWeek = () => setWeekStart((w) => addDays(w, -7))
  const nextWeek = () => setWeekStart((w) => addDays(w, 7))

  const weekNum = getWeekNumber(weekStart)
  const monthLabel = weekStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const totalBlocks = days.reduce((s, d) => {
    const p = plans[dateKey(d)]
    return s + (p?.blocks?.length || 0)
  }, 0)
  const doneBlocks = days.reduce((s, d) => {
    const p = plans[dateKey(d)]
    if (!p) return s
    return s + Object.values(p.completed || {}).filter(Boolean).length
  }, 0)
  const plannedDays = days.filter((d) => plans[dateKey(d)]?.planned).length

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Semana {weekNum}</h1>
          <p className="text-sm text-slate-500 capitalize">{monthLabel}</p>
        </div>
        <button
          onClick={() => setShowAgente(true)}
          className="px-3 py-2 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-200 transition-colors"
        >
          ✨ Montar semana
        </button>
        <div className="flex items-center gap-1">
          <button onClick={prevWeek} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors font-bold">‹</button>
          <button
            onClick={() => { setWeekStart(startOfWeek(today())); setExpanded(dateKey(today())) }}
            className="px-2.5 py-1 text-xs font-semibold text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Hoje
          </button>
          <button onClick={nextWeek} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors font-bold">›</button>
        </div>
      </div>

      {/* Week summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-indigo-600">{plannedDays}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Dias planejados</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-slate-700">{totalBlocks}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Blocos totais</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-emerald-600">{doneBlocks}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Concluídos</p>
        </div>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {days.map((day, i) => {
          const dk = dateKey(day)
          const plan = plans[dk]
          const { pct } = calcProgress(plan?.blocks || [], plan?.completed || {})
          const isToday = isSameDay(day, today())
          const isExpanded = expanded === dk
          const isPast = day < today() && !isToday

          return (
            <button
              key={dk}
              onClick={() => setExpanded(isExpanded ? null : dk)}
              className={`flex flex-col items-center py-2 px-1 rounded-2xl border transition-all ${
                isExpanded
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                  : isToday
                  ? 'bg-white border-indigo-200 shadow-sm'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <span className={`text-[10px] font-bold mb-1 ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                {DAY_LABELS[i]}
              </span>
              <span className={`text-xs font-bold mb-1.5 ${isToday ? 'text-indigo-600' : isPast ? 'text-slate-400' : 'text-slate-700'}`}>
                {day.getDate()}
              </span>
              <Ring pct={pct} size={32} />
            </button>
          )
        })}
      </div>

      {/* Expanded day detail */}
      {expanded && (() => {
        const day = days.find((d) => dateKey(d) === expanded)
        if (!day) return null
        const plan = plans[expanded]
        const dayName = day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
            <p className="text-sm font-bold text-slate-700 mb-2 capitalize">{dayName}</p>
            <DayDetail
              date={day}
              plan={plan}
              aulas={aulas}
              onPlanDay={() => setPlanningDay(day)}
            />
          </div>
        )
      })()}

      {planningDay && (
        <DayPlanModal
          date={planningDay}
          onClose={() => { setPlanningDay(null); reload() }}
        />
      )}

      {showAgente && (
        <AgenteRotina onClose={() => { setShowAgente(false); reload() }} />
      )}
    </div>
  )
}
