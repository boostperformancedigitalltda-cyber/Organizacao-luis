'use client'

const TABS = [
  { id: 'hoje',     label: 'Hoje',     icon: '📅' },
  { id: 'semana',   label: 'Semana',   icon: '📆' },
  { id: 'mes',      label: 'Mês',      icon: '🗓️' },
  { id: 'estudos',  label: 'Estudos',  icon: '📚' },
  { id: 'treino',   label: 'Treino',   icon: '💪' },
  { id: 'projetos', label: 'Projetos', icon: '🚀' },
  { id: 'metas',    label: 'Metas',    icon: '🎯' },
  { id: 'financas', label: 'Finanças', icon: '💰' },
  { id: 'rotina',   label: 'Rotina',   icon: '⚙️' },
]

export default function BottomNav({ active, onChange, pendingInbox = 0 }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-inset-bottom">
      <div className="max-w-lg mx-auto overflow-x-auto scrollbar-none">
        <div className="flex min-w-max">
          {TABS.map((tab) => {
            const isActive = active === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-3.5 gap-0.5 transition-colors active:scale-95 min-w-[58px] ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="text-[18px] leading-none">{tab.icon}</span>
                <span className={`text-[9px] font-semibold leading-none whitespace-nowrap ${isActive ? 'text-indigo-600' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-indigo-500 mt-0.5" />
                )}
                {/* Inbox badge */}
                {tab.id === 'inbox' && pendingInbox > 0 && (
                  <span className="absolute top-1 right-1 bg-amber-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {pendingInbox > 9 ? '9+' : pendingInbox}
                  </span>
                )}
              </button>
            )
          })}
          {/* Inbox tab separado */}
          <button
            onClick={() => onChange('inbox')}
            className={`relative flex flex-col items-center justify-center py-2 px-3.5 gap-0.5 transition-colors active:scale-95 min-w-[58px] ${
              active === 'inbox' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-[18px] leading-none">⚡</span>
            <span className={`text-[9px] font-semibold leading-none ${active === 'inbox' ? 'text-amber-500' : ''}`}>
              Inbox
            </span>
            {active === 'inbox' && <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />}
            {pendingInbox > 0 && active !== 'inbox' && (
              <span className="absolute top-1 right-1 bg-amber-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {pendingInbox > 9 ? '9+' : pendingInbox}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
