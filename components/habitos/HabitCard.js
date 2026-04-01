'use client'

import { getStreak, getLast7Days, isDoneToday, isHabitDueToday } from '@/lib/habits'
import { dateKey } from '@/lib/date'

const FREQ_LABELS = { daily: 'Diário', weekdays: 'Dias úteis', weekends: 'Fins de semana' }

export default function HabitCard({ habit, logs, onToggle, onRemove }) {
  const streak = getStreak(logs, habit.id)
  const last7 = getLast7Days(logs, habit.id)
  const doneToday = isDoneToday(logs, habit.id)
  const due = isHabitDueToday(habit)
  const dk = dateKey(new Date())

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
      doneToday ? 'border-emerald-200' : 'border-slate-100'
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${habit.color}20` }}
        >
          {habit.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-slate-800 truncate">{habit.title}</span>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
              {FREQ_LABELS[habit.frequency] || 'Diário'}
            </span>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <p className="text-xs font-semibold text-amber-500 mb-2">🔥 {streak} dias</p>
          )}

          {/* Last 7 days */}
          <div className="flex gap-1">
            {last7.map((d, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                  d.done ? 'text-white text-xs' : 'bg-slate-100'
                }`}
                style={d.done ? { backgroundColor: habit.color } : {}}
                title={d.date}
              >
                {d.done ? '✓' : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => due && onToggle(habit.id, dk)}
            disabled={!due}
            className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${
              doneToday
                ? 'text-white border-transparent text-lg'
                : due
                ? 'border-slate-200 hover:border-indigo-300 text-slate-300 hover:text-indigo-300 hover:bg-indigo-50'
                : 'border-slate-100 text-slate-200 cursor-not-allowed'
            }`}
            style={doneToday ? { backgroundColor: habit.color } : {}}
          >
            {doneToday ? '✓' : due ? '○' : '–'}
          </button>
          <button
            onClick={() => onRemove(habit.id)}
            className="text-[10px] text-slate-200 hover:text-rose-400 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
