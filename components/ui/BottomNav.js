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
  { id: 'inbox',    label: 'Inbox',    icon: '⚡', accent: true },
]

export default function BottomNav({ active, onChange, pendingInbox = 0 }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 nav-safe-bottom">
      <div className="max-w-lg mx-auto overflow-x-auto scrollbar-none">
        <div className="flex min-w-max">
          {TABS.map((tab) => {
            const isActive = active === tab.id
            const isInbox = tab.id === 'inbox'
            const hasBadge = isInbox && pendingInbox > 0

            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-3 gap-0.5 transition-all active:scale-90 min-w-[60px] min-h-[56px] ${
                  isActive
                    ? tab.accent ? 'text-amber-500' : 'text-indigo-600'
                    : 'text-slate-400'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${tab.accent ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                )}

                <span className="text-[20px] leading-none">{tab.icon}</span>
                <span className={`text-[9px] font-bold leading-none whitespace-nowrap ${isActive ? '' : 'text-slate-400'}`}>
                  {tab.label}
                </span>

                {/* Badge */}
                {hasBadge && (
                  <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[8px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                    {pendingInbox > 9 ? '9+' : pendingInbox}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
