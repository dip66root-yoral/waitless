import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MOVIES, CINEMAS, SHOWTIMES, SEAT_TYPES } from '../data/movies.js'
import { tokensAPI, getSocket } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import QueueProgress from '../components/QueueProgress.jsx'

const NAV_H = '60px'

import { MoviePoster, PosterThumb } from '../components/MoviePoster.jsx'
import { StepperBar } from '../components/StepperBar.jsx'
import { SeatMap } from '../components/SeatMap.jsx'
import { LiveTicket } from '../components/LiveTicket.jsx'

const STEPS = ['Showtime', 'Seats', 'Confirm', 'Ticket']

export default function MovieBooking() {
  const { movieId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const movie = MOVIES.find(m => m.id === movieId)

  const [step, setStep] = useState('detail')
  const [selectedCinema, setSelectedCinema] = useState(CINEMAS[0])
  const [selectedShowtime, setSelectedShowtime] = useState(null)
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [seatType, setSeatType] = useState(null)
  const [totalPrice, setTotalPrice] = useState(0)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [numSeats, setNumSeats] = useState(2)
  const [userName, setUserName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [bookingToken, setBookingToken] = useState(null)
  const [liveToken, setLiveToken] = useState(null)
  const socketRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    if (movie) { document.title = `${movie.title} - WAITLESS`; setSelectedFormat(movie.formats[0]) }
    return () => { clearInterval(pollRef.current); if (socketRef.current) socketRef.current.off('queue:updated') }
  }, [movie])

  if (!movie) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#08090f' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#64748b', marginBottom:'16px' }}>Movie not found</p>
        <Link to="/" className="btn-book" style={{ textDecoration:'none', padding:'10px 24px' }}>← Back to Home</Link>
      </div>
    </div>
  )

  // totalPrice is tracked in state

  async function handleBook() {
    if (!userName.trim()) return addToast('Please enter your name', 'warning')
    if (!selectedShowtime) return addToast('Select a showtime', 'warning')
    if (selectedSeats.length === 0) return addToast('Please select your seats', 'warning')
    setIsLoading(true)
    try {
      const res = await tokensAPI.create({
        queue_id:'queue-movies-001', user_name:userName.trim(), phone:phone.trim()||undefined,
        request_text:`${movie.title} — ${selectedCinema.name} — ${selectedShowtime} — ${numSeats}x ${seatType} (${selectedFormat})`,
        service_type:`Movie: ${movie.title}`, urgency:'medium', request_category:'appointment',
        estimated_service_duration:5, notes:`${numSeats} × ${seatType} | ${selectedFormat} | ₹${totalPrice}`,
      })
      setBookingToken(res.data); setLiveToken(res.data); setStep('done')
      addToast(`🎬 Booked! Token ${res.data.token_number}`, 'success')
      const socket = getSocket(); socketRef.current = socket
      socket.emit('join:queue','queue-movies-001'); socket.emit('join:token',res.data.id)
      socket.on('queue:updated',()=>refreshLive(res.data.id))
      pollRef.current = setInterval(()=>refreshLive(res.data.id),5000)
    } catch (err) { addToast(err.error||'Booking failed','error') }
    finally { setIsLoading(false) }
  }

  async function refreshLive(tid) {
    try { const r = await tokensAPI.get(tid); setLiveToken(r.data.token) } catch {}
  }

  /* ──────────────────────────────────────────────────────────────
     STEP: DETAIL PAGE
  ────────────────────────────────────────────────────────────── */
  if (step === 'detail') return (
    <div className="app-bg" style={{ minHeight:'100vh', paddingTop:NAV_H }}>

      {/* ── Cinematic hero banner ── */}
      <div className="responsive-hero-bg" style={{ position:'relative', minHeight:'460px', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, filter:'blur(25px) opacity(0.5)', transform:'scale(1.1)', zIndex: 1 }}>
          <MoviePoster movie={movie} />
        </div>
        {/* Left fade for text readability */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.7) 40%,rgba(0,0,0,0.15) 70%,transparent 100%)', zIndex: 2 }}/>
        {/* Bottom fade to page */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'180px', background:'linear-gradient(to top,#08090f 0%,transparent 100%)', zIndex: 3 }}/>

        {/* Content inside hero */}
        <div className="responsive-padding responsive-stack" style={{ position:'relative', zIndex: 4, display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'40px 48px', gap:'40px', minHeight: '460px' }}>
          
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end', maxWidth:'660px', flex: 1 }}>
            {/* Badges row */}
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
              {movie.isNew && (
                <span style={{ fontSize:'11px', fontWeight:800, padding:'4px 12px', borderRadius:'20px', background:'#e50914', color:'#fff', letterSpacing:'0.06em' }}>🔥 NEW RELEASE</span>
              )}
              <span style={{ fontSize:'11px', fontWeight:700, padding:'4px 12px', borderRadius:'20px', background:'rgba(255,255,255,0.1)', color:'#fff', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.15)' }}>
                {movie.rating}
              </span>
              <span style={{ fontSize:'11px', fontWeight:700, padding:'4px 12px', borderRadius:'20px', background:'rgba(0,0,0,0.5)', color:'#fbbf24', backdropFilter:'blur(10px)', border:'1px solid rgba(245,158,11,0.2)' }}>
                ⭐ {movie.imdb} IMDb
              </span>
              {movie.formats.slice(0,3).map(f => (
                <span key={f} style={{ fontSize:'11px', fontWeight:700, padding:'4px 11px', borderRadius:'20px', background:'rgba(0,0,0,0.5)', color:'#94a3b8', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)' }}>{f}</span>
              ))}
            </div>

            <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'#fff', lineHeight:1.05, marginBottom:'6px', fontSize:'clamp(28px,5vw,48px)', textShadow:'0 4px 30px rgba(0,0,0,0.5)' }}>
              {movie.title}
            </h1>
            <p style={{ fontSize:'15px', fontWeight:600, color:movie.poster.accent, marginBottom:'10px' }}>{movie.subtitle}</p>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'8px' }}>
              {movie.genre.map(g => (
                <span key={g} style={{ fontSize:'12px', color:'#94a3b8', padding:'3px 10px', borderRadius:'20px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>{g}</span>
              ))}
              <span style={{ color:'#4b5563', fontSize:'12px' }}>· {movie.duration}</span>
            </div>
          </div>

          {/* UNCROPPED POSTER ON RIGHT */}
          <div className="responsive-hero-poster" style={{ height:'350px', display: 'flex', alignItems: 'flex-end', flexShrink: 0 }}>
            <img 
              src={movie.posterUrl} 
              alt={movie.title} 
              style={{ height:'100%', borderRadius:'14px', boxShadow:'0 20px 50px rgba(0,0,0,0.6)', border:`1px solid ${movie.poster.accent}40`, objectFit:'contain' }} 
            />
          </div>

        </div>
      </div>

      {/* ── Content below hero ── */}
      <div className="responsive-booking-grid responsive-padding" style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 28px 80px', display:'grid', gridTemplateColumns:'1fr 340px', gap:'28px', alignItems:'start' }}>

        {/* LEFT: movie info */}
        <div>
          {/* About */}
          <div style={{ borderRadius:'16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', padding:'24px', marginBottom:'16px' }}>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'16px', color:'#fff', marginBottom:'12px' }}>About the Film</h2>
            <p style={{ fontSize:'14px', color:'#94a3b8', lineHeight:1.75, marginBottom:'20px' }}>{movie.description}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div>
                <p style={{ fontSize:'10px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'5px' }}>Cast</p>
                <p style={{ fontSize:'13px', color:'#e2e8f0' }}>{movie.cast}</p>
              </div>
              <div>
                <p style={{ fontSize:'10px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'5px' }}>Director</p>
                <p style={{ fontSize:'13px', color:'#e2e8f0' }}>{movie.director}</p>
              </div>
            </div>
          </div>

          {/* Formats */}
          <div style={{ borderRadius:'16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', padding:'20px', marginBottom:'16px' }}>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'15px', color:'#fff', marginBottom:'14px' }}>Available Formats</h2>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {movie.formats.map(f => (
                <button key={f} onClick={() => setSelectedFormat(f)}
                  style={{ padding:'8px 18px', borderRadius:'10px', fontSize:'13px', fontWeight:700, cursor:'pointer', transition:'all 0.15s', background: selectedFormat===f ? movie.poster.accent : 'rgba(255,255,255,0.04)', color: selectedFormat===f ? '#000' : '#64748b', border: `1px solid ${selectedFormat===f ? movie.poster.accent : 'rgba(255,255,255,0.08)'}` }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div style={{ borderRadius:'16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', padding:'20px' }}>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'15px', color:'#fff', marginBottom:'14px' }}>Languages</h2>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {movie.language.map(l => (
                <span key={l} style={{ padding:'6px 14px', borderRadius:'8px', fontSize:'13px', color:'#94a3b8', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: booking panel — sticky */}
        <div style={{ position:'sticky', top:`calc(${NAV_H} + 16px)` }}>
          <div style={{ borderRadius:'20px', background:'#0e0f18', border:`1px solid ${movie.poster.accent}30`, overflow:'hidden', boxShadow:`0 0 60px ${movie.poster.accent}12` }}>
            {/* Header */}
            <div style={{ padding:'20px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
              <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'17px', color:'#fff', marginBottom:'4px' }}>Book Tickets</h3>
              <p style={{ fontSize:'12px', color:'#4b5563' }}>Select cinema & check showtimes</p>
            </div>

            {/* Cinema selector */}
            <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize:'10px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'10px' }}>Select Cinema</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                {CINEMAS.slice(0,3).map(c => (
                  <button key={c.id} onClick={() => setSelectedCinema(c)}
                    style={{ width:'100%', textAlign:'left', padding:'11px 14px', borderRadius:'12px', cursor:'pointer', transition:'all 0.15s', background: selectedCinema.id===c.id ? `${movie.poster.accent}12` : 'rgba(255,255,255,0.025)', border: `1px solid ${selectedCinema.id===c.id ? movie.poster.accent+'45' : 'rgba(255,255,255,0.06)'}` }}>
                    <p style={{ fontWeight:700, fontSize:'13px', color: selectedCinema.id===c.id ? '#fff' : '#94a3b8', marginBottom:'2px' }}>{c.name}</p>
                    <p style={{ fontSize:'11px', color:'#4b5563' }}>{c.area} · {c.city}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ padding:'16px 20px' }}>
              <button onClick={() => setStep('showtime')} className="btn-book" style={{ width:'100%', padding:'14px', fontSize:'14px' }}>
                🎬 Check Showtimes →
              </button>
              <p style={{ textAlign:'center', fontSize:'11px', color:'#2d3748', marginTop:'10px' }}>No extra booking fee · Instant confirmation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  /* ──────────────────────────────────────────────────────────────
     STEP: SHOWTIME
  ────────────────────────────────────────────────────────────── */
  if (step === 'showtime') return (
    <div className="app-bg" style={{ minHeight:'100vh', paddingTop:`calc(${NAV_H} + 32px)` }}>
      <div style={{ maxWidth:'640px', margin:'0 auto', padding:'0 20px 80px' }}>
        <StepperBar steps={STEPS} currentStep={0} />

        {/* Back + mini header */}
        <button onClick={() => setStep('detail')} style={{ display:'flex', alignItems:'center', gap:'6px', color:'#475569', fontSize:'13px', background:'none', border:'none', cursor:'pointer', marginBottom:'24px', padding:0 }}>
          ← Back
        </button>

        {/* Mini movie info row */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'28px', padding:'16px', borderRadius:'14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
          <PosterThumb movie={movie} size={60} />
          <div>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'18px', color:'#fff', marginBottom:'2px' }}>{movie.title}</h2>
            <p style={{ fontSize:'12px', color:'#4b5563' }}>{selectedCinema.name} · {selectedFormat}</p>
          </div>
        </div>

        {/* Date tabs */}
        <div className="responsive-grid-dates" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'20px' }}>
          {[{d:'Today',dt:'Aug 7'},{d:'Tomorrow',dt:'Aug 8'},{d:'Sat',dt:'Aug 9'},{d:'Sun',dt:'Aug 10'}].map((item,i) => (
            <button key={item.d} style={{ padding:'10px 8px', borderRadius:'12px', cursor:'pointer', textAlign:'center', background: i===0 ? movie.poster.accent : 'rgba(255,255,255,0.03)', color: i===0 ? '#fff' : '#4b5563', border: `1px solid ${i===0 ? movie.poster.accent : 'rgba(255,255,255,0.07)'}`, transition:'all 0.15s' }}>
              <p style={{ fontSize:'13px', fontWeight:800, margin:0 }}>{item.d}</p>
              <p style={{ fontSize:'10px', margin:'2px 0 0', opacity:0.7 }}>{item.dt}</p>
            </button>
          ))}
        </div>

        {/* Cinema + showtimes */}
        <div style={{ borderRadius:'16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden', marginBottom:'20px' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontWeight:800, color:'#fff', fontSize:'14px', marginBottom:'2px' }}>{selectedCinema.name}</p>
              <p style={{ fontSize:'11px', color:'#4b5563' }}>{selectedCinema.area} · {selectedCinema.city}</p>
            </div>
            <span style={{ fontSize:'9px', fontWeight:800, padding:'3px 9px', borderRadius:'20px', background:'rgba(34,197,94,0.12)', color:'#4ade80', border:'1px solid rgba(34,197,94,0.25)' }}>AVAILABLE</span>
          </div>

          {/* Availability legend */}
          <div style={{ padding:'12px 20px 10px', display:'flex', gap:'16px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            {[{c:'#4ade80',l:'Available'},{c:'#fbbf24',l:'Filling Fast'},{c:'#f87171',l:'Almost Full'}].map(({c,l}) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                <div style={{ width:'10px', height:'10px', borderRadius:'3px', background:`${c}25`, border:`1px solid ${c}60` }}/>
                <span style={{ fontSize:'11px', color:'#374151' }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Showtime grid */}
          <div className="responsive-grid-times" style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'8px' }}>
            {SHOWTIMES.map((t, i) => {
              const states = [{c:'#4ade80',l:'Avail'},{c:'#4ade80',l:'Avail'},{c:'#fbbf24',l:'Fast'},{c:'#fbbf24',l:'Fast'},{c:'#f87171',l:'Full'}]
              const s = states[i]
              const isSel = selectedShowtime === t
              return (
                <button key={t} onClick={() => setSelectedShowtime(t)}
                  style={{ padding:'10px 6px', borderRadius:'12px', cursor:'pointer', textAlign:'center', transition:'all 0.15s', background: isSel ? movie.poster.accent : `${s.c}10`, color: isSel ? '#000' : s.c, border: `1px solid ${isSel ? movie.poster.accent : s.c+'40'}` }}>
                  <p style={{ fontSize:'12px', fontWeight:800, margin:0 }}>{t}</p>
                  <p style={{ fontSize:'9px', margin:'2px 0 0', opacity:0.8 }}>{s.l}</p>
                </button>
              )
            })}
          </div>
        </div>

        <button onClick={() => { if (!selectedShowtime) return addToast('Select a showtime','warning'); setStep('seats') }}
          className="btn-book" style={{ width:'100%', padding:'14px', fontSize:'14px' }}>
          Continue to Seat Selection →
        </button>
      </div>
    </div>
  )

  /* ──────────────────────────────────────────────────────────────
     STEP: SEAT SELECTION
  ────────────────────────────────────────────────────────────── */
  if (step === 'seats') return (
    <div className="app-bg" style={{ minHeight:'100vh', paddingTop:`calc(${NAV_H} + 32px)` }}>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'0 20px 80px' }}>
        <StepperBar steps={STEPS} currentStep={1} />

        <button onClick={() => setStep('showtime')} style={{ display:'flex', alignItems:'center', gap:'6px', color:'#475569', fontSize:'13px', background:'none', border:'none', cursor:'pointer', marginBottom:'24px', padding:0 }}>
          ← Back
        </button>

        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:'#fff', marginBottom:'5px' }}>Select Seats</h1>
        <p style={{ fontSize:'13px', color:'#4b5563', marginBottom:'24px' }}>{movie.title} · {selectedShowtime} · {selectedFormat}</p>

        {/* Ticket count */}
        <div style={{ borderRadius:'16px', padding:'18px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: selectedSeats.length > 0 ? '14px' : '0' }}>
            <span style={{ fontWeight:700, color:'#fff', fontSize:'15px' }}>Number of Tickets</span>
            <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
              <button onClick={() => { setNumSeats(Math.max(1,numSeats-1)); setSelectedSeats([]); setTotalPrice(0); setSeatType(null) }} style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontSize:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
              <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:'#fff', minWidth:'24px', textAlign:'center' }}>{numSeats}</span>
              <button onClick={() => { setNumSeats(Math.min(8,numSeats+1)); setSelectedSeats([]); setTotalPrice(0); setSeatType(null) }} style={{ width:'36px', height:'36px', borderRadius:'10px', background:movie.poster.accent, border:'none', color:'#fff', fontSize:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
            </div>
          </div>
          {selectedSeats.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'14px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p style={{ fontSize:'13px', color:'#64748b', margin: 0 }}>{numSeats} × {seatType} ({selectedFormat})</p>
                <p style={{ fontSize:'12px', color:movie.poster.accent, margin: '4px 0 0' }}>Seats: {selectedSeats.join(', ')}</p>
              </div>
              <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'22px', color:movie.poster.accent }}>₹{totalPrice}</span>
            </div>
          )}
        </div>

        {/* Seat Map */}
        <div style={{ marginBottom: '24px' }}>
          <SeatMap 
            numTickets={numSeats} 
            accent={movie.poster.accent}
            selectedSeats={selectedSeats}
            onSelect={(seats, price, typeLabel) => {
              setSelectedSeats(seats)
              setTotalPrice(price)
              setSeatType(typeLabel)
            }}
          />
        </div>

        <button onClick={() => { 
          if (selectedSeats.length === 0) return addToast('Please select seats from the map','warning')
          if (selectedSeats.length !== numSeats) return addToast(`Select ${numSeats} seats from the map`, 'warning')
          setStep('confirm') 
        }}
          className="btn-book" style={{ width:'100%', padding:'14px', fontSize:'14px' }}>
          Proceed to Confirm →
        </button>
      </div>
    </div>
  )

  /* ──────────────────────────────────────────────────────────────
     STEP: CONFIRM
  ────────────────────────────────────────────────────────────── */
  if (step === 'confirm') return (
    <div className="app-bg" style={{ minHeight:'100vh', paddingTop:`calc(${NAV_H} + 32px)` }}>
      <div style={{ maxWidth:'520px', margin:'0 auto', padding:'0 20px 80px' }}>
        <StepperBar steps={STEPS} currentStep={2} />

        <button onClick={() => setStep('seats')} style={{ display:'flex', alignItems:'center', gap:'6px', color:'#475569', fontSize:'13px', background:'none', border:'none', cursor:'pointer', marginBottom:'24px', padding:0 }}>
          ← Back
        </button>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:'#fff', marginBottom:'5px' }}>Confirm Booking</h1>
        <p style={{ fontSize:'13px', color:'#4b5563', marginBottom:'24px' }}>Review your booking details below</p>

        {/* Summary */}
        <div style={{ borderRadius:'16px', overflow:'hidden', border:`1px solid ${movie.poster.accent}30`, marginBottom:'14px' }}>
          {/* Top accent */}
          <div style={{ height:'3px', background:`linear-gradient(90deg,${movie.poster.accent}70,${movie.poster.accent})` }}/>
          <div style={{ padding:'20px', background:'rgba(255,255,255,0.02)' }}>
            <div style={{ display:'flex', gap:'14px', marginBottom:'18px' }}>
              <PosterThumb movie={movie} size={64} />
              <div>
                <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'17px', color:'#fff', marginBottom:'3px' }}>{movie.title}</h2>
                <p style={{ fontSize:'12px', color:'#4b5563', marginBottom:'2px' }}>{selectedCinema.name}</p>
                <p style={{ fontSize:'13px', fontWeight:700, color:'#e2e8f0' }}>{selectedShowtime} · {selectedFormat}</p>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
              {[{l:'Seat Type',v:seatType},{l:'Seats', v:selectedSeats.join(', ')},{l:'Total Price',v:`₹${totalPrice}`},{l:'Convenience Fee',v:'₹0 🎉'}].map(({l,v}) => (
                <div key={l} style={{ padding:'11px', borderRadius:'10px', background:'rgba(255,255,255,0.03)' }}>
                  <p style={{ fontSize:'10px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>{l}</p>
                  <p style={{ fontSize:'14px', fontWeight:700, color:'#e2e8f0', margin:0 }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderRadius:'12px', background:`${movie.poster.accent}10`, border:`1px solid ${movie.poster.accent}30` }}>
              <span style={{ fontWeight:700, color:'#fff' }}>Total Amount</span>
              <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:movie.poster.accent }}>₹{totalPrice}</span>
            </div>
          </div>
        </div>

        {/* User details */}
        <div style={{ borderRadius:'16px', padding:'20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:'14px' }}>
          <p style={{ fontSize:'11px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'14px' }}>Your Details</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div>
              <label style={{ display:'block', fontSize:'12px', color:'#64748b', marginBottom:'6px' }}>Full Name *</label>
              <input className="input-field" placeholder="Name on ticket" value={userName} onChange={e => setUserName(e.target.value)} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'12px', color:'#64748b', marginBottom:'6px' }}>Phone (optional)</label>
              <input className="input-field" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
        </div>

        <button onClick={handleBook} disabled={isLoading||!userName.trim()} className="btn-book" style={{ width:'100%', padding:'15px', fontSize:'15px' }}>
          {isLoading
            ? <span style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'center' }}><span style={{ width:'16px', height:'16px', borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'spin 0.8s linear infinite', display:'block' }}/>Processing…</span>
            : `🎬 Pay ₹${totalPrice} & Book Now`}
        </button>
        <p style={{ textAlign:'center', fontSize:'11px', color:'#1f2937', marginTop:'10px' }}>Secure checkout · Instant confirmation</p>
      </div>
    </div>
  )

  /* ──────────────────────────────────────────────────────────────
     STEP: DONE / TICKET
  ────────────────────────────────────────────────────────────── */
  if (step === 'done' && bookingToken) return (
    <div className="app-bg" style={{ minHeight:'100vh', paddingTop:`calc(${NAV_H} + 32px)` }}>
      <div style={{ maxWidth:'500px', margin:'0 auto', padding:'0 20px 80px' }}>
        <StepperBar steps={STEPS} currentStep={3} />

        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{ width:'64px', height:'64px', borderRadius:'20px', background:`${movie.poster.accent}18`, border:`1px solid ${movie.poster.accent}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', margin:'0 auto 16px' }}>🎉</div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:'#fff', marginBottom:'6px' }}>Booking Confirmed!</h1>
          <p style={{ fontSize:'14px', color:'#64748b' }}>Collect your tickets at the cinema counter</p>
        </div>

        {/* Ticket */}
        <LiveTicket token={liveToken || bookingToken} meta={{ accent: movie.poster.accent, icon: '🍿' }}>
          <div style={{ display:'flex', gap:'16px', marginBottom:'20px' }}>
            <PosterThumb movie={movie} size={72} />
            <div>
              <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:'#fff', lineHeight:1.2, marginBottom:'5px' }}>{movie.title}</p>
              <p style={{ fontWeight:700, color:'#e2e8f0', fontSize:'14px' }}>{selectedCinema.name}</p>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            {[{l:'Showtime',v:selectedShowtime},{l:'Seats',v:selectedSeats.join(', ')},{l:'Amount',v:`₹${totalPrice}`}].map(({l,v}) => (
              <div key={l}>
                <p style={{ fontSize:'10px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'3px' }}>{l}</p>
                <p style={{ fontSize:'14px', fontWeight:700, color: l==='Amount'?movie.poster.accent:'#e2e8f0', margin:0 }}>{v}</p>
              </div>
            ))}
          </div>
        </LiveTicket>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          <Link to="/" style={{ textDecoration:'none', padding:'12px', borderRadius:'12px', textAlign:'center', fontSize:'14px', fontWeight:600, color:'#e2e8f0', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>← Home</Link>
          <Link to="/provider" style={{ textDecoration:'none', padding:'12px', borderRadius:'12px', textAlign:'center', fontSize:'14px', fontWeight:700, color:movie.poster.accent, background:`${movie.poster.accent}12`, border:`1px solid ${movie.poster.accent}35` }}>View Counter</Link>
        </div>
      </div>
    </div>
  )

  return null
}
