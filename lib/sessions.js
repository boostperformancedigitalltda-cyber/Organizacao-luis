import { get, set, KEYS } from './storage'
import { dateKey, isSameMonth } from './date'

export function loadSessions() {
  return get(KEYS.sessions, [])
}

export function addSession(sessions, { type, duration, subject, note, date }) {
  const s = {
    id: Date.now().toString(),
    type,
    duration: parseInt(duration) || 0,
    subject: subject || '',
    note: note || '',
    date: date || new Date().toISOString(),
  }
  const updated = [s, ...sessions]
  set(KEYS.sessions, updated)
  return updated
}

export function removeSession(sessions, id) {
  const updated = sessions.filter((s) => s.id !== id)
  set(KEYS.sessions, updated)
  return updated
}

export function getStudySessions(sessions) {
  return sessions.filter((s) => s.type === 'estudo')
}

export function getTrainingSessions(sessions) {
  return sessions.filter((s) => s.type === 'treino')
}

export function getMonthSessions(sessions, date = new Date()) {
  return sessions.filter((s) => isSameMonth(new Date(s.date), date))
}

export function getTotalMinutes(sessions) {
  return sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
}

export function formatDuration(minutes) {
  if (!minutes) return '0min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export function groupByDay(sessions, days) {
  return days.map((day) => {
    const dk = dateKey(day)
    const daySessions = sessions.filter((s) => s.date.startsWith(dk))
    return {
      date: dk,
      label: day.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      estudo: daySessions.filter((s) => s.type === 'estudo').reduce((sum, s) => sum + s.duration, 0),
      treino: daySessions.filter((s) => s.type === 'treino').reduce((sum, s) => sum + s.duration, 0),
    }
  })
}
