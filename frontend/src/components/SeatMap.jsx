import { useState, useRef, useEffect } from 'react'

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export function SeatMap({ type = 'Classic', price = 200, accent = '#e50914', selectedSeats, onToggleSeat }) {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  // Generate deterministic but random-looking booked seats based on type and hour
  const [bookedSeats, setBookedSeats] = useState(new Set())
  useEffect(() => {
    const booked = new Set()
    for (let r = 0; r < 12; r++) {
      for (let c = 1; c <= 20; c++) {
        // Pseudo-random booking
        if (Math.sin(r * c + price) > 0.4) {
          booked.add(`${ROW_LABELS[r]}${c}`)
        }
      }
    }
    setBookedSeats(booked)
  }, [type, price])

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => setIsDragging(false)
  const handleWheel = (e) => {
    e.preventDefault()
    setScale(s => Math.min(Math.max(0.5, s - e.deltaY * 0.002), 2))
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px', background: '#0a0b10', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Controls */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
        <button onClick={() => setScale(s => Math.min(2, s + 0.2))} style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>+</button>
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>-</button>
      </div>

      {/* Screen */}
      <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 40, zIndex: 5, pointerEvents: 'none' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M0,20 Q50,0 100,20" fill="none" stroke={accent} strokeWidth="2" opacity="0.5" />
          <path d="M0,20 Q50,0 100,20 L100,0 L0,0 Z" fill={`url(#screenGlow)`} opacity="0.2" />
          <defs>
            <linearGradient id="screenGlow" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <p style={{ textAlign: 'center', color: accent, fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '-10px', opacity: 0.6 }}>Screen This Way</p>
      </div>

      {/* Seat Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          width: '100%', height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.1s',
          display: 'flex', flexDirection: 'column', gap: '12px', padding: '120px 40px 40px'
        }}>
          {ROW_LABELS.map((row) => (
            <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '20px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: 600, userSelect: 'none' }}>{row}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[...Array(20)].map((_, i) => {
                  const num = i + 1
                  if (num === 6 || num === 16) return <div key={`aisle-${num}`} style={{ width: '20px' }} /> // Aisles
                  
                  const seatId = `${row}${num}`
                  const isBooked = bookedSeats.has(seatId)
                  const isSelected = selectedSeats.includes(seatId)
                  
                  return (
                    <button
                      key={seatId}
                      disabled={isBooked}
                      onClick={(e) => { e.stopPropagation(); onToggleSeat(seatId) }}
                      style={{
                        width: '24px', height: '24px', borderRadius: '4px',
                        border: 'none', cursor: isBooked ? 'not-allowed' : 'pointer',
                        background: isBooked ? '#1e293b' : isSelected ? accent : 'rgba(255,255,255,0.08)',
                        color: isSelected ? '#fff' : 'transparent',
                        fontSize: '10px', fontWeight: 700,
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? `0 0 12px ${accent}60` : 'none',
                        opacity: isBooked ? 0.4 : 1
                      }}
                      title={isBooked ? 'Booked' : seatId}
                    >
                      {isSelected ? '✓' : ''}
                    </button>
                  )
                })}
              </div>
              <span style={{ width: '20px', fontSize: '12px', color: '#64748b', fontWeight: 600, userSelect: 'none' }}>{row}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
