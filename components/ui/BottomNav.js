'use client'

const TABS = [
  { id: 'hoje',    label: 'Hoje',    icon: '📅' },
  { id: 'estudos', label: 'Estudos', icon: '📚' },
  { id: 'semana',  label: 'Semana',  icon: '🗓️' },
  { id: 'treino',  label: 'Treino',  icon: '💪' },
  { id: 'financas',label: 'Finanças',icon: '💰' },
  { id: 'mais',    label: 'Mais',    icon: '⋯'  },
]

export default function BottomNav({ active, onChange, pendingInbox = 0 }) {
  const SECONDARY = ['habitos','metas','projetos','mes','inbox','rotina','dashboard']
  const activeIsSecondary = SECONDARY.includes(active)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 nav-safe-bottom"
      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(226,232,240,0.8)' }}>
      <div className="max-w-lg mx-auto flex">
        {TABS.map((tab) => {
          const isMais = tab.id === 'mais'
          const isActive = isMais ? activeIsSecondary : active === tab.id
          const hasBadge = isMais && pendingInbox > 0

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="relative flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all active:scale-90 min-h-[64px] touch-none"
            >
              {/* Pill background for active */}
              {isActive && (
                <span className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-2xl bg-indigo-50" />
              )}

              <span className={`relative z-10 text-[22px] leading-none transition-all duration-200 ${
                isMais ? 'font-bold tracking-widest text-base' : ''
              } ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className={`relative z-10 text-[9px] font-bold leading-none whitespace-nowrap transition-colors duration-200 ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`}>
                {tab.label}
              </span>

              {hasBadge && (
                <span className="absolute top-1.5 right-2 bg-amber-500 text-white text-[8px] font-bold min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center z-20">
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
