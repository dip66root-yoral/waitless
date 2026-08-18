import React from 'react'

const STEPS = [
  { key: 'waiting', label: 'Booked', icon: '🎟️' },
  { key: 'soon', label: 'Almost Ready', icon: '🔔' },
  { key: 'in-progress', label: 'At Counter', icon: '🎯' },
  { key: 'done', label: 'Completed', icon: '✅' },
]

function getActive(status, position) {
  if (status === 'done') return 3
  if (status === 'in-progress') return 2
  if (status === 'waiting' && position <= 2) return 1
  return 0
}

const QueueProgress = React.memo(function QueueProgress({ status, position, accentColor = '#e50914' }) {
  const active = getActive(status, position)

  return (
    <div className="flex items-start w-full gap-0">
      {STEPS.map((step, i) => {
        const done = i < active
        const isActive = i === active
        const isLast = i === STEPS.length - 1

        return (
          <div key={step.key} className="flex-1 flex flex-col items-center relative">
            {/* Connector */}
            {!isLast && (
              <div className="absolute top-[18px] h-[2px] z-0"
                style={{ left: '55%', right: '-50%', background: done || isActive ? `${accentColor}60` : 'rgba(var(--rgb-white),0.06)' }} />
            )}

            {/* Icon circle */}
            <div className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-500"
              style={{
                background: isActive ? accentColor : done ? `${accentColor}30` : 'rgba(var(--rgb-white),0.05)',
                border: isActive ? `2px solid ${accentColor}` : done ? `2px solid ${accentColor}60` : '2px solid rgba(var(--rgb-white),0.08)',
                boxShadow: isActive ? `0 0 16px ${accentColor}60` : 'none',
              }}>
              {step.icon}
              {isActive && (
                <div className="absolute inset-0 rounded-full animate-ping opacity-30"
                  style={{ background: accentColor }} />
              )}
            </div>

            {/* Label */}
            <p className="text-xs text-center mt-1.5 leading-tight transition-colors duration-300"
              style={{ color: isActive ? accentColor : done ? `${accentColor}80` : '#374151', fontWeight: isActive ? 700 : 400 }}>
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
})

export default QueueProgress
