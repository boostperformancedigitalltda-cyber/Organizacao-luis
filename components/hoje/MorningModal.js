'use client'

import { useState } from 'react'
import { getTemplateBlocks, BLOCK_CATEGORIES } from '@/lib/planner'

const ENERGY_OPTIONS = [
  { value: 1, emoji: '😴', label: 'Cansado' },
  { value: 2, emoji: '😐', label: 'Normal' },
  { value: 3, emoji: '🙂', label: 'Bem' },
  { value: 4, emoji: '😊', label: 'Ótimo' },
  { value: 5, emoji: '🔥', label: 'Focado' },
]

export default function MorningModal({ date, onComplete }) {
  const [step, setStep] = useState(1)
  const [energy, setEnergy] = useState(3)
  const [priorities, setPriorities] = useState(['', '', ''])
  const [blocks, setBlocks] = useState(() => getTemplateBlocks(date))

  const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' })
  const dateStr = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

  const updatePriority = (i, val) => {
    const p = [...priorities]
    p[i] = val
    setPriorities(p)
  }

  const updateBlock = (uid, field, val) => {
    setBlocks((prev) => prev.map((b) => b.uid === uid ? { ...b, [field]: val } : b))
  }

  const removeBlock = (uid) => {
    setBlocks((prev) => prev.filter((b) => b.uid !== uid))
  }

  const addBlock = () => {
    const newBlock = {
      uid: `blk-${Date.now()}`,
      startTime: '08:00',
      endTime: '09:00',
      title: '',
      category: 'pessoal',
      icon: '📌',
      note: '',
      goalId: null,
    }
    setBlocks((prev) => [...prev, newBlock])
  }

  const handleFinish = () => {
    onComplete({ energy, priorities, blocks })
  }

  

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-indigo-50 to-white flex flex-col">
      {/* Progress indicator */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-indigo-500' : 'bg-slate-200'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        {/* Step 1: Greeting + Energy */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">☀️</div>
              <h1 className="text-2xl font-bold text-slate-900">Bom dia, Luis 👋</h1>
              <p className="text-slate-500 mt-1 capitalize">{dayName}, {dateStr}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                Como você está hoje?
              </p>
              <div className="flex justify-between gap-2">
                {ENERGY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setEnergy(opt.value)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                      energy === opt.value
                        ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className={`text-[10px] font-semibold ${energy === opt.value ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Priorities */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Top 3 do dia</h2>
              <p className="text-slate-500 text-sm mt-1">Quais são suas 3 prioridades hoje?</p>
            </div>

            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                      i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-300' : 'bg-orange-300'
                    }`}>
                      {i + 1}
                    </div>
                    <input
                      type="text"
                      value={priorities[i]}
                      onChange={(e) => updatePriority(i, e.target.value)}
                      placeholder={`Prioridade ${i + 1}...`}
                      className="flex-1 text-sm text-slate-800 placeholder-slate-300 bg-transparent border-none outline-none font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">Blocos do dia</h2>
              <p className="text-slate-500 text-sm mt-1">Ajuste conforme necessário</p>
            </div>

            <div className="space-y-2 mb-4">
              {blocks.map((block) => {
                const cat = BLOCK_CATEGORIES.find((c) => c.id === block.category) || BLOCK_CATEGORIES[4]
                return (
                  <div key={block.uid} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{block.icon}</span>
                      <input
                        type="text"
                        value={block.title}
                        onChange={(e) => updateBlock(block.uid, 'title', e.target.value)}
                        className="flex-1 text-sm font-semibold text-slate-800 bg-transparent border-none outline-none"
                        placeholder="Título do bloco"
                      />
                      <button
                        onClick={() => removeBlock(block.uid)}
                        className="text-slate-300 hover:text-rose-400 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={block.startTime}
                        onChange={(e) => updateBlock(block.uid, 'startTime', e.target.value)}
                        className="text-xs text-slate-500 bg-slate-50 rounded-lg px-2 py-1 border border-slate-100 outline-none"
                      />
                      <span className="text-xs text-slate-300">→</span>
                      <input
                        type="time"
                        value={block.endTime}
                        onChange={(e) => updateBlock(block.uid, 'endTime', e.target.value)}
                        className="text-xs text-slate-500 bg-slate-50 rounded-lg px-2 py-1 border border-slate-100 outline-none"
                      />
                      <select
                        value={block.category}
                        onChange={(e) => updateBlock(block.uid, 'category', e.target.value)}
                        className="ml-auto text-xs bg-slate-50 rounded-lg px-2 py-1 border border-slate-100 outline-none text-slate-600"
                      >
                        {BLOCK_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={addBlock}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-400 transition-colors mb-4"
            >
              + Adicionar bloco
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-6 bg-white border-t border-slate-100">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Voltar
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Próximo →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Começar o dia →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
