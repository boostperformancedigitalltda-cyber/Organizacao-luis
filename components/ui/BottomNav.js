'use client'

const TABS = [
  { id: 'hoje',     label: 'Hoje',    icon: '📅' },
  { id: 'semana',   label: 'Semana',  icon: '📆' },
  { id: 'mes',      label: 'Mês',     icon: '🗓️' },
  { id: 'metas',    label: 'Metas',   icon: '🎯' },
  { id: 'financas', label: 'Finanças',icon: '💰' },
  { id: 'rotina',   label: 'Rotina',  icon: '⚙️' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-inset-bottom">
      <div className="max-w-lg mx-auto flex">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors active:scale-95 ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-indigo-600' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-500 mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
