import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
} from 'firebase/firestore'
import { setSyncFunction } from './storage'

const firebaseConfig = {
  apiKey: "AIzaSyAoUCvFnVANb6aco4r6qmXXFgitJF4lx3M",
  authDomain: "sistema-de-vida.firebaseapp.com",
  projectId: "sistema-de-vida",
  storageBucket: "sistema-de-vida.firebasestorage.app",
  messagingSenderId: "293084624116",
  appId: "1:293084624116:web:bda084628d14e88e26daa1",
}

// Avoid re-initializing on hot reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// ── Auth ──────────────────────────────────────────────────────────────────────

const provider = new GoogleAuthProvider()

export function signInWithGoogle() {
  return signInWithPopup(auth, provider)
}

export function logout() {
  return signOut(auth)
}

export function onAuth(callback) {
  return onAuthStateChanged(auth, callback)
}

// ── Key mapping: localStorage key → Firestore document path ──────────────────

export const KEY_MAP = {
  'sdv2-habits':              'habits',
  'sdv2-habit-logs':          'habitLogs',
  'sdv2-goals':               'goals',
  'sdv2-transactions':        'transactions',
  'sdv2-routine':             'routine',
  'sdv2-streak':              'streak',
  'sdv2-fin-goal':            'finGoal',
  'sdv2-budgets':             'budgets',
  'sdv2-sessions':            'sessions',
  'sdv2-materias':            'materias',
  'sdv2-study-blocks':        'studyBlocks',
  'sdv2-treino-planos':       'treinoPlanos',
  'sdv2-treino-logs':         'treinoLogs',
  'sdv2-projetos':            'projetos',
  'sdv2-projetos-tasks':      'projetosTasks',
  'sdv2-projetos-ideias':     'projetosIdeias',
  'sdv2-inbox':               'inbox',
  'sdv2-weekly-reviews':      'weeklyReviews',
  'sdv2-aulas':               'aulas',
  'sdv2-disponibilidade':     'disponibilidade',
  'sdv2-recurring-blocks':    'recurringBlocks',
  'sdv2-finance-categories':  'financeCategories',
  'sdv2-provas':              'provas',
  'sdv2-simulados':           'simulados',
  'sdv2-onboarding-done':     'onboardingDone',
  'sdv2-banco-erros':         'bancoErros',
}

function getFirestorePath(key) {
  if (KEY_MAP[key]) return { col: 'stores', id: KEY_MAP[key] }
  if (key.startsWith('sdv2-day-')) {
    const dk = key.replace('sdv2-day-', '')
    return { col: 'dayplans', id: dk }
  }
  return null // unknown key — don't sync
}

// ── Firestore read/write ──────────────────────────────────────────────────────

async function fsSet(uid, key, value) {
  const path = getFirestorePath(key)
  if (!path) return
  const ref = doc(db, 'users', uid, path.col, path.id)
  await setDoc(ref, { value, updatedAt: new Date().toISOString() })
}

export async function fsGetAll(uid) {
  const result = {}
  const cols = ['stores', 'dayplans']
  for (const col of cols) {
    const snap = await getDocs(collection(db, 'users', uid, col))
    snap.forEach((d) => {
      // Reverse-map: Firestore id → localStorage key
      if (col === 'stores') {
        const lsKey = Object.entries(KEY_MAP).find(([, v]) => v === d.id)?.[0]
        if (lsKey) result[lsKey] = d.data().value
      } else if (col === 'dayplans') {
        result[`sdv2-day-${d.id}`] = d.data().value
      }
    })
  }
  return result
}

// Direct write (used for initial upload on login)
export async function fsSetDirect(uid, key, value) {
  await fsSet(uid, key, value)
}

// ── Init sync (call after login) ──────────────────────────────────────────────

export function initSync(uid) {
  // Register fire-and-forget sync function into storage.js
  setSyncFunction((key, value) => {
    fsSet(uid, key, value).catch(() => {}) // silent fail — local still works
  })
}
