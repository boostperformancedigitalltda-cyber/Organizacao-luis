'use client'

import { useState, useEffect, useRef } from 'react'
import { getCatInfo, calcProgress, getCurrentBlock, getNextBlock, blockDuration } from '@/lib/planner'
import AddBlockModal from './AddBlockModal'

const ENERGY_EMOJI = { 1: '😴', 2: '😐', 3: '🙂', 4: '😊', 5: '🔥' }

// ── Focus Timer ───────────────────────────────────────────────────────────────
function FocusTimer({ block, onDone, onCancel }) {
  const DURATIONS = [25, 50]
  const [selectedMin, setSelectedMin] = useState(25)
  const [running, setRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          onDone()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running]) // eslint-disable-line

  function start() {
    setSecondsLeft(selectedMin * 60)
    setRunning(true)
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const pct = running ? ((selectedMin * 60 - secondsLeft) / (selectedMin * 60)) * 100 : 0

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 p-4">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#e0e7ff" strokeWidth="4" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="#6366f1" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-indigo-700">
              {mm}:{ss}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-semibold truncate">{block?.title || 'Foco'}</p>
            {!running ? (
              <div className="flex items-center gap-1 mt-1">
                {DURATIONS.map((d) => (
                  <button key={d} onClick={() => setSelectedMin(d)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${selectedMin === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {d}min
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-indigo-600 font-bold mt-0.5 animate-pulse">Em foco...</p>
            )}
          </div>

          <div className="flex gap-2">
            {!running ? (
              <button onClick={start}
                className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-bold">
                ▶ Iniciar
              </button>
            ) : (
              <button onClick={() => { clearInterval(intervalRef.current); setRunning(false) }}
                className="bg-amber-500 text-white px-3 py-2 rounded-xl text-sm font-bold">
                ⏸
              </button>
            )}
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 px-2 py-2 text-xl">✕</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main DayTimeline ──────────────────────────────────────────────────────────
export default function DayTimeline({ plan, onToggle, onAddBlock, onReset, onNavigate }) {
  const { date, energy, priorities, blocks, completed } = plan
  const [now, setNow] = useState(new Date())
  const [addOpen, setAddOpen] = useState(false)
  const [editBlock, setEditBlock] = useState(null)
  const [focusBlock, setFocusBlock] = useState(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const { count, total, pct } = calcProgress(blocks, completed)
  const currentBlock = getCurrentBlock(blocks)
  const nextBlock    = getNextBlock(blocks, completed)
  const nowMins      = now.getHours() * 60 + now.getMinutes()

  const dateObj = new Date(date)
  const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })
  const dateStr = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 capitalize">{dayName}</h1>
            <p className="text-sm text-slate-500">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{ENERGY_EMOJI[energy] || '🙂'}</span>
            {plan.streak > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1">
                <span className="text-xs font-bold text-amber-600">🔥 {plan.streak}</span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold">{count}/{total} blocos</span>
            <span className="font-bold text-indigo-500">{pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Priorities */}
      {priorities && priorities.some((p) => p) && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Top 3 prioridades</p>
          <div className="space-y-2">
            {priorities.map((p, i) => p ? (
              <label key={i} className="flex items-center gap-3 cursor-pointer group">
                <button
                  onClick={() => onToggle(`priority-${i}`)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    completed[`priority-${i}`] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-indigo-300'
                  }`}
                >
                  {completed[`priority-${i}`] && <span className="text-white text-xs">✓</span>}
                </button>
                <span className={`text-sm font-medium transition-all ${completed[`priority-${i}`] ? 'line-through text-slate-300' : 'text-slate-700'}`}>
                  {p}
                </span>
              </label>
            ) : null)}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Agenda</p>
        {blocks.map((block) => {
          const cat    = getCatInfo(block.category)
          const isDone = !!completed[block.uid]
          const isNow  = currentBlock?.uid === block.uid
          const isNext = nextBlock?.uid === block.uid
          const startMins = parseInt(block.startTime?.split(':')[0] || 0) * 60 + parseInt(block.startTime?.split(':')[1] || 0)
          const isPast = startMins < nowMins && !isNow
          const dur    = blockDuration(block)
          const isFocused = focusBlock?.uid === block.uid

          return (
            <div
              key={block.uid}
              className={`relative bg-white rounded-2xl border transition-all duration-200 ${
                isFocused ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-md' :
                isNow     ? 'border-indigo-300 shadow-md ring-2 ring-indigo-100' :
                isDone    ? 'border-slate-100 opacity-60' :
                            'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
              }`}
            >
              {isNow && !isFocused && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
              {isFocused && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              )}
              <div className="p-3.5 flex items-center gap-3">
                <button
                  onClick={() => onToggle(block.uid)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isDone ? 'bg-emerald-500 border-emerald-500' :
                    isNow  ? 'border-indigo-400 hover:border-indigo-500' :
                             'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {isDone && <span className="text-white text-xs font-bold">✓</span>}
                </button>

                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.dot}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{block.icon}</span>
                    <span className={`text-sm font-semibold truncate ${isDone ? 'line-through text-slate-300' : 'text-slate-800'}`}>
                      {block.title}
                    </span>
                    {isNext && !isDone && (
                      <span className="flex-shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                        PRÓXIMO
                      </span>
                    )}
                    {isFocused && (
                      <span className="flex-shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full animate-pulse">
                        FOCO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400 font-medium">{block.startTime} – {block.endTime}</span>
                    {dur > 0 && <span className="text-xs text-slate-300">• {dur}min</span>}
                    {block.note && <span className="text-xs text-slate-400 truncate">• {block.note}</span>}
                  </div>
                </div>

                <div className="flex gap-1">
                  {/* Focus timer button */}
                  {!isDone && (
                    <button
                      onClick={() => setFocusBlock(isFocused ? null : block)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                        isFocused ? 'bg-indigo-100 text-indigo-600' : 'text-slate-300 hover:text-indigo-400 hover:bg-indigo-50'
                      }`}
                      title="Iniciar timer de foco"
                    >
                      ⏱
                    </button>
                  )}
                  <button
                    onClick={() => setEditBlock(block)}
                    className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-50"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* FAB add block */}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-20 right-4 w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-center text-xl transition-all hover:scale-105 active:scale-95 z-30"
      >
        +
      </button>

      <button
        onClick={onReset}
        className="mt-6 text-xs text-slate-400 hover:text-slate-600 transition-colors underline-offset-2 hover:underline block mx-auto"
      >
        Replanejar dia
      </button>

      {/* Focus Timer overlay */}
      {focusBlock && (
        <FocusTimer
          block={focusBlock}
          onDone={() => {
            onToggle(focusBlock.uid)
            setFocusBlock(null)
          }}
          onCancel={() => setFocusBlock(null)}
        />
      )}

      <AddBlockModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(b) => { onAddBlock(b, false); setAddOpen(false) }}
      />
      {editBlock && (
        <AddBlockModal
          open={!!editBlock}
          onClose={() => setEditBlock(null)}
          onAdd={(b) => { onAddBlock(b, true); setEditBlock(null) }}
          initialBlock={editBlock}
        />
      )}
    </div>
  )
}
