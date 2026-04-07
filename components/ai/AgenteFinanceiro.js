'use client'

import { useState, useRef, useEffect } from 'react'
import { loadTransactions, loadCategories, loadFinGoal } from '@/lib/finance'
import { get } from '@/lib/storage'

export default function AgenteFinanceiro({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! Sou seu agente financeiro. Tenho acesso aos seus dados reais de receitas, despesas e orçamentos. Me pergunte qualquer coisa — gastos, metas, onde economizar, como está seu mês...',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
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
        transactions: loadTransactions(),
        categories: loadCategories(),
        finGoal: loadFinGoal(),
        budgets: get('sdv2-budgets', []),
      }

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'agente-financeiro',
          payload: { messages: newMessages, contexto },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Erro: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const SUGESTOES = [
    'Como está meu mês?',
    'Onde estou gastando mais?',
    'Consigo economizar esse mês?',
    'Estou dentro do orçamento?',
  ]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">💰</div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm">Agente Financeiro</p>
          <p className="text-[10px] text-slate-400">Analisa seus dados reais</p>
        </div>
        <button onClick={onClose} className="text-slate-400 text-2xl leading-none w-8 h-8 flex items-center justify-center">&times;</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                isUser
                  ? 'bg-emerald-500 text-white rounded-br-sm'
                  : 'bg-slate-100 text-slate-800 rounded-bl-sm'
              }`}>
                {msg.content}
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

      {/* Sugestões rápidas (só quando poucos messages) */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              onClick={() => { setInput(s); }}
              className="flex-shrink-0 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-6 pt-2 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Pergunte sobre suas finanças..."
            className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-300"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-11 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
