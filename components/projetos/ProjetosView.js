'use client'

import { useState, useEffect } from 'react'
import {
  loadProjetos, addProjeto, updateProjeto, removeProjeto,
  loadTasks, addTask, toggleTask, removeTask, updateTask, getProjectTasks,
  loadIdeias, addIdeia, removeIdeia, updateIdeia,
  getProjetoStats, PROJETO_COLORS, PROJETO_ICONS, PRIORITY_LABELS,
} from '@/lib/projetos'

// ── Task Item ─────────────────────────────────────────────────────────────────
function TaskItem({ task, projetos, onToggle, onRemove, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [priority, setPriority] = useState(task.priority)
  const [dueDate, setDueDate] = useState(task.dueDate || '')
  const [note, setNote] = useState(task.note || '')
  const p = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.media

  if (editing) {
    return (
      <div className="bg-indigo-50 rounded-2xl p-3 border border-indigo-200 space-y-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
        <div className="flex gap-2">
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => setPriority(k)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${priority === k ? `${v.bg} ${v.color} ${v.border}` : 'bg-white text-slate-400 border-slate-200'}`}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
        <div className="flex gap-2">
          <button onClick={() => { onUpdate({ title, priority, dueDate: dueDate || null, note }); setEditing(false) }}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold">Salvar</button>
          <button onClick={() => setEditing(false)} className="px-4 bg-slate-100 text-slate-600 py-2 rounded-xl text-sm font-bold">✕</button>
        </div>
      </div>
    )
  }

  const isDone = task.status === 'feito'
  return (
    <div className={`flex items-start gap-2.5 py-2 px-1 ${isDone ? 'opacity-50' : ''}`}>
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all ${
          isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-indigo-400'
        }`}
      >
        {isDone && <span className="text-white text-[10px] font-bold">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.bg} ${p.color}`}>{p.label}</span>
          {task.dueDate && <span className="text-[10px] text-slate-400">📅 {new Date(task.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>}
          {task.note && <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{task.note}</span>}
        </div>
      </div>
      <button onClick={() => setEditing(true)} className="text-slate-300 hover:text-indigo-400 text-xs flex-shrink-0">✏️</button>
      <button onClick={onRemove} className="text-slate-300 hover:text-red-400 text-xs flex-shrink-0">🗑️</button>
    </div>
  )
}

// ── Projeto Card ──────────────────────────────────────────────────────────────
function ProjetoCard({ projeto, tasks, onUpdate, onRemove, onAddTask, onToggleTask, onRemoveTask, onUpdateTask }) {
  const [open, setOpen] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', priority: 'media', dueDate: '', note: '' })
  const stats = getProjetoStats(tasks, projeto.id)
  const ptasks = getProjectTasks(tasks, projeto.id)
  const STATUS_LABELS = { ativo: 'Ativo', pausado: 'Pausado', concluido: 'Concluído' }

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: projeto.color + '20' }}>
          {projeto.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-800 text-sm">{projeto.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              projeto.status === 'ativo' ? 'bg-emerald-50 text-emerald-600' :
              projeto.status === 'pausado' ? 'bg-amber-50 text-amber-600' :
              'bg-slate-100 text-slate-500'
            }`}>{STATUS_LABELS[projeto.status]}</span>
          </div>
          {projeto.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{projeto.description}</p>}
          <div className="flex items-center gap-2 mt-1">
            {stats.total > 0 && (
              <>
                <div className="flex-1 max-w-[80px] bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${stats.pct}%`, background: projeto.color }} />
                </div>
                <span className="text-[10px] text-slate-400">{stats.done}/{stats.total}</span>
              </>
            )}
          </div>
        </div>
        <button onClick={() => setOpen(!open)} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</button>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tasks</p>
            <div className="flex gap-2">
              <select
                value={projeto.status}
                onChange={(e) => onUpdate({ status: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 focus:outline-none"
              >
                <option value="ativo">Ativo</option>
                <option value="pausado">Pausado</option>
                <option value="concluido">Concluído</option>
              </select>
              <button onClick={() => { if (confirm('Remover projeto?')) onRemove() }}
                className="text-slate-300 hover:text-red-400 text-sm">🗑️</button>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {ptasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={() => onToggleTask(t.id)}
                onRemove={() => onRemoveTask(t.id)}
                onUpdate={(d) => onUpdateTask(t.id, d)}
              />
            ))}
          </div>

          {addingTask ? (
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2 mt-2">
              <input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Descrição da task"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400"
                onKeyDown={(e) => e.key === 'Enter' && newTask.title.trim() && (onAddTask(newTask), setNewTask({ title: '', priority: 'media', dueDate: '', note: '' }), setAddingTask(false))}
                autoFocus
              />
              <div className="flex gap-1">
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <button key={k} onClick={() => setNewTask({ ...newTask, priority: k })}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${newTask.priority === k ? `${v.bg} ${v.color}` : 'bg-white text-slate-400 border border-slate-200'}`}>
                    {v.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { if (newTask.title.trim()) { onAddTask(newTask); setNewTask({ title: '', priority: 'media', dueDate: '', note: '' }); setAddingTask(false) } }}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold"
                >Adicionar</button>
                <button onClick={() => setAddingTask(false)} className="px-4 bg-slate-100 text-slate-600 py-2 rounded-xl text-sm font-bold">✕</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingTask(true)}
              className="mt-2 w-full border-2 border-dashed border-slate-200 text-slate-400 py-2 rounded-xl text-sm hover:border-indigo-200 hover:text-indigo-400 transition-colors"
            >
              + Task
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Projeto Modal ─────────────────────────────────────────────────────────────
function ProjetoModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [icon, setIcon] = useState(initial?.icon || '🚀')
  const [color, setColor] = useState(initial?.color || PROJETO_COLORS[0])
  const [description, setDescription] = useState(initial?.description || '')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 shadow-xl animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg">{initial ? 'Editar projeto' : 'Novo projeto'}</h2>
          <button onClick={onClose} className="text-slate-400 text-2xl leading-none">&times;</button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do projeto"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição (opcional)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400" />
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {PROJETO_ICONS.map((ic) => (
                <button key={ic} onClick={() => setIcon(ic)}
                  className={`text-xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${icon === ic ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110' : 'bg-slate-100'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {PROJETO_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} style={{ background: c }}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`} />
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => name.trim() && onSave({ name: name.trim(), icon, color, description })}
          disabled={!name.trim()}
          className="mt-5 w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-40"
        >
          {initial ? 'Salvar' : 'Criar projeto'}
        </button>
      </div>
    </div>
  )
}

// ── Ideias Tab ────────────────────────────────────────────────────────────────
function IdeiasTab({ ideias, projetos, setIdeias }) {
  const [text, setText] = useState('')
  const [projetoId, setProjetoId] = useState('')

  function handleAdd() {
    if (!text.trim()) return
    setIdeias(addIdeia(ideias, { text: text.trim(), projetoId: projetoId || null }))
    setText('')
  }

  return (
    <div>
      <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Anota sua ideia aqui..."
          rows={3}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 resize-none"
        />
        <div className="flex gap-2 mt-2">
          <select value={projetoId} onChange={(e) => setProjetoId(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400">
            <option value="">Ideia solta</option>
            {projetos.filter((p) => p.status === 'ativo').map((p) => (
              <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
            ))}
          </select>
          <button onClick={handleAdd} disabled={!text.trim()}
            className="bg-indigo-600 text-white px-5 rounded-xl font-bold disabled:opacity-40">
            + Salvar
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {ideias.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <div className="text-3xl mb-2">💡</div>
            <p className="text-sm">Nenhuma ideia ainda. Anota aí!</p>
          </div>
        )}
        {ideias.map((ideia) => {
          const proj = projetos.find((p) => p.id === ideia.projetoId)
          return (
            <div key={ideia.id} className="bg-white rounded-2xl p-3.5 shadow-card border border-slate-100 flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800">{ideia.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  {proj && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: proj.color }}>
                      {proj.icon} {proj.name}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {new Date(ideia.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
              <button onClick={() => setIdeias(removeIdeia(ideias, ideia.id))}
                className="text-slate-300 hover:text-red-400 text-sm flex-shrink-0">🗑️</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function ProjetosView() {
  const [projetos, setProjetos] = useState([])
  const [tasks, setTasks] = useState([])
  const [ideias, setIdeias] = useState([])
  const [subTab, setSubTab] = useState('projetos')
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    setProjetos(loadProjetos())
    setTasks(loadTasks())
    setIdeias(loadIdeias())
  }, [])

  const ativos = projetos.filter((p) => p.status === 'ativo')
  const pausados = projetos.filter((p) => p.status !== 'ativo')
  const pendingTasks = tasks.filter((t) => t.status !== 'feito').length
  const pendingIdeias = ideias.length

  const SUB_TABS = [
    { id: 'projetos', label: 'Projetos', icon: '🚀' },
    { id: 'ideias',   label: 'Ideias',   icon: '💡' },
  ]

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-800">Projetos</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {ativos.length} ativos · {pendingTasks} tasks pendentes
        </p>
      </div>

      <div className="flex gap-2 mb-5 bg-slate-100 p-1 rounded-2xl">
        {SUB_TABS.map((t) => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              subTab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}>
            <span>{t.icon}</span><span>{t.label}</span>
            {t.id === 'ideias' && pendingIdeias > 0 && (
              <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingIdeias}</span>
            )}
          </button>
        ))}
      </div>

      {subTab === 'projetos' && (
        <div className="space-y-3">
          {projetos.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-2">🚀</div>
              <p className="text-sm">Nenhum projeto ainda. Crie o primeiro!</p>
            </div>
          )}
          {ativos.map((p) => (
            <ProjetoCard
              key={p.id}
              projeto={p}
              tasks={tasks}
              onUpdate={(d) => setProjetos(updateProjeto(projetos, p.id, d))}
              onRemove={() => { const r = removeProjeto(projetos, tasks, ideias, p.id); setProjetos(r.projetos); setTasks(r.tasks); setIdeias(r.ideias) }}
              onAddTask={(d) => setTasks(addTask(tasks, { ...d, projetoId: p.id }))}
              onToggleTask={(id) => setTasks(toggleTask(tasks, id))}
              onRemoveTask={(id) => setTasks(removeTask(tasks, id))}
              onUpdateTask={(id, d) => setTasks(updateTask(tasks, id, d))}
            />
          ))}
          {pausados.length > 0 && (
            <>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-4">Pausados / Concluídos</p>
              {pausados.map((p) => (
                <ProjetoCard
                  key={p.id}
                  projeto={p}
                  tasks={tasks}
                  onUpdate={(d) => setProjetos(updateProjeto(projetos, p.id, d))}
                  onRemove={() => { const r = removeProjeto(projetos, tasks, ideias, p.id); setProjetos(r.projetos); setTasks(r.tasks); setIdeias(r.ideias) }}
                  onAddTask={(d) => setTasks(addTask(tasks, { ...d, projetoId: p.id }))}
                  onToggleTask={(id) => setTasks(toggleTask(tasks, id))}
                  onRemoveTask={(id) => setTasks(removeTask(tasks, id))}
                  onUpdateTask={(id, d) => setTasks(updateTask(tasks, id, d))}
                />
              ))}
            </>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="w-full border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold py-3 rounded-2xl hover:bg-indigo-50 transition-colors text-sm"
          >
            + Novo projeto
          </button>
        </div>
      )}

      {subTab === 'ideias' && (
        <IdeiasTab ideias={ideias} projetos={projetos} setIdeias={setIdeias} />
      )}

      {showAdd && (
        <ProjetoModal
          onSave={(d) => { setProjetos(addProjeto(projetos, d)); setShowAdd(false) }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
