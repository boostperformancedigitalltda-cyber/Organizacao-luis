'use client'

import { useState, useEffect } from 'react'
import {
  loadFlashcards, addFlashcard, addFlashcards, removeFlashcard,
  responderFlashcard, getFlashcardsParaRevisar, getFlashcardStats,
} from '@/lib/flashcards'

function aprovColor(pct) {
  if (pct >= 70) return 'text-emerald-600 bg-emerald-50'
  if (pct >= 50) return 'text-amber-600 bg-amber-50'
  return 'text-red-600 bg-red-50'
}

// ── Modo revisão (estudo dos cards) ──────────────────────────────────────────
function ModoRevisao({ cards, materiaId, onFim }) {
  const fila = cards.filter((c) => !materiaId || c.materiaId === materiaId)
  const [idx, setIdx] = useState(0)
  const [virado, setVirado] = useState(false)
  const [cardsState, setCardsState] = useState(fila)
  const [respondidos, setRespondidos] = useState(0)

  const card = cardsState[idx]

  if (!card || respondidos >= cardsState.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <p className="text-xl font-black text-slate-800 mb-2">Revisão concluída!</p>
        <p className="text-sm text-slate-500 mb-6">{respondidos} cards revisados</p>
        <button onClick={onFim}
          className="px-6 py-3 bg-indigo-500 text-white font-bold rounded-2xl">
          Voltar
        </button>
      </div>
    )
  }

  function responder(r) {
    const updated = responderFlashcard(cardsState, card.id, r)
    setCardsState(updated)
    setRespondidos((n) => n + 1)
    setIdx((i) => i + 1)
    setVirado(false)
  }

  const progresso = Math.round((respondidos / cardsState.length) * 100)

  return (
    <div className="flex flex-col min-h-[60vh]">
      {/* Progresso */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progresso}%` }} />
        </div>
        <span className="text-xs font-bold text-slate-400">{respondidos}/{cardsState.length}</span>
      </div>

      {/* Card */}
      <div
        className="flex-1 bg-white rounded-3xl shadow-lg border border-slate-100 p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px] active:scale-95 transition-all"
        onClick={() => setVirado(true)}
      >
        {!virado ? (
          <>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-4">PERGUNTA</p>
            <p className="text-lg font-bold text-slate-800 leading-relaxed">{card.frente}</p>
            <p className="text-xs text-slate-300 mt-6">Toque para revelar</p>
          </>
        ) : (
          <>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-4">RESPOSTA</p>
            <p className="text-base text-slate-700 leading-relaxed">{card.verso}</p>
          </>
        )}
      </div>

      {/* Botões de resposta */}
      {virado && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button onClick={() => responder(1)}
            className="py-3 bg-red-100 text-red-600 font-bold rounded-2xl text-sm active:scale-95 transition-all">
            ✗ Errei
          </button>
          <button onClick={() => responder(2)}
            className="py-3 bg-amber-100 text-amber-600 font-bold rounded-2xl text-sm active:scale-95 transition-all">
            〜 Difícil
          </button>
          <button onClick={() => responder(3)}
            className="py-3 bg-emerald-100 text-emerald-600 font-bold rounded-2xl text-sm active:scale-95 transition-all">
            ✓ Fácil
          </button>
        </div>
      )}

      {!virado && (
        <button onClick={onFim}
          className="mt-4 w-full py-3 bg-slate-100 text-slate-500 font-semibold rounded-2xl text-sm">
          Parar revisão
        </button>
      )}
    </div>
  )
}

// ── Tab principal de Flashcards ───────────────────────────────────────────────
export default function FlashcardsTab({ materias }) {
  const [cards, setCards] = useState(() => loadFlashcards())
  const [filterMat, setFilterMat] = useState('')
  const [revisando, setRevisando] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showGerarIA, setShowGerarIA] = useState(false)
  const [loadingIA, setLoadingIA] = useState(false)
  const [novoCard, setNovoCard] = useState({ materiaId: '', frente: '', verso: '', dificuldade: 3 })
  const [gerarForm, setGerarForm] = useState({ materiaId: '', topico: '', quantidade: 10 })
  const [expandido, setExpandido] = useState(null)

  const paraRevisar = getFlashcardsParaRevisar(cards)
  const filtered = filterMat ? cards.filter((c) => c.materiaId === filterMat) : cards
  const stats = getFlashcardStats(cards)

  async function handleGerarIA() {
    const mat = materias.find((m) => m.id === gerarForm.materiaId)
    if (!gerarForm.topico.trim()) return
    setLoadingIA(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gerar-flashcards',
          payload: {
            materiaNome: mat?.name || 'Medicina',
            topico: gerarForm.topico,
            quantidade: gerarForm.quantidade,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const novos = (data.flashcards || []).map((f) => ({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        materiaId: gerarForm.materiaId || null,
        frente: f.frente,
        verso: f.verso,
        dificuldade: f.dificuldade || 3,
        acertos: 0, erros: 0,
        ultimaRevisao: null, proximaRevisao: null, intervalo: 1,
        createdAt: new Date().toISOString(),
      }))
      const updated = addFlashcards(cards, novos)
      setCards(updated)
      setShowGerarIA(false)
      setGerarForm({ materiaId: '', topico: '', quantidade: 10 })
    } catch (e) {
      alert('Erro: ' + e.message)
    } finally {
      setLoadingIA(false)
    }
  }

  function handleAddManual() {
    if (!novoCard.frente.trim() || !novoCard.verso.trim()) return
    setCards(addFlashcard(cards, novoCard))
    setNovoCard({ materiaId: '', frente: '', verso: '', dificuldade: 3 })
    setShowAdd(false)
  }

  if (revisando) {
    return <ModoRevisao cards={paraRevisar.length > 0 ? paraRevisar : filtered} materiaId={filterMat} onFim={() => { setRevisando(false); setCards(loadFlashcards()) }} />
  }

  return (
    <div>
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-2xl p-3 shadow-card text-center">
          <p className="text-xl font-black text-indigo-600">{cards.length}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Total</p>
        </div>
        <div className={`rounded-2xl p-3 shadow-card text-center ${paraRevisar.length > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-white'}`}>
          <p className={`text-xl font-black ${paraRevisar.length > 0 ? 'text-amber-600' : 'text-slate-600'}`}>{paraRevisar.length}</p>
          <p className="text-[10px] font-semibold mt-0.5 opacity-70">Para revisar</p>
        </div>
        <div className={`rounded-2xl p-3 shadow-card text-center ${stats ? aprovColor(stats.taxaAcerto) : 'bg-white'}`}>
          <p className="text-xl font-black">{stats?.taxaAcerto ?? '—'}%</p>
          <p className="text-[10px] font-semibold mt-0.5 opacity-70">Acerto</p>
        </div>
      </div>

      {/* Botão revisar */}
      {cards.length > 0 && (
        <button
          onClick={() => setRevisando(true)}
          className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-2xl mb-4 transition-colors text-sm"
        >
          {paraRevisar.length > 0 ? `🔁 Revisar ${paraRevisar.length} card${paraRevisar.length > 1 ? 's' : ''} pendentes` : '📖 Revisar todos'}
        </button>
      )}

      {/* Filtro por matéria */}
      {materias.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <button onClick={() => setFilterMat('')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!filterMat ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            Todos
          </button>
          {materias.map((m) => (
            <button key={m.id} onClick={() => setFilterMat(m.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterMat === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {m.icon} {m.name}
            </button>
          ))}
        </div>
      )}

      {/* Lista de cards */}
      <div className="space-y-2 mb-4">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <div className="text-4xl mb-2">🃏</div>
            <p className="text-sm font-semibold text-slate-600">Nenhum flashcard ainda</p>
            <p className="text-xs mt-1">Gere com IA ou adicione manualmente</p>
          </div>
        )}
        {filtered.map((c) => {
          const mat = materias.find((m) => m.id === c.materiaId)
          const isOpen = expandido === c.id
          const pendente = !c.proximaRevisao || c.proximaRevisao <= new Date().toISOString().slice(0, 10)
          return (
            <div key={c.id} className={`bg-white rounded-2xl border shadow-card overflow-hidden ${pendente ? 'border-amber-200' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpandido(isOpen ? null : c.id)}>
                {mat && <span className="text-base flex-shrink-0">{mat.icon}</span>}
                <p className="flex-1 text-sm font-semibold text-slate-700 truncate">{c.frente}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {pendente && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                  <span className="text-slate-300 text-xs">{isOpen ? '▲' : '▾'}</span>
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-slate-100 px-3 pb-3 pt-2">
                  <p className="text-xs font-bold text-indigo-500 mb-1">Resposta:</p>
                  <p className="text-sm text-slate-700">{c.verso}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[10px] text-slate-400">✓{c.acertos} ✗{c.erros} · intervalo {c.intervalo}d</p>
                    <button onClick={() => setCards(removeFlashcard(cards, c.id))}
                      className="text-xs text-slate-300 hover:text-red-400 transition-colors">🗑️</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Ações */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setShowGerarIA(true)}
          className="flex-1 py-3 bg-indigo-500 text-white font-bold rounded-2xl text-sm">
          ✨ Gerar com IA
        </button>
        <button onClick={() => setShowAdd(true)}
          className="flex-1 py-3 border-2 border-dashed border-slate-200 text-slate-500 font-semibold rounded-2xl text-sm">
          + Manual
        </button>
      </div>

      {/* Modal gerar com IA */}
      {showGerarIA && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 shadow-xl animate-slideUp space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-slate-800">Gerar flashcards com IA</h2>
              <button onClick={() => setShowGerarIA(false)} className="text-slate-400 text-2xl">&times;</button>
            </div>
            <select value={gerarForm.materiaId} onChange={(e) => setGerarForm({ ...gerarForm, materiaId: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400">
              <option value="">Matéria (opcional)</option>
              {materias.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
            </select>
            <input value={gerarForm.topico} onChange={(e) => setGerarForm({ ...gerarForm, topico: e.target.value })}
              placeholder="Tópico — ex: Insuficiência cardíaca, Hipertensão..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Quantidade: {gerarForm.quantidade}</label>
              <input type="range" min={5} max={30} step={5} value={gerarForm.quantidade}
                onChange={(e) => setGerarForm({ ...gerarForm, quantidade: parseInt(e.target.value) })}
                className="w-full" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>5</span><span>30</span></div>
            </div>
            <button onClick={handleGerarIA} disabled={loadingIA || !gerarForm.topico.trim()}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
              {loadingIA ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gerando...</>
              ) : `Gerar ${gerarForm.quantidade} flashcards`}
            </button>
          </div>
        </div>
      )}

      {/* Modal add manual */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 shadow-xl animate-slideUp space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-slate-800">Novo flashcard</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 text-2xl">&times;</button>
            </div>
            <select value={novoCard.materiaId} onChange={(e) => setNovoCard({ ...novoCard, materiaId: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400">
              <option value="">Matéria (opcional)</option>
              {materias.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
            </select>
            <textarea value={novoCard.frente} onChange={(e) => setNovoCard({ ...novoCard, frente: e.target.value })}
              placeholder="Pergunta / frente do card"
              rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 resize-none" />
            <textarea value={novoCard.verso} onChange={(e) => setNovoCard({ ...novoCard, verso: e.target.value })}
              placeholder="Resposta / verso do card"
              rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 resize-none" />
            <button onClick={handleAddManual} disabled={!novoCard.frente.trim() || !novoCard.verso.trim()}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-40">
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
