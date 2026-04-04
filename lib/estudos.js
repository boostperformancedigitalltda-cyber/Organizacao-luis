import { get, set } from './storage'

const KEYS = {
  materias:    'sdv2-materias',
  studyBlocks: 'sdv2-study-blocks',
}

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
]

export const DEFAULT_ICONS = ['📚', '📐', '🔬', '💻', '📝', '🧮', '🌍', '🎨', '⚗️', '📖']

export function loadMaterias() {
  return get(KEYS.materias, [])
}

export function saveMaterias(materias) {
  set(KEYS.materias, materias)
}

export function addMateria(materias, { name, icon, color, weeklyGoalHours }) {
  const m = {
    id: Date.now().toString(),
    name: name || 'Nova Matéria',
    icon: icon || '📚',
    color: color || COLORS[materias.length % COLORS.length],
    weeklyGoalHours: parseFloat(weeklyGoalHours) || 2,
    topics: [],
    createdAt: new Date().toISOString(),
  }
  const updated = [...materias, m]
  saveMaterias(updated)
  return updated
}

export function updateMateria(materias, id, data) {
  const updated = materias.map((m) => m.id === id ? { ...m, ...data } : m)
  saveMaterias(updated)
  return updated
}

export function removeMateria(materias, blocks, id) {
  const updatedMaterias = materias.filter((m) => m.id !== id)
  saveMaterias(updatedMaterias)
  const updatedBlocks = blocks.filter((b) => b.materiaId !== id)
  set(KEYS.studyBlocks, updatedBlocks)
  return { materias: updatedMaterias, blocks: updatedBlocks }
}

export function addTopic(materias, materiaId, topicTitle) {
  const updated = materias.map((m) => {
    if (m.id !== materiaId) return m
    const topic = { id: Date.now().toString(), title: topicTitle, status: 'pendente' }
    return { ...m, topics: [...(m.topics || []), topic] }
  })
  saveMaterias(updated)
  return updated
}

export function toggleTopic(materias, materiaId, topicId) {
  const updated = materias.map((m) => {
    if (m.id !== materiaId) return m
    const topics = (m.topics || []).map((t) =>
      t.id === topicId ? { ...t, status: t.status === 'feito' ? 'pendente' : 'feito' } : t
    )
    return { ...m, topics }
  })
  saveMaterias(updated)
  return updated
}

export function setTopicReview(materias, materiaId, topicId, days) {
  const reviewDate = new Date()
  reviewDate.setDate(reviewDate.getDate() + days)
  const updated = materias.map((m) => {
    if (m.id !== materiaId) return m
    const topics = (m.topics || []).map((t) =>
      t.id === topicId ? { ...t, reviewDate: reviewDate.toISOString().slice(0, 10) } : t
    )
    return { ...m, topics }
  })
  saveMaterias(updated)
  return updated
}

export function getTopicsForReviewToday(materias) {
  const today = new Date().toISOString().slice(0, 10)
  const results = []
  materias.forEach((m) => {
    (m.topics || []).forEach((t) => {
      if (t.reviewDate && t.reviewDate <= today && t.status !== 'feito') {
        results.push({ materia: m, topic: t })
      }
    })
  })
  return results
}

export function removeTopic(materias, materiaId, topicId) {
  const updated = materias.map((m) => {
    if (m.id !== materiaId) return m
    return { ...m, topics: (m.topics || []).filter((t) => t.id !== topicId) }
  })
  saveMaterias(updated)
  return updated
}

// Study Blocks (planned sessions for a date)
export function loadStudyBlocks() {
  return get(KEYS.studyBlocks, [])
}

export function getBlocksForDate(blocks, dk) {
  return blocks.filter((b) => b.date === dk)
}

export function addStudyBlock(blocks, { date, materiaId, topic, startTime, endTime, note }) {
  const b = {
    id: Date.now().toString(),
    date,
    materiaId,
    topic: topic || '',
    startTime: startTime || '19:00',
    endTime: endTime || '20:00',
    completed: false,
    note: note || '',
  }
  const updated = [b, ...blocks]
  set(KEYS.studyBlocks, updated)
  return updated
}

export function toggleStudyBlock(blocks, id) {
  const updated = blocks.map((b) => b.id === id ? { ...b, completed: !b.completed } : b)
  set(KEYS.studyBlocks, updated)
  return updated
}

export function updateStudyBlock(blocks, id, data) {
  const updated = blocks.map((b) => b.id === id ? { ...b, ...data } : b)
  set(KEYS.studyBlocks, updated)
  return updated
}

export function removeStudyBlock(blocks, id) {
  const updated = blocks.filter((b) => b.id !== id)
  set(KEYS.studyBlocks, updated)
  return updated
}

// Stats
export function getWeeklyStats(blocks, materias, weekStart) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
  return materias.map((m) => {
    const mBlocks = blocks.filter((b) => b.materiaId === m.id && days.includes(b.date))
    const totalMin = mBlocks.reduce((sum, b) => {
      if (!b.startTime || !b.endTime) return sum
      const [sh, sm] = b.startTime.split(':').map(Number)
      const [eh, em] = b.endTime.split(':').map(Number)
      return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
    }, 0)
    const completedMin = mBlocks.filter((b) => b.completed).reduce((sum, b) => {
      if (!b.startTime || !b.endTime) return sum
      const [sh, sm] = b.startTime.split(':').map(Number)
      const [eh, em] = b.endTime.split(':').map(Number)
      return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
    }, 0)
    return {
      materia: m,
      totalMin,
      completedMin,
      goalMin: (m.weeklyGoalHours || 0) * 60,
      sessions: mBlocks.length,
    }
  })
}

export function formatMin(min) {
  if (!min) return '0min'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}
