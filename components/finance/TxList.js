'use client'

import { useState } from 'react'
import { fmt, getCat, CATEGORIES, getPaymentMethod } from '@/lib/finance'

function ago(dateStr) {
  const d = new Date(dateStr)
  const mins = Math.floor((Date.now() - d) / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h atrás`
  const days = Math.floor(h / 24)
  if (days === 1) return 'ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function TxList({ transactions, onRemove, showFilter = false }) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')

  let filtered = transactions
  if (typeFilter !== 'all') filtered = filtered.filter((t) => t.type === typeFilter)
  if (catFilter !== 'all') filtered = filtered.filter((t) => t.category === catFilter)

  // Running balance
  let runningBalance = 0
  const withBalance = [...filtered].reverse().map((tx) => {
    runningBalance += tx.type === 'entrada' ? tx.amount : -tx.amount
    return { ...tx, balance: runningBalance }
  }).reverse()

  return (
    <div>
      {showFilter && (
        <div className="space-y-2 mb-3">
          <div className="flex gap-1.5">
            {[['all', 'Todos'], ['entrada', 'Entradas'], ['saida', 'Gastos']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTypeFilter(v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  typeFilter === v ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 outline-none"
          >
            <option value="all">Todas as categorias</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-4xl mb-2">💸</p>
          <p className="text-sm text-slate-400">Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {withBalance.map((tx) => {
            const cat = getCat(tx.category)
            const pm = tx.paymentMethod ? getPaymentMethod(tx.paymentMethod) : null
            return (
              <div key={tx.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.bg} ${cat.border} border`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${tx.type === 'entrada' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {tx.description || cat.label}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className={`${cat.text} font-medium`}>{cat.label}</span>
                    {pm && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md text-[10px] font-semibold">
                          {pm.icon} {pm.label}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span>{ago(tx.date)}</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-sm ${tx.type === 'entrada' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {tx.type === 'entrada' ? '+' : '-'}{fmt(tx.amount)}
                  </p>
                  {showFilter && (
                    <p className="text-[10px] text-slate-300">{fmt(tx.balance)}</p>
                  )}
                </div>
                <button
                  onClick={() => onRemove(tx.id)}
                  className="text-slate-200 hover:text-rose-400 transition-colors flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
