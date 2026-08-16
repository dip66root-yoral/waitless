import { useState, useRef, useEffect, useMemo } from 'react'

const SECTIONS = [
  { id: 'recliner', label: 'Recliner', price: 450, rows: ['L', 'K', 'J'] },
  { id: 'prime', label: 'Prime', price: 300, rows: ['I', 'H', 'G', 'F'] },
  { id: 'classic', label: 'Classic', price: 200, rows: ['E', 'D', 'C', 'B', 'A'] }
]

export function SeatMap({ numTickets = 2, accent = '#e50914', selectedSeats, onSelect }) {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredSeat, setHoveredSeat] = useState(null)
  
  const containerRef = useRef(null)

  // Generate deterministic but random-looking booked seats
  const bookedSeats = useMemo(() => {
    const booked = new Set()
    SECTIONS.forEach(sec => {
      sec.rows.forEach((r, rIdx) => {
        for (let c = 1; c <= 20; c++) {
          if (Math.sin(r.charCodeAt(0) * c + sec.price) > 0.4) {
            booked.add(`${r}${c}`)
          }
        }
      })
    })
    return booked
  }, [])

  const handleMouseDown = (e) => {
    if (e.target.tagName.toLowerCase() === 'button') return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => setIsDragging(false)
  
  const handleTouchStart = (e) => {
    if (e.target.tagName.toLowerCase() === 'button') return
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y })
    }
  }
  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return
    setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y })
  }
  
  const handleWheel = (e) => {
    e.preventDefault()
    setScale(s => Math.min(Math.max(0.5, s - e.deltaY * 0.002), 2))
  }

  // Calculate hovered block
  const getHoverBlock = (row, startCol) => {
    const block = []
    for (let i = 0; i < numTickets; i++) {
      const col = startCol + i
      if (col > 20) return [] // out of bounds
      const id = `${row}${col}`
      if (bookedSeats.has(id)) return [] // blocked by booked seat
      block.push(id)
    }
    return block
  }

  // Active hover block
  const activeHoverBlock = useMemo(() => {
    if (!hoveredSeat) return []
    return getHoverBlock(hoveredSeat.row, hoveredSeat.col)
  }, [hoveredSeat, numTickets])

  const handleSeatClick = (row, col, section) => {
    const block = getHoverBlock(row, col)
    if (block.length === numTickets) {
      onSelect(block, section.price * numTickets, section.label)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '540px', background: '#060810', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Zoom Controls */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
        <button onClick={() => setScale(s => Math.min(2, s + 0.2))} style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '18px', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>+</button>
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '18px', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>-</button>
      </div>

      {/* Seat Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
        style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transition: isDragging ? 'none' : 'transform 0.1s', display: 'flex', flexDirection: 'column', gap: '30px', padding: '40px' }}>
          
          {/* Sections */}
          {SECTIONS.map(section => (
            <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Section Header */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{section.label}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>₹{section.price}</span>
              </div>

              {/* Rows */}
              {section.rows.map(row => (
                <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '20px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: 600, userSelect: 'none' }}>{row}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[...Array(20)].map((_, i) => {
                      const col = i + 1
                      if (col === 6 || col === 16) return <div key={`aisle-${col}`} style={{ width: '24px' }} />
                      
                      const id = `${row}${col}`
                      const isBooked = bookedSeats.has(id)
                      const isSelected = selectedSeats.includes(id)
                      const isHovered = activeHoverBlock.includes(id)
                      
                      let bg = 'rgba(255,255,255,0.08)'
                      let border = '1px solid rgba(255,255,255,0.15)'
                      if (isBooked) {
                        bg = 'rgba(255,255,255,0.03)'
                        border = '1px solid transparent'
                      } else if (isSelected) {
                        bg = accent
                        border = `1px solid ${accent}`
                      } else if (isHovered) {
                        bg = `${accent}80`
                        border = `1px solid ${accent}`
                      }

                      return (
                        <button
                          key={id}
                          disabled={isBooked}
                          onMouseEnter={() => !isBooked && setHoveredSeat({ row, col })}
                          onMouseLeave={() => setHoveredSeat(null)}
                          onClick={() => handleSeatClick(row, col, section)}
                          style={{
                            width: '26px', height: '26px', borderRadius: '6px',
                            border, background: bg, cursor: isBooked ? 'not-allowed' : 'pointer',
                            color: isSelected ? '#fff' : 'transparent',
                            fontSize: '11px', fontWeight: 700,
                            transition: 'all 0.15s',
                            boxShadow: (isSelected || isHovered) ? `0 0 12px ${accent}50` : 'none',
                            opacity: isBooked ? 0.3 : 1
                          }}
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
          ))}

          {/* Curved Screen Display at the Bottom */}
          <div style={{ marginTop: '40px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '80%', height: '60px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '120%', height: '200px',
                borderTop: `4px solid ${accent}`,
                borderRadius: '50% 50% 0 0',
                background: `radial-gradient(ellipse at top, ${accent}60 0%, transparent 70%)`,
                filter: `drop-shadow(0 0 20px ${accent})`,
                opacity: 0.6
              }} />
            </div>
            <p style={{ color: '#fff', fontSize: '12px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', margin: '-30px 0 0', opacity: 0.8, textShadow: '0 2px 10px rgba(0,0,0,1)' }}>All Eyes This Way</p>
          </div>

        </div>
      </div>
    </div>
  )
}
