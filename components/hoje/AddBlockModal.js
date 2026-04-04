'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { BLOCK_CATEGORIES, makeNewBlock } from '@/lib/planner'

const ICONS = ['📌', '📚', '💪', '🏠', '💼', '🍳', '🧹', '🎯', '💰', '🎮', '🏃', '🧘', '📝', '🔧', '🛒', '☕', '🎵', '📞']

export default function AddBlockModal({ open, onClose, onAdd, initialBlock }) {
  const [block, setBlock] = useState(initialBlock || makeNewBlock())

  const handleOpen = () => {
    setBlock(initialBlock || makeNewBlock())
  }

  const update = (field, val) => setBlock((prev) => ({ ...prev, [field]: val }))

  const handleSave = () => {
    if (!block.title.trim()) return
    onAdd(block)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initialBlock ? 'Editar bloco' : 'Novo bloco'}>
      <div className="p-5 space-y-4">
        {/* Icon picker */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ícone</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => update('icon', ic)}
                className={`w-11 h-11 flex items-center justify-center rounded-xl text-xl transition-all ${
                  block.icon === ic ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título *</label>
          <input
            type="text"
            value={block.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Ex: Estudo de React..."
            className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Times */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Início</label>
            <input
              type="time"
              value={block.startTime}
              onChange={(e) => update('startTime', e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 transition"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fim</label>
            <input
              type="time"
              value={block.endTime}
              onChange={(e) => update('endTime', e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 transition"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {BLOCK_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => update('category', cat.id)}
                className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                  block.category === cat.id
                    ? 'text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                style={block.category === cat.id ? { backgroundColor: cat.color } : {}}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nota (opcional)</label>
          <textarea
            value={block.note}
            onChange={(e) => update('note', e.target.value)}
            placeholder="Alguma observação..."
            rows={2}
            className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 transition resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          Salvar bloco
        </button>
      </div>
    </Modal>
  )
}
