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
import {
  loadProvas, addProva, removeProva, diasAteProva, getTipoProva, TIPOS_PROVA,
} from '@/lib/provas'
import {
  loadDisponibilidade, saveDisponibilidade, updateSlot, addSlot, removeSlot,
  getTotalMinByDow, DAY_NAMES,
  loadAulas, saveAulas, addAula, removeAula,
} from '@/lib/disponibilidade'
import { gerarPlanoSemanal, aplicarPlano } from '@/lib/planejador'

// ── AI helpers ────────────────────────────────────────────────────────────────
async function aiProcessarCronograma(materiaNome, texto) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'processar-cronograma', payload: { materiaNome, texto } }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro na IA')
  return data.topicos
}

async function aiGerarPlano(payload) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'gerar-plano', payload }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro na IA')
  return data
}

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

// ── Cronograma Modal (AI) ─────────────────────────────────────────────────────
function CronogramaModal({ materia, onImport, onClose }) {
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [erro, setErro] = useState('')

  async function handleProcessar() {
    if (!texto.trim()) return
    setLoading(true)
    setErro('')
    try {
      const topicos = await aiProcessarCronograma(materia.name, texto)
      setPreview(topicos)
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-2xl shadow-xl animate-slideUp flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Importar cronograma</h2>
            <p className="text-xs text-slate-400">{materia.icon} {materia.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
          {!preview ? (
            <>
              <p className="text-xs text-slate-500">Cole o cronograma, ementa ou conteúdo programático abaixo. A IA vai extrair os tópicos automaticamente.</p>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={`Ex:\nSemana 1 — Semiologia cardiovascular\nSemana 2 — HAS e cardiopatias isquêmicas\nSemana 3 — Insuficiência cardíaca\n...`}
                rows={10}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 resize-none"
              />
              {erro && <p className="text-xs text-red-500 font-medium">{erro}</p>}
              <button
                onClick={handleProcessar}
                disabled={!texto.trim() || loading}
                className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando com IA...
                  </>
                ) : (
                  '✨ Processar com IA'
                )}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500 font-semibold">{preview.length} tópicos encontrados — revise e confirme:</p>
              <div className="space-y-1.5">
                {preview.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                    <span className="text-indigo-400 font-black text-sm w-5 text-center">{i + 1}</span>
                    <span className="flex-1 text-sm text-slate-700 font-medium">{t.titulo}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{t.horas}h</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { onImport(preview); onClose() }}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl"
                >
                  ✅ Importar tópicos
                </button>
                <button onClick={() => setPreview(null)} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">
                  Voltar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
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
  const [cronogramaFor, setCronogramaFor] = useState(null)

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
                  <button onClick={() => setCronogramaFor(m)} className="text-slate-300 hover:text-indigo-400 text-sm" title="Importar cronograma com IA">✨</button>
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
      {cronogramaFor && (
        <CronogramaModal
          materia={cronogramaFor}
          onImport={(topicos) => {
            let updated = materias
            topicos.forEach((t) => {
              updated = addTopic(updated, cronogramaFor.id, t.titulo)
            })
            setMaterias(updated)
            setCronogramaFor(null)
          }}
          onClose={() => setCronogramaFor(null)}
        />
      )}
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

// ── Plano Tab ─────────────────────────────────────────────────────────────────
function PlanoTab({ materias, simulados, blocks, setBlocks }) {
  const [provas, setProvas] = useState([])
  const [disponibilidade, setDisponibilidade] = useState([])
  const [aulas, setAulas] = useState([])
  const [secao, setSecao] = useState('provas') // provas | aulas | horarios | gerar
  const [planoGerado, setPlanoGerado] = useState([])
  const [resumoIA, setResumoIA] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)
  const [erroIA, setErroIA] = useState('')
  const [showAddProva, setShowAddProva] = useState(false)
  const [showAddAula, setShowAddAula] = useState(false)
  const [novaProva, setNovaProva] = useState({ materiaId: '', titulo: '', data: '', tipo: 'prova' })
  const [novaAula, setNovaAula] = useState({ dow: 0, nome: '', start: '07:00', end: '09:00', local: '' })

  useEffect(() => {
    setProvas(loadProvas())
    setDisponibilidade(loadDisponibilidade())
    setAulas(loadAulas())
  }, [])

  const DAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  function handleGerarLocal() {
    const propostos = gerarPlanoSemanal({ materias, provas, simulados, disponibilidade, aulas, diasAVista: 7 })
    setPlanoGerado(propostos)
    setResumoIA('')
    setSecao('gerar')
  }

  async function handleGerarIA() {
    setLoadingIA(true)
    setErroIA('')
    setSecao('gerar')
    try {
      const resultado = await aiGerarPlano({ materias, provas, simulados, disponibilidade, aulas, diasAVista: 7 })
      // Converte os blocos retornados pela IA para o formato interno
      const blocos = (resultado.blocos || []).map((b) => ({
        id: `ia-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        date: b.data,
        materiaId: b.materiaId,
        topic: b.topico || '',
        startTime: b.startTime,
        endTime: b.endTime,
        completed: false,
        note: b.justificativa || '',
        _proposed: true,
      }))
      setPlanoGerado(blocos)
      setResumoIA(resultado.resumo || '')
    } catch (e) {
      setErroIA(e.message)
    } finally {
      setLoadingIA(false)
    }
  }

  function handleAplicar() {
    const updated = aplicarPlano(planoGerado, materias)
    setBlocks(updated)
    setPlanoGerado([])
    alert(`✅ ${planoGerado.length} blocos adicionados ao seu plano diário!`)
  }

  const provasProximas = provas.filter((p) => p.data >= new Date().toISOString().slice(0, 10))

  return (
    <div>
      {/* Seção nav */}
      <div className="flex gap-1.5 mb-4 bg-slate-100 p-1 rounded-2xl">
        {[
          { id: 'provas',   label: 'Provas',    icon: '📋' },
          { id: 'aulas',    label: 'Aulas',     icon: '🏫' },
          { id: 'horarios', label: 'Horários',  icon: '⏰' },
          { id: 'gerar',    label: 'Plano',     icon: '✨' },
        ].map((s) => (
          <button key={s.id} onClick={() => setSecao(s.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all ${secao === s.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
            <span className="text-sm">{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── PROVAS ── */}
      {secao === 'provas' && (
        <div>
          {provasProximas.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm">Nenhuma prova cadastrada.</p>
              <p className="text-xs mt-1">Adicione suas provas para priorizar o estudo.</p>
            </div>
          )}
          <div className="space-y-2 mb-4">
            {provasProximas.map((p) => {
              const mat = materias.find((m) => m.id === p.materiaId)
              const tipo = getTipoProva(p.tipo)
              const dias = diasAteProva(p.data)
              const urgente = dias <= 7
              return (
                <div key={p.id} className={`bg-white rounded-2xl p-4 shadow-card border ${urgente ? 'border-red-200' : 'border-slate-100'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: tipo.color + '20' }}>
                      {tipo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm">{p.titulo}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {mat && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: mat.color }}>{mat.icon} {mat.name}</span>}
                        <span className="text-xs text-slate-400">{new Date(p.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-black ${urgente ? 'text-red-500' : dias <= 14 ? 'text-amber-500' : 'text-slate-600'}`}>{dias}d</p>
                      <button onClick={() => setProvas(removeProva(provas, p.id))} className="text-slate-200 hover:text-red-400 text-xs">✕</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {showAddProva ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-slate-700">Nova prova</p>
              <input value={novaProva.titulo} onChange={(e) => setNovaProva({ ...novaProva, titulo: e.target.value })}
                placeholder="Nome da prova / avaliação"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Data</label>
                  <input type="date" value={novaProva.data} onChange={(e) => setNovaProva({ ...novaProva, data: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Tipo</label>
                  <select value={novaProva.tipo} onChange={(e) => setNovaProva({ ...novaProva, tipo: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400">
                    {TIPOS_PROVA.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Matéria (opcional)</label>
                <select value={novaProva.materiaId} onChange={(e) => setNovaProva({ ...novaProva, materiaId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400">
                  <option value="">Geral / múltiplas matérias</option>
                  {materias.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { if (novaProva.data && novaProva.titulo) { setProvas(addProva(provas, novaProva)); setNovaProva({ materiaId: '', titulo: '', data: '', tipo: 'prova' }); setShowAddProva(false) }}}
                  className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm">Salvar</button>
                <button onClick={() => setShowAddProva(false)} className="px-4 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-sm">Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddProva(true)}
              className="w-full border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold py-3 rounded-2xl hover:bg-indigo-50 transition-colors text-sm">
              + Adicionar prova
            </button>
          )}
        </div>
      )}

      {/* ── AULAS ── */}
      {secao === 'aulas' && (
        <div>
          <p className="text-xs text-slate-400 mb-3">Cadastre seus horários fixos de aula. O planejador vai evitar esses horários automaticamente.</p>

          {aulas.length === 0 && !showAddAula && (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">🏫</div>
              <p className="text-sm">Nenhuma aula cadastrada.</p>
            </div>
          )}

          {/* Aulas agrupadas por dia */}
          <div className="space-y-3 mb-4">
            {DAY_SHORT.map((dayLabel, dow) => {
              const aulasDia = aulas.filter((a) => a.dow === dow)
              if (aulasDia.length === 0) return null
              return (
                <div key={dow} className="bg-white rounded-2xl shadow-card overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-600">{DAY_NAMES[dow]}</p>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {aulasDia.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-base">🏫</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{a.nome}</p>
                          <p className="text-xs text-slate-400">{a.start} – {a.end}{a.local ? ` · ${a.local}` : ''}</p>
                        </div>
                        <button onClick={() => setAulas(removeAula(aulas, a.id))} className="text-slate-200 hover:text-red-400 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {showAddAula ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-slate-700">Nova aula</p>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Dia da semana</label>
                <div className="flex gap-1 flex-wrap">
                  {DAY_SHORT.map((d, i) => (
                    <button key={i} onClick={() => setNovaAula({ ...novaAula, dow: i })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${novaAula.dow === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <input value={novaAula.nome} onChange={(e) => setNovaAula({ ...novaAula, nome: e.target.value })}
                placeholder="Nome da disciplina / aula"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Início</label>
                  <input type="time" value={novaAula.start} onChange={(e) => setNovaAula({ ...novaAula, start: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Fim</label>
                  <input type="time" value={novaAula.end} onChange={(e) => setNovaAula({ ...novaAula, end: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <input value={novaAula.local} onChange={(e) => setNovaAula({ ...novaAula, local: e.target.value })}
                placeholder="Local / sala (opcional)"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
              <div className="flex gap-2">
                <button
                  onClick={() => { if (novaAula.nome && novaAula.start && novaAula.end) { setAulas(addAula(aulas, novaAula)); setNovaAula({ dow: 0, nome: '', start: '07:00', end: '09:00', local: '' }); setShowAddAula(false) }}}
                  className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm">Salvar</button>
                <button onClick={() => setShowAddAula(false)} className="px-4 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-sm">Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddAula(true)}
              className="w-full border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold py-3 rounded-2xl hover:bg-indigo-50 transition-colors text-sm">
              + Adicionar aula
            </button>
          )}
        </div>
      )}

      {/* ── HORÁRIOS LIVRES ── */}
      {secao === 'horarios' && (
        <div>
          <p className="text-xs text-slate-400 mb-3">Defina os horários livres para estudo em cada dia. O planejador usará esses janelas para distribuir os blocos.</p>
          <div className="space-y-3">
            {disponibilidade.map((d) => (
              <div key={d.dow} className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-600">{DAY_NAMES[d.dow]}</p>
                  <p className="text-xs text-slate-400">{formatMin(getTotalMinByDow(disponibilidade, d.dow))} disponíveis</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {d.slots.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Sem horário livre.</p>
                  )}
                  {d.slots.map((s, si) => (
                    <div key={si} className="flex items-center gap-2">
                      <input type="time" value={s.start}
                        onChange={(e) => setDisponibilidade(updateSlot(disponibilidade, d.dow, si, 'start', e.target.value))}
                        className="flex-1 border border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
                      <span className="text-slate-400 text-xs">até</span>
                      <input type="time" value={s.end}
                        onChange={(e) => setDisponibilidade(updateSlot(disponibilidade, d.dow, si, 'end', e.target.value))}
                        className="flex-1 border border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
                      <button onClick={() => setDisponibilidade(removeSlot(disponibilidade, d.dow, si))}
                        className="text-slate-300 hover:text-red-400 text-xs w-7 h-7 flex items-center justify-center">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setDisponibilidade(addSlot(disponibilidade, d.dow))}
                    className="text-xs text-indigo-500 font-semibold hover:text-indigo-600">+ janela</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GERAR PLANO ── */}
      {secao === 'gerar' && (
        <div>
          {planoGerado.length === 0 && !loadingIA ? (
            <div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-4">
                <p className="text-sm font-bold text-indigo-800 mb-1">✨ Gerador de plano semanal</p>
                <p className="text-xs text-indigo-600 mb-2">Prioriza automaticamente:</p>
                <ul className="space-y-1">
                  {[
                    `${provasProximas.length} prova(s) cadastrada(s)`,
                    `${aulas.length} aula(s) fixas — serão evitadas`,
                    'Matérias com simulado fraco',
                    'Matérias defasadas na meta semanal',
                    'Tópicos pendentes do cronograma',
                  ].map((item, i) => (
                    <li key={i} className="text-xs text-indigo-700 flex items-center gap-1.5">
                      <span className="text-indigo-400">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {erroIA && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <p className="text-xs text-red-600 font-semibold">Erro: {erroIA}</p>
                  {erroIA.includes('ANTHROPIC_API_KEY') && (
                    <p className="text-xs text-red-500 mt-1">Crie o arquivo <strong>.env.local</strong> com sua chave da Anthropic e reinicie o servidor.</p>
                  )}
                </div>
              )}

              {materias.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">Cadastre matérias primeiro na aba Matérias.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button onClick={handleGerarIA}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-base shadow-sm transition-all active:scale-95">
                    🤖 Gerar com IA (recomendado)
                  </button>
                  <button onClick={handleGerarLocal}
                    className="w-full py-3 border-2 border-slate-200 text-slate-500 font-semibold rounded-2xl text-sm hover:bg-slate-50 transition-all">
                    ⚙️ Gerar sem IA (algoritmo local)
                  </button>
                </div>
              )}
            </div>
          ) : loadingIA ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-600">IA analisando seus dados...</p>
              <p className="text-xs text-slate-400 text-center">Verificando provas, simulados, metas e horários disponíveis</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-700">{planoGerado.length} blocos gerados</p>
                <button onClick={() => { setPlanoGerado([]); setResumoIA(''); setErroIA('') }} className="text-xs text-slate-400 hover:text-slate-600">Refazer</button>
              </div>

              {resumoIA && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 mb-3">
                  <p className="text-xs font-bold text-indigo-700 mb-1">🤖 Raciocínio da IA</p>
                  <p className="text-xs text-indigo-700 leading-relaxed">{resumoIA}</p>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {planoGerado.map((b) => {
                  const mat = materias.find((m) => m.id === b.materiaId)
                  const d = new Date(b.date + 'T12:00:00')
                  return (
                    <div key={b.id} className="bg-white rounded-2xl p-3.5 shadow-card border border-slate-100 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: (mat?.color || '#6366f1') + '20' }}>
                        {mat?.icon || '📚'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-indigo-600">
                          {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-sm font-bold text-slate-800 truncate">{mat?.name || 'Matéria'}</p>
                        {b.topic && <p className="text-xs text-slate-600 font-medium truncate">{b.topic}</p>}
                        <p className="text-xs text-slate-400 mt-0.5">{b.startTime} – {b.endTime}</p>
                        {b.note && <p className="text-[10px] text-indigo-400 mt-0.5 truncate">{b.note}</p>}
                      </div>
                      <button onClick={() => setPlanoGerado(planoGerado.filter((x) => x.id !== b.id))}
                        className="text-slate-200 hover:text-red-400 text-xs mt-1">✕</button>
                    </div>
                  )
                })}
              </div>

              <button onClick={handleAplicar}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-base shadow-sm transition-all active:scale-95">
                ✅ Aplicar ao Hoje ({planoGerado.length} blocos)
              </button>
            </div>
          )}
        </div>
      )}
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
    { id: 'plano',     label: 'Plano',     icon: '✨' },
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

      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-shrink-0 flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
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
      {subTab === 'plano' && <PlanoTab materias={materias} simulados={simulados} blocks={blocks} setBlocks={setBlocks} />}
      {subTab === 'progresso' && <ProgressTab materias={materias} blocks={blocks} simulados={simulados} />}
    </div>
  )
}
