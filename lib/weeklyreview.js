import { get, set } from './storage'

const KEY = 'sdv2-weekly-reviews'

export function loadReviews() {
  return get(KEY, [])
}

// weekStart: 'YYYY-MM-DD' (Monday)
export function getReviewForWeek(reviews, weekStart) {
  return reviews.find((r) => r.weekStart === weekStart) || null
}

export function saveReview(reviews, { weekStart, wins, improvements, nextWeekFocus, ratings }) {
  const existing = reviews.find((r) => r.weekStart === weekStart)
  let updated
  if (existing) {
    updated = reviews.map((r) =>
      r.weekStart === weekStart
        ? { ...r, wins, improvements, nextWeekFocus, ratings, updatedAt: new Date().toISOString() }
        : r
    )
  } else {
    const review = {
      id: Date.now().toString(),
      weekStart,
      wins: wins || '',
      improvements: improvements || '',
      nextWeekFocus: nextWeekFocus || '',
      ratings: ratings || { estudo: 0, treino: 0, projetos: 0, saude: 0 },
      completedAt: new Date().toISOString(),
    }
    updated = [review, ...reviews]
  }
  set(KEY, updated)
  return updated
}

export function removeReview(reviews, id) {
  const updated = reviews.filter((r) => r.id !== id)
  set(KEY, updated)
  return updated
}

// Get current week's Monday as YYYY-MM-DD
export function getCurrentWeekStart() {
  const today = new Date()
  const dow = today.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  return monday.toISOString().slice(0, 10)
}

// Format week label: "Semana de 01 a 07 de abril"
export function formatWeekLabel(weekStart) {
  const start = new Date(weekStart + 'T12:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const startStr = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  const endStr = end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  return `${startStr} – ${endStr}`
}

// Should show review prompt? (show on Sunday only if not done)
export function shouldShowReviewPrompt(reviews) {
  const weekStart = getCurrentWeekStart()
  const done = getReviewForWeek(reviews, weekStart)
  if (done) return false
  const today = new Date()
  return today.getDay() === 0 // only Sunday
}
