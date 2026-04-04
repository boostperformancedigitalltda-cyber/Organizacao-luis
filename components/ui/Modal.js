'use client'

import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, fullHeight = false }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up modal-sheet ${
          fullHeight ? 'h-[90vh] flex flex-col' : 'max-h-[90vh]'
        }`}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 transition-colors text-slate-500 text-lg"
            >
              ✕
            </button>
          </div>
        )}
        {/* Scrollable content */}
        <div className={`overflow-y-auto overscroll-contain ${fullHeight ? 'flex-1' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
