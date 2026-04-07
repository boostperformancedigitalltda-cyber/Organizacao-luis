'use client'

import { useState, useEffect } from 'react'
import {
  loadMaterias, saveMaterias, addMateria, updateMateria, removeMateria,
  addTopic, toggleTopic, removeTopic, setTopicReview, getTopicsForReviewToday,
  loadStudyBlocks, getBlocksForDate, addStudyBlock, toggleStudyBlock,
  removeStudyBlock, updateStudyBlock, getWeeklyStats, formatMin,
  loadSimulados, addSimulado, removeSimulado, getSimuladoStats,
  getQuestoesDia, setQuestoesDia,
  seedMateriasMedicina, DEFAULT_ICONS,
} from '@/lib/estudos'
import { dateKey } from '@/lib/date'

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16','#14b8a6','#a855f7']

const FASES = ['pré-clínico', 'clínico', 'internato', 'residência', '']

function blockDuration(b) {
  if (!b.startTime || !b.endTime) return 0
  const [sh, sm] = b.startTime.split(':').map(Number)
  const [eh, em] = b.endTime.split(':').map(Number)
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
}

function aprovColor(pct) {
  if (pct >= 70) return 'text-emerald-600 bg-emerald-50'
  if (pct >= 50) return 'text-amber-600 bg-amber-50'
  return 'text-red-600 bg-red-50'
}

// ── Block Modal ───────────────────────────────────────────────────────────────
function BlockModal({ materias, initial, onSave, onClose }) {
  const [materiaId, setMateriaId] = useState(initial?.materiaId || materias[0]?.id || '')
  const [topic, setTopic] = useState(initial?.topic || '')
  const [startTime, setStartTime] = useState(initial?.startTime || '19:00')
  const [endTime, setEndTime] = useState(initial?.endTime || '20:00')
  const [note, setNote] = useState(initial?.note || '')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 shadow-xl animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg">{initial ? 'Editar bloco' : 'Novo bloco de estudo'}</h2>
          <button onClick={onClose} className="text-slate-400 text-2xl leading-none">&times;</button>
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
              placeholder="Ex: Cardiopatias congênitas – cap. 5"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Início</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fim</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Observação</label>
            <input value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Fazer questões do Medcof depois"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
          </div>
        </div>
        <button
          onClick={() => materiaId && onSave({ materiaId, topic, startTime, endTime, note })}
          disabled={!materiaId}
          className="mt-5 w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-40"
        >
          {initial ? 'Salvar alterações' : 'Adicionar bloco'}
        </button>
      </div>
    </div>
  )
}

// ── Materia Modal ─────────────────────────────────────────────────────────────
function MateriaModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [icon, setIcon] = useState(initial?.icon || '📚')
  const [color, setColor] = useState(initial?.color || COLORS[0])
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(initial?.weeklyGoalHours ?? 4)
  const [fase, setFase] = useState(initial?.fase || '')
  const [metaQuestoes, setMetaQuestoes] = useState(initial?.metaQuestoes ?? 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 shadow-xl animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg">{initial ? 'Editar matéria' : 'Nova matéria'}</h2>
          <button onClick={onClose} className="text-slate-400 text-2xl leading-none">&times;</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Clínica Médica, Cirurgia..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Fase</label>
            <div className="flex flex-wrap gap-2">
              {FASES.map((f) => (
                <button key={f} onClick={() => setFase(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${fase === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {f || 'Sem fase'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ICONS.map((ic) => (
                <button key={ic} onClick={() => setIcon(ic)}
                  className={`text-xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${icon === ic ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110' : 'bg-slate-100'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ background: c }}
                  className={`w-9 h-9 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Meta semanal (horas)</label>
              <input type="number" min="0.5" max="40" step="0.5" value={weeklyGoalHours}
                onChange={(e) => setWeeklyGoalHours(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Meta questões/dia</label>
              <input type="number" min="0" max="200" step="5" value={metaQuestoes}
                onChange={(e) => setMetaQuestoes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
            </div>
          </div>
        </div>
        <button
          onClick={() => name.trim() && onSave({ name: name.trim(), icon, color, weeklyGoalHours, fase, metaQuestoes })}
          disabled={!name.trim()}
          className="mt-5 w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-40"
        >
          {initial ? 'Salvar' : 'Criar matéria'}
        </button>
      </div>
    </div>
  )
}

// ── Simulado Modal ────────────────────────────────────────────────────────────
function SimuladoModal({ materias, onSave, onClose }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [materiaId, setMateriaId] = useState('')
  const [total, setTotal] = useState('')
  const [acertos, setAcertos] = useState('')
  const [fonte, setFonte] = useState('')

  const aproveitamento = total > 0 ? Math.round((acertos / total) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 shadow-xl animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg">Registrar simulado</h2>
          <button onClick={onClose} className="text-slate-400 text-2xl leading-none">&times;</button>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Matéria (opcional)</label>
              <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400">
                <option value="">Geral / misto</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Fonte / nome do simulado</label>
            <input value={fonte} onChange={(e) => setFonte(e.target.value)}
              placeholder="Ex: Medcof, Revalida, UNA-SUS..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Total de questões</label>
              <input type="number" min="0" value={total} onChange={(e) => setTotal(e.target.value)}
                placeholder="120"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Acertos</label>
              <input type="number" min="0" max={total || undefined} value={acertos} onChange={(e) => setAcertos(e.target.value)}
                placeholder="80"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
            </div>
          </div>
          {total > 0 && acertos !== '' && (
            <div className={`rounded-xl px-4 py-3 text-center font-bold text-lg ${aprovColor(aproveitamento)}`}>
              {aproveitamento}% de aproveitamento
            </div>
          )}
        </div>
        <button
          onClick={() => total && onSave({ date, materiaId, total, acertos, fonte })}
          disabled={!total}
          className="mt-5 w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-40"
        >
          Salvar simulado
        </button>
      </div>
    </div>
  )
}

// ── Hoje Tab ──────────────────────────────────────────────────────────────────
function TodayTab({ materias, blocks, setBlocks }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editBlock, setEditBlock] = useState(null)
  const dk = dateKey(new Date())
  const todayBlocks = getBlocksForDate(blocks, dk)
    .slice()
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

  const [questoes, setQuestoesState] = useState(0)

  useEffect(() => {
    setQuestoesState(getQuestoesDia(dk))
  }, [dk])

  const total = todayBlocks.length
  const done = todayBlocks.filter((b) => b.completed).length
  const totalMin = todayBlocks.reduce((s, b) => s + blockDuration(b), 0)
  const doneMin = todayBlocks.filter((b) => b.completed).reduce((s, b) => s + blockDuration(b), 0)

  const revisoesPendentes = getTopicsForReviewToday(materias)

  function handleAdd(data) {
    setBlocks(addStudyBlock(blocks, { ...data, date: dk }))
    setShowAdd(false)
  }

  function handleEdit(data) {
    setBlocks(updateStudyBlock(blocks, editBlock.id, data))
    setEditBlock(null)
  }

  function changeQuestoes(delta) {
    const novo = Math.max(0, questoes + delta)
    setQuestoesState(novo)
    setQuestoesDia(dk, novo)
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
      {/* Revisões pendentes */}
      {revisoesPendentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-4">
          <p className="text-xs font-bold text-amber-700 mb-2">🔁 {revisoesPendentes.length} revisão{revisoesPendentes.length > 1 ? 'ões' : ''} pendente{revisoesPendentes.length > 1 ? 's' : ''} hoje</p>
          <div className="flex flex-col gap-1.5">
            {revisoesPendentes.slice(0, 3).map(({ materia: m, topic: t }) => (
              <div key={t.id} className="flex items-center gap-2">
                <span className="text-base">{m.icon}</span>
                <span className="text-xs text-amber-800 font-medium flex-1 truncate">{t.title}</span>
                <span className="text-[10px] text-amber-500 font-semibold px-1.5 py-0.5 bg-amber-100 rounded-full">{m.name}</span>
              </div>
            ))}
            {revisoesPendentes.length > 3 && (
              <p className="text-[10px] text-amber-500 font-semibold">+{revisoesPendentes.length - 3} mais</p>
            )}
          </div>
        </div>
      )}

      {/* Questões do dia */}
      <div className="bg-white rounded-2xl p-4 mb-4 shadow-card border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Questões hoje</p>
            <p className="text-3xl font-black text-indigo-600 mt-0.5">{questoes}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <button onClick={() => changeQuestoes(10)}
              className="w-10 h-10 bg-indigo-500 text-white font-bold rounded-xl text-lg active:scale-95 transition-all">+</button>
            <button onClick={() => changeQuestoes(-10)}
              className="w-10 h-10 bg-slate-100 text-slate-600 font-bold rounded-xl text-lg active:scale-95 transition-all">−</button>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {[5, 10, 20, 30].map((n) => (
            <button key={n} onClick={() => changeQuestoes(n)}
              className="flex-1 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all">
              +{n}
            </button>
          ))}
        </div>
      </div>

      {/* Progresso de blocos */}
      {total > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-600">Blocos de estudo</span>
            <span className="text-sm font-bold text-indigo-600">{done}/{total}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
            <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
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
          </div>
        )}
        {todayBlocks.map((b) => {
          const mat = materias.find((m) => m.id === b.materiaId)
          const dur = blockDuration(b)
          return (
            <div key={b.id}
              className={`bg-white rounded-2xl p-3.5 shadow-card flex items-start gap-3 transition-opacity ${b.completed ? 'opacity-60' : ''}`}>
              <button
                onClick={() => setBlocks(toggleStudyBlock(blocks, b.id))}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${b.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-indigo-400'}`}>
                {b.completed && <span className="text-white text-xs">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base">{mat?.icon || '📚'}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: mat?.color || '#6366f1' }}>
                    {mat?.name || 'Matéria'}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto">{b.startTime}–{b.endTime}</span>
                </div>
                {b.topic && (
                  <p className={`text-sm font-semibold text-slate-700 mt-1 ${b.completed ? 'line-through' : ''}`}>{b.topic}</p>
                )}
                {b.note && <p className="text-xs text-slate-400 mt-0.5">{b.note}</p>}
                {dur > 0 && <p className="text-xs text-slate-400 mt-0.5">{formatMin(dur)}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setEditBlock(b)} className="text-slate-300 hover:text-indigo-400 text-sm">✏️</button>
                <button onClick={() => { if(confirm('Remover?')) setBlocks(removeStudyBlock(blocks, b.id)) }} className="text-slate-300 hover:text-red-400 text-sm">🗑️</button>
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={() => setShowAdd(true)}
        className="w-full border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold py-3 rounded-2xl hover:bg-indigo-50 transition-colors text-sm">
        + Adicionar bloco de estudo
      </button>

      {showAdd && <BlockModal materias={materias} onSave={handleAdd} onClose={() => setShowAdd(false)} />}
      {editBlock && <BlockModal materias={materias} initial={editBlock} onSave={handleEdit} onClose={() => setEditBlock(null)} />}
    </div>
  )
}

// ── Matérias Tab ──────────────────────────────────────────────────────────────
function MateriasTab({ materias, setMaterias, blocks, setBlocks }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editMat, setEditMat] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [newTopic, setNewTopic] = useState('')
  const [filterFase, setFilterFase] = useState('')

  const fases = [...new Set(materias.map((m) => m.fase).filter(Boolean))]
  const filtered = filterFase ? materias.filter((m) => m.fase === filterFase) : materias

  function handleAddTopic(materiaId) {
    if (!newTopic.trim()) return
    setMaterias(addTopic(materias, materiaId, newTopic.trim()))
    setNewTopic('')
  }

  return (
    <div>
      {/* Seed medicina */}
      {materias.length === 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-4 text-center">
          <p className="text-sm font-bold text-indigo-700 mb-1">🩺 Estudante de medicina?</p>
          <p className="text-xs text-indigo-500 mb-3">Carregue as matérias do curso pré-configuradas</p>
          <button
            onClick={() => setMaterias(seedMateriasMedicina())}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl"
          >
            Carregar matérias de medicina
          </button>
        </div>
      )}

      {/* Filter por fase */}
      {fases.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={() => setFilterFase('')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!filterFase ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            Todas
          </button>
          {fases.map((f) => (
            <button key={f} onClick={() => setFilterFase(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterFase === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {f}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3 mb-4">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <div className="text-3xl mb-2">📖</div>
            <p className="text-sm">Nenhuma matéria ainda.</p>
          </div>
        )}
        {filtered.map((m) => {
          const isOpen = expanded === m.id
          const done = (m.topics || []).filter((t) => t.status === 'feito').length
          const total = (m.topics || []).length
          const today = new Date().toISOString().slice(0, 10)
          const pendingReviews = (m.topics || []).filter((t) => t.reviewDate && t.reviewDate <= today).length

          return (
            <div key={m.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: m.color + '20' }}>
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                    {m.fase && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{m.fase}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400">Meta: {m.weeklyGoalHours}h/sem</p>
                    {total > 0 && <p className="text-xs text-slate-400">· {done}/{total} tópicos</p>}
                    {pendingReviews > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">
                        🔁 {pendingReviews}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setEditMat(m)} className="text-slate-300 hover:text-indigo-400">✏️</button>
                  <button onClick={() => { if(confirm('Remover matéria?')) { const r = removeMateria(materias, blocks, m.id); setMaterias(r.materias); setBlocks(r.blocks); if(expanded===m.id) setExpanded(null) }}} className="text-slate-300 hover:text-red-400">🗑️</button>
                  <button onClick={() => setExpanded(isOpen ? null : m.id)}
                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</button>
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
                      const reviewDue = t.reviewDate && t.reviewDate <= today
                      return (
                        <div key={t.id}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setMaterias(toggleTopic(materias, m.id, t.id))}
                              className={`w-6 h-6 rounded flex-shrink-0 border-2 flex items-center justify-center text-xs transition-all ${t.status === 'feito' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                              {t.status === 'feito' && '✓'}
                            </button>
                            <span className={`text-sm flex-1 ${t.status === 'feito' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.title}</span>
                            <button onClick={() => setMaterias(removeTopic(materias, m.id, t.id))}
                              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 text-xs">✕</button>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 ml-8">
                            {t.reviewDate ? (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${reviewDue ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-500'}`}>
                                🔁 {reviewDue ? 'Revisar hoje!' : `Revisão: ${t.reviewDate}`}
                              </span>
                            ) : (
                              <div className="flex gap-1">
                                <span className="text-[10px] text-slate-400 mr-1">Revisão em:</span>
                                {[1, 3, 7, 14, 30].map((d) => (
                                  <button key={d}
                                    onClick={() => setMaterias(setTopicReview(materias, m.id, t.id, d))}
                                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-all">
                                    +{d}d
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTopic(m.id)}
                      placeholder="Novo tópico (ex: IAM, AVC, Dengue...)"
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400"
                    />
                    <button onClick={() => handleAddTopic(m.id)}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold">+</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={() => setShowAdd(true)}
        className="w-full border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold py-3 rounded-2xl hover:bg-indigo-50 transition-colors text-sm">
        + Nova matéria
      </button>

      {showAdd && <MateriaModal onSave={(d) => { setMaterias(addMateria(materias, d)); setShowAdd(false) }} onClose={() => setShowAdd(false)} />}
      {editMat && <MateriaModal initial={editMat} onSave={(d) => { setMaterias(updateMateria(materias, editMat.id, d)); setEditMat(null) }} onClose={() => setEditMat(null)} />}
    </div>
  )
}

// ── Simulados Tab ─────────────────────────────────────────────────────────────
function SimuladosTab({ materias, simulados, setSimulados }) {
  const [showAdd, setShowAdd] = useState(false)
  const [filterMat, setFilterMat] = useState('')

  const filtered = filterMat ? simulados.filter((s) => s.materiaId === filterMat) : simulados
  const stats = getSimuladoStats(filtered)

  return (
    <div>
      {/* Resumo geral */}
      {simulados.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-2xl p-3 shadow-card text-center">
            <p className="text-xl font-black text-indigo-600">{stats?.count || 0}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Simulados</p>
          </div>
          <div className={`rounded-2xl p-3 shadow-card text-center ${stats ? aprovColor(stats.avg) : 'bg-white'}`}>
            <p className="text-xl font-black">{stats?.avg || 0}%</p>
            <p className="text-[10px] font-semibold mt-0.5 opacity-70">Média</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-card text-center">
            <p className="text-xl font-black text-emerald-600">{stats?.best || 0}%</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Melhor</p>
          </div>
        </div>
      )}

      {/* Filter por matéria */}
      {materias.length > 0 && simulados.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={() => setFilterMat('')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!filterMat ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            Todos
          </button>
          {materias.map((m) => (
            <button key={m.id} onClick={() => setFilterMat(m.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterMat === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {m.icon} {m.name}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="space-y-2 mb-4">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-sm">Nenhum simulado registrado.</p>
            <p className="text-xs mt-1">Registre seus resultados para acompanhar a evolução.</p>
          </div>
        )}
        {filtered.map((s) => {
          const mat = materias.find((m) => m.id === s.materiaId)
          const d = new Date(s.date + 'T12:00:00')
          return (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-card border border-slate-100">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${aprovColor(s.aproveitamento)}`}>
                  {s.aproveitamento}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {mat && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: mat.color }}>
                        {mat.icon} {mat.name}
                      </span>
                    )}
                    {!mat && <span className="text-xs font-bold text-slate-500">Simulado geral</span>}
                    {s.fonte && <span className="text-xs text-slate-400">{s.fonte}</span>}
                  </div>
                  <p className="text-sm text-slate-700 mt-1">
                    <span className="font-bold text-emerald-600">{s.acertos}</span>
                    <span className="text-slate-400"> / {s.total} questões</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <button onClick={() => { if(confirm('Remover?')) setSimulados(removeSimulado(simulados, s.id)) }}
                  className="text-slate-200 hover:text-red-400 text-xs">✕</button>
              </div>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${s.aproveitamento}%`,
                  background: s.aproveitamento >= 70 ? '#10b981' : s.aproveitamento >= 50 ? '#f59e0b' : '#ef4444'
                }} />
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={() => setShowAdd(true)}
        className="w-full border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold py-3 rounded-2xl hover:bg-indigo-50 transition-colors text-sm">
        + Registrar simulado
      </button>

      {showAdd && (
        <SimuladoModal
          materias={materias}
          onSave={(d) => { setSimulados(addSimulado(simulados, d)); setShowAdd(false) }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}

// ── Progresso Tab ─────────────────────────────────────────────────────────────
function ProgressTab({ materias, blocks, simulados }) {
  const today = new Date()
  const dow = today.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() + diff)

  const stats = getWeeklyStats(blocks, materias, weekStart)
  const totalGoalMin = stats.reduce((s, x) => s + x.goalMin, 0)
  const totalDoneMin = stats.reduce((s, x) => s + x.completedMin, 0)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
  const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  // Questões acumuladas na semana
  const questoesSemana = days.reduce((s, dk) => s + getQuestoesDia(dk), 0)

  // Simulados stats
  const simStats = getSimuladoStats(simulados)

  // Sort por defasagem (menor % da meta primeiro)
  const sorted = [...stats].sort((a, b) => {
    const pctA = a.goalMin ? a.completedMin / a.goalMin : 1
    const pctB = b.goalMin ? b.completedMin / b.goalMin : 1
    return pctA - pctB
  })

  return (
    <div className="space-y-4">
      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 shadow-card text-center">
          <p className="text-xl font-black text-indigo-600">{formatMin(totalDoneMin)}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Estudado</p>
          <p className="text-[10px] text-slate-300">meta {formatMin(totalGoalMin)}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-card text-center">
          <p className="text-xl font-black text-emerald-600">{questoesSemana}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Questões</p>
          <p className="text-[10px] text-slate-300">esta semana</p>
        </div>
        <div className={`rounded-2xl p-3 shadow-card text-center ${simStats ? aprovColor(simStats.avg) : 'bg-white'}`}>
          <p className="text-xl font-black">{simStats?.avg ?? '—'}%</p>
          <p className="text-[10px] font-semibold opacity-70 mt-0.5">Média sim.</p>
          <p className="text-[10px] opacity-50">{simStats?.count ?? 0} feitos</p>
        </div>
      </div>

      {/* Semana geral */}
      <div className="bg-white rounded-2xl p-4 shadow-card">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Semana atual</p>
        <div className="flex items-end justify-between mb-2">
          <span className="text-sm text-slate-600">Total concluído</span>
          <span className="text-sm font-bold text-indigo-600">{formatMin(totalDoneMin)} / {formatMin(totalGoalMin)}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div className="bg-indigo-500 h-2.5 rounded-full transition-all"
            style={{ width: `${totalGoalMin ? Math.min(100, (totalDoneMin / totalGoalMin) * 100) : 0}%` }} />
        </div>
      </div>

      {/* Por matéria — ordenado por defasagem */}
      {materias.length === 0 && (
        <div className="text-center py-10 text-slate-400">
          <p className="text-sm">Cadastre matérias para ver o progresso.</p>
        </div>
      )}

      {sorted.map(({ materia: m, completedMin, goalMin }) => {
        const pct = goalMin ? Math.min(100, Math.round((completedMin / goalMin) * 100)) : 0
        const defasado = goalMin > 0 && pct < 50
        const simM = getSimuladoStats(simulados, m.id)

        return (
          <div key={m.id} className={`bg-white rounded-2xl p-4 shadow-card ${defasado ? 'border border-red-100' : 'border border-slate-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{m.icon}</span>
              <span className="font-bold text-slate-800 text-sm flex-1">{m.name}</span>
              {defasado && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">⚠ defasada</span>}
              <span className="text-xs text-slate-400">{formatMin(completedMin)} / {formatMin(goalMin)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
              <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: defasado ? '#ef4444' : m.color }} />
            </div>
            <div className="flex items-center justify-between">
              {/* Daily dots */}
              <div className="flex gap-1 flex-1">
                {days.map((dk, i) => {
                  const dayBlocks = blocks.filter((b) => b.materiaId === m.id && b.date === dk)
                  const hasDone = dayBlocks.some((b) => b.completed)
                  const hasPlanned = dayBlocks.length > 0
                  return (
                    <div key={dk} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full h-4 rounded" style={{
                        background: hasDone ? m.color : hasPlanned ? m.color + '40' : '#f1f5f9',
                      }} />
                      <span className="text-[8px] text-slate-400">{DAY_LABELS[i]}</span>
                    </div>
                  )
                })}
              </div>
              {simM && (
                <div className={`ml-3 flex-shrink-0 text-center px-2 py-1 rounded-xl text-xs font-bold ${aprovColor(simM.avg)}`}>
                  {simM.avg}%<br/><span className="text-[9px] font-normal opacity-70">sim.</span>
                </div>
              )}
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
  const [simulados, setSimulados] = useState([])

  useEffect(() => {
    setMaterias(loadMaterias())
    setBlocks(loadStudyBlocks())
    setSimulados(loadSimulados())
  }, [])

  const revisoesPendentes = getTopicsForReviewToday(materias).length

  const SUB_TABS = [
    { id: 'hoje',      label: 'Hoje',      icon: '📅' },
    { id: 'materias',  label: 'Matérias',  icon: '📚' },
    { id: 'simulados', label: 'Simulados', icon: '📝' },
    { id: 'progresso', label: 'Progresso', icon: '📊' },
  ]

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-800">Estudos</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {revisoesPendentes > 0
            ? `🔁 ${revisoesPendentes} revisão${revisoesPendentes > 1 ? 'ões' : ''} pendente${revisoesPendentes > 1 ? 's' : ''} hoje`
            : 'Plano de estudos'}
        </p>
      </div>

      <div className="flex gap-1.5 mb-5 bg-slate-100 p-1 rounded-2xl">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all ${
              subTab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {subTab === 'hoje' && <TodayTab materias={materias} blocks={blocks} setBlocks={setBlocks} />}
      {subTab === 'materias' && <MateriasTab materias={materias} setMaterias={setMaterias} blocks={blocks} setBlocks={setBlocks} />}
      {subTab === 'simulados' && <SimuladosTab materias={materias} simulados={simulados} setSimulados={setSimulados} />}
      {subTab === 'progresso' && <ProgressTab materias={materias} blocks={blocks} simulados={simulados} />}
    </div>
  )
}
