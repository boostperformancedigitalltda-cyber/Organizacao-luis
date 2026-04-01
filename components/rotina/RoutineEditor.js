'use client'

import { useState, useEffect } from 'react'
import { get, set, KEYS } from '@/lib/storage'
import { TEMPLATES, BLOCK_CATEGORIES, DAY_NAMES, DAY_LABELS } from '@/lib/planner'

function emptyBlock() {
  return { startTime: '08:00', endTime: '09:00', title: '', category: 'pessoal', icon: '📌' }
}

function loadRoutine() {
  const saved = get(KEYS.routine, null)
  if (saved) return saved
  // Convert default TEMPLATES to the same shape (no uid/note needed in templates)
  const base = {}
  for (let d = 0; d <= 6; d++) {
    base[d] = (TEMPLATES[d] || []).map(({ startTime, endTime, title, category, icon }) => ({
      startTime, endTime, title, category, icon,
    }))
  }
  return base
}

function BlockRow({ block, onChange, onDelete }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={block.icon}
          onChange={(e) => onChange({ ...block, icon: e.target.value })}
          className="w-10 text-center text-base bg-white border border-slate-200 rounded-lg py-1 outline-none"
          maxLength={2}
        />
        <input
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Nome do bloco"
          className="flex-1 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-400 transition"
        />
        <button
          onClick={onDelete}
          className="text-slate-300 hover:text-rose-400 transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 flex-shrink-0"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <input
            type="time"
            value={block.startTime}
            onChange={(e) => onChange({ ...block, startTime: e.target.value })}
            className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none"
          />
          <span className="text-slate-300 text-xs font-bold">→</span>
          <input
            type="time"
            value={block.endTime}
            onChange={(e) => onChange({ ...block, endTime: e.target.value })}
            className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none"
          />
        </div>
        <select
          value={block.category}
          onChange={(e) => onChange({ ...block, category: e.target.value })}
          className="ml-auto text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none text-slate-600"
        >
          {BLOCK_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function RoutineEditor() {
  const [routine, setRoutine] = useState(null)
  const [activeDay, setActiveDay] = useState(() => {
    const d = new Date().getDay()
    return d === 0 ? 0 : d // default to today
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setRoutine(loadRoutine())
  }, [])

  if (!routine) return null

  const updateBlock = (idx, updated) => {
    const blocks = [...(routine[activeDay] || [])]
    blocks[idx] = updated
    const newRoutine = { ...routine, [activeDay]: blocks }
    setRoutine(newRoutine)
    set(KEYS.routine, newRoutine)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const deleteBlock = (idx) => {
    const blocks = (routine[activeDay] || []).filter((_, i) => i !== idx)
    const newRoutine = { ...routine, [activeDay]: blocks }
    setRoutine(newRoutine)
    set(KEYS.routine, newRoutine)
  }

  const addBlock = () => {
    const blocks = [...(routine[activeDay] || []), emptyBlock()]
    const newRoutine = { ...routine, [activeDay]: blocks }
    setRoutine(newRoutine)
    set(KEYS.routine, newRoutine)
  }

  const resetDay = () => {
    const defaultBlocks = (TEMPLATES[activeDay] || []).map(
      ({ startTime, endTime, title, category, icon }) => ({ startTime, endTime, title, category, icon })
    )
    const newRoutine = { ...routine, [activeDay]: defaultBlocks }
    setRoutine(newRoutine)
    set(KEYS.routine, newRoutine)
  }

  const resetAll = () => {
    const base = {}
    for (let d = 0; d <= 6; d++) {
      base[d] = (TEMPLATES[d] || []).map(({ startTime, endTime, title, category, icon }) => ({
        startTime, endTime, title, category, icon,
      }))
    }
    setRoutine(base)
    set(KEYS.routine, base)
  }

  const dayBlocks = routine[activeDay] || []

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Minha Rotina</h1>
        <p className="text-sm text-slate-500">Configure o template padrão de cada dia</p>
      </div>

      {/* Day selector */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {DAY_LABELS.map((label, d) => {
          const count = (routine[d] || []).length
          return (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border transition-all ${
                activeDay === d
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm'
                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
            >
              <span className="text-xs font-bold">{label}</span>
              <span className={`text-[10px] font-semibold mt-0.5 ${activeDay === d ? 'text-indigo-400' : 'text-slate-300'}`}>
                {count} bloco{count !== 1 ? 's' : ''}
              </span>
            </button>
          )
        })}
      </div>

      {/* Day title + reset */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-slate-700">{DAY_NAMES[activeDay]}</p>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-[10px] text-emerald-500 font-bold">✓ Salvo</span>
          )}
          <button
            onClick={resetDay}
            className="text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors"
          >
            Resetar dia
          </button>
        </div>
      </div>

      {/* Block list */}
      {dayBlocks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm mb-3">
          <p className="text-3xl mb-2">😴</p>
          <p className="text-sm text-slate-400">Nenhum bloco neste dia</p>
          <p className="text-xs text-slate-300 mt-1">Dia livre ou adicione blocos abaixo</p>
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          {dayBlocks.map((block, idx) => (
            <BlockRow
              key={idx}
              block={block}
              onChange={(updated) => updateBlock(idx, updated)}
              onDelete={() => deleteBlock(idx)}
            />
          ))}
        </div>
      )}

      {/* Add block */}
      <button
        onClick={addBlock}
        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-400 transition-colors mb-6"
      >
        + Adicionar bloco
      </button>

      {/* Info */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
        <p className="text-xs text-indigo-500 font-semibold leading-relaxed">
          Esses blocos aparecem automaticamente como sugestão ao planejar um novo dia.
          Você pode editar ou remover qualquer bloco antes de confirmar.
        </p>
        <button
          onClick={resetAll}
          className="mt-3 text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors underline-offset-2 hover:underline"
        >
          Restaurar todos os dias ao padrão
        </button>
      </div>
    </div>
  )
}
