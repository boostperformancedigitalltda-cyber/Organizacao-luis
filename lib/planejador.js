import { loadStudyBlocks, getWeeklyStats, getSimuladoStats } from './estudos'
import { diasAteProva } from './provas'
import { getAulasByDow } from './disponibilidade'
import { get, set } from './storage'

function toMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fromMin(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Calcula o score de prioridade de cada matéria para a semana.
 */
function calcPrioridades(materias, provas, simulados, blocks, weekDates) {
  const weekStart = weekDates[0]

  return materias.map((m) => {
    let score = 0

    // 1. Prova chegando
    const provasMateria = provas.filter((p) => p.materiaId === m.id && p.data >= weekStart)
    let provaEmBreve = null
    if (provasMateria.length > 0) {
      provaEmBreve = provasMateria.sort((a, b) => a.data.localeCompare(b.data))[0]
      const dias = diasAteProva(provaEmBreve.data)
      if (dias <= 3)       score += 100
      else if (dias <= 7)  score += 70
      else if (dias <= 14) score += 40
      else if (dias <= 30) score += 20
    }

    // 2. Defasagem na meta semanal
    const now = new Date()
    const dow = now.getDay()
    const diff = dow === 0 ? -6 : 1 - dow
    const weekStartDate = new Date(now)
    weekStartDate.setDate(now.getDate() + diff)
    const stat = getWeeklyStats(blocks, [m], weekStartDate)[0]
    if (stat && stat.goalMin > 0) {
      const pct = stat.completedMin / stat.goalMin
      if (pct < 0.3)      score += 30
      else if (pct < 0.6) score += 15
      else if (pct < 0.9) score += 5
    } else if (m.weeklyGoalHours > 0) {
      score += 10
    }

    // 3. Simulado ruim
    const simStats = getSimuladoStats(simulados, m.id)
    if (simStats) {
      if (simStats.avg < 50)      score += 25
      else if (simStats.avg < 60) score += 15
      else if (simStats.avg < 70) score += 8
    }

    // Garante score mínimo pra matérias com meta
    if (score === 0 && m.weeklyGoalHours > 0) score = 5

    return { materia: m, score, provaEmBreve }
  }).filter((p) => p.score > 0).sort((a, b) => b.score - a.score)
}

/**
 * Dado um slot de tempo e uma lista de bloqueios (aulas + existentes),
 * retorna os sub-slots livres dentro do slot.
 */
function subSlotsLivres(slotStart, slotEnd, bloqueios) {
  const livres = []
  let cursor = slotStart

  const sorted = [...bloqueios].sort((a, b) => a[0] - b[0])

  for (const [bStart, bEnd] of sorted) {
    if (bStart >= slotEnd) break
    if (bEnd <= cursor) continue
    if (bStart > cursor) {
      livres.push([cursor, Math.min(bStart, slotEnd)])
    }
    cursor = Math.max(cursor, bEnd)
  }

  if (cursor < slotEnd) livres.push([cursor, slotEnd])
  return livres
}

/**
 * Gera blocos de estudo para os próximos dias.
 */
export function gerarPlanoSemanal({ materias, provas, simulados, disponibilidade, aulas, diasAVista = 7 }) {
  if (materias.length === 0) return []

  const blocks = loadStudyBlocks()

  const weekDates = Array.from({ length: diasAVista }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const prioridades = calcPrioridades(materias, provas, simulados, blocks, weekDates)
  if (prioridades.length === 0) return []

  const propostos = []

  weekDates.forEach((dk) => {
    const d = new Date(dk + 'T12:00:00')
    const dowJS = d.getDay()
    const dow = dowJS === 0 ? 6 : dowJS - 1

    const dispDia = disponibilidade.find((x) => x.dow === dow)
    if (!dispDia || dispDia.slots.length === 0) return

    // Bloqueios: aulas + blocos já existentes
    const aulasHoje = getAulasByDow(aulas, dow)
    const existentes = blocks.filter((b) => b.date === dk)

    const bloqueios = [
      ...aulasHoje.map((a) => [toMin(a.start), toMin(a.end)]),
      ...existentes.map((b) => b.startTime && b.endTime ? [toMin(b.startTime), toMin(b.endTime)] : null).filter(Boolean),
    ]

    dispDia.slots.forEach((slot) => {
      const slotStart = toMin(slot.start)
      const slotEnd = toMin(slot.end)
      if (slotEnd - slotStart < 30) return

      const livres = subSlotsLivres(slotStart, slotEnd, bloqueios)

      livres.forEach(([freeStart, freeEnd]) => {
        const totalMin = freeEnd - freeStart
        if (totalMin < 45) return

        const totalScore = prioridades.reduce((s, p) => s + p.score, 0)
        const MIN_BLOCO = 45
        const MAX_BLOCO = 90

        let cursor = freeStart

        prioridades.forEach(({ materia: m, score, provaEmBreve }) => {
          if (cursor >= freeEnd - MIN_BLOCO) return

          const frac = score / totalScore
          let dur = Math.round(frac * totalMin)
          dur = Math.max(MIN_BLOCO, Math.min(MAX_BLOCO, dur))
          dur = Math.min(dur, freeEnd - cursor)
          if (dur < MIN_BLOCO) return

          propostos.push({
            id: `prop-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            date: dk,
            materiaId: m.id,
            topic: provaEmBreve ? `Preparação: prova em ${diasAteProva(provaEmBreve.data)} dias` : '',
            startTime: fromMin(cursor),
            endTime: fromMin(cursor + dur),
            completed: false,
            note: provaEmBreve ? `${provaEmBreve.titulo}` : '',
            _proposed: true,
          })

          cursor += dur
        })
      })
    })
  })

  return propostos
}

/**
 * Aplica os blocos propostos ao storage.
 */
export function aplicarPlano(propostos) {
  const blocks = loadStudyBlocks()
  const novos = propostos.map(({ _proposed, ...b }) => ({
    ...b,
    id: Date.now().toString() + Math.random().toString(36).slice(2),
  }))
  const updated = [...blocks, ...novos]
  set('sdv2-study-blocks', updated)
  return updated
}
