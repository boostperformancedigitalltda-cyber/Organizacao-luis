export function dateKey(date = new Date()) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function today() { return new Date() }

export function formatFull(date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function formatShort(date) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function formatMonth(date) {
  return new Date(date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function formatMonthShort(date) {
  return new Date(date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}

export function getDayName(date) {
  return new Date(date).toLocaleDateString('pt-BR', { weekday: 'long' })
}

export function getWeekday(date) {
  return new Date(date).getDay()
}

export function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function startOfMonth(date) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(date) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
}

export function getLast(n, unit = 'day') {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    if (unit === 'day') d.setDate(d.getDate() - i)
    else if (unit === 'month') { d.setDate(1); d.setMonth(d.getMonth() - i) }
    days.push(d)
  }
  return days
}

export function isSameDay(a, b) {
  return dateKey(new Date(a)) === dateKey(new Date(b))
}

export function isSameMonth(a, b) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth()
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function getMonthCalendar(date) {
  const first = startOfMonth(date)
  const lastDay = endOfMonth(date).getDate()
  const startDow = first.getDay() === 0 ? 6 : first.getDay() - 1
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDay; d++) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), d))
  }
  return cells
}

export function getWeekNumber(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}
