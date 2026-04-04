// Generic localStorage helpers with sdv2- prefix

let _syncFn = null

// Called by firebase.js after login to enable cloud sync
export function setSyncFunction(fn) {
  _syncFn = fn
}

export function get(key, fallback = null) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export function set(key, value) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  // Fire-and-forget sync to Firestore when user is logged in
  if (_syncFn) _syncFn(key, value)
}

export function remove(key) {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(key) } catch {}
}

// Keys
export const KEYS = {
  day:         (dk) => `sdv2-day-${dk}`,
  streak:      'sdv2-streak',
  sessions:    'sdv2-sessions',
  transactions:'sdv2-transactions',
  finGoal:     'sdv2-fin-goal',
  goals:       'sdv2-goals',
  habits:      'sdv2-habits',
  habitLogs:   'sdv2-habit-logs',
  budgets:     'sdv2-budgets',
  routine:     'sdv2-routine',
  // Legacy compat
  dayPlan:     (dk) => `svida-plan-${dk}`,
  dayCompleted:(dk) => `svida-done-${dk}`,
}
