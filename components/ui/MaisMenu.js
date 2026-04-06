'use client'

import { useState } from 'react'
import NotificationSettings from '@/components/shared/NotificationSettings'

const ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'bg-blue-50    text-blue-600'    },
  { id: 'habitos',   label: 'Hábitos',   icon: '🌱', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'metas',     label: 'Metas',     icon: '🎯', color: 'bg-indigo-50  text-indigo-600'  },
  { id: 'semana',    label: 'Semana',    icon: '📆', color: 'bg-violet-50  text-violet-600'  },
  { id: 'rotina',    label: 'Rotina',    icon: '🔄', color: 'bg-cyan-50    text-cyan-600'    },
  { id: 'inbox',     label: 'Inbox',     icon: '⚡', color: 'bg-amber-50   text-amber-600'   },
]

export default function MaisMenu({ onNavigate, onClose, onReview, pendingInbox = 0 }) {
  const [showNotif, setShowNotif] = useState(false)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slideUp modal-sheet">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
          </div>
          <div className="px-5 pt-2 pb-2 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mais seções</p>
            <div className="flex gap-2">
              {onReview && (
                <button
                  onClick={() => { onReview(); onClose() }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl active:bg-slate-200"
                >
                  📋 Review
                </button>
              )}
              <button
                onClick={() => setShowNotif(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl active:bg-slate-200"
              >
                🔔 Notificações
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 px-5 pb-6">
            {ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose() }}
                className={`relative flex flex-col items-center justify-center gap-2 py-4 rounded-2xl ${item.color} active:scale-95 transition-all`}
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="text-xs font-bold">{item.label}</span>
                {item.id === 'inbox' && pendingInbox > 0 && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                    {pendingInbox > 9 ? '9+' : pendingInbox}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showNotif && <NotificationSettings onClose={() => setShowNotif(false)} />}
    </>
  )
}
