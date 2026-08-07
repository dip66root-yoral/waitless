import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext.jsx'

const STYLES = {
  success: { icon: '✅', border: 'rgba(34,197,94,0.25)', bg: 'rgba(10,25,12,0.95)', accent: '#4ade80' },
  error:   { icon: '❌', border: 'rgba(239,68,68,0.25)',  bg: 'rgba(25,8,8,0.95)',   accent: '#f87171' },
  warning: { icon: '⚠️', border: 'rgba(245,158,11,0.25)', bg: 'rgba(24,16,4,0.95)',  accent: '#fbbf24' },
  info:    { icon: 'ℹ️', border: 'rgba(56,189,248,0.25)', bg: 'rgba(4,16,26,0.95)',  accent: '#38bdf8' },
}

function Toast({ id, message, type, duration, onRemove }) {
  const [exiting, setExiting] = useState(false)
  const s = STYLES[type] || STYLES.info

  useEffect(() => {
    const t = setTimeout(() => setExiting(true), duration - 400)
    return () => clearTimeout(t)
  }, [duration])

  return (
    <div
      onClick={() => { setExiting(true); setTimeout(() => onRemove(id), 350) }}
      className={`flex items-start gap-3 px-4 py-3.5 max-w-sm w-full cursor-pointer rounded-xl ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ background: s.bg, border: `1px solid ${s.border}`, backdropFilter: 'blur(20px)', boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${s.border}` }}
    >
      <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
      <p className="text-sm flex-1 leading-relaxed" style={{ color: '#e2e8f0' }}>{message}</p>
      <button className="text-slate-600 hover:text-slate-300 text-xs shrink-0 transition-colors mt-0.5">✕</button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()
  return (
    <div className="fixed bottom-5 right-4 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}
