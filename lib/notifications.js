import { get, set } from './storage'
import { loadMaterias, getTopicsForReviewToday } from './estudos'

const KEY = 'sdv2-notif-settings'

export const DEFAULT_SETTINGS = {
  enabled: false,
  morning: { enabled: true,  time: '07:00' },
  study:   { enabled: true,  time: '19:00' },
  treino:  { enabled: false, time: '18:00' },
  review:  { enabled: true,  time: '20:00' }, // Sunday only
}

export function loadNotifSettings() {
  return get(KEY, DEFAULT_SETTINGS)
}

export function saveNotifSettings(s) {
  set(KEY, s)
}

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

export function getPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

// Returns ms until next occurrence of HH:MM (today or tomorrow)
function msUntil(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  target.setHours(h, m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return target - now
}

// Show a notification (requires permission)
function show(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      tag,
    })
  } else {
    new Notification(title, { body, tag, icon: '/icons/icon-192.png' })
  }
}

// Store active timer IDs so we can clear them
let _timers = []
let _blockTimers = []

export function clearScheduled() {
  _timers.forEach(clearTimeout)
  _timers = []
}

function scheduleDaily(timeStr, title, body, tag) {
  const delay = msUntil(timeStr)
  const id = setTimeout(() => {
    show(title, body, tag)
    // Re-schedule for next day
    scheduleDaily(timeStr, title, body, tag)
  }, delay)
  _timers.push(id)
}

function isSunday() {
  return new Date().getDay() === 0
}

export function scheduleBlockNotifications(blocks) {
  _blockTimers.forEach(clearTimeout)
  _blockTimers = []
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const now = new Date()
  blocks.forEach((block) => {
    if (!block.startTime || !block.title) return
    const [h, m] = block.startTime.split(':').map(Number)
    const target = new Date()
    target.setHours(h, m - 5, 0, 0) // 5 min before
    if (target <= now) return
    const delay = target - now
    const id = setTimeout(() => {
      show(
        `⏰ ${block.icon || ''} ${block.title}`.trim(),
        `Começa em 5 minutos — ${block.startTime}`,
        `block-${block.uid}`
      )
    }, delay)
    _blockTimers.push(id)
  })
}

export function scheduleAll(settings) {
  clearScheduled()
  if (!settings?.enabled || getPermission() !== 'granted') return

  if (settings.morning?.enabled) {
    scheduleDaily(
      settings.morning.time,
      '☀️ Bom dia, Luis!',
      'Hora de planejar seu dia. Abra o app e defina suas prioridades.',
      'morning'
    )
  }

  if (settings.study?.enabled) {
    scheduleDaily(
      settings.study.time,
      '📚 Hora de estudar',
      'Sessão de estudos agendada. Vamos lá!',
      'study'
    )
  }

  if (settings.treino?.enabled) {
    scheduleDaily(
      settings.treino.time,
      '💪 Hora do treino',
      'Não pule o treino de hoje. Você vai se arrepender.',
      'treino'
    )
  }

  // Revisão espaçada — diária no horário de estudo
  if (settings.study?.enabled) {
    const delay = msUntil(settings.study.time)
    const id = setTimeout(() => {
      try {
        const mats = loadMaterias()
        const pending = getTopicsForReviewToday(mats)
        if (pending.length > 0) {
          show('🔁 Revisões pendentes', `Você tem ${pending.length} tópico(s) para revisar hoje.`, 'revisao-espacada')
        }
      } catch {}
      // re-agendar para amanhã
      scheduleAll(settings)
    }, delay)
    _timers.push(id)
  }

  if (settings.review?.enabled) {
    // Only schedule on Sunday — re-check after 24h on other days
    function scheduleReview() {
      const target = new Date()
      // Find next Sunday at the review time
      const [h, m] = settings.review.time.split(':').map(Number)
      target.setHours(h, m, 0, 0)
      // Days until Sunday (0 = Sunday)
      const daysUntilSunday = (7 - target.getDay()) % 7 || 7
      target.setDate(target.getDate() + daysUntilSunday)
      const delay = Math.max(0, target - Date.now())
      const id = setTimeout(() => {
        show('📋 Review Semanal', 'Como foi sua semana? Abra o app e faça o review.', 'review')
        scheduleReview()
      }, delay)
      _timers.push(id)
    }
    scheduleReview()
  }
}
