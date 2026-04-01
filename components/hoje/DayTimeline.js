'use client'

import { useState, useEffect } from 'react'
import { getCatInfo, calcProgress, getCurrentBlock, getNextBlock, blockDuration } from '@/lib/planner'
import AddBlockModal from './AddBlockModal'

const ENERGY_EMOJI = { 1: '😴', 2: '😐', 3: '🙂', 4: '😊', 5: '🔥' }

export default function DayTimeline({ plan, onToggle, onAddBlock, onReset }) {
  const { date, energy, priorities, blocks, completed } = plan
  const [now, setNow] = useState(new Date())
  const [addOpen, setAddOpen] = useState(false)
  const [editBlock, setEditBlock] = useState(null)

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

          return (
            <div
              key={block.uid}
              className={`relative bg-white rounded-2xl border transition-all duration-200 ${
                isNow  ? 'border-indigo-300 shadow-md ring-2 ring-indigo-100' :
                isDone ? 'border-slate-100 opacity-60' :
                         'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
              }`}
            >
              {isNow && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
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
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400 font-medium">{block.startTime} – {block.endTime}</span>
                    {dur > 0 && <span className="text-xs text-slate-300">• {dur}min</span>}
                    {block.note && <span className="text-xs text-slate-400 truncate">• {block.note}</span>}
                  </div>
                </div>

                <button
                  onClick={() => setEditBlock(block)}
                  className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-50"
                >
                  ✏️
                </button>
              </div>
            </div>
          )
        })}
      </div>

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
