'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { CATEGORIES, PAYMENT_METHODS } from '@/lib/finance'

export default function AddTxModal({ open, onClose, onAdd }) {
  const [type, setType] = useState('saida')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('alimentacao')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('pix')

  const handleSave = () => {
    const val = parseFloat(amount.replace(',', '.'))
    if (!val || val <= 0) return
    onAdd({ type, amount: val, category, description, date, paymentMethod: type === 'saida' ? paymentMethod : null })
    setAmount('')
    setDescription('')
    setCategory('alimentacao')
    setDate(new Date().toISOString().slice(0, 10))
    setPaymentMethod('pix')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova transação">
      <div className="p-5 space-y-4">
        {/* Type toggle */}
        <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <button
            onClick={() => setType('saida')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
              type === 'saida' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            💸 Gasto
          </button>
          <button
            onClick={() => setType('entrada')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
              type === 'entrada' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            💰 Entrada
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor *</label>
          <div className="mt-1.5 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 transition"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                  category === cat.id
                    ? `${cat.bg} ${cat.text} border ${cat.border} shadow-sm`
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment method (only for gastos) */}
        {type === 'saida' && (
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Forma de pagamento</label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                    paymentMethod === m.id
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span>{m.icon}</span>{m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição (opcional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Almoço, Uber, Faculdade..."
            className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 transition"
          />
        </div>

        {/* Date */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 transition"
          />
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-3 text-white font-semibold rounded-xl transition-colors shadow-sm ${
            type === 'saida' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          Adicionar {type === 'saida' ? 'gasto' : 'entrada'}
        </button>
      </div>
    </Modal>
  )
}
