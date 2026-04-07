'use client'

import { useState } from 'react'
import { get, set } from '@/lib/storage'
import { seedMateriasMedicina, addMateria } from '@/lib/estudos'
import {
  loadDisponibilidade, saveDisponibilidade,
  DAY_NAMES, DAY_SHORT,
} from '@/lib/disponibilidade'
import { addProva, loadProvas, saveProvas } from '@/lib/provas'

const KEY_DONE = 'sdv2-onboarding-done'

export function isOnboardingDone() {
  if (typeof window === 'undefined') return true
  return get(KEY_DONE, false)
}

export function markOnboardingDone() {
  set(KEY_DONE, true)
}

// ── Step components ───────────────────────────────────────────────────────────

function StepBemVindo({ onNext }) {
  return (
    <div className="flex flex-col items-center text-center px-2">
      <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
        <span className="text-5xl">🩺</span>
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Bem-vindo ao MedPlanner</h1>
      <p className="text-slate-500 text-sm leading-relaxed mb-8">
        Vamos configurar seu app em menos de 2 minutos.<br />
        Assim ele já começa trabalhando por você.
      </p>
      <div className="w-full space-y-3 text-left mb-8">
        {[
          { icon: '📋', text: 'Sua fase no curso' },
          { icon: '📚', text: 'Suas matérias' },
          { icon: '⏰', text: 'Horários livres para estudo' },
          { icon: '📅', text: 'Próxima prova (opcional)' },
        ].map((item) => (
          <div key={item.icon} className="flex items-center gap-3 bg-indigo-50 rounded-2xl px-4 py-3">
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-semibold text-indigo-800">{item.text}</span>
          </div>
        ))}
      </div>
      <button onClick={onNext} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl text-base active:scale-95 transition-all shadow-lg">
        Começar configuração →
      </button>
    </div>
  )
}

function StepFase({ onNext }) {
  const [fase, setFase] = useState('')

  const fases = [
    { id: 'pré-clínico', label: 'Pré-clínico', sub: '1º ao 4º período', icon: '📖' },
    { id: 'clínico',     label: 'Clínico',     sub: '5º ao 8º período', icon: '🏥' },
    { id: 'internato',   label: 'Internato',   sub: '9º ao 12º período', icon: '🩺' },
    { id: 'residência',  label: 'Residência',  sub: 'Pós-graduação',     icon: '⚕️' },
  ]

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-extrabold text-slate-900 mb-1">Qual é sua fase?</h2>
      <p className="text-sm text-slate-400 mb-6">Usamos isso para priorizar o conteúdo certo.</p>
      <div className="space-y-3 mb-8">
        {fases.map((f) => (
          <button
            key={f.id}
            onClick={() => setFase(f.id)}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all text-left ${
              fase === f.id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <span className="text-2xl">{f.icon}</span>
            <div>
              <p className={`font-bold text-sm ${fase === f.id ? 'text-indigo-700' : 'text-slate-800'}`}>{f.label}</p>
              <p className="text-xs text-slate-400">{f.sub}</p>
            </div>
            {fase === f.id && <span className="ml-auto text-indigo-500 font-black">✓</span>}
          </button>
        ))}
      </div>
      <button
        onClick={() => fase && onNext({ fase })}
        disabled={!fase}
        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl disabled:opacity-30 active:scale-95 transition-all"
      >
        Continuar →
      </button>
    </div>
  )
}

function StepMaterias({ data, onNext }) {
  const [modo, setModo] = useState(null) // 'medicina' | 'manual'
  const [materias, setMaterias] = useState([])
  const [novaMateria, setNovaMateria] = useState('')

  function handleSeedMedicina() {
    const seeded = seedMateriasMedicina()
    setMaterias(seeded)
    setModo('medicina')
  }

  function handleAddManual() {
    if (!novaMateria.trim()) return
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']
    const nova = {
      id: Date.now().toString(),
      name: novaMateria.trim(),
      icon: '📚',
      color: colors[materias.length % colors.length],
      weeklyGoalHours: 4,
      fase: data.fase || '',
      topics: [],
      createdAt: new Date().toISOString(),
    }
    setMaterias((prev) => [...prev, nova])
    setNovaMateria('')
    setModo('manual')
  }

  function handleConfirm() {
    // Salva no storage
    set('sdv2-materias', materias)
    onNext({ materias })
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-extrabold text-slate-900 mb-1">Suas matérias</h2>
      <p className="text-sm text-slate-400 mb-5">Escolha como prefere começar.</p>

      {materias.length === 0 ? (
        <div className="space-y-3 mb-6">
          <button
            onClick={handleSeedMedicina}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50 text-left hover:border-indigo-400 transition-all"
          >
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-bold text-sm text-indigo-800">Carregar matérias de medicina</p>
              <p className="text-xs text-indigo-500">10 disciplinas pré-configuradas para o curso</p>
            </div>
          </button>
          <button
            onClick={() => setModo('manual')}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 border-slate-100 bg-white text-left hover:border-slate-200 transition-all"
          >
            <span className="text-2xl">✏️</span>
            <div>
              <p className="font-bold text-sm text-slate-800">Adicionar manualmente</p>
              <p className="text-xs text-slate-400">Crie suas próprias disciplinas</p>
            </div>
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{materias.length} matérias</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {materias.map((m) => (
              <div key={m.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-slate-100">
                <span className="text-base">{m.icon}</span>
                <span className="text-sm font-semibold text-slate-700 flex-1">{m.name}</span>
                <button onClick={() => setMaterias((prev) => prev.filter((x) => x.id !== m.id))}
                  className="text-slate-300 hover:text-red-400 text-xs">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {(modo === 'manual' || materias.length > 0) && (
        <div className="flex gap-2 mb-5">
          <input
            value={novaMateria}
            onChange={(e) => setNovaMateria(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
            placeholder="Nome da matéria..."
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400"
          />
          <button onClick={handleAddManual}
            className="px-4 bg-indigo-600 text-white font-bold rounded-xl text-sm">+</button>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={materias.length === 0}
        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl disabled:opacity-30 active:scale-95 transition-all"
      >
        Continuar com {materias.length} matéria{materias.length !== 1 ? 's' : ''} →
      </button>
      {materias.length === 0 && (
        <button onClick={() => onNext({ materias: [] })} className="mt-3 text-xs text-slate-400 text-center w-full">
          Pular por agora
        </button>
      )}
    </div>
  )
}

function StepHorarios({ onNext }) {
  const [disp, setDisp] = useState(loadDisponibilidade())

  const DAY_ICONS = ['🌙', '🌙', '🌙', '🌙', '🌙', '☀️', '☀️']

  function updateSlotField(dow, si, field, value) {
    setDisp((prev) => prev.map((d) => {
      if (d.dow !== dow) return d
      const slots = d.slots.map((s, i) => i === si ? { ...s, [field]: value } : s)
      return { ...d, slots }
    }))
  }

  function toggleDia(dow) {
    setDisp((prev) => prev.map((d) => {
      if (d.dow !== dow) return d
      if (d.slots.length > 0) return { ...d, slots: [] }
      return { ...d, slots: [{ start: dow < 5 ? '19:00' : '08:00', end: dow < 5 ? '22:00' : '13:00' }] }
    }))
  }

  function handleSave() {
    saveDisponibilidade(disp)
    onNext({ disponibilidade: disp })
  }

  const totalMin = disp.reduce((sum, d) => {
    return sum + d.slots.reduce((s2, sl) => {
      const [sh, sm] = sl.start.split(':').map(Number)
      const [eh, em] = sl.end.split(':').map(Number)
      return s2 + Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
    }, 0)
  }, 0)
  const totalH = (totalMin / 60).toFixed(1)

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-extrabold text-slate-900 mb-1">Quando você estuda?</h2>
      <p className="text-sm text-slate-400 mb-1">Configure suas janelas de estudo por dia.</p>
      {totalMin > 0 && (
        <p className="text-xs font-bold text-indigo-600 mb-4">{totalH}h disponíveis por semana</p>
      )}

      <div className="space-y-2 mb-6">
        {disp.map((d) => {
          const ativo = d.slots.length > 0
          return (
            <div key={d.dow} className={`rounded-2xl border-2 overflow-hidden transition-all ${ativo ? 'border-indigo-200 bg-white' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg">{DAY_ICONS[d.dow]}</span>
                <p className={`text-sm font-bold flex-1 ${ativo ? 'text-slate-800' : 'text-slate-400'}`}>{DAY_NAMES[d.dow]}</p>
                <button
                  onClick={() => toggleDia(d.dow)}
                  className={`w-12 h-6 rounded-full transition-all flex items-center px-0.5 ${ativo ? 'bg-indigo-500 justify-end' : 'bg-slate-200 justify-start'}`}
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
                </button>
              </div>
              {ativo && d.slots.map((sl, si) => (
                <div key={si} className="flex items-center gap-2 px-4 pb-3">
                  <input type="time" value={sl.start}
                    onChange={(e) => updateSlotField(d.dow, si, 'start', e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
                  <span className="text-xs text-slate-400">até</span>
                  <input type="time" value={sl.end}
                    onChange={(e) => updateSlotField(d.dow, si, 'end', e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <button onClick={handleSave}
        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl active:scale-95 transition-all">
        Continuar →
      </button>
    </div>
  )
}

function StepProva({ data, onNext }) {
  const [titulo, setTitulo] = useState('')
  const [dataProva, setDataProva] = useState('')
  const [materiaId, setMateriaId] = useState('')

  function handleSave() {
    if (titulo && dataProva) {
      const provas = loadProvas()
      const updated = addProva(provas, { titulo, data: dataProva, materiaId, tipo: 'prova' })
      saveProvas(updated)
    }
    onNext()
  }

  const materias = data.materias || []

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-extrabold text-slate-900 mb-1">Próxima prova</h2>
      <p className="text-sm text-slate-400 mb-6">Opcional — o app vai priorizar o estudo automaticamente.</p>

      <div className="space-y-3 mb-6">
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Nome da prova</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: P1 de Clínica Médica"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Data</label>
          <input type="date" value={dataProva} onChange={(e) => setDataProva(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
        </div>
        {materias.length > 0 && (
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Matéria (opcional)</label>
            <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400">
              <option value="">Selecionar matéria...</option>
              {materias.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <button onClick={handleSave}
        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl active:scale-95 transition-all">
        {titulo && dataProva ? 'Salvar e continuar →' : 'Pular →'}
      </button>
    </div>
  )
}

function StepPronto({ onFinish }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl animate-bounce">
        <span className="text-5xl">🎉</span>
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Tudo pronto!</h2>
      <p className="text-slate-500 text-sm leading-relaxed mb-8">
        Seu app já está configurado.<br />
        Vá em <strong>Estudos → Plano → Gerar</strong> para criar seu primeiro plano semanal.
      </p>
      <div className="w-full space-y-2 text-left mb-8">
        {[
          { icon: '📚', label: 'Importe o cronograma de cada matéria (botão ✨)' },
          { icon: '📋', label: 'Adicione suas próximas provas' },
          { icon: '🤖', label: 'Gere seu plano semanal com IA' },
        ].map((tip) => (
          <div key={tip.icon} className="flex items-start gap-3 bg-slate-50 rounded-2xl px-4 py-3">
            <span className="text-lg mt-0.5">{tip.icon}</span>
            <span className="text-xs text-slate-600 font-medium leading-relaxed">{tip.label}</span>
          </div>
        ))}
      </div>
      <button onClick={onFinish}
        className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl text-base active:scale-95 transition-all shadow-lg">
        Abrir o app →
      </button>
    </div>
  )
}

// ── Main Onboarding ───────────────────────────────────────────────────────────
export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})

  const STEPS = ['bemvindo', 'fase', 'materias', 'horarios', 'prova', 'pronto']
  const current = STEPS[step]

  function next(newData = {}) {
    setData((prev) => ({ ...prev, ...newData }))
    setStep((s) => s + 1)
  }

  function finish() {
    markOnboardingDone()
    onDone()
  }

  const progress = step / (STEPS.length - 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        {/* Progress bar */}
        {step > 0 && step < STEPS.length - 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400">Passo {step} de {STEPS.length - 2}</p>
              <button onClick={finish} className="text-xs text-slate-400 hover:text-slate-600">Pular tudo</button>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}

        {current === 'bemvindo'  && <StepBemVindo onNext={next} />}
        {current === 'fase'      && <StepFase onNext={next} />}
        {current === 'materias'  && <StepMaterias data={data} onNext={next} />}
        {current === 'horarios'  && <StepHorarios onNext={next} />}
        {current === 'prova'     && <StepProva data={data} onNext={next} />}
        {current === 'pronto'    && <StepPronto onFinish={finish} />}
      </div>
    </div>
  )
}
