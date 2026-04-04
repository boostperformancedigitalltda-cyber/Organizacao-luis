'use client'

const TABS = [
  { id: 'hoje',     label: 'Hoje',     icon: '📅' },
  { id: 'estudos',  label: 'Estudos',  icon: '📚' },
  { id: 'treino',   label: 'Treino',   icon: '💪' },
  { id: 'projetos', label: 'Projetos', icon: '🚀' },
  { id: 'financas', label: 'Finanças', icon: '💰' },
  { id: 'mais',     label: 'Mais',     icon: '⋯'  },
]

export default function BottomNav({ active, onChange, pendingInbox = 0 }) {
  const SECONDARY = ['habitos','metas','semana','mes','inbox','rotina']
  const activeIsSecondary = SECONDARY.includes(active)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 nav-safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {TABS.map((tab) => {
          const isMais = tab.id === 'mais'
          const isActive = isMais ? activeIsSecondary : active === tab.id
          const hasBadge = isMais && pendingInbox > 0

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all active:scale-90 min-h-[64px] touch-none ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-indigo-500" />
              )}
              <span className={`text-[20px] leading-none ${isMais ? 'font-bold tracking-widest text-base' : ''}`}>
                {tab.icon}
              </span>
              <span className="text-[9px] font-bold leading-none whitespace-nowrap">
                {tab.label}
              </span>
              {hasBadge && (
                <span className="absolute top-1.5 right-2 bg-amber-500 text-white text-[8px] font-bold min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center">
                  {pendingInbox > 9 ? '9+' : pendingInbox}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
