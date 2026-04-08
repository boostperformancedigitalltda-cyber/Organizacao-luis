'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', background: '#fff', minHeight: '100vh' }}>
      <h2 style={{ color: '#ef4444', fontSize: 18, marginBottom: 12 }}>❌ Erro encontrado</h2>
      <p style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
        <strong>Mensagem:</strong> {error?.message || 'Erro desconhecido'}
      </p>
      <pre style={{
        background: '#f1f5f9', padding: 12, borderRadius: 8,
        fontSize: 11, overflow: 'auto', whiteSpace: 'pre-wrap',
        color: '#1e293b', marginBottom: 16,
      }}>
        {error?.stack || 'Sem stack trace'}
      </pre>
      <button
        onClick={reset}
        style={{ background: '#6366f1', color: '#fff', padding: '10px 20px', borderRadius: 8, border: 'none', fontSize: 14 }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
