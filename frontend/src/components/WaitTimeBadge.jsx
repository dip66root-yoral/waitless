import { useState, useEffect } from 'react'

export default function WaitTimeBadge({ minutes }) {
  const [display, setDisplay] = useState(formatTime(minutes))

  useEffect(() => {
    setDisplay(formatTime(minutes))
  }, [minutes])

  if (!minutes || minutes <= 0) return null

  const color = minutes <= 5
    ? 'text-green-400 border-green-500/30 bg-green-500/10'
    : minutes <= 15
    ? 'text-teal-400 border-teal-500/30 bg-teal-500/10'
    : minutes <= 30
    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    : 'text-slate-400 border-slate-500/30 bg-slate-500/10'

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-sm font-medium ${color}`}>
      <span className="text-base">⏱</span>
      <span>~{display}</span>
    </div>
  )
}

function formatTime(minutes) {
  if (!minutes || minutes <= 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
