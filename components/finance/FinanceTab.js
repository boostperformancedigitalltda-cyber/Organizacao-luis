'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import SummaryCards from './SummaryCards'
import { MonthlyChart, CategoryPie, DailyChart } from './Charts'
import TxList from './TxList'
import BudgetView from './BudgetView'
import AddTxModal from './AddTxModal'
import {
  loadTransactions, addTx, removeTx,
  calcPeriodSummary, calcByCategoryPeriod, calcLast6Months, calcDailyForPeriod,
  loadFinGoal, saveFinGoal, fmt, getPeriodTxs,
  loadCategories, saveCategories, addCategory, removeCategory,
  getColorPresets, DEFAULT_CATEGORIES,
} from '@/lib/finance'

const PACK_MEDICINA_CATS = [
  { label: 'Cursinho/Residência', color: '#6366f1' },
  { label: 'Livros e material',   color: '#8b5cf6' },
  { label: 'Alimentação',         color: '#f97316' },
  { label: 'Transporte',          color: '#06b6d4' },
  { label: 'Moradia',             color: '#f59e0b' },
  { label: 'Saúde',               color: '#ef4444' },
  { label: 'Lazer',               color: '#ec4899' },
  { label: 'Investimento',        color: '#10b981' },
  { label: 'Outros',              color: '#94a3b8' },
]

function CategoryManager({ onClose }) {
  const [cats, setCats] = useState(loadCategories())
  const [novaLabel, setNovaLabel] = useState('')
  const [novaCor, setNovaCor] = useState('#6366f1')
  const presets = getColorPresets()

  function handleAdd() {
    if (!novaLabel.trim()) return
    setCats(addCategory(cats, { label: novaLabel.trim(), color: novaCor }))
    setNovaLabel('')
  }

  function handleRemove(id) {
    const builtin = DEFAULT_CATEGORIES.find((c) => c.id === id)
    if (builtin && !confirm(`Remover "${builtin.label}"? Transações existentes com essa categoria não serão afetadas.`)) return
    setCats(removeCategory(cats, id))
  }

  function handlePackMedicina() {
    const { set } = require('@/lib/storage')
    const novaCats = PACK_MEDICINA_CATS.map((item, i) => {
      const preset = presets.find((p) => p.color === item.color) || presets[i % presets.length]
      const id = item.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_med'
      return { id, label: item.label, ...preset }
    })
    saveCategories(novaCats)
    setCats(novaCats)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-2xl shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="font-bold text-slate-800 text-lg">Categorias</h2>
          <button onClick={onClose} className="text-slate-400 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {/* Pack medicina */}
          <button onClick={handlePackMedicina}
            className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-left hover:bg-indigo-100 transition-all">
            <span className="text-xl">🩺</span>
            <div>
              <p className="text-sm font-bold text-indigo-800">Carregar pack medicina</p>
              <p className="text-xs text-indigo-500">Substitui pelas categorias ideais pra estudante de medicina</p>
            </div>
          </button>

          {/* Lista atual */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Categorias atuais ({cats.length})</p>
            <div className="space-y-1.5">
              {cats.map((c) => (
                <div key={c.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-sm font-semibold text-slate-700 flex-1">{c.label}</span>
                  <button onClick={() => handleRemove(c.id)}
                    className="text-slate-300 hover:text-red-400 text-xs w-6 h-6 flex items-center justify-center">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Nova categoria */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-500">Nova categoria</p>
            <input value={novaLabel} onChange={(e) => setNovaLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Nome da categoria..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
            <div>
              <p className="text-xs text-slate-400 mb-2">Cor</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button key={p.color} onClick={() => setNovaCor(p.color)}
                    style={{ background: p.color }}
                    className={`w-8 h-8 rounded-full transition-all ${novaCor === p.color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`} />
                ))}
              </div>
            </div>
            <button onClick={handleAdd} disabled={!novaLabel.trim()}
              className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm disabled:opacity-40">
              + Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const SUB_TABS = [
  { id: 'resumo',    label: 'Resumo' },
  { id: 'graficos',  label: 'Gráficos' },
  { id: 'extrato',   label: 'Extrato' },
  { id: 'orcamento', label: 'Orçamento' },
]

const PERIODS = [
  { id: 'dia',    label: 'Dia' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mês' },
  { id: 'custom', label: 'Custom' },
]

function getRange(period, currentDate, customStart, customEnd) {
  const d = new Date(currentDate)
  if (period === 'dia') {
    return [
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
    ]
  }
  if (period === 'semana') {
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow, 0, 0, 0)
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999)
    return [start, end]
  }
  if (period === 'custom' && customStart && customEnd) {
    return [
      new Date(customStart + 'T00:00:00'),
      new Date(customEnd + 'T23:59:59'),
    ]
  }
  // mes (default)
  return [
    new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0),
    new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
  ]
}

function getPeriodLabel(period, currentDate, customStart, customEnd) {
  const d = new Date(currentDate)
  if (period === 'dia') {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  }
  if (period === 'semana') {
    const [start, end] = getRange('semana', currentDate, null, null)
    const s = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    const e = end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    return `${s} – ${e}`
  }
  if (period === 'custom') {
    if (customStart && customEnd) return `${customStart.split('-').reverse().join('/')} – ${customEnd.split('-').reverse().join('/')}`
    return 'Selecione o período'
  }
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default function FinanceTab() {
  const [txs, setTxs] = useState([])
  const [finGoal, setFinGoal] = useState(0)
  const [modal, setModal] = useState(false)
  const [view, setView] = useState('resumo')
  const [loaded, setLoaded] = useState(false)
  const [period, setPeriod] = useState('mes')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [editGoal, setEditGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [showCatManager, setShowCatManager] = useState(false)

  useEffect(() => {
    setTxs(loadTransactions())
    setFinGoal(loadFinGoal())
    setLoaded(true)
  }, [])

  const [rangeStart, rangeEnd] = useMemo(
    () => getRange(period, currentDate, customStart, customEnd),
    [period, currentDate, customStart, customEnd]
  )

  const summary  = useMemo(() => calcPeriodSummary(txs, rangeStart, rangeEnd), [txs, rangeStart, rangeEnd])
  const byCat    = useMemo(() => calcByCategoryPeriod(txs, rangeStart, rangeEnd), [txs, rangeStart, rangeEnd])
  const monthly  = useMemo(() => calcLast6Months(txs), [txs])
  const daily    = useMemo(() => calcDailyForPeriod(txs, rangeStart, rangeEnd), [txs, rangeStart, rangeEnd])
  const periodTxs = useMemo(() => getPeriodTxs(txs, rangeStart, rangeEnd), [txs, rangeStart, rangeEnd])

  const handleAdd = (data) => {
    const updated = addTx(txs, data)
    setTxs(updated)
    setModal(false)
  }

  const handleRemove = (id) => {
    const updated = removeTx(txs, id)
    setTxs(updated)
  }

  const handlePrev = () => {
    const d = new Date(currentDate)
    if (period === 'dia') d.setDate(d.getDate() - 1)
    else if (period === 'semana') d.setDate(d.getDate() - 7)
    else if (period === 'mes') d.setMonth(d.getMonth() - 1)
    setCurrentDate(d)
  }

  const handleNext = () => {
    const d = new Date(currentDate)
    if (period === 'dia') d.setDate(d.getDate() + 1)
    else if (period === 'semana') d.setDate(d.getDate() + 7)
    else if (period === 'mes') d.setMonth(d.getMonth() + 1)
    setCurrentDate(d)
  }

  const goalPct = finGoal > 0 && summary.saldo > 0 ? Math.min(100, Math.round((summary.saldo / finGoal) * 100)) : 0

  if (!loaded) return null

  const periodLabel = getPeriodLabel(period, currentDate, customStart, customEnd)
  const showNav = period !== 'custom'

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-slate-900">Finanças</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCatManager(true)}
            className="px-3 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl transition-colors hover:bg-slate-200"
          >
            🏷️
          </button>
          <button
            onClick={() => setModal(true)}
            className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            + Novo
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-3">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === p.id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date navigation or custom inputs */}
      {period === 'custom' ? (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-400 transition"
          />
          <span className="text-slate-400 text-xs font-bold">→</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-400 transition"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between mb-3 px-1">
          <button onClick={handlePrev} className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 font-bold transition-colors">‹</button>
          <span className="text-sm text-slate-600 font-semibold capitalize">{periodLabel}</span>
          <button onClick={handleNext} className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 font-bold transition-colors">›</button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              view === t.id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* RESUMO */}
      {view === 'resumo' && (
        <div className="space-y-4 animate-fade-in">
          <SummaryCards summary={summary} txCount={periodTxs.length} />

          {/* Monthly goal */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meta de economia</p>
              {editGoal ? (
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="0"
                    className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                  />
                  <button
                    onClick={() => {
                      const v = parseFloat(goalInput) || 0
                      setFinGoal(v)
                      saveFinGoal(v)
                      setEditGoal(false)
                    }}
                    className="px-2 py-1 bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setGoalInput(finGoal || ''); setEditGoal(true) }}
                  className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold"
                >
                  {finGoal > 0 ? '✏️ Editar' : '+ Definir'}
                </button>
              )}
            </div>
            {finGoal > 0 ? (
              <>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-slate-700">{fmt(summary.saldo > 0 ? summary.saldo : 0)}</span>
                  <span className="text-slate-400">{fmt(finGoal)}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${goalPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${goalPct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5 text-right font-semibold">{goalPct}%</p>
              </>
            ) : (
              <p className="text-sm text-slate-300 italic">Nenhuma meta definida</p>
            )}
          </div>

          {/* Last 5 transactions */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Últimas movimentações</p>
            <TxList transactions={periodTxs.slice(0, 5)} onRemove={handleRemove} />
            {periodTxs.length > 5 && (
              <button
                onClick={() => setView('extrato')}
                className="w-full text-xs text-indigo-500 font-semibold py-3 hover:text-indigo-600 transition-colors"
              >
                Ver todas ({periodTxs.length}) →
              </button>
            )}
          </div>
        </div>
      )}

      {/* GRÁFICOS */}
      {view === 'graficos' && (
        <div className="space-y-4 animate-fade-in">
          <MonthlyChart data={monthly} />
          <CategoryPie data={byCat} />
          {daily.length > 1 && <DailyChart data={daily} />}
        </div>
      )}

      {/* EXTRATO */}
      {view === 'extrato' && (
        <div className="animate-fade-in">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-400 mb-1">Transações</p>
                <p className="font-bold text-slate-800">{periodTxs.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Entradas</p>
                <p className="font-bold text-emerald-600">{fmt(summary.entradas)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Gastos</p>
                <p className="font-bold text-rose-500">{fmt(summary.saidas)}</p>
              </div>
            </div>
          </div>
          <TxList transactions={periodTxs} onRemove={handleRemove} showFilter />
        </div>
      )}

      {/* ORÇAMENTO */}
      {view === 'orcamento' && (
        <div className="animate-fade-in">
          <BudgetView byCat={byCat} />
        </div>
      )}

      {/* Modals */}
      <AddTxModal open={modal} onClose={() => setModal(false)} onAdd={handleAdd} />
      {showCatManager && <CategoryManager onClose={() => setShowCatManager(false)} />}
    </div>
  )
}
