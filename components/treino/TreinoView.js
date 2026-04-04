'use client'

import { useState, useEffect, useRef } from 'react'
import {
  loadPlanos, addPlano, updatePlano, removePlano, duplicatePlano,
  addExercise, updateExercise, removeExercise,
  loadLogs, addLog,
  getTodayPlano, DAY_NAMES, DAY_SHORT,
} from '@/lib/treino'

// ── Exercise Row ──────────────────────────────────────────────────────────────
function ExerciseRow({ ex, onUpdate, onRemove, sessionMode, checked, onCheck, sets, onSetUpdate }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(ex.name)
  const [exSets, setExSets] = useState(String(ex.sets))
  const [reps, setReps] = useState(ex.reps)
  const [weight, setWeight] = useState(ex.weight)
  const [rest, setRest] = useState(ex.rest)

  if (sessionMode) {
    // Active workout mode: show sets to check off
    const numSets = parseInt(ex.sets) || 3
    return (
      <div className={`bg-white rounded-2xl p-3.5 shadow-card border transition-all ${checked ? 'border-emerald-200 opacity-70' : 'border-slate-100'}`}>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={onCheck}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
            }`}
          >
            {checked && <span className="text-white text-xs font-bold">✓</span>}
          </button>
          <span className={`text-sm font-bold flex-1 ${checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>{ex.name}</span>
          <span className="text-xs text-slate-400">{ex.sets}x{ex.reps} {ex.weight && `· ${ex.weight}`}</span>
        </div>
        {!checked && (
          <div className="flex gap-1 mt-1">
            {Array.from({ length: numSets }, (_, i) => (
              <button
                key={i}
                onClick={() => onSetUpdate(i)}
                className={`flex-1 h-7 rounded-lg text-xs font-bold transition-all ${
                  (sets[i] ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500')
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
        {ex.rest && <p className="text-xs text-slate-400 mt-1">Descanso: {ex.rest}</p>}
      </div>
    )
  }

  if (editing) {
    return (
      <div className="bg-indigo-50 rounded-2xl p-3.5 border border-indigo-200 space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do exercício"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400"
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-slate-500 block mb-1">Séries</label>
            <input type="number" min="1" max="10" value={exSets} onChange={(e) => setExSets(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-500 block mb-1">Repetições</label>
            <input value={reps} onChange={(e) => setReps(e.target.value)} placeholder="10-12"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-500 block mb-1">Carga</label>
            <input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="60kg"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-500 block mb-1">Descanso</label>
            <input value={rest} onChange={(e) => setRest(e.target.value)} placeholder="60s"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { onUpdate({ name, sets: parseInt(exSets) || 3, reps, weight, rest }); setEditing(false) }}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold"
          >Salvar</button>
          <button onClick={() => setEditing(false)} className="px-4 bg-slate-100 text-slate-600 py-2 rounded-xl text-sm font-bold">Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-3.5 shadow-card border border-slate-100 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">{ex.name || 'Exercício'}</p>
        <p className="text-xs text-slate-400">{ex.sets} séries × {ex.reps} {ex.weight && `· ${ex.weight}`} {ex.rest && `· Desc: ${ex.rest}`}</p>
      </div>
      <button onClick={() => setEditing(true)} className="text-slate-300 hover:text-indigo-400 text-base">✏️</button>
      <button onClick={onRemove} className="text-slate-300 hover:text-red-400 text-base">🗑️</button>
    </div>
  )
}

// ── Plano Card ────────────────────────────────────────────────────────────────
function PlanoCard({ plano, isToday, existingDays, onUpdate, onRemove, onDuplicate, onAddEx, onUpdateEx, onRemoveEx, onStartSession }) {
  const [open, setOpen] = useState(isToday)
  const [addingEx, setAddingEx] = useState(false)
  const [newEx, setNewEx] = useState({ name: '', sets: 3, reps: '10-12', weight: '', rest: '60s' })
  const [duplicateTo, setDuplicateTo] = useState(null)

  return (
    <div className={`bg-white rounded-2xl shadow-card overflow-hidden ${isToday ? 'ring-2 ring-indigo-300' : ''}`}>
      <div className="flex items-center gap-3 p-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${isToday ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          {DAY_SHORT[plano.dayOfWeek]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm">{plano.name}</p>
          <p className="text-xs text-slate-400">{plano.exercises.length} exercícios{isToday ? ' · Hoje' : ''}</p>
        </div>
        <div className="flex items-center gap-1">
          {isToday && (
            <button
              onClick={onStartSession}
              className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
            >
              Iniciar
            </button>
          )}
          <button onClick={() => setOpen(!open)} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-2">
          {plano.exercises.map((ex) => (
            <ExerciseRow
              key={ex.id}
              ex={ex}
              onUpdate={(d) => onUpdateEx(ex.id, d)}
              onRemove={() => onRemoveEx(ex.id)}
            />
          ))}

          {addingEx ? (
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2">
              <input value={newEx.name} onChange={(e) => setNewEx({ ...newEx, name: e.target.value })}
                placeholder="Nome do exercício"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400"
              />
              <div className="flex gap-2">
                <input type="number" value={newEx.sets} onChange={(e) => setNewEx({ ...newEx, sets: e.target.value })}
                  placeholder="Séries" min="1" max="10"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
                <input value={newEx.reps} onChange={(e) => setNewEx({ ...newEx, reps: e.target.value })}
                  placeholder="Reps"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
                <input value={newEx.weight} onChange={(e) => setNewEx({ ...newEx, weight: e.target.value })}
                  placeholder="Carga"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { if (newEx.name.trim()) { onAddEx(newEx); setNewEx({ name: '', sets: 3, reps: '10-12', weight: '', rest: '60s' }); setAddingEx(false) } }}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold"
                >Adicionar</button>
                <button onClick={() => setAddingEx(false)} className="px-4 bg-slate-100 text-slate-600 py-2 rounded-xl text-sm font-bold">✕</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingEx(true)}
              className="w-full border-2 border-dashed border-slate-200 text-slate-400 py-2 rounded-xl text-sm hover:border-indigo-200 hover:text-indigo-400 transition-colors"
            >
              + Exercício
            </button>
          )}

          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setDuplicateTo(plano.dayOfWeek)}
              className="flex-1 text-indigo-400 text-xs font-semibold py-2 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              📋 Duplicar para outro dia
            </button>
            <button
              onClick={() => { if (confirm(`Excluir o dia "${plano.name}"?`)) onRemove() }}
              className="flex-1 text-red-400 text-xs font-semibold py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              🗑️ Excluir dia
            </button>
          </div>

          {duplicateTo !== null && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 mt-1 space-y-2">
              <p className="text-xs font-bold text-indigo-700">Duplicar para qual dia?</p>
              <div className="flex gap-1 flex-wrap">
                {DAY_SHORT.map((d, i) => {
                  const taken = existingDays.includes(i) && i !== plano.dayOfWeek
                  return (
                    <button
                      key={i}
                      disabled={taken || i === plano.dayOfWeek}
                      onClick={() => setDuplicateTo(i)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                        duplicateTo === i ? 'bg-indigo-600 text-white' : 'bg-white border border-indigo-200 text-indigo-600'
                      }`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { onDuplicate(duplicateTo); setDuplicateTo(null) }}
                  disabled={duplicateTo === plano.dayOfWeek}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                >
                  Duplicar
                </button>
                <button onClick={() => setDuplicateTo(null)} className="px-4 bg-white border border-slate-200 text-slate-500 py-2 rounded-xl text-xs font-bold">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Session Mode (active workout) ─────────────────────────────────────────────
function SessionMode({ plano, onFinish, onCancel }) {
  const [checked, setChecked] = useState({})
  const [setsDone, setSetsDone] = useState({})
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  function toggleCheck(exId) {
    setChecked((p) => ({ ...p, [exId]: !p[exId] }))
  }

  function toggleSet(exId, setIdx) {
    setSetsDone((p) => {
      const cur = p[exId] || {}
      return { ...p, [exId]: { ...cur, [setIdx]: !cur[setIdx] } }
    })
  }

  const totalEx = plano.exercises.length
  const doneEx = Object.values(checked).filter(Boolean).length
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="bg-indigo-600 text-white rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-lg">{plano.name}</h2>
          <span className="font-mono text-xl font-bold">{mm}:{ss}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${totalEx ? (doneEx / totalEx) * 100 : 0}%` }} />
          </div>
          <span className="text-sm font-bold">{doneEx}/{totalEx}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {plano.exercises.map((ex) => (
          <ExerciseRow
            key={ex.id}
            ex={ex}
            sessionMode
            checked={!!checked[ex.id]}
            onCheck={() => toggleCheck(ex.id)}
            sets={setsDone[ex.id] || {}}
            onSetUpdate={(i) => toggleSet(ex.id, i)}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onFinish(Math.floor(elapsed / 60))}
          className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-2xl"
        >
          Concluir treino ✓
        </button>
        <button onClick={onCancel} className="px-4 bg-slate-100 text-slate-600 font-bold py-3 rounded-2xl">
          Sair
        </button>
      </div>
    </div>
  )
}

// ── Add Plano Modal ───────────────────────────────────────────────────────────
function AddPlanoModal({ existingDays, onSave, onClose }) {
  const [dayOfWeek, setDayOfWeek] = useState(
    [0,1,2,3,4,5,6].find((d) => !existingDays.includes(d)) ?? 0
  )
  const [name, setName] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 shadow-xl animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg">Novo dia de treino</h2>
          <button onClick={onClose} className="text-slate-400 text-2xl leading-none">&times;</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Dia da semana</label>
            <div className="flex gap-1 flex-wrap">
              {DAY_SHORT.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setDayOfWeek(i)}
                  disabled={existingDays.includes(i)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    dayOfWeek === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome do treino</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Ex: Peito + Tríceps`}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>
        <button
          onClick={() => onSave({ dayOfWeek, name: name || DAY_NAMES[dayOfWeek] })}
          className="mt-5 w-full bg-indigo-600 text-white font-bold py-3 rounded-xl"
        >
          Criar
        </button>
      </div>
    </div>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function TreinoView() {
  const [planos, setPlanos] = useState([])
  const [logs, setLogs] = useState([])
  const [subTab, setSubTab] = useState('plano')
  const [showAdd, setShowAdd] = useState(false)
  const [activeSession, setActiveSession] = useState(null)

  useEffect(() => {
    setPlanos(loadPlanos())
    setLogs(loadLogs())
  }, [])

  const todayPlano = getTodayPlano(planos)
  const existingDays = planos.map((p) => p.dayOfWeek)

  function handleAddPlano(data) {
    setPlanos(addPlano(planos, data))
    setShowAdd(false)
  }

  function handleAddEx(planoId, exData) {
    setPlanos(addExercise(planos, planoId, exData))
  }

  function handleUpdateEx(planoId, exId, data) {
    setPlanos(updateExercise(planos, planoId, exId, data))
  }

  function handleRemoveEx(planoId, exId) {
    setPlanos(removeExercise(planos, planoId, exId))
  }

  function handleDuplicate(planoId, targetDay) {
    setPlanos(duplicatePlano(planos, planoId, targetDay))
  }

  function handleFinishSession(duration) {
    if (!activeSession) return
    const newLogs = addLog(logs, {
      planoId: activeSession.id,
      date: new Date().toISOString().slice(0, 10),
      duration,
    })
    setLogs(newLogs)
    setActiveSession(null)
    setSubTab('historico')
  }

  if (activeSession) {
    return (
      <SessionMode
        plano={activeSession}
        onFinish={handleFinishSession}
        onCancel={() => setActiveSession(null)}
      />
    )
  }

  const SUB_TABS = [
    { id: 'plano',    label: 'Plano',    icon: '📋' },
    { id: 'historico',label: 'Histórico',icon: '📊' },
  ]

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-800">Treino</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {todayPlano ? `Hoje: ${todayPlano.name}` : 'Nenhum treino planejado para hoje'}
        </p>
      </div>

      <div className="flex gap-2 mb-5 bg-slate-100 p-1 rounded-2xl">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              subTab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {subTab === 'plano' && (
        <div className="space-y-3">
          {planos.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-2">💪</div>
              <p className="text-sm">Nenhum dia de treino. Adicione seu plano!</p>
            </div>
          )}
          {planos.map((p) => (
            <PlanoCard
              key={p.id}
              plano={p}
              isToday={todayPlano?.id === p.id}
              existingDays={existingDays}
              onUpdate={(d) => setPlanos(updatePlano(planos, p.id, d))}
              onRemove={() => setPlanos(removePlano(planos, p.id))}
              onDuplicate={(targetDay) => handleDuplicate(p.id, targetDay)}
              onAddEx={(d) => handleAddEx(p.id, d)}
              onUpdateEx={(exId, d) => handleUpdateEx(p.id, exId, d)}
              onRemoveEx={(exId) => handleRemoveEx(p.id, exId)}
              onStartSession={() => setActiveSession(p)}
            />
          ))}
          <button
            onClick={() => setShowAdd(true)}
            className="w-full border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold py-3 rounded-2xl hover:bg-indigo-50 transition-colors text-sm"
          >
            + Novo dia de treino
          </button>
        </div>
      )}

      {subTab === 'historico' && (
        <div className="space-y-3">
          {logs.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm">Nenhum treino registrado ainda.</p>
            </div>
          )}
          {logs.map((l) => {
            const p = planos.find((pl) => pl.id === l.planoId)
            const d = new Date(l.date + 'T12:00:00')
            return (
              <div key={l.id} className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">💪</div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">{p?.name || 'Treino'}</p>
                  <p className="text-xs text-slate-400">
                    {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    {l.duration ? ` · ${l.duration}min` : ''}
                  </p>
                </div>
                <span className="text-emerald-500 font-bold text-xs">✓</span>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <AddPlanoModal
          existingDays={existingDays}
          onSave={handleAddPlano}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
