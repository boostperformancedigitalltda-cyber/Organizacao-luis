import { get, set } from './storage'

const KEY = 'sdv2-provas'

export const TIPOS_PROVA = [
  { id: 'prova',    label: 'Prova',     icon: '📋', color: '#ef4444' },
  { id: 'simulado', label: 'Simulado',  icon: '📝', color: '#f59e0b' },
  { id: 'revalida', label: 'Revalida',  icon: '🏥', color: '#6366f1' },
  { id: 'residencia',label: 'Residência',icon: '🩺', color: '#8b5cf6' },
  { id: 'outro',    label: 'Outro',     icon: '📌', color: '#06b6d4' },
]

export function loadProvas() {
  return get(KEY, [])
}

export function saveProvas(provas) {
  set(KEY, provas)
}

export function addProva(provas, { materiaId, titulo, data, tipo, local }) {
  const p = {
    id: Date.now().toString(),
    materiaId: materiaId || null,
    titulo: titulo || 'Prova',
    data,
    tipo: tipo || 'prova',
    local: local || '',
    createdAt: new Date().toISOString(),
  }
  const updated = [...provas, p].sort((a, b) => a.data.localeCompare(b.data))
  saveProvas(updated)
  return updated
}

export function removeProva(provas, id) {
  const updated = provas.filter((p) => p.id !== id)
  saveProvas(updated)
  return updated
}

export function diasAteProva(data) {
  const hoje = new Date().toISOString().slice(0, 10)
  const diff = Math.ceil((new Date(data + 'T12:00:00') - new Date(hoje + 'T12:00:00')) / (1000 * 60 * 60 * 24))
  return diff
}

export function getProvasProximas(provas, dias = 60) {
  const hoje = new Date().toISOString().slice(0, 10)
  return provas.filter((p) => p.data >= hoje && diasAteProva(p.data) <= dias)
}

export function getTipoProva(tipo) {
  return TIPOS_PROVA.find((t) => t.id === tipo) || TIPOS_PROVA[0]
}
