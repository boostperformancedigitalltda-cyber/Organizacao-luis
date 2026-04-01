'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { GOAL_CATEGORIES, UNITS } from '@/lib/goals'

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6']

export default function AddGoalModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState({
    title: '',
    category: 'pessoal',
    period: 'mensal',
    targetMonth: new Date().toISOString().slice(0, 7),
    targetValue: '',
    unit: '%',
    color: '#6366f1',
  })

  const update = (field, val) => setForm((prev) => ({ ...prev, [field]: val }))

  const handleSave = () => {
    if (!form.title.trim() || !form.targetValue) return
    onAdd(form)
    setForm({
      title: '', category: 'pessoal', period: 'mensal',
      targetMonth: new Date().toISOString().slice(0, 7),
      targetValue: '', unit: '%', color: '#6366f1',
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova meta">
      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Ex: Economizar R$500..."
            className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 transition"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {GOAL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => update('category', cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  form.category === cat.id ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                style={form.category === cat.id ? { backgroundColor: cat.color } : {}}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target value + Unit */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor alvo *</label>
            <input
              type="number"
              value={form.targetValue}
              onChange={(e) => update('targetValue', e.target.value)}
              placeholder="100"
              className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 transition"
            />
          </div>
          <div className="w-28">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidade</label>
            <select
              value={form.unit}
              onChange={(e) => update('unit', e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 transition"
            >
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Period + Month */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Período</label>
            <select
              value={form.period}
              onChange={(e) => update('period', e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 transition"
            >
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prazo</label>
            <input
              type="month"
              value={form.targetMonth}
              onChange={(e) => update('targetMonth', e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 transition"
            />
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cor</label>
          <div className="flex gap-2 mt-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => update('color', c)}
                className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          Criar meta
        </button>
      </div>
    </Modal>
  )
}
