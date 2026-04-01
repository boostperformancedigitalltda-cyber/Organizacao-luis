import { get, set, KEYS } from './storage'

export const GOAL_CATEGORIES = [
  { id: 'financeiro',  label: 'Financeiro',  icon: '💰', color: '#10b981' },
  { id: 'saude',       label: 'Saúde',       icon: '💪', color: '#f43f5e' },
  { id: 'estudo',      label: 'Estudo',      icon: '📚', color: '#6366f1' },
  { id: 'pessoal',     label: 'Pessoal',     icon: '🎯', color: '#f59e0b' },
  { id: 'trabalho',    label: 'Trabalho',    icon: '💼', color: '#8b5cf6' },
  { id: 'habito',      label: 'Hábito',      icon: '🔄', color: '#06b6d4' },
  { id: 'outro',       label: 'Outro',       icon: '⭐', color: '#64748b' },
]

export const UNITS = ['R$', 'horas', 'kg', 'vezes', '%', 'dias', 'km', 'livros', 'páginas']

export function getGoalCat(id) {
  return GOAL_CATEGORIES.find((c) => c.id === id) || GOAL_CATEGORIES[6]
}

export function loadGoals() {
  return get(KEYS.goals, [])
}

export function saveGoals(goals) {
  set(KEYS.goals, goals)
}

export function addGoal(goals, data) {
  const g = {
    id: Date.now().toString(),
    title: data.title || 'Nova Meta',
    category: data.category || 'pessoal',
    period: data.period || 'mensal',
    targetMonth: data.targetMonth || new Date().toISOString().slice(0, 7),
    targetValue: parseFloat(data.targetValue) || 100,
    currentValue: 0,
    unit: data.unit || '%',
    color: data.color || '#6366f1',
    status: 'em_andamento',
    createdAt: new Date().toISOString(),
  }
  const updated = [g, ...goals]
  saveGoals(updated)
  return updated
}

export function updateGoalValue(goals, id, currentValue) {
  const updated = goals.map((g) => {
    if (g.id !== id) return g
    const pct = g.targetValue > 0 ? (currentValue / g.targetValue) * 100 : 0
    const status = pct >= 100 ? 'concluida' : 'em_andamento'
    return { ...g, currentValue: parseFloat(currentValue) || 0, status }
  })
  saveGoals(updated)
  return updated
}

export function removeGoal(goals, id) {
  const updated = goals.filter((g) => g.id !== id)
  saveGoals(updated)
  return updated
}

export function goalProgress(goal) {
  if (!goal.targetValue) return 0
  return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
}

export function goalStatus(goal) {
  const pct = goalProgress(goal)
  if (pct >= 100) return { label: 'Concluída', color: 'text-emerald-600', bg: 'bg-emerald-50' }
  const now = new Date()
  const [year, month] = goal.targetMonth.split('-').map(Number)
  if (now.getFullYear() > year || (now.getFullYear() === year && now.getMonth() + 1 > month)) {
    return { label: 'Atrasada', color: 'text-rose-600', bg: 'bg-rose-50' }
  }
  return { label: 'Em andamento', color: 'text-indigo-600', bg: 'bg-indigo-50' }
}
