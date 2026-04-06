'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { BLOCK_CATEGORIES, makeNewBlock } from '@/lib/planner'
import { loadMaterias } from '@/lib/estudos'

const ICONS = ['📌', '📚', '💪', '🏠', '💼', '🍳', '🧹', '🎯', '💰', '🎮', '🏃', '🧘', '📝', '🔧', '🛒', '☕', '🎵', '📞']

export default function AddBlockModal({ open, onClose, onAdd, onRemove, initialBlock }) {
  const [block, setBlock] = useState(initialBlock || makeNewBlock())
  const [materias, setMaterias] = useState([])

  useEffect(() => {
    setMaterias(loadMaterias())
  }, [])

  const handleOpen = () => {
    setBlock(initialBlock || makeNewBlock())
  }

  const update = (field, val) => setBlock((prev) => ({ ...prev, [field]: val }))

  const handleSave = () => {
    if (!block.title.trim()) return
    onAdd(block)
    onClose()
  }

  const selectMateria = (mat) => {
    setBlock((prev) => ({
      ...prev,
      title: mat.name,
      icon: mat.icon,
      materiaId: mat.id,
    }))
  }

  const isEstudo = block.category === 'estudo'

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
                onClick={() => {
                  update('category', cat.id)
                  if (cat.id !== 'estudo') update('materiaId', null)
                }}
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

        {/* Materia picker (only when estudo) */}
        {isEstudo && materias.length > 0 && (
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matéria</label>
            <div className="flex flex-col gap-2 mt-2">
              {materias.map((mat) => {
                const selected = block.materiaId === mat.id
                return (
                  <button
                    key={mat.id}
                    onClick={() => selectMateria(mat)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                      selected
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-xl">{mat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${selected ? 'text-indigo-700' : 'text-slate-700'}`}>
                        {mat.name}
                      </p>
                      {mat.weeklyGoalHours && (
                        <p className="text-[10px] text-slate-400">Meta: {mat.weeklyGoalHours}h/semana</p>
                      )}
                    </div>
                    {selected && <span className="text-indigo-500 font-bold text-sm">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {isEstudo && materias.length === 0 && (
          <div className="bg-indigo-50 rounded-xl px-3 py-2.5 text-xs text-indigo-600 font-medium">
            Nenhuma matéria cadastrada. Adicione na aba Estudos.
          </div>
        )}

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
          className="w-full py-3.5 btn-primary rounded-xl font-bold"
        >
          Salvar bloco
        </button>

        {initialBlock && onRemove && (
          <button
            onClick={() => { onRemove(initialBlock.uid); onClose() }}
            className="w-full py-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 font-semibold rounded-xl transition-colors text-sm"
          >
            Remover bloco
          </button>
        )}
      </div>
    </Modal>
  )
}
