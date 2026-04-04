'use client'

import { useState } from 'react'
import { addToInbox, CAPTURE_TYPES } from '@/lib/quickcapture'

export default function QuickCapture({ inbox, setInbox }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [type, setType] = useState('task')

  function handleSave() {
    if (!text.trim()) return
    setInbox(addToInbox(inbox, { text, type }))
    setText('')
    setType('task')
    setOpen(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-30 w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-lg flex items-center justify-center text-xl transition-all hover:scale-105 active:scale-95"
        title="Captura rápida"
      >
        ⚡
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 shadow-xl animate-slideUp">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-800">⚡ Captura rápida</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 text-2xl leading-none">&times;</button>
            </div>

            {/* Type selector */}
            <div className="flex gap-2 mb-3">
              {CAPTURE_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex-1 flex flex-col items-center py-2 rounded-xl border transition-all ${
                    type === t.id
                      ? `${t.bg} ${t.color} border-current`
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <span className="text-lg leading-none">{t.icon}</span>
                  <span className="text-[10px] font-bold mt-0.5">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Input */}
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="O que você quer capturar? (Enter para salvar)"
              rows={3}
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 resize-none"
            />

            <button
              onClick={handleSave}
              disabled={!text.trim()}
              className="mt-3 w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-40"
            >
              Salvar na inbox ⚡
            </button>

            {inbox.filter((i) => !i.processed).length > 0 && (
              <p className="text-center text-xs text-slate-400 mt-2">
                {inbox.filter((i) => !i.processed).length} item(s) na inbox para processar
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
