import { get, set } from './storage'

const KEY = 'sdv2-inbox'

export const CAPTURE_TYPES = [
  { id: 'task',    label: 'Task',   icon: '✅', color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
  { id: 'ideia',   label: 'Ideia',  icon: '💡', color: 'text-amber-600',   bg: 'bg-amber-50'   },
  { id: 'estudo',  label: 'Estudo', icon: '📚', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'treino',  label: 'Treino', icon: '💪', color: 'text-rose-600',    bg: 'bg-rose-50'    },
]

export function loadInbox() {
  return get(KEY, [])
}

export function addToInbox(inbox, { text, type }) {
  const item = {
    id: Date.now().toString(),
    text: text.trim(),
    type: type || 'task',
    processed: false,
    createdAt: new Date().toISOString(),
  }
  const updated = [item, ...inbox]
  set(KEY, updated)
  return updated
}

export function markProcessed(inbox, id) {
  const updated = inbox.map((i) => i.id === id ? { ...i, processed: true } : i)
  set(KEY, updated)
  return updated
}

export function removeFromInbox(inbox, id) {
  const updated = inbox.filter((i) => i.id !== id)
  set(KEY, updated)
  return updated
}

export function getPendingInbox(inbox) {
  return inbox.filter((i) => !i.processed)
}
