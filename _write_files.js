const fs = require('fs');
const path = require('path');
const BASE = __dirname;

function write(rel, content) {
  const full = path.join(BASE, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('wrote:', rel);
}

// ─────────────────────────────────────────────
// app/page.js
// ─────────────────────────────────────────────
write('app/page.js', `'use client'

import { useState, useEffect } from 'react'
import BottomNav from '@/components/ui/BottomNav'
import MorningModal from '@/components/hoje/MorningModal'
import DayTimeline from '@/components/hoje/DayTimeline'
import WeekPlanner from '@/components/semana/WeekPlanner'
import MonthView from '@/components/mes/MonthView'
import GoalsView from '@/components/metas/GoalsView'
import FinanceTab from '@/components/finance/FinanceTab'
import { loadDayPlan, saveDayPlan } from '@/lib/planner'
import { dateKey } from '@/lib/date'

export default function Home() {
  const [tab, setTab] = useState('hoje')
  const [today] = useState(new Date())
  const [plan, setPlan] = useState(null)
  const [loaded, setLoaded] = useState(false)

  const dk = dateKey(today)

  useEffect(() => {
    const savedPlan = loadDayPlan(dk)
    setPlan(savedPlan)
    setLoaded(true)
  }, []) // eslint-disable-line

  const handleMorningComplete = ({ energy, priorities, blocks }) => {
    const newPlan = {
      date: today.toISOString(),
      energy,
      priorities,
      blocks,
      completed: {},
      planned: true,
    }
    setPlan(newPlan)
    saveDayPlan(dk, newPlan)
  }

  const handleToggle = (uid) => {
    if (!plan) return
    const newCompleted = { ...plan.completed, [uid]: !plan.completed[uid] }
    const newPlan = { ...plan, completed: newCompleted }
    setPlan(newPlan)
    saveDayPlan(dk, newPlan)
  }

  const handleAddBlock = (block, isEdit) => {
    if (!plan) return
    let newBlocks
    if (isEdit) {
      newBlocks = plan.blocks.map((b) => b.uid === block.uid ? block : b)
    } else {
      newBlocks = [...plan.blocks, block]
    }
    const newPlan = { ...plan, blocks: newBlocks }
    setPlan(newPlan)
    saveDayPlan(dk, newPlan)
  }

  const handleReset = () => {
    setPlan(null)
    saveDayPlan(dk, null)
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-indigo-500 text-sm font-semibold">Carregando...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {tab === 'hoje' && !plan && (
        <MorningModal date={today} onComplete={handleMorningComplete} />
      )}

      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        {tab === 'hoje' && plan && (
          <DayTimeline
            plan={plan}
            onToggle={handleToggle}
            onAddBlock={handleAddBlock}
            onReset={handleReset}
          />
        )}
        {tab === 'semana'   && <WeekPlanner />}
        {tab === 'mes'      && <MonthView />}
        {tab === 'metas'    && <GoalsView />}
        {tab === 'financas' && <FinanceTab />}
      </div>

      <BottomNav active={tab} onChange={setTab} />
    </main>
  )
}
`);

// ─────────────────────────────────────────────
// components/ui/BottomNav.js
// ─────────────────────────────────────────────
write('components/ui/BottomNav.js', `'use client'

const TABS = [
  { id: 'hoje',     label: 'Hoje',    icon: '📅' },
  { id: 'semana',   label: 'Semana',  icon: '📆' },
  { id: 'mes',      label: 'Mês',     icon: '🗓️' },
  { id: 'metas',    label: 'Metas',   icon: '🎯' },
  { id: 'financas', label: 'Finanças', icon: '💰' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200">
      <div className="max-w-lg mx-auto flex">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={\`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors active:scale-95 \${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }\`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className={\`text-[10px] font-semibold leading-none \${isActive ? 'text-indigo-600' : ''}\`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-500 mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
`);

// ─────────────────────────────────────────────
// components/hoje/MorningModal.js
// ─────────────────────────────────────────────
write('components/hoje/MorningModal.js', `'use client'

import { useState } from 'react'
import { getTemplateBlocks, BLOCK_CATEGORIES } from '@/lib/planner'

const ENERGY_OPTIONS = [
  { value: 1, emoji: '😴', label: 'Cansado' },
  { value: 2, emoji: '😐', label: 'Normal' },
  { value: 3, emoji: '🙂', label: 'Bem' },
  { value: 4, emoji: '😊', label: 'Ótimo' },
  { value: 5, emoji: '🔥', label: 'Focado' },
]

export default function MorningModal({ date, onComplete }) {
  const [step, setStep] = useState(1)
  const [energy, setEnergy] = useState(3)
  const [priorities, setPriorities] = useState(['', '', ''])
  const [blocks, setBlocks] = useState(() => getTemplateBlocks(date))

  const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' })
  const dateStr = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

  const updatePriority = (i, val) => {
    const p = [...priorities]; p[i] = val; setPriorities(p)
  }
  const updateBlock = (uid, field, val) =>
    setBlocks((prev) => prev.map((b) => b.uid === uid ? { ...b, [field]: val } : b))
  const removeBlock = (uid) =>
    setBlocks((prev) => prev.filter((b) => b.uid !== uid))
  const addBlock = () =>
    setBlocks((prev) => [...prev, {
      uid: \`blk-\${Date.now()}\`, startTime: '08:00', endTime: '09:00',
      title: '', category: 'pessoal', icon: '📌', note: '', goalId: null,
    }])

  const handleFinish = () => onComplete({ energy, priorities, blocks })

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-indigo-50 to-white flex flex-col">
      <div className="px-6 pt-12 pb-4">
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={\`h-1 flex-1 rounded-full transition-all duration-300 \${s <= step ? 'bg-indigo-500' : 'bg-slate-200'}\`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">👋</div>
              <h1 className="text-2xl font-bold text-slate-900">Bom dia, Luis!</h1>
              <p className="text-slate-500 mt-1 capitalize">{dayName}, {dateStr}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Como você está hoje?</p>
              <div className="flex justify-between gap-2">
                {ENERGY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setEnergy(opt.value)}
                    className={\`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95 \${
                      energy === opt.value ? 'border-indigo-400 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'
                    }\`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className={\`text-[10px] font-semibold \${energy === opt.value ? 'text-indigo-600' : 'text-slate-400'}\`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Quais são suas 3 prioridades de hoje?</h2>
              <p className="text-slate-500 text-sm mt-1">As coisas mais importantes que DEVEM acontecer hoje</p>
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={\`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 \${
                      i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-300' : 'bg-orange-300'
                    }\`}>{i + 1}</div>
                    <input
                      type="text" value={priorities[i]}
                      onChange={(e) => updatePriority(i, e.target.value)}
                      placeholder={\`Prioridade \${i + 1}...\`}
                      className="flex-1 text-sm text-slate-800 placeholder-slate-300 bg-transparent border-none outline-none font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">Planeje sua agenda de hoje</h2>
              <p className="text-slate-500 text-sm mt-1">Ajuste os blocos conforme necessário</p>
            </div>
            <div className="space-y-2 mb-4">
              {blocks.map((block) => (
                <div key={block.uid} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{block.icon}</span>
                    <input type="text" value={block.title}
                      onChange={(e) => updateBlock(block.uid, 'title', e.target.value)}
                      className="flex-1 text-sm font-semibold text-slate-800 bg-transparent border-none outline-none"
                      placeholder="Título do bloco"
                    />
                    <button onClick={() => removeBlock(block.uid)} className="text-slate-300 hover:text-rose-400 transition-colors text-xs">✕</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="time" value={block.startTime}
                      onChange={(e) => updateBlock(block.uid, 'startTime', e.target.value)}
                      className="text-xs text-slate-500 bg-slate-50 rounded-lg px-2 py-1 border border-slate-100 outline-none"
                    />
                    <span className="text-xs text-slate-300">→</span>
                    <input type="time" value={block.endTime}
                      onChange={(e) => updateBlock(block.uid, 'endTime', e.target.value)}
                      className="text-xs text-slate-500 bg-slate-50 rounded-lg px-2 py-1 border border-slate-100 outline-none"
                    />
                    <select value={block.category}
                      onChange={(e) => updateBlock(block.uid, 'category', e.target.value)}
                      className="ml-auto text-xs bg-slate-50 rounded-lg px-2 py-1 border border-slate-100 outline-none text-slate-600"
                    >
                      {BLOCK_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addBlock}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-400 transition-colors mb-4">
              + Adicionar bloco
            </button>
          </div>
        )}
      </div>

      <div className="px-6 py-6 bg-white border-t border-slate-100">
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
              Voltar
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)}
              className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors shadow-sm active:scale-95">
              Próximo →
            </button>
          ) : (
            <button onClick={handleFinish}
              className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors shadow-sm active:scale-95">
              Começar o dia →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
`);

// ─────────────────────────────────────────────
// components/semana/WeekPlanner.js
// ─────────────────────────────────────────────
write('components/semana/WeekPlanner.js', `'use client'

import { useState, useEffect } from 'react'
import { dateKey, startOfWeek, getWeekDays, getWeekNumber, isSameDay } from '@/lib/date'
import { loadDayPlan, saveDayPlan, calcProgress, getCatInfo, getTemplateBlocks, makeNewBlock, BLOCK_CATEGORIES } from '@/lib/planner'
import Modal from '@/components/ui/Modal'

function CompletionRing({ pct, size = 28 }) {
  const r = (size - 4) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct >= 100 ? '#10b981' : pct > 0 ? '#6366f1' : '#e2e8f0'}
        strokeWidth="2.5" strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-500"
      />
    </svg>
  )
}

function DayPlanModal({ date, open, onClose, onSaved }) {
  const dk = dateKey(date)
  const [blocks, setBlocks] = useState([])

  useEffect(() => {
    if (open) {
      const existing = loadDayPlan(dk)
      setBlocks(existing ? existing.blocks : getTemplateBlocks(date))
    }
  }, [open]) // eslint-disable-line

  const updateBlock = (uid, field, val) => setBlocks(prev => prev.map(b => b.uid === uid ? { ...b, [field]: val } : b))
  const removeBlock = (uid) => setBlocks(prev => prev.filter(b => b.uid !== uid))
  const addBlock = () => setBlocks(prev => [...prev, makeNewBlock()])

  const handleSave = () => {
    const existing = loadDayPlan(dk) || {}
    saveDayPlan(dk, { ...existing, date: date.toISOString(), blocks, completed: existing.completed || {}, planned: true })
    onSaved()
    onClose()
  }

  const dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <Modal open={open} onClose={onClose} title={dayLabel} fullHeight>
      <div className="p-4 space-y-3 overflow-y-auto">
        {blocks.map(block => (
          <div key={block.uid} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{block.icon}</span>
              <input type="text" value={block.title}
                onChange={e => updateBlock(block.uid, 'title', e.target.value)}
                className="flex-1 text-sm font-semibold text-slate-800 bg-transparent border-none outline-none"
                placeholder="Título do bloco"
              />
              <button onClick={() => removeBlock(block.uid)} className="text-slate-300 hover:text-rose-400 transition-colors text-xs">✕</button>
            </div>
            <div className="flex items-center gap-2">
              <input type="time" value={block.startTime}
                onChange={e => updateBlock(block.uid, 'startTime', e.target.value)}
                className="text-xs text-slate-500 bg-white rounded-lg px-2 py-1 border border-slate-200 outline-none"
              />
              <span className="text-xs text-slate-300">→</span>
              <input type="time" value={block.endTime}
                onChange={e => updateBlock(block.uid, 'endTime', e.target.value)}
                className="text-xs text-slate-500 bg-white rounded-lg px-2 py-1 border border-slate-200 outline-none"
              />
              <select value={block.category}
                onChange={e => updateBlock(block.uid, 'category', e.target.value)}
                className="ml-auto text-xs bg-white rounded-lg px-2 py-1 border border-slate-200 outline-none text-slate-600"
              >
                {BLOCK_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
        ))}
        <button onClick={addBlock}
          className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-400 transition-colors">
          + Adicionar bloco
        </button>
        <button onClick={handleSave}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors shadow-sm active:scale-95">
          Salvar plano do dia
        </button>
      </div>
    </Modal>
  )
}

export default function WeekPlanner() {
  const [today] = useState(new Date())
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()))
  const [selectedDay, setSelectedDay] = useState(null)
  const [planModal, setPlanModal] = useState(false)
  const [tick, setTick] = useState(0)

  const weekDays = getWeekDays(weekStart)
  const weekNum = getWeekNumber(weekStart)
  const monthLabel = weekStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }

  const getDayPlan = (date) => {
    if (typeof window === 'undefined') return null
    return loadDayPlan(dateKey(date))
  }

  // recalc when tick changes
  const dayPlans = weekDays.map(d => getDayPlan(d))

  const selectedPlan = selectedDay ? getDayPlan(selectedDay) : null

  const weekStats = weekDays.reduce((acc, d, i) => {
    const plan = dayPlans[i]
    if (plan) {
      acc.planned++
      acc.total += (plan.blocks || []).length
      const { count } = calcProgress(plan.blocks || [], plan.completed || {})
      acc.done += count
    }
    return acc
  }, { planned: 0, total: 0, done: 0 })

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Semana</h1>
          <p className="text-sm text-slate-500 capitalize">Semana {weekNum} • {monthLabel}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={prevWeek} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600">‹</button>
          <button onClick={nextWeek} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600">›</button>
        </div>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map((d, i) => {
          const plan = dayPlans[i]
          const { pct } = plan ? calcProgress(plan.blocks || [], plan.completed || {}) : { pct: 0 }
          const isToday = isSameDay(d, today)
          const isSelected = selectedDay && isSameDay(d, selectedDay)
          const dayAbbr = d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)

          return (
            <button key={dateKey(d)}
              onClick={() => setSelectedDay(isSelected ? null : d)}
              className={\`flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-95 \${
                isSelected ? 'bg-indigo-50 ring-2 ring-indigo-300' :
                isToday ? 'bg-white ring-2 ring-indigo-400 shadow-sm' :
                'bg-white hover:bg-slate-50 border border-slate-100'
              }\`}
            >
              <span className={\`text-[10px] font-bold uppercase tracking-wider \${isToday ? 'text-indigo-500' : 'text-slate-400'}\`}>{dayAbbr}</span>
              <span className={\`text-base font-bold \${isToday ? 'text-indigo-600' : 'text-slate-700'}\`}>{d.getDate()}</span>
              <div className="relative">
                <CompletionRing pct={pct} />
                {pct > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-500">{pct}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 capitalize">
              {selectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <button
              onClick={() => setPlanModal(true)}
              className="text-xs text-indigo-500 font-semibold hover:text-indigo-600 transition-colors"
            >
              {selectedPlan ? '✏️ Editar' : '+ Planejar dia'}
            </button>
          </div>

          {selectedPlan && selectedPlan.blocks?.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {selectedPlan.blocks.map(block => {
                const cat = getCatInfo(block.category)
                const isDone = selectedPlan.completed?.[block.uid]
                return (
                  <div key={block.uid} className={\`flex items-center gap-3 px-4 py-3 \${isDone ? 'opacity-50' : ''}\`}>
                    <div className={\`w-2 h-2 rounded-full flex-shrink-0 \${cat.dot}\`} />
                    <span className="text-base leading-none">{block.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={\`text-sm font-semibold \${isDone ? 'line-through text-slate-400' : 'text-slate-800'}\`}>{block.title}</p>
                      <p className="text-xs text-slate-400">{block.startTime} – {block.endTime}</p>
                    </div>
                    {isDone && <span className="text-emerald-500 text-sm">✓</span>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm text-slate-400 mb-3">Nenhum plano para este dia</p>
              <button onClick={() => setPlanModal(true)}
                className="px-4 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:bg-indigo-600 transition-colors active:scale-95">
                + Planejar dia
              </button>
            </div>
          )}
        </div>
      )}

      {/* Week summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resumo da semana</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-indigo-600">{weekStats.planned}</p>
            <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">Dias planejados</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-slate-700">{weekStats.total}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Blocos totais</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-emerald-600">{weekStats.done}</p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Completos</p>
          </div>
        </div>
      </div>

      {selectedDay && (
        <DayPlanModal
          date={selectedDay}
          open={planModal}
          onClose={() => setPlanModal(false)}
          onSaved={() => setTick(t => t + 1)}
        />
      )}
    </div>
  )
}
`);

// ─────────────────────────────────────────────
// components/mes/MonthView.js
// ─────────────────────────────────────────────
write('components/mes/MonthView.js', `'use client'

import { useState } from 'react'
import { dateKey, getMonthCalendar, isSameDay, formatMonth } from '@/lib/date'
import { loadDayPlan, calcProgress, getCatInfo, BLOCK_CATEGORIES } from '@/lib/planner'
import { loadGoals, goalProgress } from '@/lib/goals'

const DAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export default function MonthView() {
  const [today] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  const prevMonth = () => {
    const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d)
  }
  const nextMonth = () => {
    const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d)
  }

  const cells = getMonthCalendar(currentMonth)

  const getDayPlan = (date) => {
    if (!date || typeof window === 'undefined') return null
    return loadDayPlan(dateKey(date))
  }

  const selectedPlan = selectedDay ? getDayPlan(selectedDay) : null

  // Monthly goals
  const allGoals = typeof window !== 'undefined' ? loadGoals() : []
  const monthKey = currentMonth.toISOString().slice(0, 7)
  const monthGoals = allGoals.filter(g =>
    g.targetMonth === monthKey ||
    (g.period === 'anual' && g.targetMonth?.startsWith(currentMonth.getFullYear().toString())) ||
    g.period === 'trimestral'
  ).slice(0, 4)

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mês</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <button onClick={prevMonth} className="text-slate-400 hover:text-slate-600 transition-colors text-lg">‹</button>
            <span className="text-sm text-slate-500 font-medium capitalize">{formatMonth(currentMonth)}</span>
            <button onClick={nextMonth} className="text-slate-400 hover:text-slate-600 transition-colors text-lg">›</button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_HEADERS.map(h => (
            <div key={h} className="text-center text-[10px] font-bold text-slate-300 pb-1">{h}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell) return <div key={\`empty-\${i}\`} />
            const plan = getDayPlan(cell)
            const { pct, count, total } = plan ? calcProgress(plan.blocks || [], plan.completed || {}) : { pct: 0, count: 0, total: 0 }
            const isToday = isSameDay(cell, today)
            const isSelected = selectedDay && isSameDay(cell, selectedDay)
            const isPast = cell < today && !isToday
            const isOtherMonth = cell.getMonth() !== currentMonth.getMonth()

            // Category dots
            const catIds = [...new Set((plan?.blocks || []).map(b => b.category))].slice(0, 3)

            return (
              <button key={dateKey(cell)}
                onClick={() => setSelectedDay(isSelected ? null : cell)}
                className={\`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all relative \${
                  isSelected ? 'ring-2 ring-indigo-400 bg-indigo-50' :
                  isToday ? 'ring-2 ring-indigo-500 bg-indigo-50' :
                  pct >= 100 ? 'bg-emerald-50 ring-1 ring-emerald-200' :
                  'hover:bg-slate-50'
                } \${isOtherMonth || isPast ? 'opacity-40' : ''}\`}
              >
                <span className={\`\${isToday ? 'text-indigo-600 font-bold' : 'text-slate-700'}\`}>{cell.getDate()}</span>
                {catIds.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {catIds.map(catId => {
                      const cat = getCatInfo(catId)
                      return <span key={catId} className={\`w-1 h-1 rounded-full \${cat.dot}\`} />
                    })}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-700 capitalize">
              {selectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
          </div>
          {selectedPlan?.blocks?.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {selectedPlan.blocks.map(block => {
                const cat = getCatInfo(block.category)
                const isDone = selectedPlan.completed?.[block.uid]
                return (
                  <div key={block.uid} className={\`flex items-center gap-3 px-4 py-3 \${isDone ? 'opacity-50' : ''}\`}>
                    <div className={\`w-2 h-2 rounded-full flex-shrink-0 \${cat.dot}\`} />
                    <span className="text-base leading-none">{block.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={\`text-sm font-semibold \${isDone ? 'line-through text-slate-400' : 'text-slate-800'}\`}>{block.title}</p>
                      <p className="text-xs text-slate-400">{block.startTime} – {block.endTime}</p>
                    </div>
                    {isDone && <span className="text-emerald-500">✓</span>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-slate-400">Nenhum bloco planejado</p>
            </div>
          )}
        </div>
      )}

      {/* Monthly goals */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metas do mês</p>
        </div>
        {monthGoals.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-sm text-slate-400">Nenhuma meta para este mês</p>
          </div>
        ) : (
          <div className="space-y-3">
            {monthGoals.map(goal => {
              const pct = goalProgress(goal)
              return (
                <div key={goal.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-800">{goal.title}</p>
                    <span className="text-xs font-bold" style={{ color: goal.color }}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: \`\${pct}%\`, backgroundColor: goal.color }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{goal.currentValue} / {goal.targetValue} {goal.unit}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
`);

// ─────────────────────────────────────────────
// components/metas/GoalsView.js  (updated with milestones)
// ─────────────────────────────────────────────
write('components/metas/GoalsView.js', `'use client'

import { useState, useEffect } from 'react'
import { loadGoals, addGoal, removeGoal, updateGoalValue, getGoalCat, goalProgress, goalStatus } from '@/lib/goals'
import AddGoalModal from './AddGoalModal'

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

  const periodLabel = goal.period === 'mensal' ? 'Mensal' : goal.period === 'trimestral' ? 'Trimestral' : 'Anual'

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: \`\${goal.color}20\` }}>
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-slate-800 leading-tight">{goal.title}</p>
            <button onClick={() => onRemove(goal.id)} className="text-slate-200 hover:text-rose-400 transition-colors text-xs flex-shrink-0">✕</button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={\`text-[10px] font-bold px-1.5 py-0.5 rounded-full \${status.bg} \${status.color}\`}>{status.label}</span>
            <span className="text-[10px] text-slate-400">• {periodLabel}</span>
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
          <span className="font-bold" style={{ color: goal.color }}>{pct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: \`\${pct}%\`, backgroundColor: goal.color }} />
        </div>
      </div>

      {goal.milestones && goal.milestones.length > 0 && (
        <div className="mt-2 space-y-1">
          {goal.milestones.filter(m => m).map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
              {m}
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <div className="flex gap-2 mt-2">
          <input type="number" value={val} onChange={e => setVal(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400"
          />
          <button onClick={handleSave} className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-semibold rounded-xl">OK</button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl">✕</button>
        </div>
      ) : (
        <button onClick={() => { setVal(goal.currentValue); setEditing(true) }}
          className="mt-1 text-xs text-indigo-500 hover:text-indigo-600 font-semibold transition-colors">
          Atualizar progresso
        </button>
      )}
    </div>
  )
}

export default function GoalsView() {
  const [goals, setGoals] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [periodFilter, setPeriodFilter] = useState('all')

  useEffect(() => { setGoals(loadGoals()) }, [])

  const handleAdd = (data) => { setGoals(addGoal(goals, data)) }
  const handleUpdateValue = (id, val) => { setGoals(updateGoalValue(goals, id, val)) }
  const handleRemove = (id) => { setGoals(removeGoal(goals, id)) }

  const filtered = periodFilter === 'all' ? goals : goals.filter(g => g.period === periodFilter)
  const active = filtered.filter(g => g.status !== 'concluida')
  const done = filtered.filter(g => g.status === 'concluida')
  const delayed = filtered.filter(g => goalStatus(g).label === 'Atrasada')

  const grouped = active.reduce((acc, g) => {
    const cat = getGoalCat(g.category)
    if (!acc[cat.id]) acc[cat.id] = { cat, goals: [] }
    acc[cat.id].goals.push(g)
    return acc
  }, {})

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Metas</h1>
          <p className="text-sm text-slate-500">{active.length} ativas · {done.length} concluídas{delayed.length > 0 ? \` · \${delayed.length} atrasadas\` : ''}</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm active:scale-95">
          + Nova meta
        </button>
      </div>

      {/* Summary */}
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
          <p className={\`text-xl font-bold \${delayed.length > 0 ? 'text-rose-500' : 'text-slate-400'}\`}>{delayed.length}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Atrasadas</p>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex gap-1.5 mb-4">
        {[['all', 'Todas'], ['mensal', 'Mensal'], ['trimestral', 'Trimestral'], ['anual', 'Anual']].map(([v, l]) => (
          <button key={v} onClick={() => setPeriodFilter(v)}
            className={\`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all \${
              periodFilter === v ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }\`}>
            {l}
          </button>
        ))}
      </div>

      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-slate-500 font-medium">Nenhuma meta criada</p>
          <p className="text-slate-400 text-sm mt-1">Defina objetivos claros e acompanhe o progresso</p>
          <button onClick={() => setAddOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:bg-indigo-600 transition-colors active:scale-95">
            Criar primeira meta
          </button>
        </div>
      ) : (
        <>
          {Object.values(grouped).map(({ cat, goals: gs }) => (
            <div key={cat.id} className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>{cat.icon}</span> {cat.label}
              </p>
              <div className="space-y-3">
                {gs.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onUpdateValue={handleUpdateValue} onRemove={handleRemove} />
                ))}
              </div>
            </div>
          ))}

          {done.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Concluídas</p>
              <div className="space-y-3">
                {done.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onUpdateValue={handleUpdateValue} onRemove={handleRemove} />
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
`);

// ─────────────────────────────────────────────
// components/metas/AddGoalModal.js  (3-step with milestones)
// ─────────────────────────────────────────────
write('components/metas/AddGoalModal.js', `'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { GOAL_CATEGORIES, UNITS } from '@/lib/goals'

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6']

const defaultForm = () => ({
  title: '',
  category: 'pessoal',
  period: 'mensal',
  targetMonth: new Date().toISOString().slice(0, 7),
  targetValue: '',
  unit: '%',
  color: '#6366f1',
  milestones: ['', '', '', '', ''],
})

export default function AddGoalModal({ open, onClose, onAdd }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(defaultForm())

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }))
  const updateMilestone = (i, val) => {
    const m = [...form.milestones]; m[i] = val; setForm(prev => ({ ...prev, milestones: m }))
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.targetValue) return
    onAdd({ ...form, milestones: form.milestones.filter(m => m.trim()) })
    setForm(defaultForm())
    setStep(1)
    onClose()
  }

  const handleClose = () => { setForm(defaultForm()); setStep(1); onClose() }

  return (
    <Modal open={open} onClose={handleClose} title="Nova meta" fullHeight>
      <div className="p-5">
        {/* Step indicators */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={\`h-1 flex-1 rounded-full transition-all duration-300 \${s <= step ? 'bg-indigo-500' : 'bg-slate-200'}\`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Título e categoria</p>
              <input type="text" value={form.title} onChange={e => update('title', e.target.value)}
                placeholder="Ex: Estudar 40h este mês..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 transition mb-3"
              />
              <div className="flex flex-wrap gap-2">
                {GOAL_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => update('category', cat.id)}
                    className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 \${
                      form.category === cat.id ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }\`}
                    style={form.category === cat.id ? { backgroundColor: cat.color } : {}}
                  >
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cor</p>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => update('color', c)}
                    className={\`w-8 h-8 rounded-full transition-all active:scale-95 \${form.color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}\`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Alvo e período</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor alvo *</label>
                <input type="number" value={form.targetValue} onChange={e => update('targetValue', e.target.value)}
                  placeholder="100"
                  className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 transition"
                />
              </div>
              <div className="w-28">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidade</label>
                <select value={form.unit} onChange={e => update('unit', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 transition">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Período</label>
                <select value={form.period} onChange={e => update('period', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 transition">
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prazo</label>
                <input type="month" value={form.targetMonth} onChange={e => update('targetMonth', e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 transition"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Marcos planejados (opcional)</p>
              <p className="text-xs text-slate-400 mt-1 mb-3">Divida sua meta em até 5 etapas</p>
            </div>
            {form.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">{i + 1}</span>
                <input type="text" value={m} onChange={e => updateMilestone(i, e.target.value)}
                  placeholder={\`Marco \${i + 1} (opcional)...\`}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 transition"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
              Voltar
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)}
              disabled={step === 1 && !form.title.trim()}
              className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors shadow-sm active:scale-95">
              Próximo →
            </button>
          ) : (
            <button onClick={handleSave}
              disabled={!form.title.trim() || !form.targetValue}
              className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors shadow-sm active:scale-95">
              Criar meta
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
`);

// ─────────────────────────────────────────────
// components/finance/FinanceTab.js  (4 sub-tabs: Resumo / Planejamento / Extrato / Análise)
// ─────────────────────────────────────────────
write('components/finance/FinanceTab.js', `'use client'

import { useState, useEffect, useMemo } from 'react'
import SummaryCards from './SummaryCards'
import { MonthlyChart, CategoryPie, DailyChart } from './Charts'
import TxList from './TxList'
import BudgetPlanner from './BudgetPlanner'
import AddTxModal from './AddTxModal'
import {
  loadTransactions, addTx, removeTx,
  calcMonthSummary, calcByCategory, calcLast6Months, calcDailyThisMonth,
  loadFinGoal, saveFinGoal, fmt, getMonthTxs,
} from '@/lib/finance'
import { formatMonth } from '@/lib/date'

const SUB_TABS = [
  { id: 'resumo',       label: 'Resumo' },
  { id: 'planejamento', label: 'Planejamento' },
  { id: 'extrato',      label: 'Extrato' },
  { id: 'analise',      label: 'Análise' },
]

export default function FinanceTab() {
  const [txs, setTxs] = useState([])
  const [finGoal, setFinGoal] = useState(0)
  const [modal, setModal] = useState(false)
  const [view, setView] = useState('resumo')
  const [loaded, setLoaded] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [editGoal, setEditGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  useEffect(() => {
    setTxs(loadTransactions())
    setFinGoal(loadFinGoal())
    setLoaded(true)
  }, [])

  const summary  = useMemo(() => calcMonthSummary(txs, currentMonth), [txs, currentMonth])
  const byCat    = useMemo(() => calcByCategory(txs, currentMonth),   [txs, currentMonth])
  const monthly  = useMemo(() => calcLast6Months(txs),                [txs])
  const daily    = useMemo(() => calcDailyThisMonth(txs, currentMonth), [txs, currentMonth])
  const monthTxs = useMemo(() => getMonthTxs(txs, currentMonth),      [txs, currentMonth])

  const handleAdd = (data) => { setTxs(addTx(txs, data)); setModal(false) }
  const handleRemove = (id) => setTxs(removeTx(txs, id))

  const prevMonth = () => { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d) }
  const nextMonth = () => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d) }

  const goalPct = finGoal > 0 && summary.saldo > 0 ? Math.min(100, Math.round((summary.saldo / finGoal) * 100)) : 0

  if (!loaded) return null

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Finanças</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <button onClick={prevMonth} className="text-slate-400 hover:text-slate-600 transition-colors">‹</button>
            <span className="text-sm text-slate-500 font-medium capitalize">{formatMonth(currentMonth)}</span>
            <button onClick={nextMonth} className="text-slate-400 hover:text-slate-600 transition-colors">›</button>
          </div>
        </div>
        <button onClick={() => setModal(true)}
          className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm active:scale-95">
          + Novo
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={\`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all \${
              view === t.id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }\`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* RESUMO */}
      {view === 'resumo' && (
        <div className="space-y-4 animate-fade-in">
          <SummaryCards summary={summary} txCount={monthTxs.length} />

          {/* Savings goal */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meta de economia</p>
              {editGoal ? (
                <div className="flex gap-1">
                  <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                    placeholder="0"
                    className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                  />
                  <button onClick={() => { const v = parseFloat(goalInput) || 0; setFinGoal(v); saveFinGoal(v); setEditGoal(false) }}
                    className="px-2 py-1 bg-indigo-500 text-white text-xs font-semibold rounded-lg">OK</button>
                </div>
              ) : (
                <button onClick={() => { setGoalInput(finGoal || ''); setEditGoal(true) }}
                  className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold">
                  {finGoal > 0 ? '✏️ Editar' : '+ Definir'}
                </button>
              )}
            </div>
            {finGoal > 0 ? (
              <>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-slate-700">{fmt(summary.saldo > 0 ? summary.saldo : 0)}</span>
                  <span className="text-slate-400">{fmt(finGoal)}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={\`h-full rounded-full transition-all duration-500 \${goalPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}\`}
                    style={{ width: \`\${goalPct}%\` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1.5 text-right font-semibold">{goalPct}%</p>
              </>
            ) : (
              <p className="text-sm text-slate-300 italic">Nenhuma meta definida</p>
            )}
          </div>

          {/* Last transactions */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Últimas movimentações</p>
            <TxList transactions={monthTxs.slice(0, 5)} onRemove={handleRemove} />
            {monthTxs.length > 5 && (
              <button onClick={() => setView('extrato')}
                className="w-full text-xs text-indigo-500 font-semibold py-3 hover:text-indigo-600 transition-colors">
                Ver todas ({monthTxs.length}) →
              </button>
            )}
          </div>
        </div>
      )}

      {/* PLANEJAMENTO (budget) */}
      {view === 'planejamento' && (
        <div className="animate-fade-in">
          <BudgetPlanner byCat={byCat} month={currentMonth} />
        </div>
      )}

      {/* EXTRATO */}
      {view === 'extrato' && (
        <div className="animate-fade-in">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-400 mb-1">Transações</p>
                <p className="font-bold text-slate-800">{monthTxs.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Entradas</p>
                <p className="font-bold text-emerald-600">{fmt(summary.entradas)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Gastos</p>
                <p className="font-bold text-rose-500">{fmt(summary.saidas)}</p>
              </div>
            </div>
          </div>
          <TxList transactions={monthTxs} onRemove={handleRemove} showFilter />
        </div>
      )}

      {/* ANÁLISE */}
      {view === 'analise' && (
        <div className="space-y-4 animate-fade-in">
          <MonthlyChart data={monthly} />
          <CategoryPie data={byCat} />
          <DailyChart data={daily} />
        </div>
      )}

      <AddTxModal open={modal} onClose={() => setModal(false)} onAdd={handleAdd} />
    </div>
  )
}
`);

// ─────────────────────────────────────────────
// components/finance/BudgetPlanner.js  (new — planning-first budget)
// ─────────────────────────────────────────────
write('components/finance/BudgetPlanner.js', `'use client'

import { useState } from 'react'
import { CATEGORIES, fmt, loadBudgets, saveBudgets } from '@/lib/finance'
import { formatMonth } from '@/lib/date'

export default function BudgetPlanner({ byCat, month }) {
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

  const totalPlanned = CATEGORIES.reduce((s, c) => s + (budgets[c.id] || 0), 0)
  const totalSpent = byCat.reduce((s, c) => s + c.total, 0)

  const monthLabel = formatMonth(month)

  return (
    <div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Orçamento de {monthLabel}</p>
        <div className="flex justify-between items-baseline mt-2">
          <div>
            <p className="text-xs text-slate-400">Planejado</p>
            <p className="text-xl font-bold text-slate-800">{fmt(totalPlanned)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Gasto</p>
            <p className={\`text-xl font-bold \${totalSpent > totalPlanned && totalPlanned > 0 ? 'text-rose-500' : 'text-slate-600'}\`}>{fmt(totalSpent)}</p>
          </div>
        </div>
        {totalPlanned > 0 && (
          <>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div className={\`h-full rounded-full transition-all duration-500 \${totalSpent > totalPlanned ? 'bg-rose-500' : 'bg-indigo-500'}\`}
                style={{ width: \`\${Math.min(100, Math.round((totalSpent / totalPlanned) * 100))}%\` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1 text-right">
              {Math.round((totalSpent / totalPlanned) * 100)}% usado
            </p>
          </>
        )}
      </div>

      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Por categoria</p>
      <div className="space-y-3">
        {CATEGORIES.map(cat => {
          const budget = budgets[cat.id] || 0
          const spent = byCat.find(c => c.id === cat.id)?.total || 0
          const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0
          const over = budget > 0 && spent > budget
          const near = budget > 0 && !over && pct >= 80

          return (
            <div key={cat.id}
              className={\`bg-white rounded-2xl p-4 shadow-sm border transition-all \${over ? 'border-rose-200' : 'border-slate-100'}\`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm font-semibold text-slate-700">{cat.label}</span>
                  {over && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">Excedido</span>}
                  {near && <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">Quase</span>}
                </div>
                {editing === cat.id ? (
                  <div className="flex gap-1">
                    <input type="number" value={tempVal} onChange={e => setTempVal(e.target.value)}
                      placeholder="0" autoFocus
                      className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                    />
                    <button onClick={() => handleSaveBudget(cat.id)}
                      className="px-2 py-1 bg-indigo-500 text-white text-xs font-semibold rounded-lg">OK</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={\`text-xs font-semibold \${over ? 'text-rose-500' : 'text-slate-500'}\`}>
                      {fmt(spent)} {budget > 0 ? \`/ \${fmt(budget)}\` : ''}
                    </span>
                    <button onClick={() => { setEditing(cat.id); setTempVal(budget || '') }}
                      className="text-xs text-slate-400 hover:text-indigo-500 transition-colors">✏️</button>
                  </div>
                )}
              </div>
              {budget > 0 ? (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={\`h-full rounded-full transition-all duration-500 \${over ? 'bg-rose-500' : near ? 'bg-amber-400' : 'bg-emerald-500'}\`}
                    style={{ width: \`\${pct}%\` }} />
                </div>
              ) : (
                <button onClick={() => { setEditing(cat.id); setTempVal('') }}
                  className="text-xs text-slate-300 italic hover:text-indigo-400 transition-colors">
                  + Definir orçamento
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
`);

console.log('All files written successfully!');
