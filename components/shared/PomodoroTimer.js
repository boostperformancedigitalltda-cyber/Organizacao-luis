'use client'

import { useState, useEffect, useRef } from 'react'

const MODES = {
  foco:     { label: 'Foco',       mins: 25, color: '#6366f1', bg: 'bg-indigo-500' },
  pausa:    { label: 'Pausa curta',mins: 5,  color: '#10b981', bg: 'bg-emerald-500' },
  pausaLong:{ label: 'Pausa longa',mins: 15, color: '#06b6d4', bg: 'bg-cyan-500' },
}

export default function PomodoroTimer({ onClose, activeBlock }) {
  const [mode, setMode] = useState('foco')
  const [segundos, setSegundos] = useState(25 * 60)
  const [rodando, setRodando] = useState(false)
  const [ciclos, setCiclos] = useState(0)
  const [customMins, setCustomMins] = useState(25)
  const intervalRef = useRef(null)

  const m = MODES[mode]
  const totalSecs = customMins * 60
  const pct = Math.round(((totalSecs - segundos) / totalSecs) * 100)
  const mins = Math.floor(segundos / 60)
  const secs = segundos % 60

  useEffect(() => {
    if (rodando) {
      intervalRef.current = setInterval(() => {
        setSegundos((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRodando(false)
            if (mode === 'foco') {
              setCiclos((c) => c + 1)
              // Notificação
              if (typeof window !== 'undefined' && Notification.permission === 'granted') {
                new Notification('🍅 Pomodoro concluído!', { body: 'Hora da pausa.' })
              }
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [rodando, mode])

  function switchMode(newMode, mins) {
    clearInterval(intervalRef.current)
    setRodando(false)
    setMode(newMode)
    setCustomMins(mins)
    setSegundos(mins * 60)
  }

  function toggle() {
    setRodando((r) => !r)
  }

  function reset() {
    clearInterval(intervalRef.current)
    setRodando(false)
    setSegundos(customMins * 60)
  }

  // Círculo SVG
  const size = 200
  const r = 80
  const circ = 2 * Math.PI * r
  const dash = ((100 - pct) / 100) * circ

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl pb-8 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <p className="font-black text-slate-800 text-lg">🍅 Pomodoro</p>
            {activeBlock && <p className="text-xs text-slate-400">{activeBlock.icon} {activeBlock.title}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">{ciclos} ciclo{ciclos !== 1 ? 's' : ''}</span>
            <button onClick={onClose} className="text-slate-300 text-2xl w-8 h-8 flex items-center justify-center">&times;</button>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex gap-1.5 px-5 mb-4">
          {[
            { id: 'foco', label: '🍅 Foco', mins: 25 },
            { id: 'pausa', label: '☕ Pausa', mins: 5 },
            { id: 'pausaLong', label: '🛋️ Longa', mins: 15 },
          ].map((opt) => (
            <button key={opt.id} onClick={() => switchMode(opt.id, opt.mins)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === opt.id ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}
              style={mode === opt.id ? { background: MODES[opt.id].color } : {}}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Timer circle */}
        <div className="flex flex-col items-center pb-2">
          <div className="relative">
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
              <circle
                cx={size/2} cy={size/2} r={r}
                fill="none" stroke={m.color} strokeWidth={10}
                strokeDasharray={`${circ - dash} ${dash}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-black text-slate-800 tabular-nums">
                {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
              </p>
              <p className="text-xs font-bold mt-1" style={{ color: m.color }}>{m.label}</p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex gap-3 mt-4">
            <button onClick={reset}
              className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 font-bold text-lg flex items-center justify-center active:scale-90 transition-all">
              ↺
            </button>
            <button onClick={toggle}
              className="w-24 h-12 rounded-full text-white font-black text-sm flex items-center justify-center active:scale-90 transition-all shadow-lg"
              style={{ background: m.color }}>
              {rodando ? '⏸ Pausar' : '▶ Iniciar'}
            </button>
            <button
              onClick={() => switchMode(mode === 'foco' ? 'pausa' : 'foco', mode === 'foco' ? 5 : 25)}
              className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 font-bold text-lg flex items-center justify-center active:scale-90 transition-all">
              ⏭
            </button>
          </div>

          {/* Custom time */}
          <div className="mt-4 flex items-center gap-2">
            <label className="text-xs text-slate-400 font-semibold">Tempo:</label>
            {[15, 25, 35, 45, 60].map((t) => (
              <button key={t} onClick={() => { setCustomMins(t); setSegundos(t * 60); setRodando(false) }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${customMins === t && mode === 'foco' ? 'text-white' : 'bg-slate-100 text-slate-500'}`}
                style={customMins === t && mode === 'foco' ? { background: m.color } : {}}>
                {t}m
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
