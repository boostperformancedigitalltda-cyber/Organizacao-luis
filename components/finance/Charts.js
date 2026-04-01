'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { fmtShort, fmt } from '@/lib/finance'

// Monthly bar chart
export function MonthlyChart({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <p className="text-sm font-bold text-slate-800 mb-4">Últimos 6 meses</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={10} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={48} />
          <Tooltip
            formatter={(v, name) => [fmt(v), name === 'entradas' ? 'Entradas' : 'Gastos']}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          />
          <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} name="entradas" />
          <Bar dataKey="saidas"   fill="#f43f5e" radius={[4, 4, 0, 0]} name="saidas" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 justify-center">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Entradas
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />Gastos
        </span>
      </div>
    </div>
  )
}

// Category pie chart
export function CategoryPie({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
        <p className="text-3xl mb-2">🥧</p>
        <p className="text-sm text-slate-400">Nenhum gasto registrado</p>
      </div>
    )
  }
  const total = data.reduce((s, d) => s + d.total, 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <p className="text-sm font-bold text-slate-800 mb-4">Gastos por categoria</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => [fmt(v), '']}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 mt-2">
        {data.slice(0, 6).map((cat, i) => (
          <div key={cat.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-slate-600 font-medium">{cat.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-semibold">{fmt(cat.total)}</span>
              <span className="text-slate-400 w-8 text-right">{Math.round((cat.total / total) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Daily spending area chart
export function DailyChart({ data }) {
  const chartData = data

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <p className="text-sm font-bold text-slate-800 mb-4">Gastos diários</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={4} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={42} />
          <Tooltip
            formatter={(v) => [fmt(v), 'Gastos']}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
          />
          <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#dailyGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
