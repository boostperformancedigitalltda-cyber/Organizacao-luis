'use client'

import { useState, useRef, useEffect } from 'react'
import { loadMaterias } from '@/lib/estudos'
import { loadProvas } from '@/lib/provas'
import { loadAulas, loadDisponibilidade } from '@/lib/disponibilidade'
import { loadDayPlan, saveDayPlan, timeToMinutes } from '@/lib/planner'
import { dateKey } from '@/lib/date'

function parsePlano(text) {
  const match = text.match(/<PLANO>([\s\S]*?)<\/PLANO>/)
  if (!match) return null
  try {
    return JSON.parse(match[1].trim())
  } catch { return null }
}

function textWithoutPlano(text) {
  return text.replace(/<PLANO>[\s\S]*?<\/PLANO>/g, '').trim()
}

export default function AgenteRotina({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Oi! Vou te ajudar a montar o cronograma da semana. Me conta o que você precisa fazer — pode ser qualquer coisa: estudar, treinar, compromissos, consultas, eventos. Fala tudo e eu monto pra você.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [planoGerado, setPlanoGerado] = useState(null)
  const [aplicando, setAplicando] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const contexto = {
        materias: loadMaterias(),
        provas: loadProvas(),
        aulas: loadAulas(),
        disponibilidade: loadDisponibilidade(),
      }

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'agente-rotina',
          payload: {
            messages: newMessages,
            contexto,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const reply = data.reply
      const plano = parsePlano(reply)
      if (plano) setPlanoGerado(plano)

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Erro: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  function handleAplicar() {
    if (!planoGerado?.blocos) return
    setAplicando(true)

    // Agrupa blocos por data
    const byDate = {}
    planoGerado.blocos.forEach((b) => {
      if (!byDate[b.data]) byDate[b.data] = []
      byDate[b.data].push(b)
    })

    Object.entries(byDate).forEach(([dk, blocos]) => {
      const plan = loadDayPlan(dk) || { date: dk, blocks: [], completed: {}, planned: true }
      const novos = blocos.map((b) => ({
        uid: `agente-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        startTime: b.startTime,
        endTime: b.endTime,
        title: b.titulo,
        category: b.categoria || 'pessoal',
        icon: b.icone || '📌',
        note: b.nota || '',
        materiaId: b.materiaId || null,
      }))
      plan.blocks = [...(plan.blocks || []), ...novos].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      )
      plan.planned = true
      saveDayPlan(dk, plan)
    })

    setAplicando(false)
    const total = planoGerado.blocos.length
    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: `✅ ${total} blocos adicionados à sua semana! Você pode ver tudo na aba Semana ou no Hoje.`,
    }])
    setPlanoGerado(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">🗓️</div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm">Agente de Rotina</p>
          <p className="text-[10px] text-slate-400">Monta seu cronograma semanal</p>
        </div>
        <button onClick={onClose} className="text-slate-400 text-2xl leading-none w-8 h-8 flex items-center justify-center">&times;</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          const displayText = isUser ? msg.content : textWithoutPlano(msg.content)
          const plano = !isUser ? parsePlano(msg.content) : null

          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${isUser ? 'order-1' : ''}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-500 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                }`}>
                  {displayText}
                </div>
                {plano && (
                  <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-2xl p-3">
                    <p className="text-xs font-bold text-indigo-700 mb-2">📋 Plano gerado — {plano.blocos?.length} blocos</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {(plano.blocos || []).map((b, j) => (
                        <div key={j} className="flex items-center gap-2 text-xs text-indigo-800">
                          <span>{b.icone || '📌'}</span>
                          <span className="font-semibold">{b.titulo}</span>
                          <span className="text-indigo-400 ml-auto flex-shrink-0">{b.startTime}–{b.endTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Aplicar plano */}
      {planoGerado && (
        <div className="px-4 pb-2">
          <button
            onClick={handleAplicar}
            disabled={aplicando}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-sm transition-colors disabled:opacity-50"
          >
            ✅ Aplicar {planoGerado.blocos?.length} blocos à semana
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-6 pt-2 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ex: preciso estudar clínica 2h, treino segunda e quarta..."
            className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-300"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-11 h-11 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
