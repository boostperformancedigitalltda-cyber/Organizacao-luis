import { get, set } from './storage'

const KEYS = {
  materias:    'sdv2-materias',
  studyBlocks: 'sdv2-study-blocks',
  simulados:   'sdv2-simulados',
}

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
]

export const DEFAULT_ICONS = ['📚', '📐', '🔬', '💻', '📝', '🧮', '🌍', '🎨', '⚗️', '📖', '🫀', '🧠', '💊', '🔪', '👶', '🤱', '🏥', '🦠']

// ── Medicina seed ─────────────────────────────────────────────────────────────

export const MEDICINA_MATERIAS_SEED = [
  { name: 'Clínica Médica',         icon: '🫀', color: '#ef4444', fase: 'clínico',    weeklyGoalHours: 8 },
  { name: 'Cirurgia',               icon: '🔪', color: '#6366f1', fase: 'clínico',    weeklyGoalHours: 6 },
  { name: 'Pediatria',              icon: '👶', color: '#10b981', fase: 'clínico',    weeklyGoalHours: 5 },
  { name: 'Ginecologia e Obstetrícia', icon: '🤱', color: '#ec4899', fase: 'clínico', weeklyGoalHours: 5 },
  { name: 'Psiquiatria',            icon: '🧠', color: '#8b5cf6', fase: 'clínico',    weeklyGoalHours: 3 },
  { name: 'Medicina Preventiva',    icon: '🏥', color: '#06b6d4', fase: 'clínico',    weeklyGoalHours: 3 },
  { name: 'Farmacologia',           icon: '💊', color: '#f59e0b', fase: 'pré-clínico',weeklyGoalHours: 4 },
  { name: 'Patologia',              icon: '🔬', color: '#84cc16', fase: 'pré-clínico',weeklyGoalHours: 4 },
  { name: 'Fisiologia',             icon: '⚗️', color: '#14b8a6', fase: 'pré-clínico',weeklyGoalHours: 4 },
  { name: 'Microbiologia',          icon: '🦠', color: '#a855f7', fase: 'pré-clínico',weeklyGoalHours: 3 },
]

// ── Matérias ──────────────────────────────────────────────────────────────────

export function loadMaterias() {
  return get(KEYS.materias, [])
}

export function saveMaterias(materias) {
  set(KEYS.materias, materias)
}

export function addMateria(materias, { name, icon, color, weeklyGoalHours, fase, metaQuestoes }) {
  const m = {
    id: Date.now().toString(),
    name: name || 'Nova Matéria',
    icon: icon || '📚',
    color: color || COLORS[materias.length % COLORS.length],
    weeklyGoalHours: parseFloat(weeklyGoalHours) || 2,
    fase: fase || '',
    metaQuestoes: parseInt(metaQuestoes) || 0,
    topics: [],
    createdAt: new Date().toISOString(),
  }
  const updated = [...materias, m]
  saveMaterias(updated)
  return updated
}

export function seedMateriasMedicina() {
  const now = Date.now()
  const materias = MEDICINA_MATERIAS_SEED.map((m, i) => ({
    id: `med-seed-${i}`,
    name: m.name,
    icon: m.icon,
    color: m.color,
    weeklyGoalHours: m.weeklyGoalHours,
    fase: m.fase,
    metaQuestoes: 0,
    topics: [],
    createdAt: new Date(now + i).toISOString(),
  }))
  saveMaterias(materias)
  return materias
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
    const topic = { id: Date.now().toString(), title: topicTitle, status: 'pendente', reviewDate: null }
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
      t.id === topicId ? { ...t, reviewDate: reviewDate.toISOString().slice(0, 10), status: 'feito' } : t
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
    ;(m.topics || []).forEach((t) => {
      if (t.reviewDate && t.reviewDate <= today) {
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

// ── Study Blocks ──────────────────────────────────────────────────────────────

export function loadStudyBlocks() {
  return get(KEYS.studyBlocks, [])
}

export function getBlocksForDate(blocks, dk) {
  return blocks.filter((b) => b.date === dk)
}

export function addStudyBlock(blocks, { date, materiaId, topic, startTime, endTime, note, completed }) {
  const b = {
    id: Date.now().toString(),
    date,
    materiaId,
    topic: topic || '',
    startTime: startTime || '19:00',
    endTime: endTime || '20:00',
    completed: completed || false,
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

// ── Simulados ─────────────────────────────────────────────────────────────────

export function loadSimulados() {
  return get(KEYS.simulados, [])
}

export function addSimulado(simulados, { date, materiaId, total, acertos, fonte, nota, questoes }) {
  const tot = parseInt(total) || 0
  const ace = parseInt(acertos) || 0
  const s = {
    id: Date.now().toString(),
    date: date || new Date().toISOString().slice(0, 10),
    materiaId: materiaId || null,
    total: tot,
    acertos: ace,
    fonte: fonte || '',
    nota: nota ? parseFloat(nota) : null,
    aproveitamento: tot > 0 ? Math.round((ace / tot) * 100) : 0,
    questoes: questoes || [], // [{num, resultado: 'certo'|'errado'|'anulada', tema, enunciado}]
    createdAt: new Date().toISOString(),
  }
  const updated = [s, ...simulados]
  set(KEYS.simulados, updated)
  return updated
}

export function removeSimulado(simulados, id) {
  const updated = simulados.filter((s) => s.id !== id)
  set(KEYS.simulados, updated)
  return updated
}

export function getSimuladoStats(simulados, materiaId) {
  const filtered = materiaId ? simulados.filter((s) => s.materiaId === materiaId) : simulados
  if (!filtered.length) return null
  const avg = Math.round(filtered.reduce((s, x) => s + x.aproveitamento, 0) / filtered.length)
  const best = Math.max(...filtered.map((s) => s.aproveitamento))
  const total = filtered.reduce((s, x) => s + x.total, 0)
  const acertos = filtered.reduce((s, x) => s + x.acertos, 0)
  return { avg, best, total, acertos, count: filtered.length }
}

// ── Banco de Erros ────────────────────────────────────────────────────────────

const KEY_ERROS = 'sdv2-banco-erros'

export function loadBancoErros() {
  return get(KEY_ERROS, [])
}

export function saveBancoErros(erros) {
  set(KEY_ERROS, erros)
}

export function addErro(erros, { materiaId, tema, enunciado, gabarito, fonte, simuladoId }) {
  const e = {
    id: Date.now().toString(),
    materiaId: materiaId || null,
    tema: tema || '',
    enunciado: enunciado || '',
    gabarito: gabarito || '',
    fonte: fonte || '',
    simuladoId: simuladoId || null,
    revisoes: 0,
    dominado: false,
    createdAt: new Date().toISOString(),
  }
  const updated = [e, ...erros]
  saveBancoErros(updated)
  return updated
}

export function toggleErroDominado(erros, id) {
  const updated = erros.map((e) => e.id === id ? { ...e, dominado: !e.dominado, revisoes: e.dominado ? e.revisoes : e.revisoes + 1 } : e)
  saveBancoErros(updated)
  return updated
}

export function removeErro(erros, id) {
  const updated = erros.filter((e) => e.id !== id)
  saveBancoErros(updated)
  return updated
}

export function getErroPadroes(erros, materias) {
  // Agrupa erros por matéria e tema para identificar padrões
  const porMateria = {}
  erros.filter((e) => !e.dominado).forEach((e) => {
    const key = e.materiaId || 'geral'
    if (!porMateria[key]) porMateria[key] = { count: 0, temas: {} }
    porMateria[key].count++
    if (e.tema) {
      porMateria[key].temas[e.tema] = (porMateria[key].temas[e.tema] || 0) + 1
    }
  })
  return Object.entries(porMateria)
    .map(([materiaId, data]) => {
      const mat = materias.find((m) => m.id === materiaId)
      const topTemas = Object.entries(data.temas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tema, count]) => ({ tema, count }))
      return { materiaId, materia: mat, count: data.count, topTemas }
    })
    .sort((a, b) => b.count - a.count)
}

// ── Questões diárias ──────────────────────────────────────────────────────────

export function getQuestoesDia(dk) {
  return get(`sdv2-questoes-${dk}`, 0)
}

export function setQuestoesDia(dk, n) {
  set(`sdv2-questoes-${dk}`, Math.max(0, parseInt(n) || 0))
}

// ── Stats ─────────────────────────────────────────────────────────────────────

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
    const completedMin = mBlocks
      .filter((b) => b.completed)
      .reduce((sum, b) => {
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
