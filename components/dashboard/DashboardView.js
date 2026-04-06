'use client'

import { useState, useEffect } from 'react'
import { loadDayPlan, calcProgress } from '@/lib/planner'
import { loadMaterias, loadStudyBlocks, getWeeklyStats, formatMin, getBlocksForDate } from '@/lib/estudos'
import { loadTransactions, calcMonthSummary, calcByCategory, fmt } from '@/lib/finance'
import { loadProjetos, loadTasks, getProjetoStats } from '@/lib/projetos'
import { loadHabits, loadHabitLogs, isHabitDueToday } from '@/lib/habits'
import { loadPlanos, getTodayPlano, loadLogs } from '@/lib/treino'
import { dateKey, startOfWeek, getLast } from '@/lib/date'

const ENERGY_EMOJI = { 1: '😴', 2: '😐', 3: '🙂', 4: '😊', 5: '🔥' }
const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ── Score circular SVG ────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120, stroke = 10 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : score >= 30 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? 'Excelente' : score >= 50 ? 'Bom' : score >= 30 ? 'Regular' : 'Fraco'

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-900">{score}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">score</span>
        </div>
      </div>
      <span className="text-xs font-bold mt-1" style={{ color }}>{label}</span>
    </div>
  )
}

// ── Últimos 7 dias ────────────────────────────────────────────────────────────
function WeekStrip({ weekDays }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Últimos 7 dias</p>
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d, i) => {
          const isToday = d.dk === dateKey(new Date())
          const pct = d.pct
          const bg =
            !d.planned ? 'bg-slate-100' :
            pct >= 80  ? 'bg-emerald-500' :
            pct >= 50  ? 'bg-indigo-400' :
            pct >= 20  ? 'bg-amber-400'  : 'bg-red-400'

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-slate-400 font-semibold">{d.dayName}</span>
              <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold
                ${d.planned ? 'text-white' : 'text-slate-300'} ${bg}
                ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}>
                {d.planned ? (d.energy ? ENERGY_EMOJI[d.energy] : `${pct}%`) : '–'}
              </div>
              {d.planned && (
                <span className="text-[8px] text-slate-400">{pct}%</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Hábitos Heatmap ───────────────────────────────────────────────────────────
function HabitHeatmap({ habits, habitLogs }) {
  const last7 = getLast(7, 'day').map((d) => dateKey(d))
  const dueHabits = habits.filter(isHabitDueToday)
  if (dueHabits.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Hábitos — últimos 7 dias</p>
      <div className="space-y-2.5">
        {dueHabits.map((h) => {
          const done = last7.filter((dk) => (habitLogs[h.id] || []).includes(dk)).length
          return (
            <div key={h.id} className="flex items-center gap-2">
              <span className="text-base w-6 flex-shrink-0">{h.icon}</span>
              <span className="text-xs text-slate-600 font-medium w-20 truncate flex-shrink-0">{h.title}</span>
              <div className="flex gap-1 flex-1">
                {last7.map((dk, i) => {
                  const isDone = (habitLogs[h.id] || []).includes(dk)
                  return (
                    <div
                      key={i}
                      className="flex-1 h-5 rounded"
                      style={{ backgroundColor: isDone ? h.color : '#f1f5f9' }}
                    />
                  )
                })}
              </div>
              <span className="text-[10px] font-bold text-slate-400 w-6 text-right flex-shrink-0">{done}/7</span>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 px-[108px]">
        {getLast(7, 'day').map((d, i) => (
          <span key={i} className="flex-1 text-center text-[8px] text-slate-300 font-medium">
            {DAY_SHORT[d.getDay()]}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Estudos barchart ──────────────────────────────────────────────────────────
function EstudosChart({ materias, studyBlocks }) {
  const last7 = getLast(7, 'day')
  const weekStart = startOfWeek(new Date())
  const stats = getWeeklyStats(studyBlocks, materias, weekStart)
  const totalStudied = stats.reduce((s, x) => s + x.completedMin, 0)
  const totalGoal = stats.reduce((s, x) => s + x.goalMin, 0)

  // Minutes per day (last 7)
  const perDay = last7.map((d) => {
    const dk = dateKey(d)
    const dayBlocks = getBlocksForDate(studyBlocks, dk)
    const mins = dayBlocks.filter(b => b.completed).reduce((s, b) => {
      if (!b.startTime || !b.endTime) return s
      const [sh, sm] = b.startTime.split(':').map(Number)
      const [eh, em] = b.endTime.split(':').map(Number)
      return s + Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
    }, 0)
    return { day: DAY_SHORT[d.getDay()], mins, dk }
  })

  const maxMins = Math.max(...perDay.map(d => d.mins), 1)

  if (materias.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estudos — semana</p>
        <div className="text-right">
          <p className="text-sm font-black text-indigo-600">{formatMin(totalStudied)}</p>
          {totalGoal > 0 && <p className="text-[10px] text-slate-400">meta: {formatMin(totalGoal)}</p>}
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-16 mb-1">
        {perDay.map((d, i) => {
          const isToday = d.dk === dateKey(new Date())
          const h = maxMins > 0 ? (d.mins / maxMins) * 100 : 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex flex-col justify-end" style={{ height: 52 }}>
                <div
                  className={`w-full rounded-t-md transition-all ${isToday ? 'bg-indigo-500' : 'bg-indigo-200'}`}
                  style={{ height: `${Math.max(h, d.mins > 0 ? 8 : 0)}%` }}
                />
              </div>
              {d.mins > 0 && (
                <span className="text-[8px] text-indigo-500 font-bold">{formatMin(d.mins)}</span>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-1">
        {perDay.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-slate-300">{d.day}</span>
        ))}
      </div>

      {/* Per materia */}
      {stats.filter(s => s.goalMin > 0).length > 0 && (
        <div className="mt-3 space-y-2 border-t border-slate-50 pt-3">
          {stats.filter(s => s.goalMin > 0).slice(0, 4).map((s) => (
            <div key={s.materia.id} className="flex items-center gap-2">
              <span className="text-sm w-5">{s.materia.icon}</span>
              <span className="text-xs text-slate-600 truncate flex-1">{s.materia.name}</span>
              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.completedMin >= s.goalMin ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                  style={{ width: `${Math.min(100, s.goalMin ? (s.completedMin / s.goalMin) * 100 : 0)}%` }}
                />
              </div>
              <span className={`text-[10px] font-bold w-16 text-right ${s.completedMin >= s.goalMin ? 'text-emerald-600' : 'text-slate-400'}`}>
                {formatMin(s.completedMin)}/{formatMin(s.goalMin)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Finanças ──────────────────────────────────────────────────────────────────
function FinancasCard({ transactions }) {
  const { entradas, saidas, saldo } = calcMonthSummary(transactions)
  const byCategory = calcByCategory(transactions).slice(0, 5)
  const gastoPct = entradas > 0 ? Math.min(100, (saidas / entradas) * 100) : 0

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Finanças — mês atual</p>

      {/* Saldo grande */}
      <div className={`rounded-2xl p-4 mb-4 ${saldo >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo</p>
        <p className={`text-3xl font-black mt-0.5 ${saldo >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(saldo)}</p>
        <div className="flex gap-4 mt-2">
          <div>
            <p className="text-[10px] text-emerald-600 font-bold">↑ Entrada</p>
            <p className="text-sm font-bold text-emerald-700">{fmt(entradas)}</p>
          </div>
          <div>
            <p className="text-[10px] text-red-500 font-bold">↓ Saída</p>
            <p className="text-sm font-bold text-red-600">{fmt(saidas)}</p>
          </div>
        </div>
      </div>

      {/* Barra gasto vs renda */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500 font-medium">% da renda gasta</span>
          <span className={`font-bold ${gastoPct > 90 ? 'text-red-500' : gastoPct > 70 ? 'text-amber-500' : 'text-emerald-600'}`}>
            {Math.round(gastoPct)}%
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${gastoPct > 90 ? 'bg-red-500' : gastoPct > 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${gastoPct}%` }}
          />
        </div>
      </div>

      {/* Top categorias */}
      {byCategory.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Top gastos por categoria</p>
          <div className="space-y-2">
            {byCategory.map((cat) => {
              const pct = saidas > 0 ? (cat.total / saidas) * 100 : 0
              return (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 w-24 truncate">{cat.label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 w-14 text-right">{fmt(cat.total)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Projetos ──────────────────────────────────────────────────────────────────
function ProjetosCard({ projetos, tasks }) {
  const today = dateKey(new Date())
  const ativos = projetos.filter((p) => p.status === 'ativo')
  const overdue = tasks.filter((t) => t.status !== 'feito' && t.dueDate && t.dueDate < today)
  const urgente = tasks.filter((t) => t.status !== 'feito' && t.priority === 'alta').slice(0, 3)

  if (ativos.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Projetos</p>

      {/* Urgentes */}
      {urgente.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-1.5">⚠️ Alta prioridade</p>
          <div className="space-y-1.5">
            {urgente.map((t) => {
              const proj = projetos.find(p => p.id === t.projetoId)
              const isOverdue = t.dueDate && t.dueDate < today
              return (
                <div key={t.id} className="flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2">
                  <span className="text-sm">{proj?.icon || '🚀'}</span>
                  <span className="text-xs text-slate-700 font-medium flex-1 truncate">{t.title}</span>
                  {isOverdue && <span className="text-[9px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full">vencida</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Projetos com barra */}
      <div className="space-y-3">
        {ativos.slice(0, 5).map((p) => {
          const stats = getProjetoStats(tasks, p.id)
          const overdueCount = tasks.filter(t => t.projetoId === p.id && t.status !== 'feito' && t.dueDate && t.dueDate < today).length
          return (
            <div key={p.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{p.icon}</span>
                  <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">{p.name}</span>
                  {overdueCount > 0 && (
                    <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">{overdueCount} venc.</span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400">{stats.pct}% · {stats.done}/{stats.total}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${stats.pct}%`, backgroundColor: p.color || '#6366f1' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardView() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const dk = dateKey(new Date())
    const plan = loadDayPlan(dk)
    const materias = loadMaterias()
    const studyBlocks = loadStudyBlocks()
    const transactions = loadTransactions()
    const projetos = loadProjetos()
    const tasks = loadTasks()
    const habits = loadHabits()
    const habitLogs = loadHabitLogs()
    const planos = loadPlanos()
    const treinoPlano = getTodayPlano(planos)
    const treinoLogs = loadLogs()

    // Score do dia
    const { pct: blockPct } = plan ? calcProgress(plan.blocks, plan.completed) : { pct: 0 }
    const dueHabits = habits.filter(isHabitDueToday)
    const doneHabits = dueHabits.filter(h => (habitLogs[h.id] || []).includes(dk)).length
    const habitPct = dueHabits.length > 0 ? (doneHabits / dueHabits.length) * 100 : 100
    const treinoDone = treinoPlano && treinoLogs.some(l => l.date === dk && l.planoId === treinoPlano.id)
    const treinoPct = treinoPlano ? (treinoDone ? 100 : 0) : 100
    const score = Math.round(blockPct * 0.5 + habitPct * 0.3 + treinoPct * 0.2)

    // Últimos 7 dias
    const weekDays = getLast(7, 'day').map((d) => {
      const dkk = dateKey(d)
      const p = loadDayPlan(dkk)
      const { pct } = p ? calcProgress(p.blocks, p.completed) : { pct: 0 }
      return {
        dk: dkk,
        dayName: DAY_SHORT[d.getDay()],
        planned: !!p?.planned,
        pct,
        energy: p?.energy || null,
      }
    })

    setData({ plan, materias, studyBlocks, transactions, projetos, tasks, habits, habitLogs, treinoPlano, treinoLogs, score, weekDays })
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-indigo-500 text-sm font-semibold animate-pulse">Carregando dashboard...</div>
      </div>
    )
  }

  const { plan, materias, studyBlocks, transactions, projetos, tasks, habits, habitLogs, treinoPlano, treinoLogs, score, weekDays } = data
  const dk = dateKey(new Date())
  const { count, total, pct } = plan ? calcProgress(plan.blocks, plan.completed) : { count: 0, total: 0, pct: 0 }
  const dueHabits = habits.filter(isHabitDueToday)
  const doneHabits = dueHabits.filter(h => (habitLogs[h.id] || []).includes(dk)).length
  const treinoDone = treinoPlano && treinoLogs.some(l => l.date === dk && l.planoId === treinoPlano.id)
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="mb-5">
        <p className="text-slate-500 text-sm">{greeting}, Luis 👋</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
      </div>

      {/* Score + resumo do dia */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
        <div className="flex items-center gap-5">
          <ScoreRing score={score} />
          <div className="flex-1 space-y-2.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">📅 Agenda</span>
                <span className="font-bold text-slate-700">{count}/{total}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
            {dueHabits.length > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">🌱 Hábitos</span>
                  <span className="font-bold text-slate-700">{doneHabits}/{dueHabits.length}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(doneHabits / dueHabits.length) * 100}%` }} />
                </div>
              </div>
            )}
            {treinoPlano && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">💪 Treino</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${treinoDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {treinoDone ? '✓ Feito' : 'Pendente'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Semana strip */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
        <WeekStrip weekDays={weekDays} />
      </div>

      {/* Hábitos heatmap */}
      <div className="mb-4">
        <HabitHeatmap habits={habits} habitLogs={habitLogs} />
      </div>

      {/* Estudos */}
      <div className="mb-4">
        <EstudosChart materias={materias} studyBlocks={studyBlocks} />
      </div>

      {/* Finanças */}
      <div className="mb-4">
        <FinancasCard transactions={transactions} />
      </div>

      {/* Projetos */}
      <ProjetosCard projetos={projetos} tasks={tasks} />
    </div>
  )
}
