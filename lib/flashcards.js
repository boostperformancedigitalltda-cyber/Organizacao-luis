import { get, set } from './storage'

const KEY = 'sdv2-flashcards'

export function loadFlashcards() {
  return get(KEY, [])
}

export function saveFlashcards(cards) {
  set(KEY, cards)
}

export function addFlashcard(cards, { materiaId, frente, verso, dificuldade }) {
  const card = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    materiaId: materiaId || null,
    frente: frente || '',
    verso: verso || '',
    dificuldade: dificuldade || 3, // 1-5
    acertos: 0,
    erros: 0,
    ultimaRevisao: null,
    proximaRevisao: null,
    intervalo: 1, // dias até próxima revisão
    createdAt: new Date().toISOString(),
  }
  const updated = [card, ...cards]
  saveFlashcards(updated)
  return updated
}

export function addFlashcards(cards, novos) {
  const updated = [...novos, ...cards]
  saveFlashcards(updated)
  return updated
}

export function removeFlashcard(cards, id) {
  const updated = cards.filter((c) => c.id !== id)
  saveFlashcards(updated)
  return updated
}

// SM-2 simplificado: resposta 1=errei, 2=difícil, 3=fácil
export function responderFlashcard(cards, id, resposta) {
  const hoje = new Date().toISOString().slice(0, 10)
  const updated = cards.map((c) => {
    if (c.id !== id) return c
    let intervalo = c.intervalo || 1
    let acertos = c.acertos
    let erros = c.erros

    if (resposta === 1) {
      // Errei — volta para 1 dia
      intervalo = 1
      erros++
    } else if (resposta === 2) {
      // Difícil — mantém intervalo
      intervalo = Math.max(1, Math.round(intervalo * 1.2))
      acertos++
    } else {
      // Fácil — dobra intervalo
      intervalo = Math.round(intervalo * 2.5)
      acertos++
    }

    const proxima = new Date()
    proxima.setDate(proxima.getDate() + intervalo)

    return {
      ...c,
      acertos,
      erros,
      intervalo,
      ultimaRevisao: hoje,
      proximaRevisao: proxima.toISOString().slice(0, 10),
    }
  })
  saveFlashcards(updated)
  return updated
}

export function getFlashcardsParaRevisar(cards) {
  const hoje = new Date().toISOString().slice(0, 10)
  return cards.filter((c) => !c.proximaRevisao || c.proximaRevisao <= hoje)
}

export function getFlashcardStats(cards, materiaId) {
  const filtered = materiaId ? cards.filter((c) => c.materiaId === materiaId) : cards
  if (!filtered.length) return null
  const total = filtered.length
  const paraRevisar = getFlashcardsParaRevisar(filtered).length
  const dominados = filtered.filter((c) => c.intervalo >= 14 && c.acertos > 0).length
  const totalRespostas = filtered.reduce((s, c) => s + c.acertos + c.erros, 0)
  const totalAcertos = filtered.reduce((s, c) => s + c.acertos, 0)
  const taxaAcerto = totalRespostas > 0 ? Math.round((totalAcertos / totalRespostas) * 100) : 0
  return { total, paraRevisar, dominados, taxaAcerto }
}
