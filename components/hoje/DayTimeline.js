'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthWrapper'
import { getCatInfo, calcProgress, getCurrentBlock, getNextBlock, blockDuration } from '@/lib/planner'
import { loadStudyBlocks, getBlocksForDate, toggleStudyBlock, formatMin } from '@/lib/estudos'
import { loadMaterias } from '@/lib/estudos'
import { loadPlanos, getTodayPlano, loadLogs, addLog } from '@/lib/treino'
import { loadHabits, loadHabitLogs, toggleHabitDay, isHabitDueToday, isDoneToday } from '@/lib/habits'
import { dateKey } from '@/lib/date'
import AddBlockModal from './AddBlockModal'
import PomodoroTimer from '@/components/shared/PomodoroTimer'

const ENERGY_EMOJI = { 1: '😴', 2: '😐', 3: '🙂', 4: '😊', 5: '🔥' }

// ── Focus Timer ───────────────────────────────────────────────────────────────
function FocusTimer({ block, onDone, onCancel }) {
  const DURATIONS = [25, 50]
  const [selectedMin, setSelectedMin] = useState(25)
  const [running, setRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(intervalRef.current); setRunning(false); onDone(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running]) // eslint-disable-line

  function start() { setSecondsLeft(selectedMin * 60); setRunning(true) }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const pct = running ? ((selectedMin * 60 - secondsLeft) / (selectedMin * 60)) * 100 : 0

  return (
    <div className="fixed left-0 right-0 z-40 px-4 max-w-lg mx-auto" style={{ bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 8px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 p-4">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#e0e7ff" strokeWidth="4" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="#6366f1" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-indigo-700">{mm}:{ss}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-semibold truncate">{block?.title || 'Foco'}</p>
            {!running ? (
              <div className="flex gap-1 mt-1">
                {DURATIONS.map((d) => (
                  <button key={d} onClick={() => setSelectedMin(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${selectedMin === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {d}min
                  </button>
                ))}
              </div>
            ) : <p className="text-xs text-indigo-600 font-bold mt-0.5 animate-pulse">Em foco...</p>}
          </div>
          <div className="flex gap-2">
            {!running
              ? <button onClick={start} className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-bold">▶</button>
              : <button onClick={() => { clearInterval(intervalRef.current); setRunning(false) }} className="bg-amber-500 text-white px-3 py-2 rounded-xl text-sm font-bold">⏸</button>
            }
            <button onClick={onCancel} className="text-slate-400 w-10 h-10 flex items-center justify-center text-xl">✕</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── End-of-day Celebration ────────────────────────────────────────────────────
function CelebrationModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-slideUp">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Dia completo!</h2>
        <p className="text-slate-500 text-sm mb-6">Você concluiu todos os blocos do dia. Isso é consistência de alto nível.</p>
        <div className="bg-indigo-50 rounded-2xl p-4 mb-6">
          <p className="text-indigo-700 font-bold text-sm">💡 Dica</p>
          <p className="text-indigo-600 text-sm mt-1">Faça o Weekly Review no domingo para fechar a semana com clareza.</p>
        </div>
        <button onClick={onClose} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl">
          Fechar
        </button>
      </div>
    </div>
  )
}

// ── Habits Strip ──────────────────────────────────────────────────────────────
function HabitsStrip({ habits, logs, onToggle }) {
  const dk = dateKey(new Date())
  const dueHabits = habits.filter(isHabitDueToday)
  if (dueHabits.length === 0) return null

  const doneCount = dueHabits.filter((h) => (logs[h.id] || []).includes(dk)).length

  return (
    <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hábitos de hoje</p>
        <span className="text-xs font-bold text-indigo-600">{doneCount}/{dueHabits.length}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {dueHabits.map((h) => {
          const done = (logs[h.id] || []).includes(dk)
          return (
            <button
              key={h.id}
              onClick={() => onToggle(h.id, dk)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all active:scale-95 ${
                done
                  ? 'border-transparent text-white'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
              style={done ? { background: h.color } : {}}
            >
              <span className="text-base leading-none">{h.icon}</span>
              <span className="text-xs font-bold truncate max-w-[80px]">{h.title}</span>
              {done && <span className="text-xs font-bold">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Study Blocks for Today ────────────────────────────────────────────────────
function StudySection({ blocks, materias, onToggle, onNavigate }) {
  if (blocks.length === 0) return null
  const done = blocks.filter((b) => b.completed).length

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estudos de hoje</p>
        <button onClick={() => onNavigate('estudos')} className="text-xs font-bold text-indigo-500">Ver tudo →</button>
      </div>
      <div className="space-y-2">
        {blocks.map((b) => {
          const mat = materias.find((m) => m.id === b.materiaId)
          return (
            <div key={b.id} className={`bg-white rounded-2xl p-3.5 shadow-card border border-slate-100 flex items-center gap-3 transition-opacity ${b.completed ? 'opacity-50' : ''}`}>
              <button
                onClick={() => onToggle(b.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${b.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}
              >
                {b.completed && <span className="text-white text-xs font-bold">✓</span>}
              </button>
              <span className="text-lg">{mat?.icon || '📚'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${b.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {b.topic || mat?.name || 'Estudo'}
                </p>
                <p className="text-xs text-slate-400">{b.startTime}–{b.endTime} · {mat?.name}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Treino Card ───────────────────────────────────────────────────────────────
function TreinoCard({ plano, logs, onNavigate }) {
  const dk = dateKey(new Date())
  const done = logs.some((l) => l.date === dk && l.planoId === plano.id)

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-card border mb-4 flex items-center gap-3 ${done ? 'border-emerald-200 opacity-70' : 'border-slate-100'}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${done ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
        💪
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Treino de hoje</p>
        <p className="text-sm font-bold text-slate-800">{plano.name}</p>
        <p className="text-xs text-slate-400">{plano.exercises.length} exercícios</p>
      </div>
      {done
        ? <span className="text-emerald-500 font-bold text-sm">✓ Feito</span>
        : <button onClick={() => onNavigate('treino')} className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95">
            Iniciar →
          </button>
      }
    </div>
  )
}

// ── Main DayTimeline ──────────────────────────────────────────────────────────
export default function DayTimeline({ plan, onToggle, onAddBlock, onRemoveBlock, onReset, onNavigate, onPlanTomorrow, hasTomorrowPlan }) {
  const auth = useAuth()
  const { date, energy, priorities, blocks, completed } = plan
  const [now, setNow] = useState(new Date())
  const [addOpen, setAddOpen] = useState(false)
  const [editBlock, setEditBlock] = useState(null)
  const [focusBlock, setFocusBlock] = useState(null)
  const [showPomodoro, setShowPomodoro] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationShown, setCelebrationShown] = useState(false)

  // Integrated data
  const [studyBlocks, setStudyBlocks] = useState([])
  const [materias, setMaterias] = useState([])
  const [treinoPlano, setTreinoPlano] = useState(null)
  const [treinoLogs, setTreinoLogs] = useState([])
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState({})

  const dk = dateKey(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const mats = loadMaterias()
    setMaterias(mats)
    const allBlocks = loadStudyBlocks()
    setStudyBlocks(getBlocksForDate(allBlocks, dk).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')))
    const planos = loadPlanos()
    setTreinoPlano(getTodayPlano(planos))
    setTreinoLogs(loadLogs())
    setHabits(loadHabits())
    setHabitLogs(loadHabitLogs())
  }, []) // eslint-disable-line

  const { count, total, pct } = calcProgress(blocks, completed)
  const currentBlock = getCurrentBlock(blocks)
  const nextBlock    = getNextBlock(blocks, completed)
  const nowMins      = now.getHours() * 60 + now.getMinutes()

  // End-of-day celebration
  useEffect(() => {
    if (pct === 100 && total > 0 && !celebrationShown) {
      setShowCelebration(true)
      setCelebrationShown(true)
    }
  }, [pct, total, celebrationShown])

  function handleStudyToggle(id) {
    const allBlocks = loadStudyBlocks()
    const updated = toggleStudyBlock(allBlocks, id)
    setStudyBlocks(getBlocksForDate(updated, dk).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')))
  }

  function handleHabitToggle(habitId, dk) {
    const updated = toggleHabitDay(habitLogs, habitId, dk)
    setHabitLogs(updated)
  }

  const dateObj = new Date(date)
  const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })
  const dateStr = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-0.5">{dateStr}</p>
            <h1 className="text-3xl font-black text-slate-900 capitalize leading-tight">{dayName}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center text-xl">
              {ENERGY_EMOJI[energy] || '🙂'}
            </div>
            {plan.streak > 0 && (
              <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl px-2.5 py-1.5 shadow-sm">
                <span className="text-xs font-black text-white">🔥 {plan.streak}</span>
              </div>
            )}
            {auth?.user?.photoURL && (
              <button
                onClick={() => { if (confirm('Sair da conta?')) auth.logout() }}
                className="w-10 h-10 rounded-2xl overflow-hidden shadow-card border-2 border-white"
              >
                <img src={auth.user.photoURL} alt="avatar" className="w-full h-full object-cover" />
              </button>
            )}
          </div>
        </div>
        {/* Overall progress */}
        <div className="mt-4 bg-white rounded-2xl px-4 py-3 shadow-card border border-slate-100">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-bold text-slate-500">{count}/{total} blocos concluídos</span>
            <span className="font-black text-indigo-600">{pct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full progress-indigo rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Priorities */}
      {priorities?.some((p) => p) && (
        <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Top 3 prioridades</p>
          <div className="space-y-2">
            {priorities.map((p, i) => p ? (
              <label key={i} className="flex items-center gap-3 cursor-pointer group">
                <button
                  onClick={() => onToggle(`priority-${i}`)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    completed[`priority-${i}`] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-indigo-300'
                  }`}
                >
                  {completed[`priority-${i}`] && <span className="text-white text-xs font-bold">✓</span>}
                </button>
                <span className={`text-sm font-medium transition-all ${completed[`priority-${i}`] ? 'line-through text-slate-300' : 'text-slate-700'}`}>
                  {p}
                </span>
              </label>
            ) : null)}
          </div>
        </div>
      )}

      {/* Habits strip */}
      <HabitsStrip habits={habits} logs={habitLogs} onToggle={handleHabitToggle} />

      {/* Treino card */}
      {treinoPlano && (
        <TreinoCard plano={treinoPlano} logs={treinoLogs} onNavigate={onNavigate} />
      )}

      {/* Study blocks */}
      <StudySection
        blocks={studyBlocks}
        materias={materias}
        onToggle={handleStudyToggle}
        onNavigate={onNavigate}
      />

      {/* Day plan timeline */}
      {blocks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Agenda</p>
          {blocks.map((block) => {
            const cat    = getCatInfo(block.category)
            const isDone = !!completed[block.uid]
            const isNow  = currentBlock?.uid === block.uid
            const isNext = nextBlock?.uid === block.uid
            const startMins = parseInt(block.startTime?.split(':')[0] || 0) * 60 + parseInt(block.startTime?.split(':')[1] || 0)
            const dur    = blockDuration(block)
            const isFocused = focusBlock?.uid === block.uid

            return (
              <div key={block.uid}
                className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
                  isFocused ? 'border-indigo-300 ring-2 ring-indigo-100 shadow-card-hover' :
                  isNow     ? 'border-indigo-200 ring-2 ring-indigo-100 shadow-card-hover' :
                  isDone    ? 'border-slate-100 opacity-55' :
                              'border-slate-100 shadow-card'
                }`}
              >
                {/* Left color stripe */}
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: cat.color, opacity: isDone ? 0.3 : 1 }} />

                {(isNow || isFocused) && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-sm" />
                )}
                <div className="pl-4 pr-3.5 py-3.5 flex items-center gap-3">
                  <button onClick={() => onToggle(block.uid)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isDone ? 'bg-emerald-500 border-emerald-500 shadow-sm' :
                      isNow  ? 'border-indigo-400' :
                               'border-slate-200'
                    }`}
                  >
                    {isDone && <span className="text-white text-xs font-bold check-in">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{block.icon}</span>
                      <span className={`text-sm font-semibold truncate ${isDone ? 'line-through text-slate-300' : 'text-slate-800'}`}>
                        {block.title}
                      </span>
                      {isNext && !isDone && (
                        <span className="flex-shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">PRÓXIMO</span>
                      )}
                      {isFocused && (
                        <span className="flex-shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full animate-pulse">FOCO</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{block.startTime} – {block.endTime}</span>
                      {dur > 0 && <span className="text-xs text-slate-300">• {dur}min</span>}
                      {block.note && <span className="text-xs text-slate-400 truncate">• {block.note}</span>}
                    </div>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {!isDone && (
                      <button onClick={() => setFocusBlock(isFocused ? null : block)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isFocused ? 'bg-indigo-100 text-indigo-600' : 'text-slate-300 hover:text-indigo-400'}`}>
                        ⏱
                      </button>
                    )}
                    <button onClick={() => setEditBlock(block)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-slate-500">
                      ✏️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pomodoro FAB */}
      <button onClick={() => setShowPomodoro(true)}
        className="fixed right-20 w-12 h-12 bg-white border border-slate-200 shadow-md rounded-2xl flex items-center justify-center text-xl active:scale-90 z-30 transition-all hover:shadow-lg"
        style={{ bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 18px)' }}
        title="Pomodoro">
        🍅
      </button>

      {/* Add block FAB */}
      <button onClick={() => setAddOpen(true)}
        className="fixed right-4 w-14 h-14 btn-primary rounded-2xl flex items-center justify-center text-2xl font-light active:scale-90 z-30"
        style={{ bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 16px)' }}>
        +
      </button>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button onClick={onReset} className="text-xs text-slate-400 hover:text-slate-600 underline-offset-2 hover:underline">
          Replanejar dia
        </button>
        {onPlanTomorrow && (
          <button onClick={onPlanTomorrow} className={`text-xs underline-offset-2 hover:underline ${hasTomorrowPlan ? 'text-indigo-400 hover:text-indigo-600' : 'text-indigo-500 hover:text-indigo-700 font-semibold'}`}>
            {hasTomorrowPlan ? '✓ Amanhã planejado' : '🌙 Planejar amanhã'}
          </button>
        )}
      </div>

      {/* Focus Timer */}
      {focusBlock && (
        <FocusTimer block={focusBlock} onDone={() => { onToggle(focusBlock.uid); setFocusBlock(null) }} onCancel={() => setFocusBlock(null)} />
      )}

      {/* End-of-day celebration */}
      {showCelebration && <CelebrationModal onClose={() => setShowCelebration(false)} />}

      {showPomodoro && (
        <PomodoroTimer
          onClose={() => setShowPomodoro(false)}
          activeBlock={getCurrentBlock(blocks)}
        />
      )}

      <AddBlockModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={(b) => { onAddBlock(b, false); setAddOpen(false) }} />
      {editBlock && (
        <AddBlockModal
          open={!!editBlock}
          onClose={() => setEditBlock(null)}
          onAdd={(b) => { onAddBlock(b, true); setEditBlock(null) }}
          onRemove={(uid) => { onRemoveBlock(uid); setEditBlock(null) }}
          initialBlock={editBlock}
        />
      )}
    </div>
  )
}
