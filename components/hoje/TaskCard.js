'use client'

import { useState } from 'react'
import { TASK_CATEGORIES, CATEGORY_COLORS } from '@/lib/planner'
import { formatDuration } from '@/lib/sessions'

export default function TaskCard({ task, completed, onToggle, onLogSession }) {
  const [popping, setPopping] = useState(false)
  const cat = TASK_CATEGORIES.find((c) => c.id === task.category)
  const colors = cat ? CATEGORY_COLORS[cat.color] : CATEGORY_COLORS.purple
  const isStudy   = task.category === 'estudo'
  const isTraining = task.category === 'treino'
  const canLog    = isStudy || isTraining

  const handle = () => {
    if (!completed) { setPopping(true); setTimeout(() => setPopping(false), 280) }
    onToggle(task.uid)
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-card
        ${completed
          ? `${colors.bg} ${colors.border} opacity-70`
          : `bg-white border-surface-200 hover:border-surface-300 hover:shadow-card-md`
        }
        ${popping ? 'task-pop' : ''}
      `}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Check circle */}
        <button
          onClick={handle}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300
            ${completed
              ? `border-transparent bg-${cat?.color || 'blue'}-500`
              : 'border-surface-300 hover:border-brand-400'
            }`}
          style={completed ? { backgroundColor: cat ? `var(--${cat.color}-500, #3b82f6)` : '#3b82f6' } : {}}
        >
          {completed && (
            <svg className="w-3.5 h-3.5 text-white check-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{task.icon}</span>
            <p className={`font-semibold text-sm ${completed ? 'line-through text-ink-subtle' : 'text-ink'}`}>
              {task.label}
            </p>
            {task.category && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
                {cat?.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {task.time && (
              <span className="text-xs text-ink-subtle flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/>
                </svg>
                {task.time}
              </span>
            )}
            {task.duration && (
              <span className="text-xs text-ink-subtle">
                {formatDuration(task.duration)}
              </span>
            )}
            {task.note && (
              <span className="text-xs text-ink-subtle italic truncate max-w-[160px]">{task.note}</span>
            )}
          </div>
        </div>

        {/* Log session button */}
        {canLog && completed && (
          <button
            onClick={() => onLogSession(task)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors
              ${colors.bg} ${colors.text} ${colors.border} hover:opacity-80`}
          >
            Registrar
          </button>
        )}
      </div>
    </div>
  )
}
