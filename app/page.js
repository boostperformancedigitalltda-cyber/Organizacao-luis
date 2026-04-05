'use client'

import { useState, useEffect } from 'react'
import BottomNav from '@/components/ui/BottomNav'
import MorningModal from '@/components/hoje/MorningModal'
import DayTimeline from '@/components/hoje/DayTimeline'
import WeekPlanner from '@/components/semana/WeekPlanner'
import GoalsView from '@/components/metas/GoalsView'
import FinanceTab from '@/components/finance/FinanceTab'
import EstudosView from '@/components/estudos/EstudosView'
import TreinoView from '@/components/treino/TreinoView'
import ProjetosView from '@/components/projetos/ProjetosView'
import QuickCapture from '@/components/shared/QuickCapture'
import WeeklyReview from '@/components/weeklyreview/WeeklyReview'
import AuthWrapper from '@/components/auth/AuthWrapper'
import MaisMenu from '@/components/ui/MaisMenu'
import HabitsView from '@/components/habitos/HabitsView'
import { loadDayPlan, saveDayPlan } from '@/lib/planner'
import { dateKey } from '@/lib/date'
import { loadInbox } from '@/lib/quickcapture'
import { loadReviews, shouldShowReviewPrompt } from '@/lib/weeklyreview'
import { loadNotifSettings, scheduleAll, getPermission } from '@/lib/notifications'
import { loadTasks, loadProjetos } from '@/lib/projetos'

// Inbox view (processar itens capturados)
import { getPendingInbox, removeFromInbox, markProcessed, CAPTURE_TYPES } from '@/lib/quickcapture'

function InboxView({ inbox, setInbox }) {
  const pending = getPendingInbox(inbox)
  const processed = inbox.filter((i) => i.processed)

  if (inbox.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <div className="text-5xl mb-3">⚡</div>
        <p className="font-semibold text-slate-600">Inbox vazia</p>
        <p className="text-sm mt-1">Use o botão ⚡ para capturar ideias e tasks rapidamente.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-800">Inbox</h1>
        <p className="text-sm text-slate-500 mt-0.5">{pending.length} item(s) para processar</p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-2 mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Para processar</p>
          {pending.map((item) => {
            const t = CAPTURE_TYPES.find((c) => c.id === item.type)
            return (
              <div key={item.id} className="bg-white rounded-2xl p-3.5 shadow-card border border-slate-100 flex items-start gap-3">
                <span className={`text-lg flex-shrink-0 ${t?.bg} rounded-xl w-9 h-9 flex items-center justify-center`}>{t?.icon || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">{item.text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {t?.label} · {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setInbox(markProcessed(inbox, item.id))}
                    className="text-emerald-400 hover:text-emerald-600 text-sm w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-50">✓</button>
                  <button onClick={() => setInbox(removeFromInbox(inbox, item.id))}
                    className="text-slate-300 hover:text-red-400 text-sm w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50">🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {processed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Processados</p>
          {processed.map((item) => {
            const t = CAPTURE_TYPES.find((c) => c.id === item.type)
            return (
              <div key={item.id} className="bg-white rounded-2xl p-3.5 shadow-card border border-slate-100 flex items-center gap-3 opacity-50">
                <span className="text-lg">{t?.icon || '📌'}</span>
                <p className="text-sm text-slate-600 line-through flex-1">{item.text}</p>
                <button onClick={() => setInbox(removeFromInbox(inbox, item.id))}
                  className="text-slate-300 hover:text-red-400 text-sm">🗑️</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [tab, setTab] = useState('hoje')
  const [today] = useState(new Date())
  const [tomorrow] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d })
  const [plan, setPlan] = useState(null)
  const [prevPlan, setPrevPlan] = useState(null)
  const [tomorrowPlan, setTomorrowPlan] = useState(null)
  const [showPlanTomorrow, setShowPlanTomorrow] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [inbox, setInbox] = useState([])
  const [reviews, setReviews] = useState([])
  const [showReview, setShowReview] = useState(false)
  const [showMais, setShowMais] = useState(false)
  const [pendingTasks, setPendingTasks] = useState([])
  const [projetos, setProjetos] = useState([])

  function handleTabChange(id) {
    if (id === 'mais') { setShowMais(true); return }
    setShowMais(false)
    setTab(id)
  }

  const dk = dateKey(today)

  useEffect(() => {
    const savedPlan = loadDayPlan(dk)
    setPlan(savedPlan)
    setTomorrowPlan(loadDayPlan(dateKey(tomorrow)))

    // Load yesterday's plan for morning summary
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    setPrevPlan(loadDayPlan(dateKey(yesterday)))

    // Load project tasks for morning suggestions
    const allTasks = loadTasks()
    const allProjetos = loadProjetos()
    setPendingTasks(allTasks.filter((t) => t.status !== 'feito'))
    setProjetos(allProjetos.filter((p) => p.status === 'ativo'))

    setInbox(loadInbox())
    const rev = loadReviews()
    setReviews(rev)
    if (shouldShowReviewPrompt(rev)) {
      setTimeout(() => setShowReview(true), 1500)
    }
    if (typeof window !== 'undefined' && getPermission() === 'granted') {
      scheduleAll(loadNotifSettings())
    }
    setLoaded(true)
  }, []) // eslint-disable-line

  const handleMorningComplete = ({ energy, priorities, blocks }) => {
    const newPlan = {
      date: today.toISOString(),
      energy,
      priorities,
      blocks,
      completed: {},
      planned: true,
    }
    setPlan(newPlan)
    saveDayPlan(dk, newPlan)
  }

  const handleToggle = (uid) => {
    if (!plan) return
    const newCompleted = { ...plan.completed, [uid]: !plan.completed[uid] }
    const newPlan = { ...plan, completed: newCompleted }
    setPlan(newPlan)
    saveDayPlan(dk, newPlan)
  }

  const handleAddBlock = (block, isEdit) => {
    if (!plan) return
    let newBlocks
    if (isEdit) {
      newBlocks = plan.blocks.map((b) => b.uid === block.uid ? block : b)
    } else {
      newBlocks = [...plan.blocks, block]
    }
    const newPlan = { ...plan, blocks: newBlocks }
    setPlan(newPlan)
    saveDayPlan(dk, newPlan)
  }

  const handleReset = () => {
    setPlan(null)
    saveDayPlan(dk, null)
  }

  const handleTomorrowComplete = ({ energy, priorities, blocks }) => {
    const newPlan = {
      date: tomorrow.toISOString(),
      energy,
      priorities,
      blocks,
      completed: {},
      planned: true,
    }
    setTomorrowPlan(newPlan)
    saveDayPlan(dateKey(tomorrow), newPlan)
    setShowPlanTomorrow(false)
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-indigo-500 text-sm font-semibold">Carregando...</div>
      </div>
    )
  }

  const pendingInbox = inbox.filter((i) => !i.processed).length

  return (
    <AuthWrapper>
    <main className="min-h-screen bg-slate-50">
      {/* Morning planning wizard */}
      {tab === 'hoje' && !plan && (
        <MorningModal
          date={today}
          onComplete={handleMorningComplete}
          prevPlan={prevPlan}
          pendingTasks={pendingTasks}
          projetos={projetos}
        />
      )}

      {/* Plan tomorrow modal */}
      {showPlanTomorrow && (
        <MorningModal
          date={tomorrow}
          onComplete={handleTomorrowComplete}
          onCancel={() => setShowPlanTomorrow(false)}
          prevPlan={plan}
          pendingTasks={pendingTasks}
          projetos={projetos}
          isTomorrow
        />
      )}

      {/* Weekly Review Modal */}
      {showReview && (
        <WeeklyReview
          reviews={reviews}
          setReviews={setReviews}
          onClose={() => setShowReview(false)}
        />
      )}

      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 pt-5 content-pb">
        {tab === 'hoje' && plan && (
          <DayTimeline
            plan={plan}
            onToggle={handleToggle}
            onAddBlock={handleAddBlock}
            onReset={handleReset}
            onNavigate={handleTabChange}
            onPlanTomorrow={() => setShowPlanTomorrow(true)}
            hasTomorrowPlan={!!tomorrowPlan}
          />
        )}
        {tab === 'estudos'  && <EstudosView />}
        {tab === 'treino'   && <TreinoView />}
        {tab === 'projetos' && <ProjetosView />}
        {tab === 'financas' && <FinanceTab />}
        {/* Secondary (via Mais) */}
        {tab === 'habitos'  && <HabitsView />}
        {tab === 'metas'    && <GoalsView />}
        {tab === 'semana'   && <WeekPlanner />}
        {tab === 'inbox'    && <InboxView inbox={inbox} setInbox={setInbox} />}
      </div>

      {/* Review button */}
      <button
        onClick={() => setShowReview(true)}
        className="fixed top-4 right-4 z-30 bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 active:bg-slate-50 transition-all flex items-center gap-1.5"
      >
        📋 Review
      </button>

      {/* Quick Capture FAB */}
      <QuickCapture inbox={inbox} setInbox={setInbox} />

      {/* Mais Menu */}
      {showMais && (
        <MaisMenu
          onNavigate={(id) => { setTab(id); setShowMais(false) }}
          onClose={() => setShowMais(false)}
          pendingInbox={pendingInbox}
        />
      )}

      <BottomNav active={tab} onChange={handleTabChange} pendingInbox={pendingInbox} />
    </main>
    </AuthWrapper>
  )
}
