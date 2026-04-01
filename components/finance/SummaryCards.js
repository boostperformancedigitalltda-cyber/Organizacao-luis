'use client'

import { fmt } from '@/lib/finance'

export default function SummaryCards({ summary, txCount }) {
  const { entradas, saidas, saldo } = summary
  const savingsRate = entradas > 0 ? Math.round(((entradas - saidas) / entradas) * 100) : 0

  return (
    <div className="space-y-3">
      {/* Big saldo card */}
      <div className={`rounded-2xl p-5 shadow-sm border ${
        saldo >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
      }`}>
        <p className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-500">Saldo do mês</p>
        <p className={`text-4xl font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
          {fmt(saldo)}
        </p>
        {entradas > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            Taxa de economia:{' '}
            <span className={`font-bold ${savingsRate >= 20 ? 'text-emerald-600' : 'text-amber-500'}`}>
              {savingsRate}%
            </span>
          </p>
        )}
      </div>

      {/* Entradas / Gastos / Transações */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
          <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-1.5" />
          <p className="text-sm font-bold text-emerald-600">{fmt(entradas)}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Entradas</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
          <div className="w-2 h-2 rounded-full bg-rose-500 mx-auto mb-1.5" />
          <p className="text-sm font-bold text-rose-500">{fmt(saidas)}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Gastos</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
          <div className="w-2 h-2 rounded-full bg-indigo-400 mx-auto mb-1.5" />
          <p className="text-sm font-bold text-slate-700">{txCount || 0}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Transações</p>
        </div>
      </div>
    </div>
  )
}
