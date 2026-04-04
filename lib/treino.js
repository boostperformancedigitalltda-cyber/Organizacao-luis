import { get, set } from './storage'

const KEYS = {
  planos:  'sdv2-treino-planos',
  logs:    'sdv2-treino-logs',
}

export const DAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
export const DAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// ── Planos ────────────────────────────────────────────────────────────────────

export function loadPlanos() {
  return get(KEYS.planos, [])
}

export function savePlanos(planos) {
  set(KEYS.planos, planos)
}

export function addPlano(planos, { dayOfWeek, name, exercises }) {
  // Remove existing plano for same day
  const filtered = planos.filter((p) => p.dayOfWeek !== dayOfWeek)
  const p = {
    id: Date.now().toString(),
    dayOfWeek,
    name: name || DAY_NAMES[dayOfWeek],
    exercises: exercises || [],
  }
  const updated = [...filtered, p].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
  savePlanos(updated)
  return updated
}

export function updatePlano(planos, id, data) {
  const updated = planos.map((p) => p.id === id ? { ...p, ...data } : p)
  savePlanos(updated)
  return updated
}

export function removePlano(planos, id) {
  const updated = planos.filter((p) => p.id !== id)
  savePlanos(updated)
  return updated
}

export function duplicatePlano(planos, id, targetDay) {
  const source = planos.find((p) => p.id === id)
  if (!source) return planos
  const exercises = source.exercises.map((ex) => ({ ...ex, id: Date.now().toString() + Math.random() }))
  return addPlano(planos, { dayOfWeek: targetDay, name: source.name, exercises })
}

export function addExercise(planos, planoId, ex) {
  const updated = planos.map((p) => {
    if (p.id !== planoId) return p
    const exercise = {
      id: Date.now().toString(),
      name: ex.name || '',
      sets: ex.sets || 3,
      reps: ex.reps || '10-12',
      weight: ex.weight || '',
      rest: ex.rest || '60s',
      note: ex.note || '',
    }
    return { ...p, exercises: [...(p.exercises || []), exercise] }
  })
  savePlanos(updated)
  return updated
}

export function updateExercise(planos, planoId, exId, data) {
  const updated = planos.map((p) => {
    if (p.id !== planoId) return p
    return { ...p, exercises: p.exercises.map((e) => e.id === exId ? { ...e, ...data } : e) }
  })
  savePlanos(updated)
  return updated
}

export function removeExercise(planos, planoId, exId) {
  const updated = planos.map((p) => {
    if (p.id !== planoId) return p
    return { ...p, exercises: p.exercises.filter((e) => e.id !== exId) }
  })
  savePlanos(updated)
  return updated
}

export function reorderExercises(planos, planoId, from, to) {
  const updated = planos.map((p) => {
    if (p.id !== planoId) return p
    const exs = [...p.exercises]
    const [item] = exs.splice(from, 1)
    exs.splice(to, 0, item)
    return { ...p, exercises: exs }
  })
  savePlanos(updated)
  return updated
}

// ── Logs (completed sessions) ─────────────────────────────────────────────────

export function loadLogs() {
  return get(KEYS.logs, [])
}

export function addLog(logs, { planoId, date, exercises, duration, note }) {
  const log = {
    id: Date.now().toString(),
    planoId,
    date: date || new Date().toISOString().slice(0, 10),
    exercises: exercises || [],
    duration: parseInt(duration) || 0,
    note: note || '',
    completedAt: new Date().toISOString(),
  }
  const updated = [log, ...logs]
  set(KEYS.logs, updated)
  return updated
}

export function removeLog(logs, id) {
  const updated = logs.filter((l) => l.id !== id)
  set(KEYS.logs, updated)
  return updated
}

// ── Utils ─────────────────────────────────────────────────────────────────────

export function getTodayPlano(planos) {
  const dow = new Date().getDay() // 0=Sun
  // Convert Sun=0 to Mon=0 index
  const idx = dow === 0 ? 6 : dow - 1
  return planos.find((p) => p.dayOfWeek === idx) || null
}

export function getLogsForDate(logs, dk) {
  return logs.filter((l) => l.date === dk)
}

export function getWeeklyVolume(logs, weekStart) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
  return logs.filter((l) => days.includes(l.date))
}
