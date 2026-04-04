'use client'

import { useState, useEffect } from 'react'
import {
  loadNotifSettings, saveNotifSettings,
  requestPermission, getPermission, scheduleAll
} from '@/lib/notifications'

const ITEMS = [
  { key: 'morning', icon: '☀️', label: 'Manhã',       desc: 'Planejar o dia' },
  { key: 'study',   icon: '📚', label: 'Estudo',       desc: 'Lembrete de sessão' },
  { key: 'treino',  icon: '💪', label: 'Treino',       desc: 'Lembrete de treino' },
  { key: 'review',  icon: '📋', label: 'Review',       desc: 'Domingo — review semanal' },
]

export default function NotificationSettings({ onClose }) {
  const [settings, setSettings] = useState(loadNotifSettings)
  const [permission, setPermission] = useState(() => getPermission())
  const [saving, setSaving] = useState(false)

  async function handleEnable() {
    const result = await requestPermission()
    setPermission(result)
    if (result === 'granted') {
      const next = { ...settings, enabled: true }
      setSettings(next)
      saveNotifSettings(next)
      scheduleAll(next)
    }
  }

  function handleToggleMain(val) {
    const next = { ...settings, enabled: val }
    setSettings(next)
    saveNotifSettings(next)
    scheduleAll(next)
  }

  function handleToggleItem(key, val) {
    const next = { ...settings, [key]: { ...settings[key], enabled: val } }
    setSettings(next)
    saveNotifSettings(next)
    scheduleAll(next)
  }

  function handleTime(key, time) {
    const next = { ...settings, [key]: { ...settings[key], time } }
    setSettings(next)
    saveNotifSettings(next)
    scheduleAll(next)
  }

  const isSupported = permission !== 'unsupported'
  const isDenied = permission === 'denied'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slideUp modal-sheet">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Notificações</h2>
              <p className="text-xs text-slate-400 mt-0.5">Lembretes diários automáticos</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500">✕</button>
          </div>

          {!isSupported && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 mb-4">
              Seu navegador não suporta notificações. Instale o app na tela inicial (iOS/Android) para ativar.
            </div>
          )}

          {isDenied && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4">
              Notificações bloqueadas. Vá em Configurações do navegador e permita notificações para este site.
            </div>
          )}

          {isSupported && !isDenied && permission !== 'granted' && (
            <button
              onClick={handleEnable}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl mb-5 active:bg-indigo-700 transition-all"
            >
              Ativar notificações
            </button>
          )}

          {permission === 'granted' && (
            <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 mb-5">
              <div>
                <p className="text-sm font-bold text-slate-700">Notificações ativas</p>
                <p className="text-xs text-slate-400">Desative para pausar todos os lembretes</p>
              </div>
              <Toggle value={settings.enabled} onChange={handleToggleMain} />
            </div>
          )}

          <div className="space-y-3">
            {ITEMS.map(({ key, icon, label, desc }) => {
              const item = settings[key] || {}
              const disabled = !settings.enabled || permission !== 'granted'
              return (
                <div
                  key={key}
                  className={`bg-white border border-slate-100 rounded-2xl p-4 shadow-sm transition-opacity ${disabled ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                    <Toggle
                      value={item.enabled}
                      onChange={(v) => !disabled && handleToggleItem(key, v)}
                      disabled={disabled}
                    />
                  </div>
                  {item.enabled && !disabled && key !== 'review' && (
                    <div className="mt-3 flex items-center gap-2 pl-13">
                      <span className="text-xs text-slate-500 ml-[52px]">Horário:</span>
                      <input
                        type="time"
                        value={item.time || '07:00'}
                        onChange={(e) => handleTime(key, e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-700 bg-slate-50"
                      />
                    </div>
                  )}
                  {item.enabled && !disabled && key === 'review' && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-500 ml-[52px]">Horário (dom):</span>
                      <input
                        type="time"
                        value={item.time || '20:00'}
                        onChange={(e) => handleTime(key, e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-700 bg-slate-50"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Toggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-indigo-500' : 'bg-slate-200'} ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}
