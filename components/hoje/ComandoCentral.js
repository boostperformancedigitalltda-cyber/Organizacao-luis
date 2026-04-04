'use client'

import { useEffect, useState } from 'react'
import { loadPlanos, getTodayPlano } from '@/lib/treino'
import { loadStudyBlocks, getBlocksForDate } from '@/lib/estudos'
import { loadProjetos, loadTasks, getTopPendingTask } from '@/lib/projetos'
import { loadInbox, getPendingInbox } from '@/lib/quickcapture'
import { dateKey } from '@/lib/date'

export default function ComandoCentral({ onNavigate }) {
  const [todayTreino, setTodayTreino] = useState(null)
  const [nextEstudo, setNextEstudo] = useState(null)
  const [topTask, setTopTask] = useState(null)
  const [inboxCount, setInboxCount] = useState(0)

  useEffect(() => {
    const planos = loadPlanos()
    const treino = getTodayPlano(planos)
    setTodayTreino(treino)

    const dk = dateKey(new Date())
    const blocks = loadStudyBlocks()
    const todayBlocks = getBlocksForDate(blocks, dk)
      .filter((b) => !b.completed)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    setNextEstudo(todayBlocks[0] || null)

    const projetos = loadProjetos()
    const tasks = loadTasks()
    setTopTask(getTopPendingTask(tasks, projetos))

    const inbox = loadInbox()
    setInboxCount(getPendingInbox(inbox).length)
  }, [])

  const hasAnything = todayTreino || nextEstudo || topTask || inboxCount > 0
  if (!hasAnything) return null

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-4 mb-4 text-white shadow-lg">
      <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-3">Comando central</p>
      <div className="space-y-2.5">
        {nextEstudo && (
          <button
            onClick={() => onNavigate('estudos')}
            className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2.5 transition-all text-left"
          >
            <span className="text-lg">📚</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-indigo-200 font-semibold">Próximo estudo</p>
              <p className="text-sm font-bold truncate">{nextEstudo.topic || 'Bloco de estudo'}</p>
            </div>
            <span className="text-xs text-indigo-200 flex-shrink-0">{nextEstudo.startTime}</span>
          </button>
        )}

        {todayTreino && (
          <button
            onClick={() => onNavigate('treino')}
            className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2.5 transition-all text-left"
          >
            <span className="text-lg">💪</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-indigo-200 font-semibold">Treino de hoje</p>
              <p className="text-sm font-bold truncate">{todayTreino.name}</p>
            </div>
            <span className="text-xs text-indigo-200 flex-shrink-0">{todayTreino.exercises.length} ex.</span>
          </button>
        )}

        {topTask && (
          <button
            onClick={() => onNavigate('projetos')}
            className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2.5 transition-all text-left"
          >
            <span className="text-lg">🚀</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-indigo-200 font-semibold">Task prioritária</p>
              <p className="text-sm font-bold truncate">{topTask.title}</p>
            </div>
            {topTask.priority === 'alta' && (
              <span className="text-[10px] bg-red-400 text-white px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">Alta</span>
            )}
          </button>
        )}

        {inboxCount > 0 && (
          <button
            onClick={() => onNavigate('inbox')}
            className="w-full flex items-center gap-3 bg-amber-500/30 hover:bg-amber-500/40 rounded-xl px-3 py-2.5 transition-all text-left"
          >
            <span className="text-lg">⚡</span>
            <div className="flex-1">
              <p className="text-xs text-indigo-200 font-semibold">Inbox</p>
              <p className="text-sm font-bold">{inboxCount} item(s) para processar</p>
            </div>
            <span className="bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">{inboxCount}</span>
          </button>
        )}
      </div>
    </div>
  )
}
