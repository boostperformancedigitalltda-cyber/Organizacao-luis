'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  loadSessions, getStudySessions, getTrainingSessions,
  getMonthSessions, getTotalMinutes, formatDuration, groupByDay,
} from '@/lib/sessions'
import { getLast, dateKey } from '@/lib/date'
import { loadCompleted, loadPlan, calcProgress } from '@/lib/planner'

function StatCard({ label, value, sub, accent = 'brand' }) {
  const colors = {
    brand:   'bg-brand-50 border-brand-100 text-brand-600',
    green:   'bg-emerald-50 border-emerald-100 text-emerald-600',
    orange:  'bg-orange-50 border-orange-100 text-orange-600',
    purple:  'bg-purple-50 border-purple-100 text-purple-600',
  }
  return (
    <div className={`rounded-2xl border p-4 ${colors[accent]}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function ProgressTab({ streak }) {
  const [sessions, setSessions] = useState([])
  const [weekData, setWeekData]  = useState([])
  const [loaded,   setLoaded]    = useState(false)

  useEffect(() => {
    const s = loadSessions()
    setSessions(s)

    // Build last 7 days task completion
    const days = getLast(7)
    const wd = days.map((d) => {
      const dk = dateKey(d)
      const plan = loadPlan(dk)
      const done = loadCompleted(dk)
      const { pct } = calcProgress(plan || [], done)
      return {
        label: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        pct,
        isToday: dk === dateKey(new Date()),
      }
    })
    setWeekData(wd)
    setLoaded(true)
  }, [])

  const monthStudy    = useMemo(() => getMonthSessions(getStudySessions(sessions)),   [sessions])
  const monthTraining = useMemo(() => getMonthSessions(getTrainingSessions(sessions)), [sessions])
  const studyMins     = getTotalMinutes(monthStudy)
  const trainMins     = getTotalMinutes(monthTraining)

  const last7 = getLast(7)
  const activityData = useMemo(() => groupByDay(sessions, last7), [sessions])

  if (!loaded) return null

  return (
    <div className="animate-slideUp space-y-4 pb-4">
      <div>
        <p className="text-xs font-bold text-brand-500 uppercase tracking-widest">Visão geral</p>
        <h1 className="text-2xl font-bold text-ink mt-0.5">Progresso</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Streak" value={`${streak} dias`} sub={streak < 7 ? 'Continue!' : 'Incrível 🔥'} accent="orange" />
        <StatCard label="Dias 100%" value={weekData.filter(d => d.pct === 100).length} sub="nos últimos 7 dias" accent="green" />
        <StatCard label="Estudo (mês)" value={formatDuration(studyMins)} sub={`${monthStudy.length} sessões`} accent="brand" />
        <StatCard label="Treino (mês)" value={formatDuration(trainMins)} sub={`${monthTraining.length} sessões`} accent="purple" />
      </div>

      {/* 7-day task completion */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-4">
        <p className="text-sm font-bold text-ink mb-4">Conclusão dos últimos 7 dias</p>
        <div className="space-y-2.5">
          {weekData.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <p className={`w-8 text-xs font-bold text-right ${d.isToday ? 'text-brand-500' : 'text-ink-subtle'}`}>
                {d.label}
              </p>
              <div className="flex-1 h-2.5 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    d.pct === 100 ? 'bg-emerald-500' : d.pct > 0 ? 'bg-brand-400' : ''
                  }`}
                  style={{ width: `${d.pct}%` }}
                />
              </div>
              <p className="w-10 text-right text-xs font-semibold text-ink-subtle">
                {d.pct === 100 ? '✓' : d.pct > 0 ? `${d.pct}%` : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity: estudo + treino */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-4">
        <p className="text-sm font-bold text-ink mb-4">Atividade (min) – últimos 7 dias</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={activityData} barSize={10} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
            <Tooltip
              formatter={(v, name) => [`${v} min`, name === 'estudo' ? 'Estudo' : 'Treino']}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Bar dataKey="estudo" fill="#3b82f6" radius={[4,4,0,0]} />
            <Bar dataKey="treino" fill="#10b981" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-2">
          <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Estudo
          </span>
          <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Treino
          </span>
        </div>
      </div>

      {/* Session history */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-4">
        <p className="text-sm font-bold text-ink mb-3">Sessões recentes</p>
        {sessions.length === 0 ? (
          <p className="text-sm text-ink-subtle text-center py-4">Nenhuma sessão registrada ainda</p>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-surface-100 last:border-0">
                <span className="text-lg">{s.type === 'estudo' ? '📚' : '💪'}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{s.subject}</p>
                  {s.note && <p className="text-xs text-ink-subtle">{s.note}</p>}
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${s.type === 'estudo' ? 'text-brand-600' : 'text-emerald-600'}`}>
                    {formatDuration(s.duration)}
                  </p>
                  <p className="text-xs text-ink-subtle">
                    {new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Motivational */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">Lembrete</p>
        <p className="text-sm text-brand-800 font-medium leading-relaxed">
          {streak === 0
            ? 'Cada dia é uma nova oportunidade. Comece hoje.'
            : streak < 7
            ? `${streak} dias consecutivos. Não quebre a corrente.`
            : streak < 30
            ? `${streak} dias. Você está construindo algo real. Continue.`
            : `${streak} dias de execução. Isso é excelência.`}
        </p>
      </div>
    </div>
  )
}
