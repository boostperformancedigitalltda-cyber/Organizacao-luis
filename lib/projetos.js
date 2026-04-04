import { get, set } from './storage'

const KEYS = {
  projetos: 'sdv2-projetos',
  tasks:    'sdv2-projetos-tasks',
  ideias:   'sdv2-projetos-ideias',
}

export const PROJETO_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
]

export const PROJETO_ICONS = ['🚀', '💡', '🏥', '📱', '💼', '🌱', '🔬', '🎯', '⚡', '🛠️']

export const PRIORITY_LABELS = {
  alta:  { label: 'Alta',  color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  media: { label: 'Média', color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  baixa: { label: 'Baixa', color: 'text-slate-500',  bg: 'bg-slate-100', border: 'border-slate-200' },
}

// ── Projetos ──────────────────────────────────────────────────────────────────

export function loadProjetos() {
  return get(KEYS.projetos, [])
}

export function saveProjetos(projetos) {
  set(KEYS.projetos, projetos)
}

export function addProjeto(projetos, { name, icon, color, description }) {
  const p = {
    id: Date.now().toString(),
    name: name || 'Novo projeto',
    icon: icon || '🚀',
    color: color || PROJETO_COLORS[projetos.length % PROJETO_COLORS.length],
    description: description || '',
    status: 'ativo',
    createdAt: new Date().toISOString(),
  }
  const updated = [p, ...projetos]
  saveProjetos(updated)
  return updated
}

export function updateProjeto(projetos, id, data) {
  const updated = projetos.map((p) => p.id === id ? { ...p, ...data } : p)
  saveProjetos(updated)
  return updated
}

export function removeProjeto(projetos, tasks, ideias, id) {
  const updatedP = projetos.filter((p) => p.id !== id)
  saveProjetos(updatedP)
  const updatedT = tasks.filter((t) => t.projetoId !== id)
  set(KEYS.tasks, updatedT)
  const updatedI = ideias.filter((i) => i.projetoId !== id)
  set(KEYS.ideias, updatedI)
  return { projetos: updatedP, tasks: updatedT, ideias: updatedI }
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export function loadTasks() {
  return get(KEYS.tasks, [])
}

export function addTask(tasks, { projetoId, title, priority, dueDate, note }) {
  const t = {
    id: Date.now().toString(),
    projetoId,
    title: title || '',
    status: 'pendente',
    priority: priority || 'media',
    dueDate: dueDate || null,
    note: note || '',
    createdAt: new Date().toISOString(),
  }
  const updated = [t, ...tasks]
  set(KEYS.tasks, updated)
  return updated
}

export function updateTask(tasks, id, data) {
  const updated = tasks.map((t) => t.id === id ? { ...t, ...data } : t)
  set(KEYS.tasks, updated)
  return updated
}

export function toggleTask(tasks, id) {
  const updated = tasks.map((t) => {
    if (t.id !== id) return t
    const next = t.status === 'feito' ? 'pendente' : 'feito'
    return { ...t, status: next, completedAt: next === 'feito' ? new Date().toISOString() : null }
  })
  set(KEYS.tasks, updated)
  return updated
}

export function removeTask(tasks, id) {
  const updated = tasks.filter((t) => t.id !== id)
  set(KEYS.tasks, updated)
  return updated
}

export function getProjectTasks(tasks, projetoId) {
  return tasks
    .filter((t) => t.projetoId === projetoId)
    .sort((a, b) => {
      const order = { alta: 0, media: 1, baixa: 2 }
      if (a.status === 'feito' && b.status !== 'feito') return 1
      if (a.status !== 'feito' && b.status === 'feito') return -1
      return (order[a.priority] || 1) - (order[b.priority] || 1)
    })
}

export function getTopPendingTask(tasks, projetos) {
  const active = projetos.filter((p) => p.status === 'ativo').map((p) => p.id)
  const pending = tasks.filter((t) => t.status !== 'feito' && active.includes(t.projetoId))
  const high = pending.find((t) => t.priority === 'alta')
  return high || pending[0] || null
}

// ── Ideias ────────────────────────────────────────────────────────────────────

export function loadIdeias() {
  return get(KEYS.ideias, [])
}

export function addIdeia(ideias, { projetoId, text }) {
  const i = {
    id: Date.now().toString(),
    projetoId: projetoId || null,
    text: text || '',
    processed: false,
    createdAt: new Date().toISOString(),
  }
  const updated = [i, ...ideias]
  set(KEYS.ideias, updated)
  return updated
}

export function removeIdeia(ideias, id) {
  const updated = ideias.filter((i) => i.id !== id)
  set(KEYS.ideias, updated)
  return updated
}

export function updateIdeia(ideias, id, data) {
  const updated = ideias.map((i) => i.id === id ? { ...i, ...data } : i)
  set(KEYS.ideias, updated)
  return updated
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getProjetoStats(tasks, projetoId) {
  const ptasks = tasks.filter((t) => t.projetoId === projetoId)
  const done = ptasks.filter((t) => t.status === 'feito').length
  return { total: ptasks.length, done, pct: ptasks.length ? Math.round((done / ptasks.length) * 100) : 0 }
}
