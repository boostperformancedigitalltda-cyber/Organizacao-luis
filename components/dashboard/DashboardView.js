'use client'

import { useState, useEffect } from 'react'
import { loadDayPlan, calcProgress, timeToMinutes } from '@/lib/planner'
import { loadMaterias, loadStudyBlocks, getWeeklyStats, formatMin } from '@/lib/estudos'
import { loadTransactions, calcMonthSummary, fmt } from '@/lib/finance'
import { loadProjetos, loadTasks, getProjetoStats } from '@/lib/projetos'
import { loadHabits, loadHabitLogs, isHabitDueToday } from '@/lib/habits'
import { loadPlanos, getTodayPlano, loadLogs } from '@/lib/treino'
import { dateKey } from '@/lib/date'

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{children}</p>
}

function ProgressBar({ pct, color = 'bg-indigo-500' }) {
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )
}

// ── Hoje ─────────────────────────────────────────────────────────────────────
function HojeCard({ plan, habits, habitLogs, treinoPlano, treinoLogs }) {
  const dk = dateKey(new Date())
  const { count, total, pct } = plan ? calcProgress(plan.blocks, plan.completed) : { count: 0, total: 0, pct: 0 }

  const dueHabits = habits.filter(isHabitDueToday)
  const doneHabits = dueHabits.filter((h) => (habitLogs[h.id] || []).includes(dk)).length

  const treinoDone = treinoPlano && treinoLogs.some((l) => l.date === dk && l.planoId === treinoPlano.id)

  return (
    <Card>
      <SectionTitle>Hoje</SectionTitle>
      <div className="space-y-3">
        {/* Blocos */}
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 font-medium">📅 Agenda</span>
            <span className="font-bold text-indigo-600">{count}/{total} blocos</span>
          </div>
          <ProgressBar pct={pct} color="bg-indigo-500" />
        </div>

        {/* Hábitos */}
        {dueHabits.length > 0 && (
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 font-medium">🌱 Hábitos</span>
              <span className={`font-bold ${doneHabits === dueHabits.length ? 'text-emerald-600' : 'text-amber-600'}`}>
                {doneHabits}/{dueHabits.length}
              </span>
            </div>
            <ProgressBar pct={(doneHabits / dueHabits.length) * 100} color="bg-emerald-500" />
          </div>
        )}

        {/* Treino */}
        {treinoPlano && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 font-medium">💪 {treinoPlano.name}</span>
            {treinoDone
              ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">✓ Feito</span>
              : <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">Pendente</span>
            }
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Estudos ───────────────────────────────────────────────────────────────────
function EstudosCard({ materias, studyBlocks }) {
  const weekStart = (() => {
    const d = new Date()
    const dow = d.getDay()
    const diff = dow === 0 ? -6 : 1 - dow
    d.setDate(d.getDate() + diff)
    return d
  })()

  const stats = getWeeklyStats(studyBlocks, materias, weekStart)
  const withGoal = stats.filter((s) => s.goalMin > 0)
  const totalStudied = stats.reduce((sum, s) => sum + s.completedMin, 0)

  if (materias.length === 0) return null

  return (
    <Card>
      <SectionTitle>Estudos — semana</SectionTitle>
      {withGoal.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma sessão registrada ainda.</p>
      ) : (
        <div className="space-y-3">
          {withGoal.slice(0, 4).map((s) => (
            <div key={s.materia.id}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700 font-medium">{s.materia.icon} {s.materia.name}</span>
                <span className={`font-bold text-xs ${s.completedMin >= s.goalMin ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {formatMin(s.completedMin)} / {formatMin(s.goalMin)}
                </span>
              </div>
              <ProgressBar
                pct={s.goalMin ? (s.completedMin / s.goalMin) * 100 : 0}
                color={s.completedMin >= s.goalMin ? 'bg-emerald-500' : 'bg-indigo-400'}
              />
            </div>
          ))}
          <p className="text-xs text-slate-400 mt-1">Total: {formatMin(totalStudied)} estudados</p>
        </div>
      )}
    </Card>
  )
}

// ── Finanças ──────────────────────────────────────────────────────────────────
function FinancasCard({ transactions }) {
  const { entradas, saidas, saldo } = calcMonthSummary(transactions)
  const gastoPct = entradas > 0 ? (saidas / entradas) * 100 : 0

  return (
    <Card>
      <SectionTitle>Finanças — mês atual</SectionTitle>
      <div className="flex gap-3 mb-3">
        <div className="flex-1 bg-emerald-50 rounded-xl p-3">
          <p className="text-[10px] font-bold text-emerald-600 uppercase">Entradas</p>
          <p className="text-sm font-bold text-emerald-700 mt-0.5">{fmt(entradas)}</p>
        </div>
        <div className="flex-1 bg-red-50 rounded-xl p-3">
          <p className="text-[10px] font-bold text-red-500 uppercase">Saídas</p>
          <p className="text-sm font-bold text-red-600 mt-0.5">{fmt(saidas)}</p>
        </div>
      </div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-500 font-medium">Saldo</span>
        <span className={`font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(saldo)}</span>
      </div>
      <ProgressBar pct={gastoPct} color={gastoPct > 90 ? 'bg-red-500' : gastoPct > 70 ? 'bg-amber-400' : 'bg-emerald-500'} />
      <p className="text-[10px] text-slate-400 mt-1">{Math.round(gastoPct)}% da renda gasto</p>
    </Card>
  )
}

// ── Projetos ──────────────────────────────────────────────────────────────────
function ProjetosCard({ projetos, tasks }) {
  const today = new Date().toISOString().slice(0, 10)
  const ativos = projetos.filter((p) => p.status === 'ativo')
  const overdue = tasks.filter((t) => t.status !== 'feito' && t.dueDate && t.dueDate < today)

  if (ativos.length === 0) return null

  return (
    <Card>
      <SectionTitle>Projetos ativos</SectionTitle>

      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <p className="text-xs font-bold text-red-600">{overdue.length} tarefa{overdue.length > 1 ? 's' : ''} vencida{overdue.length > 1 ? 's' : ''}</p>
        </div>
      )}

      <div className="space-y-3">
        {ativos.slice(0, 4).map((p) => {
          const stats = getProjetoStats(tasks, p.id)
          return (
            <div key={p.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 font-medium flex items-center gap-1.5">
                  <span>{p.icon}</span> {p.name}
                </span>
                <span className="text-xs font-bold text-slate-500">{stats.done}/{stats.total}</span>
              </div>
              <ProgressBar pct={stats.pct} color="bg-violet-500" />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardView() {
  const [plan, setPlan] = useState(null)
  const [materias, setMaterias] = useState([])
  const [studyBlocks, setStudyBlocks] = useState([])
  const [transactions, setTransactions] = useState([])
  const [projetos, setProjetos] = useState([])
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState({})
  const [treinoPlano, setTreinoPlano] = useState(null)
  const [treinoLogs, setTreinoLogs] = useState([])

  useEffect(() => {
    const dk = dateKey(new Date())
    setPlan(loadDayPlan(dk))
    setMaterias(loadMaterias())
    setStudyBlocks(loadStudyBlocks())
    setTransactions(loadTransactions())
    setProjetos(loadProjetos())
    setTasks(loadTasks())
    setHabits(loadHabits())
    setHabitLogs(loadHabitLogs())
    const planos = loadPlanos()
    setTreinoPlano(getTodayPlano(planos))
    setTreinoLogs(loadLogs())
  }, [])

  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="pb-4">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 capitalize">{dateStr}</p>
      </div>

      <div className="space-y-4">
        <HojeCard
          plan={plan}
          habits={habits}
          habitLogs={habitLogs}
          treinoPlano={treinoPlano}
          treinoLogs={treinoLogs}
        />
        <EstudosCard materias={materias} studyBlocks={studyBlocks} />
        <FinancasCard transactions={transactions} />
        <ProjetosCard projetos={projetos} tasks={tasks} />
      </div>
    </div>
  )
}
