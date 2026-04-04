'use client'

import { useState, useEffect } from 'react'
import {
  loadMaterias, saveMaterias, addMateria, updateMateria, removeMateria,
  addTopic, toggleTopic, removeTopic, setTopicReview, getTopicsForReviewToday,
  loadStudyBlocks, getBlocksForDate, addStudyBlock, toggleStudyBlock,
  removeStudyBlock, updateStudyBlock, getWeeklyStats, formatMin,
  DEFAULT_ICONS,
} from '@/lib/estudos'
import { dateKey } from '@/lib/date'

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16']

function blockDuration(b) {
  if (!b.startTime || !b.endTime) return 0
  const [sh, sm] = b.startTime.split(':').map(Number)
  const [eh, em] = b.endTime.split(':').map(Number)
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
}

// ── Add/Edit Block Modal ──────────────────────────────────────────────────────
function BlockModal({ materias, initial, onSave, onClose }) {
  const [materiaId, setMateriaId] = useState(initial?.materiaId || materias[0]?.id || '')
  const [topic, setTopic] = useState(initial?.topic || '')
  const [startTime, setStartTime] = useState(initial?.startTime || '19:00')
  const [endTime, setEndTime] = useState(initial?.endTime || '20:00')
  const [note, setNote] = useState(initial?.note || '')

  function save() {
    if (!materiaId) return
    onSave({ materiaId, topic, startTime, endTime, note })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 shadow-xl animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg">{initial ? 'Editar bloco' : 'Novo bloco de estudo'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Matéria</label>
            <select
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400"
            >
              {materias.map((m) => (
                <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tópico / assunto</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Capítulo 3 – Derivadas"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fim</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Observação (opcional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Fazer exercícios 1 a 10"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={!materiaId}
          className="mt-5 w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-40"
        >
          {initial ? 'Salvar alterações' : 'Adicionar bloco'}
        </button>
      </div>
    </div>
  )
}

// ── Add/Edit Materia Modal ────────────────────────────────────────────────────
function MateriaModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [icon, setIcon] = useState(initial?.icon || '📚')
  const [color, setColor] = useState(initial?.color || COLORS[0])
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(initial?.weeklyGoalHours ?? 2)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 shadow-xl animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg">{initial ? 'Editar matéria' : 'Nova matéria'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cálculo, Física, Inglês..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`text-xl w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    icon === ic ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110' : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Cor</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ background: c }}
                  className={`w-10 h-10 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Meta semanal (horas)</label>
            <input
              type="number"
              min="0.5"
              max="40"
              step="0.5"
              value={weeklyGoalHours}
              onChange={(e) => setWeeklyGoalHours(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <button
          onClick={() => name.trim() && onSave({ name: name.trim(), icon, color, weeklyGoalHours })}
          disabled={!name.trim()}
          className="mt-5 w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-40"
        >
          {initial ? 'Salvar' : 'Criar matéria'}
        </button>
      </div>
    </div>
  )
}

// ── Today Tab ─────────────────────────────────────────────────────────────────
function TodayTab({ materias, blocks, setBlocks }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editBlock, setEditBlock] = useState(null)
  const dk = dateKey(new Date())
  const todayBlocks = getBlocksForDate(blocks, dk)
    .slice()
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

  const total = todayBlocks.length
  const done = todayBlocks.filter((b) => b.completed).length
  const totalMin = todayBlocks.reduce((s, b) => s + blockDuration(b), 0)
  const doneMin = todayBlocks.filter((b) => b.completed).reduce((s, b) => s + blockDuration(b), 0)

  function handleAdd(data) {
    setBlocks(addStudyBlock(blocks, { ...data, date: dk }))
    setShowAdd(false)
  }

  function handleEdit(data) {
    setBlocks(updateStudyBlock(blocks, editBlock.id, data))
    setEditBlock(null)
  }

  function handleToggle(id) {
    setBlocks(toggleStudyBlock(blocks, id))
  }

  function handleRemove(id) {
    if (!confirm('Remover este bloco?')) return
    setBlocks(removeStudyBlock(blocks, id))
  }

  if (materias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-3">📚</div>
        <p className="text-slate-600 font-semibold mb-1">Nenhuma matéria cadastrada</p>
        <p className="text-slate-400 text-sm">Vá em "Matérias" e adicione suas disciplinas primeiro.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header summary */}
      {total > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-600">Progresso de hoje</span>
            <span className="text-sm font-bold text-indigo-600">{done}/{total} blocos</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>{formatMin(doneMin)} concluídos</span>
            <span>{formatMin(totalMin)} planejados</span>
          </div>
        </div>
      )}

      {/* Blocks list */}
      <div className="space-y-2 mb-4">
        {todayBlocks.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <div className="text-3xl mb-2">🌙</div>
            <p className="text-sm">Nenhum bloco de estudo para hoje.</p>
            <p className="text-xs mt-1">Planeje o que vai estudar após as aulas!</p>
          </div>
        )}
        {todayBlocks.map((b) => {
          const mat = materias.find((m) => m.id === b.materiaId)
          const dur = blockDuration(b)
          return (
            <div
              key={b.id}
              className={`bg-white rounded-2xl p-3.5 shadow-card flex items-start gap-3 transition-opacity ${b.completed ? 'opacity-60' : ''}`}
            >
              <button
                onClick={() => handleToggle(b.id)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                  b.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-indigo-400'
                }`}
              >
                {b.completed && <span className="text-white text-xs">✓</span>}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{mat?.icon || '📚'}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: mat?.color || '#6366f1' }}
                  >
                    {mat?.name || 'Matéria'}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto">{b.startTime}–{b.endTime}</span>
                </div>
                {b.topic && (
                  <p className={`text-sm font-semibold text-slate-700 mt-1 ${b.completed ? 'line-through' : ''}`}>
                    {b.topic}
                  </p>
                )}
                {b.note && <p className="text-xs text-slate-400 mt-0.5">{b.note}</p>}
                {dur > 0 && <p className="text-xs text-slate-400 mt-0.5">{formatMin(dur)}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setEditBlock(b)}
                  className="text-slate-300 hover:text-indigo-400 text-sm"
                >✏️</button>
                <button
                  onClick={() => handleRemove(b.id)}
                  className="text-slate-300 hover:text-red-400 text-sm"
                >🗑️</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold py-3 rounded-2xl hover:bg-indigo-50 transition-colors text-sm"
      >
        + Adicionar bloco de estudo
      </button>

      {showAdd && (
        <BlockModal materias={materias} onSave={handleAdd} onClose={() => setShowAdd(false)} />
      )}
      {editBlock && (
        <BlockModal materias={materias} initial={editBlock} onSave={handleEdit} onClose={() => setEditBlock(null)} />
      )}
    </div>
  )
}

// ── Materias Tab ──────────────────────────────────────────────────────────────
function MateriasTab({ materias, setMaterias, blocks, setBlocks }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editMat, setEditMat] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [newTopic, setNewTopic] = useState('')

  function handleAdd(data) {
    setMaterias(addMateria(materias, data))
    setShowAdd(false)
  }

  function handleEdit(data) {
    setMaterias(updateMateria(materias, editMat.id, data))
    setEditMat(null)
  }

  function handleRemove(id) {
    if (!confirm('Remover esta matéria e todos os blocos associados?')) return
    const res = removeMateria(materias, blocks, id)
    setMaterias(res.materias)
    setBlocks(res.blocks)
    if (expanded === id) setExpanded(null)
  }

  function handleAddTopic(materiaId) {
    if (!newTopic.trim()) return
    setMaterias(addTopic(materias, materiaId, newTopic.trim()))
    setNewTopic('')
  }

  function handleToggleTopic(materiaId, topicId) {
    setMaterias(toggleTopic(materias, materiaId, topicId))
  }

  function handleRemoveTopic(materiaId, topicId) {
    setMaterias(removeTopic(materias, materiaId, topicId))
  }

  return (
    <div>
      <div className="space-y-3 mb-4">
        {materias.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <div className="text-3xl mb-2">📖</div>
            <p className="text-sm">Nenhuma matéria ainda.</p>
          </div>
        )}
        {materias.map((m) => {
          const isOpen = expanded === m.id
          const done = (m.topics || []).filter((t) => t.status === 'feito').length
          const total = (m.topics || []).length
          return (
            <div key={m.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: m.color + '20' }}
                >
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                  <p className="text-xs text-slate-400">Meta: {m.weeklyGoalHours}h/sem {total > 0 ? `· ${done}/${total} tópicos` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditMat(m)} className="text-slate-300 hover:text-indigo-400 text-base">✏️</button>
                  <button onClick={() => handleRemove(m.id)} className="text-slate-300 hover:text-red-400 text-base">🗑️</button>
                  <button
                    onClick={() => setExpanded(isOpen ? null : m.id)}
                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  >
                    ▾
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-100 px-4 py-3">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Tópicos / conteúdos</p>
                  <div className="space-y-2 mb-3">
                    {(m.topics || []).length === 0 && (
                      <p className="text-xs text-slate-400 italic">Nenhum tópico ainda.</p>
                    )}
                    {(m.topics || []).map((t) => {
                      const today = new Date().toISOString().slice(0, 10)
                      const reviewDue = t.reviewDate && t.reviewDate <= today
                      return (
                      <div key={t.id}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleTopic(m.id, t.id)}
                            className={`w-6 h-6 rounded flex-shrink-0 border-2 flex items-center justify-center text-xs transition-all ${
                              t.status === 'feito'
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {t.status === 'feito' && '✓'}
                          </button>
                          <span className={`text-sm flex-1 ${t.status === 'feito' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {t.title}
                          </span>
                          <button
                            onClick={() => handleRemoveTopic(m.id, t.id)}
                            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-400"
                          >✕</button>
                        </div>
                        {/* Revisão espaçada */}
                        <div className="flex items-center gap-1.5 mt-1 ml-8">
                          {t.reviewDate ? (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${reviewDue ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-500'}`}>
                              🔁 {reviewDue ? 'Revisar hoje!' : `Revisar em ${t.reviewDate}`}
                            </span>
                          ) : t.status !== 'feito' ? (
                            <div className="flex gap-1">
                              {[3, 7, 14].map((d) => (
                                <button key={d}
                                  onClick={() => setMaterias(setTopicReview(materias, m.id, t.id, d))}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-all">
                                  +{d}d
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )})}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTopic(m.id)}
                      placeholder="Novo tópico..."
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={() => handleAddTopic(m.id)}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="w-full border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold py-3 rounded-2xl hover:bg-indigo-50 transition-colors text-sm"
      >
        + Nova matéria
      </button>

      {showAdd && <MateriaModal onSave={handleAdd} onClose={() => setShowAdd(false)} />}
      {editMat && <MateriaModal initial={editMat} onSave={handleEdit} onClose={() => setEditMat(null)} />}
    </div>
  )
}

// ── Progress Tab ──────────────────────────────────────────────────────────────
function ProgressTab({ materias, blocks }) {
  // Current week start (Monday)
  const today = new Date()
  const dow = today.getDay() // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() + diff)

  const stats = getWeeklyStats(blocks, materias, weekStart)
  const totalGoalMin = stats.reduce((s, x) => s + x.goalMin, 0)
  const totalDoneMin = stats.reduce((s, x) => s + x.completedMin, 0)

  // Last 7 days for each materia
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
  const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  return (
    <div className="space-y-4">
      {/* Week summary */}
      <div className="bg-white rounded-2xl p-4 shadow-card">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Semana atual</p>
        <div className="flex items-end justify-between mb-2">
          <span className="text-sm text-slate-600">Total concluído</span>
          <span className="text-sm font-bold text-indigo-600">{formatMin(totalDoneMin)} / {formatMin(totalGoalMin)}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div
            className="bg-indigo-500 h-2.5 rounded-full transition-all"
            style={{ width: `${totalGoalMin ? Math.min(100, (totalDoneMin / totalGoalMin) * 100) : 0}%` }}
          />
        </div>
      </div>

      {/* Per-subject stats */}
      {materias.length === 0 && (
        <div className="text-center py-10 text-slate-400">
          <p className="text-sm">Cadastre matérias para ver o progresso.</p>
        </div>
      )}
      {stats.map(({ materia: m, totalMin, completedMin, goalMin }) => {
        const pct = goalMin ? Math.min(100, Math.round((completedMin / goalMin) * 100)) : 0
        return (
          <div key={m.id} className="bg-white rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{m.icon}</span>
              <span className="font-bold text-slate-800 text-sm">{m.name}</span>
              <span className="ml-auto text-xs text-slate-400">{formatMin(completedMin)} / {formatMin(goalMin)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${pct}%`, background: m.color }}
              />
            </div>
            {/* Daily dots */}
            <div className="flex gap-1">
              {days.map((dk, i) => {
                const dayBlocks = blocks.filter((b) => b.materiaId === m.id && b.date === dk)
                const hasDone = dayBlocks.some((b) => b.completed)
                const hasPlanned = dayBlocks.length > 0
                return (
                  <div key={dk} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full h-4 rounded"
                      style={{
                        background: hasDone ? m.color : hasPlanned ? m.color + '40' : '#f1f5f9',
                      }}
                    />
                    <span className="text-[9px] text-slate-400">{DAY_LABELS[i]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function EstudosView() {
  const [subTab, setSubTab] = useState('hoje')
  const [materias, setMaterias] = useState([])
  const [blocks, setBlocks] = useState([])

  useEffect(() => {
    setMaterias(loadMaterias())
    setBlocks(loadStudyBlocks())
  }, [])

  const SUB_TABS = [
    { id: 'hoje',     label: 'Hoje',     icon: '📅' },
    { id: 'materias', label: 'Matérias', icon: '📚' },
    { id: 'progresso',label: 'Progresso',icon: '📊' },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-800">Estudos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Plano de estudos pós-aula</p>
      </div>

      {/* Sub-tab nav */}
      <div className="flex gap-2 mb-5 bg-slate-100 p-1 rounded-2xl">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              subTab === t.id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {subTab === 'hoje' && (
        <TodayTab materias={materias} blocks={blocks} setBlocks={setBlocks} />
      )}
      {subTab === 'materias' && (
        <MateriasTab
          materias={materias}
          setMaterias={setMaterias}
          blocks={blocks}
          setBlocks={setBlocks}
        />
      )}
      {subTab === 'progresso' && (
        <ProgressTab materias={materias} blocks={blocks} />
      )}
    </div>
  )
}
