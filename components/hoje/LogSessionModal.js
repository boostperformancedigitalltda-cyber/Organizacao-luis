'use client'

import { useState } from 'react'
import { DURATIONS } from '@/lib/planner'
import { formatDuration } from '@/lib/sessions'

const STUDY_SUBJECTS = [
  'Matemática', 'Programação', 'Inglês', 'Direito', 'Economia',
  'Física', 'Química', 'Biologia', 'História', 'Português', 'Outro',
]

const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps',
  'Perna', 'Glúteo', 'Abdômen', 'Full Body', 'Cardio',
]

const DURATION_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1h',     value: 60 },
  { label: '1h30',   value: 90 },
  { label: '2h',     value: 120 },
  { label: '2h30',   value: 150 },
  { label: '3h',     value: 180 },
]

export default function LogSessionModal({ task, onSave, onClose }) {
  const isStudy = task.category === 'estudo'
  const [duration, setDuration] = useState(task.duration || 60)
  const [subject, setSubject] = useState(isStudy ? '' : '')
  const [note, setNote] = useState('')

  const handleSave = () => {
    if (!subject) return
    onSave({
      type: isStudy ? 'estudo' : 'treino',
      duration,
      subject,
      note,
    })
  }

  const subjects = isStudy ? STUDY_SUBJECTS : MUSCLE_GROUPS
  const title = isStudy ? 'Registrar estudo' : 'Registrar treino'
  const subjectLabel = isStudy ? 'Matéria' : 'Grupo muscular'
  const color = isStudy ? 'brand' : 'green'

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full md:max-w-sm bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-card-lg">
        <div className="w-10 h-1 bg-surface-200 rounded-full mx-auto mb-5 md:hidden" />

        <h2 className="text-lg font-bold text-ink mb-5">
          {task.icon} {title}
        </h2>

        {/* Duration */}
        <div className="mb-4">
          <label className="text-xs font-bold text-ink-subtle uppercase tracking-wider block mb-2">
            Duração
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={`py-2 rounded-xl text-xs font-semibold border transition-colors
                  ${duration === d.value
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-surface-50 text-ink-muted border-surface-200 hover:border-brand-300'
                  }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div className="mb-4">
          <label className="text-xs font-bold text-ink-subtle uppercase tracking-wider block mb-2">
            {subjectLabel}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`py-2 rounded-xl text-xs font-semibold border transition-colors
                  ${subject === s
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-surface-50 text-ink-muted border-surface-200 hover:border-brand-300'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-5">
          <label className="text-xs font-bold text-ink-subtle uppercase tracking-wider block mb-2">
            Observação (opcional)
          </label>
          <input
            type="text"
            placeholder={isStudy ? 'Ex: Capítulo 3 – funções...' : 'Ex: 4 séries de 12...'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-surface-200 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-brand-400"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border border-surface-200 text-ink-muted font-semibold text-sm hover:bg-surface-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!subject}
            className="flex-1 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Salvar sessão
          </button>
        </div>
      </div>
    </div>
  )
}
