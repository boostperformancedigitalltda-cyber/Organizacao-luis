import { get, set, KEYS } from './storage'
import { isSameMonth, getLast, formatMonthShort, dateKey } from './date'

export const PAYMENT_METHODS = [
  { id: 'pix',      label: 'Pix',          icon: '⚡' },
  { id: 'credito',  label: 'Crédito',      icon: '💳' },
  { id: 'debito',   label: 'Débito',       icon: '🏧' },
  { id: 'dinheiro', label: 'Dinheiro',     icon: '💵' },
  { id: 'transf',   label: 'Transferência',icon: '🏦' },
  { id: 'boleto',   label: 'Boleto',       icon: '📄' },
]

export function getPaymentMethod(id) {
  return PAYMENT_METHODS.find((m) => m.id === id) || null
}

export const DEFAULT_CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação', color: '#f97316', bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200' },
  { id: 'faculdade',   label: 'Faculdade',   color: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200'   },
  { id: 'pessoal',     label: 'Pessoal',     color: '#a855f7', bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-200' },
  { id: 'investimento',label: 'Investimento',color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200'},
  { id: 'moradia',     label: 'Moradia',     color: '#f59e0b', bg: 'bg-yellow-50',  text: 'text-yellow-600',  border: 'border-yellow-200' },
  { id: 'saude',       label: 'Saúde',       color: '#ef4444', bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200'    },
  { id: 'transporte',  label: 'Transporte',  color: '#06b6d4', bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-200'   },
  { id: 'lazer',       label: 'Lazer',       color: '#ec4899', bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200'   },
  { id: 'apostas',     label: 'Apostas',     color: '#16a34a', bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200'  },
  { id: 'outros',      label: 'Outros',      color: '#94a3b8', bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200'  },
]

// Keep CATEGORIES as a reference — runtime uses loadCategories()
export const CATEGORIES = DEFAULT_CATEGORIES

const CAT_COLORS = [
  { color: '#f97316', bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200' },
  { color: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200'   },
  { color: '#a855f7', bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-200' },
  { color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200'},
  { color: '#f59e0b', bg: 'bg-yellow-50',  text: 'text-yellow-600',  border: 'border-yellow-200' },
  { color: '#ef4444', bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200'    },
  { color: '#06b6d4', bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-200'   },
  { color: '#ec4899', bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200'   },
  { color: '#16a34a', bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200'  },
  { color: '#94a3b8', bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200'  },
  { color: '#8b5cf6', bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200' },
  { color: '#0ea5e9', bg: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-200'    },
]

export function getColorPresets() { return CAT_COLORS }

export function loadCategories() {
  return get('sdv2-finance-categories', DEFAULT_CATEGORIES)
}

export function saveCategories(cats) {
  set('sdv2-finance-categories', cats)
}

export function addCategory(cats, { label, color }) {
  const preset = CAT_COLORS.find((c) => c.color === color) || CAT_COLORS[9]
  const id = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now()
  const nova = { id, label, color: preset.color, bg: preset.bg, text: preset.text, border: preset.border }
  const updated = [...cats, nova]
  saveCategories(updated)
  return updated
}

export function removeCategory(cats, id) {
  const updated = cats.filter((c) => c.id !== id)
  saveCategories(updated)
  return updated
}

export function getCat(id, cats) {
  const list = cats || loadCategories()
  return list.find((c) => c.id === id) || list[list.length - 1] || DEFAULT_CATEGORIES[9]
}

export function loadTransactions() {
  return get(KEYS.transactions, [])
}

export function saveTransactions(txs) {
  set(KEYS.transactions, txs)
}

export function addTx(txs, { type, amount, category, description, date, paymentMethod }) {
  const tx = {
    id: Date.now().toString(),
    type,
    amount: parseFloat(amount) || 0,
    category: category || 'outros',
    description: description || '',
    date: date ? new Date(date + 'T12:00:00').toISOString() : new Date().toISOString(),
    paymentMethod: paymentMethod || null,
  }
  const updated = [tx, ...txs]
  saveTransactions(updated)
  return updated
}

export function removeTx(txs, id) {
  const updated = txs.filter((t) => t.id !== id)
  saveTransactions(updated)
  return updated
}

export function calcMonthSummary(txs, date = new Date()) {
  const monthly = txs.filter((t) => isSameMonth(new Date(t.date), date))
  const entradas = monthly.filter((t) => t.type === 'entrada').reduce((s, t) => s + t.amount, 0)
  const saidas   = monthly.filter((t) => t.type === 'saida').reduce((s, t) => s + t.amount, 0)
  return { entradas, saidas, saldo: entradas - saidas, count: monthly.length }
}

export function calcByCategory(txs, date = new Date()) {
  const saidas = txs.filter((t) => t.type === 'saida' && isSameMonth(new Date(t.date), date))
  const map = {}
  saidas.forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount })
  const cats = loadCategories()
  return cats
    .map((c) => ({ ...c, total: map[c.id] || 0 }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
}

export function calcLast6Months(txs) {
  return getLast(6, 'month').map((d) => {
    const month = txs.filter((t) => isSameMonth(new Date(t.date), d))
    const entradas = month.filter((t) => t.type === 'entrada').reduce((s, t) => s + t.amount, 0)
    const saidas   = month.filter((t) => t.type === 'saida').reduce((s, t) => s + t.amount, 0)
    return { month: formatMonthShort(d), entradas, saidas }
  })
}

export function calcDailyThisMonth(txs, date = new Date()) {
  const days = []
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(date.getFullYear(), date.getMonth(), i)
    const dk = dateKey(d)
    const daySaidas = txs
      .filter((t) => t.type === 'saida' && t.date.startsWith(dk))
      .reduce((s, t) => s + t.amount, 0)
    days.push({ day: i, total: daySaidas })
  }
  return days
}

function inRange(t, startKey, endKey) {
  const d = t.date.slice(0, 10)
  return d >= startKey && d <= endKey
}

export function calcPeriodSummary(txs, start, end) {
  const s = dateKey(start), e = dateKey(end)
  const filtered = txs.filter((t) => inRange(t, s, e))
  const entradas = filtered.filter((t) => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0)
  const saidas   = filtered.filter((t) => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0)
  return { entradas, saidas, saldo: entradas - saidas, count: filtered.length }
}

export function calcByCategoryPeriod(txs, start, end) {
  const s = dateKey(start), e = dateKey(end)
  const saidas = txs.filter((t) => t.type === 'saida' && inRange(t, s, e))
  const map = {}
  saidas.forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount })
  const cats = loadCategories()
  return cats
    .map((c) => ({ ...c, total: map[c.id] || 0 }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
}

export function getPeriodTxs(txs, start, end) {
  const s = dateKey(start), e = dateKey(end)
  return txs.filter((t) => inRange(t, s, e))
}

export function calcDailyForPeriod(txs, start, end) {
  const days = []
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  while (cur <= endDay) {
    const dk = dateKey(cur)
    const total = txs
      .filter((t) => t.type === 'saida' && t.date.startsWith(dk))
      .reduce((s, t) => s + t.amount, 0)
    days.push({ day: cur.getDate(), date: dk, total })
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

export function loadFinGoal() { return get(KEYS.finGoal, 0) }
export function saveFinGoal(v) { set(KEYS.finGoal, v) }

export function loadBudgets() { return get(KEYS.budgets, {}) }
export function saveBudgets(b) { set(KEYS.budgets, b) }

export function fmt(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export function fmtShort(value) {
  if (Math.abs(value) >= 1000) return `R$${(value / 1000).toFixed(1)}k`
  return `R$${(value || 0).toFixed(0)}`
}

export function getMonthTxs(txs, date = new Date()) {
  return txs.filter((t) => isSameMonth(new Date(t.date), date))
}
