'use client'

import { useState, useEffect } from 'react'
import { saveReview, getCurrentWeekStart, formatWeekLabel } from '@/lib/weeklyreview'
import { loadDayPlan, calcProgress } from '@/lib/planner'
import { loadStudyBlocks, getWeeklyStats, formatMin, loadMaterias } from '@/lib/estudos'
import { loadHabits, loadHabitLogs, isHabitDueToday } from '@/lib/habits'
import { startOfWeek, getLast, dateKey } from '@/lib/date'

const RATING_AREAS = [
  { id: 'estudo',   label: 'Estudos',      icon: '📚' },
  { id: 'treino',   label: 'Treino',       icon: '💪' },
  { id: 'projetos', label: 'Projetos',     icon: '🚀' },
  { id: 'saude',    label: 'Saúde/Sono',  icon: '😴' },
]

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`text-2xl transition-transform hover:scale-110 ${n <= value ? 'grayscale-0' : 'grayscale opacity-30'}`}
        >
          ⭐
        </button>
      ))}
    </div>
  )
}

function WeekStats() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const last7 = getLast(7, 'day')
    const weekDates = last7.map(d => dateKey(d))

    // Day completion
    let plansPlanned = 0, plansCompleted = 0, totalPct = 0
    weekDates.forEach(dk => {
      const plan = loadDayPlan(dk)
      if (!plan?.planned) return
      plansPlanned++
      const { pct } = calcProgress(plan.blocks, plan.completed)
      totalPct += pct
      if (pct >= 80) plansCompleted++
    })
    const avgPct = plansPlanned > 0 ? Math.round(totalPct / plansPlanned) : 0

    // Study hours
    const blocks = loadStudyBlocks()
    const weekStart = startOfWeek(new Date())
    const materias = loadMaterias()
    const weekStats = getWeeklyStats(blocks, materias, weekStart)
    const studyMin = weekStats.reduce((s, x) => s + x.completedMin, 0)

    // Habits
    const habits = loadHabits()
    const habitLogs = loadHabitLogs()
    const dueHabits = habits.filter(isHabitDueToday)
    let habitsDone = 0, habitsTotal = 0
    weekDates.forEach(dk => {
      dueHabits.forEach(h => {
        habitsTotal++
        if ((habitLogs[h.id] || []).includes(dk)) habitsDone++
      })
    })
    const habitPct = habitsTotal > 0 ? Math.round((habitsDone / habitsTotal) * 100) : null

    setStats({ avgPct, studyMin, habitPct, plansPlanned })
  }, [])

  if (!stats || stats.plansPlanned === 0) return null

  return (
    <div className="grid grid-cols-3 gap-2 mb-5">
      <div className="bg-indigo-50 rounded-2xl p-3 text-center">
        <p className="text-xl font-black text-indigo-600">{stats.avgPct}%</p>
        <p className="text-[10px] text-indigo-400 font-bold mt-0.5">agenda cumprida</p>
      </div>
      {stats.studyMin > 0 && (
        <div className="bg-violet-50 rounded-2xl p-3 text-center">
          <p className="text-xl font-black text-violet-600">{formatMin(stats.studyMin)}</p>
          <p className="text-[10px] text-violet-400 font-bold mt-0.5">estudo</p>
        </div>
      )}
      {stats.habitPct !== null && (
        <div className="bg-emerald-50 rounded-2xl p-3 text-center">
          <p className="text-xl font-black text-emerald-600">{stats.habitPct}%</p>
          <p className="text-[10px] text-emerald-400 font-bold mt-0.5">hábitos</p>
        </div>
      )}
    </div>
  )
}

export default function WeeklyReview({ reviews, setReviews, onClose }) {
  const weekStart = getCurrentWeekStart()
  const weekLabel = formatWeekLabel(weekStart)

  const [step, setStep] = useState(0)
  const [ratings, setRatings] = useState({ estudo: 0, treino: 0, projetos: 0, saude: 0 })
  const [wins, setWins] = useState('')
  const [improvements, setImprovements] = useState('')
  const [nextWeekFocus, setNextWeekFocus] = useState('')

  const STEPS = [
    { label: 'Avaliação',     icon: '⭐' },
    { label: 'Vitórias',      icon: '🏆' },
    { label: 'Melhorias',     icon: '🔧' },
    { label: 'Próxima semana',icon: '🎯' },
  ]

  function handleSave() {
    setReviews(saveReview(reviews, { weekStart, wins, improvements, nextWeekFocus, ratings }))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-2xl shadow-2xl animate-slideUp" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 pt-5 pb-4 rounded-t-2xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-extrabold text-slate-800 text-xl">Review Semanal</h2>
              <p className="text-xs text-slate-400 mt-0.5">{weekLabel}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 text-2xl leading-none">&times;</button>
          </div>
          {/* Step indicator */}
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  i === step ? 'bg-indigo-600 text-white' :
                  i < step   ? 'bg-emerald-100 text-emerald-600' :
                               'bg-slate-100 text-slate-400'
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-5 pb-8">
          {/* Step 0: Ratings */}
          {step === 0 && (
            <div>
              <WeekStats />
              <p className="text-slate-600 text-sm mb-4">Como foi essa semana em cada área?</p>
              <div className="space-y-4">
                {RATING_AREAS.map((area) => (
                  <div key={area.id} className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{area.icon}</span>
                      <span className="font-bold text-slate-700 text-sm">{area.label}</span>
                      {ratings[area.id] > 0 && (
                        <span className="ml-auto text-xs font-bold text-indigo-600">{ratings[area.id]}/5</span>
                      )}
                    </div>
                    <StarRating
                      value={ratings[area.id]}
                      onChange={(v) => setRatings((p) => ({ ...p, [area.id]: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Wins */}
          {step === 1 && (
            <div>
              <p className="font-bold text-slate-800 text-lg mb-1">🏆 Vitórias da semana</p>
              <p className="text-slate-500 text-sm mb-4">O que você conseguiu? Mesmo as pequenas conquistas contam.</p>
              <textarea
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="Ex: Estudei anatomia 3x essa semana, fiz 4 treinos, avancei no projeto X..."
                rows={6}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 resize-none"
              />
            </div>
          )}

          {/* Step 2: Improvements */}
          {step === 2 && (
            <div>
              <p className="font-bold text-slate-800 text-lg mb-1">🔧 O que pode melhorar?</p>
              <p className="text-slate-500 text-sm mb-4">Sem julgamento — apenas análise honesta para evoluir.</p>
              <textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Ex: Fui dormir tarde toda semana, não revisei as matérias, procrastinei no projeto Y..."
                rows={6}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 resize-none"
              />
            </div>
          )}

          {/* Step 3: Next week focus */}
          {step === 3 && (
            <div>
              <p className="font-bold text-slate-800 text-lg mb-1">🎯 Foco da próxima semana</p>
              <p className="text-slate-500 text-sm mb-4">1 a 3 intenções claras. O que vai ser diferente?</p>
              <textarea
                value={nextWeekFocus}
                onChange={(e) => setNextWeekFocus(e.target.value)}
                placeholder="Ex: Dormir até meia-noite, estudar fisiologia todo dia, reunião de negócios na quinta..."
                rows={6}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 resize-none"
              />

              {/* Summary preview */}
              <div className="mt-4 bg-indigo-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Resumo da avaliação</p>
                {RATING_AREAS.map((area) => (
                  <div key={area.id} className="flex items-center gap-2">
                    <span className="text-sm">{area.icon}</span>
                    <span className="text-xs text-slate-600 flex-1">{area.label}</span>
                    <span className="text-xs font-bold text-indigo-600">{'⭐'.repeat(ratings[area.id]) || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 border border-slate-200 text-slate-600 font-bold py-3 rounded-2xl"
              >
                ← Voltar
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-2xl"
              >
                Próximo →
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-2xl"
              >
                Concluir review ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
