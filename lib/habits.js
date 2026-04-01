import { get, set, KEYS } from './storage'
import { dateKey, isSameDay } from './date'

export function loadHabits() {
  return get(KEYS.habits, [])
}

export function saveHabits(habits) {
  set(KEYS.habits, habits)
}

export function loadHabitLogs() {
  return get(KEYS.habitLogs, {})
}

export function saveHabitLogs(logs) {
  set(KEYS.habitLogs, logs)
}

export function addHabit(habits, data) {
  const h = {
    id: Date.now().toString(),
    title: data.title || 'Novo Hábito',
    icon: data.icon || '⭐',
    color: data.color || '#6366f1',
    frequency: data.frequency || 'daily',
    createdAt: new Date().toISOString(),
  }
  const updated = [h, ...habits]
  saveHabits(updated)
  return updated
}

export function removeHabit(habits, logs, id) {
  const updatedHabits = habits.filter((h) => h.id !== id)
  const updatedLogs = { ...logs }
  delete updatedLogs[id]
  saveHabits(updatedHabits)
  saveHabitLogs(updatedLogs)
  return { habits: updatedHabits, logs: updatedLogs }
}

export function toggleHabitDay(logs, habitId, dk) {
  const curr = logs[habitId] || []
  const already = curr.includes(dk)
  const updated = {
    ...logs,
    [habitId]: already ? curr.filter((d) => d !== dk) : [...curr, dk],
  }
  saveHabitLogs(updated)
  return updated
}

export function isDoneToday(logs, habitId) {
  const dk = dateKey(new Date())
  return (logs[habitId] || []).includes(dk)
}

export function getStreak(logs, habitId) {
  const datesSet = new Set(logs[habitId] || [])
  let streak = 0
  const d = new Date()
  while (true) {
    const dk = dateKey(d)
    if (datesSet.has(dk)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

export function getLast7Days(logs, habitId) {
  const datesSet = new Set(logs[habitId] || [])
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { date: dateKey(d), done: datesSet.has(dateKey(d)) }
  })
}

export function getHeatmapData(logs, habitId) {
  const datesSet = new Set(logs[habitId] || [])
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return { date: dateKey(d), done: datesSet.has(dateKey(d)) }
  })
}

export function isHabitDueToday(habit) {
  const dow = new Date().getDay()
  if (habit.frequency === 'daily') return true
  if (habit.frequency === 'weekdays') return dow >= 1 && dow <= 5
  if (habit.frequency === 'weekends') return dow === 0 || dow === 6
  return true
}
