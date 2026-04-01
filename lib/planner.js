import { get, set, KEYS } from './storage'

export const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Block categories
export const BLOCK_CATEGORIES = [
  { id: 'estudo',   label: 'Estudo',   color: '#6366f1', bg: 'bg-indigo-50',  dot: 'bg-indigo-500',  text: 'text-indigo-700'  },
  { id: 'treino',   label: 'Treino',   color: '#10b981', bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  { id: 'casa',     label: 'Casa',     color: '#f59e0b', bg: 'bg-amber-50',   dot: 'bg-amber-500',   text: 'text-amber-700'   },
  { id: 'trabalho', label: 'Trabalho', color: '#8b5cf6', bg: 'bg-violet-50',  dot: 'bg-violet-500',  text: 'text-violet-700'  },
  { id: 'pessoal',  label: 'Pessoal',  color: '#ec4899', bg: 'bg-pink-50',    dot: 'bg-pink-500',    text: 'text-pink-700'    },
  { id: 'saude',    label: 'Saúde',    color: '#ef4444', bg: 'bg-red-50',     dot: 'bg-red-500',     text: 'text-red-700'     },
  { id: 'lazer',    label: 'Lazer',    color: '#06b6d4', bg: 'bg-cyan-50',    dot: 'bg-cyan-500',    text: 'text-cyan-700'    },
]

export function getCatInfo(catId) {
  return BLOCK_CATEGORIES.find((c) => c.id === catId) || BLOCK_CATEGORIES[4]
}

// Weekday templates
export const TEMPLATES = {
  0: [ // Sunday
    { startTime: '09:00', endTime: '10:00', title: 'Descanso',      category: 'pessoal',  icon: '😌' },
    { startTime: '10:00', endTime: '11:00', title: 'Organização',   category: 'casa',     icon: '🗂️' },
  ],
  1: [ // Monday
    { startTime: '07:30', endTime: '08:00', title: 'Quarto',        category: 'casa',     icon: '🛏️' },
    { startTime: '08:00', endTime: '12:00', title: 'Aula',          category: 'estudo',   icon: '🎓' },
    { startTime: '12:00', endTime: '13:00', title: 'Almoço',        category: 'pessoal',  icon: '🍽️' },
    { startTime: '13:00', endTime: '16:00', title: 'Aula a tarde',  category: 'estudo',   icon: '🎓' },
    { startTime: '20:00', endTime: '21:30', title: 'Academia',      category: 'treino',   icon: '💪' },
    { startTime: '21:30', endTime: '22:00', title: 'Janta',         category: 'pessoal',  icon: '🍳' },
    { startTime: '22:00', endTime: '23:00', title: 'Trabalho',      category: 'trabalho', icon: '💰' },
  ],
  2: [ // Tuesday
    { startTime: '07:30', endTime: '08:00', title: 'Quarto',        category: 'casa',     icon: '🛏️' },
    { startTime: '08:00', endTime: '12:00', title: 'Aula',          category: 'estudo',   icon: '🎓' },
    { startTime: '12:00', endTime: '13:00', title: 'Almoço',        category: 'pessoal',  icon: '🍽️' },
    { startTime: '13:00', endTime: '16:00', title: 'Aula a tarde',  category: 'estudo',   icon: '🎓' },
    { startTime: '20:00', endTime: '21:30', title: 'Academia',      category: 'treino',   icon: '💪' },
    { startTime: '21:30', endTime: '22:00', title: 'Janta',         category: 'pessoal',  icon: '🍳' },
    { startTime: '22:00', endTime: '23:00', title: 'Trabalho',      category: 'trabalho', icon: '💰' },
  ],
  3: [ // Wednesday
    { startTime: '07:30', endTime: '08:00', title: 'Quarto',        category: 'casa',     icon: '🛏️' },
    { startTime: '08:00', endTime: '12:00', title: 'Aula',          category: 'estudo',   icon: '🎓' },
    { startTime: '12:00', endTime: '13:00', title: 'Almoço',        category: 'pessoal',  icon: '🍽️' },
    { startTime: '13:00', endTime: '16:00', title: 'Aula a tarde',  category: 'estudo',   icon: '🎓' },
    { startTime: '20:00', endTime: '21:30', title: 'Academia',      category: 'treino',   icon: '💪' },
    { startTime: '21:30', endTime: '22:00', title: 'Janta',         category: 'pessoal',  icon: '🍳' },
    { startTime: '22:00', endTime: '23:00', title: 'Trabalho',      category: 'trabalho', icon: '💰' },
  ],
  4: [ // Thursday
    { startTime: '07:30', endTime: '08:00', title: 'Quarto',        category: 'casa',     icon: '🛏️' },
    { startTime: '08:00', endTime: '12:00', title: 'Aula',          category: 'estudo',   icon: '🎓' },
    { startTime: '12:00', endTime: '13:00', title: 'Almoço',        category: 'pessoal',  icon: '🍽️' },
    { startTime: '13:00', endTime: '16:00', title: 'Aula a tarde',  category: 'estudo',   icon: '🎓' },
    { startTime: '20:00', endTime: '21:30', title: 'Academia',      category: 'treino',   icon: '💪' },
    { startTime: '21:30', endTime: '22:00', title: 'Janta',         category: 'pessoal',  icon: '🍳' },
    { startTime: '22:00', endTime: '23:00', title: 'Trabalho',      category: 'trabalho', icon: '💰' },
  ],
  5: [ // Friday
    { startTime: '07:30', endTime: '08:00', title: 'Quarto',        category: 'casa',     icon: '🛏️' },
    { startTime: '08:00', endTime: '12:00', title: 'Aula',          category: 'estudo',   icon: '🎓' },
    { startTime: '12:00', endTime: '13:00', title: 'Almoço',        category: 'pessoal',  icon: '🍽️' },
    { startTime: '13:00', endTime: '16:00', title: 'Aula a tarde',  category: 'estudo',   icon: '🎓' },
    { startTime: '20:00', endTime: '21:30', title: 'Academia',      category: 'treino',   icon: '💪' },
    { startTime: '21:30', endTime: '22:00', title: 'Janta',         category: 'pessoal',  icon: '🍳' },
    { startTime: '22:00', endTime: '23:00', title: 'Trabalho',      category: 'trabalho', icon: '💰' },
  ],
  6: [ // Saturday
    { startTime: '09:00', endTime: '10:00', title: 'Acordar',       category: 'pessoal',  icon: '☀️' },
    { startTime: '10:00', endTime: '12:00', title: 'Limpeza',       category: 'casa',     icon: '🧹' },
    { startTime: '20:00', endTime: '21:30', title: 'Academia',      category: 'treino',   icon: '💪' },
    { startTime: '21:30', endTime: '22:00', title: 'Lavar louça',   category: 'casa',     icon: '🍽️' },
  ],
}

function uid() {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function getTemplateBlocks(date) {
  const dow = new Date(date).getDay()
  const customRoutine = get(KEYS.routine, null)
  const template = customRoutine?.[dow] ?? TEMPLATES[dow] ?? []
  return template.map((b) => ({ ...b, uid: uid(), note: b.note || '' }))
}

// DayPlan shape: { date, energy, priorities, blocks, completed, prioritiesCompleted, planned }

export function loadDayPlan(dk) {
  return get(KEYS.day(dk), null)
}

export function saveDayPlan(dk, plan) {
  set(KEYS.day(dk), plan)
}

export function calcProgress(blocks, completed) {
  if (!blocks || blocks.length === 0) return { count: 0, total: 0, pct: 0 }
  const total = blocks.length
  const count = blocks.filter((b) => completed[b.uid]).length
  return { count, total, pct: Math.round((count / total) * 100) }
}

export function timeToMinutes(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function blockDuration(block) {
  const s = timeToMinutes(block.startTime)
  const e = timeToMinutes(block.endTime)
  return e > s ? e - s : 0
}

export function getCurrentBlock(blocks) {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  return blocks.find((b) => {
    const s = timeToMinutes(b.startTime)
    const e = timeToMinutes(b.endTime)
    return nowMins >= s && nowMins < e
  }) || null
}

export function getNextBlock(blocks, completed) {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  return blocks.find((b) => {
    const s = timeToMinutes(b.startTime)
    return s > nowMins && !completed[b.uid]
  }) || null
}

export function makeNewBlock() {
  return {
    uid: uid(),
    startTime: '08:00',
    endTime: '09:00',
    title: '',
    category: 'pessoal',
    icon: '📌',
    note: '',
    goalId: null,
  }
}
