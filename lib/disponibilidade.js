import { get, set } from './storage'

const KEY = 'sdv2-disponibilidade'
const KEY_AULAS = 'sdv2-aulas'

// Default: Seg-Sex 19h-22h, Sáb 08h-13h, Dom 08h-12h
const DEFAULT_DISPONIBILIDADE = [
  { dow: 0, slots: [{ start: '19:00', end: '22:00' }] },
  { dow: 1, slots: [{ start: '19:00', end: '22:00' }] },
  { dow: 2, slots: [{ start: '19:00', end: '22:00' }] },
  { dow: 3, slots: [{ start: '19:00', end: '22:00' }] },
  { dow: 4, slots: [{ start: '19:00', end: '22:00' }] },
  { dow: 5, slots: [{ start: '08:00', end: '13:00' }] },
  { dow: 6, slots: [{ start: '08:00', end: '12:00' }] },
]

export const DAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
export const DAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// ── Disponibilidade (horários livres) ─────────────────────────────────────────

export function loadDisponibilidade() {
  return get(KEY, DEFAULT_DISPONIBILIDADE)
}

export function saveDisponibilidade(disp) {
  set(KEY, disp)
}

export function updateSlot(disp, dow, slotIdx, field, value) {
  const updated = disp.map((d) => {
    if (d.dow !== dow) return d
    const slots = d.slots.map((s, i) => i === slotIdx ? { ...s, [field]: value } : s)
    return { ...d, slots }
  })
  saveDisponibilidade(updated)
  return updated
}

export function addSlot(disp, dow) {
  const updated = disp.map((d) => {
    if (d.dow !== dow) return d
    return { ...d, slots: [...d.slots, { start: '07:00', end: '09:00' }] }
  })
  saveDisponibilidade(updated)
  return updated
}

export function removeSlot(disp, dow, slotIdx) {
  const updated = disp.map((d) => {
    if (d.dow !== dow) return d
    return { ...d, slots: d.slots.filter((_, i) => i !== slotIdx) }
  })
  saveDisponibilidade(updated)
  return updated
}

export function getTotalMinByDow(disp, dow) {
  const day = disp.find((d) => d.dow === dow)
  if (!day) return 0
  return day.slots.reduce((sum, s) => {
    const [sh, sm] = s.start.split(':').map(Number)
    const [eh, em] = s.end.split(':').map(Number)
    return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
  }, 0)
}

// ── Aulas (horários fixos semanais) ──────────────────────────────────────────

export function loadAulas() {
  return get(KEY_AULAS, [])
}

export function saveAulas(aulas) {
  set(KEY_AULAS, aulas)
}

export function addAula(aulas, { dow, nome, start, end, local }) {
  const a = {
    id: Date.now().toString(),
    dow: parseInt(dow),
    nome: nome || 'Aula',
    start,
    end,
    local: local || '',
  }
  const updated = [...aulas, a].sort((a, b) => a.dow - b.dow || a.start.localeCompare(b.start))
  saveAulas(updated)
  return updated
}

export function removeAula(aulas, id) {
  const updated = aulas.filter((a) => a.id !== id)
  saveAulas(updated)
  return updated
}

export function getAulasByDow(aulas, dow) {
  return aulas.filter((a) => a.dow === dow)
}
