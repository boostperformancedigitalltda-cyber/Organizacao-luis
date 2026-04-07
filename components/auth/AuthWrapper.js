'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { onAuth, signInWithGoogle, logout, fsGetAll, initSync, KEY_MAP, fsSetDirect } from '@/lib/firebase'
import { get, set } from '@/lib/storage'
import Onboarding, { isOnboardingDone } from '@/components/onboarding/Onboarding'

export const AuthContext = createContext(null)
export function useAuth() { return useContext(AuthContext) }

export default function AuthWrapper({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      if (u) {
        setSyncing(true)
        try {
          // 1. Pull all Firestore data
          const fsData = await fsGetAll(u.uid)

          // 2. Firestore wins — write into localStorage
          Object.entries(fsData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              set(key, value)
            }
          })

          // 3. Upload local data missing in Firestore (entered before login or on another device)
          const uploadPromises = []
          for (const lsKey of Object.keys(KEY_MAP)) {
            if (!(lsKey in fsData)) {
              const localValue = get(lsKey, null)
              if (localValue !== null && localValue !== undefined) {
                uploadPromises.push(fsSetDirect(u.uid, lsKey, localValue))
              }
            }
          }
          if (uploadPromises.length > 0) await Promise.allSettled(uploadPromises)

          // 4. Enable ongoing sync for future writes
          initSync(u.uid)
        } catch (e) {
          console.error('Sync error:', e)
          // Continue anyway — local data still works
        }
        setSyncing(false)
        setUser(u)
        // Show onboarding for new users
        if (!isOnboardingDone()) setShowOnboarding(true)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function handleLogin() {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      setError('Erro ao entrar com Google. Tente novamente.')
    }
  }

  if (loading || syncing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">
          {syncing ? 'Sincronizando dados...' : 'Carregando...'}
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          {/* Logo */}
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-4xl">⚡</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">Sistema de Vida</h1>
          <p className="text-indigo-300 text-sm mb-10 leading-relaxed">
            Seu sistema de organização pessoal.<br />
            Estude, treine e empreenda com foco.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { icon: '📚', label: 'Estudos' },
              { icon: '💪', label: 'Treinos' },
              { icon: '🚀', label: 'Projetos' },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 rounded-2xl p-3 flex flex-col items-center gap-1">
                <span className="text-2xl">{f.icon}</span>
                <span className="text-xs font-semibold text-indigo-200">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>

          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}

          <p className="mt-6 text-xs text-indigo-400">
            Seus dados ficam salvos na nuvem e sincronizam em qualquer dispositivo.
          </p>
        </div>
      </div>
    )
  }

  // User logged in — show onboarding first if needed
  if (showOnboarding) {
    return <Onboarding onDone={() => setShowOnboarding(false)} />
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
