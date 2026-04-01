'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

const ICONS = ['⭐', '💪', '📚', '🧘', '🏃', '🥗', '💧', '🎯', '🎵', '💻', '📝', '🛏️', '☀️', '🌙', '💊', '🏋️', '🚴', '🧹', '🍎', '🧠']
const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6']

export default function AddHabitModal({ open, onClose, onAdd }) {
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('⭐')
  const [color, setColor] = useState('#6366f1')
  const [frequency, setFrequency] = useState('daily')

  const handleSave = () => {
    if (!title.trim()) return
    onAdd({ title: title.trim(), icon, color, frequency })
    setTitle('')
    setIcon('⭐')
    setColor('#6366f1')
    setFrequency('daily')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo hábito">
      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome do hábito *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Beber 2L de água..."
            className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 transition"
          />
        </div>

        {/* Icon */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ícone</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-lg transition-all ${
                  icon === ic ? 'bg-indigo-100 ring-2 ring-indigo-400 scale-110' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cor</label>
          <div className="flex gap-2 mt-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c, ringColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Frequência</label>
          <div className="flex gap-2 mt-2">
            {[
              { value: 'daily', label: 'Diário' },
              { value: 'weekdays', label: 'Dias úteis' },
              { value: 'weekends', label: 'Fins de semana' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFrequency(opt.value)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  frequency === opt.value
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          Criar hábito
        </button>
      </div>
    </Modal>
  )
}
