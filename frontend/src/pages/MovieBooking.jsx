import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MOVIES, CINEMAS, SHOWTIMES, SEAT_TYPES } from '../data/movies.js'
import { tokensAPI, getSocket } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import QueueProgress from '../components/QueueProgress.jsx'

const NAV_H = '60px'

/* ═══════════════════════════════════════════════════════════════
   CINEMA POSTER — unique visual per film
═══════════════════════════════════════════════════════════════ */
function CinemaPoster({ movie, style = {} }) {
  const { poster } = movie
  const renderPattern = () => {
    switch (poster.pattern) {
      case 'web':
        return (
          <>
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.12 }} viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
              {[...Array(14)].map((_,i) => <line key={i} x1="380" y1="580" x2={i*30} y2="0" stroke={poster.accent} strokeWidth="0.9"/>)}
              {[80,160,240,320,400].map(r => <circle key={r} cx="380" cy="580" r={r} fill="none" stroke={poster.accent} strokeWidth="0.8"/>)}
            </svg>
            <div style={{ position:'absolute', bottom:'-30px', right:'-30px', width:'280px', height:'280px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent}30 0%, transparent 65%)` }}/>
            <div style={{ position:'absolute', top:'-20px', left:'-20px', width:'160px', height:'160px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent2}20 0%, transparent 65%)` }}/>
          </>
        )
      case 'stars':
        return (
          <>
            {[...Array(80)].map((_,i) => (
              <div key={i} style={{ position:'absolute', borderRadius:'50%', background:'#fff', width: i%5===0?'2.5px':i%3===0?'1.5px':'1px', height: i%5===0?'2.5px':i%3===0?'1.5px':'1px', left:`${(i*41+7)%100}%`, top:`${(i*67+13)%100}%`, opacity: 0.08+(i%7)*0.07 }}/>
            ))}
            <div style={{ position:'absolute', top:'15%', right:'12%', width:'100px', height:'100px', borderRadius:'50%', background:`radial-gradient(circle at 35% 35%, ${poster.accent}50 0%, ${poster.accent}15 50%, transparent 70%)`, boxShadow:`0 0 40px ${poster.accent}35`}}/>
            <div style={{ position:'absolute', top:'20%', left:'25%', width:'220px', height:'140px', borderRadius:'50%', background:`radial-gradient(ellipse, ${poster.accent2}15 0%, transparent 70%)` }}/>
          </>
        )
      case 'fire':
        return (
          <>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'60%', background:`linear-gradient(to top, ${poster.accent}45 0%, ${poster.accent2}20 40%, transparent 100%)` }}/>
            <div style={{ position:'absolute', bottom:'-40px', left:'50%', transform:'translateX(-50%)', width:'400px', height:'250px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent}25 0%, transparent 65%)` }}/>
            {['-12deg','-6deg','0deg','6deg'].map((r,i) => (
              <div key={i} style={{ position:'absolute', top:'5%', left:'-30%', width:'160%', height:'2px', background:`linear-gradient(90deg,transparent,${poster.accent}${40-i*8},transparent)`, transform:`rotate(${r})` }}/>
            ))}
          </>
        )
      case 'dust':
        return (
          <>
            {[...Array(24)].map((_,i) => (
              <div key={i} style={{ position:'absolute', width: i%4===0?'4px':'2px', height: i%4===0?'4px':'2px', borderRadius:'50%', background:poster.accent, left:`${(i*47+11)%100}%`, top:`${(i*73+17)%100}%`, opacity:0.08+(i%5)*0.07 }}/>
            ))}
            <div style={{ position:'absolute', bottom:'-50px', left:'50%', transform:'translateX(-50%)', width:'420px', height:'300px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent}22 0%, transparent 60%)` }}/>
          </>
        )
      case 'biolum':
        return (
          <>
            {[...Array(30)].map((_,i) => (
              <div key={i} style={{ position:'absolute', width:'5px', height:'5px', borderRadius:'50%', background:i%2===0?poster.accent:poster.accent2, left:`${(i*43+9)%100}%`, top:`${(i*71+15)%100}%`, opacity:0.1+(i%6)*0.06, boxShadow:`0 0 8px ${i%2===0?poster.accent:poster.accent2}` }}/>
            ))}
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 45% 85% at 10% 60%, ${poster.accent}15 0%, transparent 55%)` }}/>
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 40% 70% at 90% 40%, ${poster.accent2}12 0%, transparent 55%)` }}/>
            <div style={{ position:'absolute', bottom:'-30px', right:'15%', width:'200px', height:'200px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent2}28 0%, transparent 65%)` }}/>
          </>
        )
      default: return null
    }
  }
  return (
    <div style={{ position:'absolute', inset:0, background:poster.bg, overflow:'hidden', ...style }}>
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 80% 60% at 40% 30%, ${poster.accent}22 0%, transparent 60%)` }}/>
      {renderPattern()}
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9rem', opacity:0.1, transform:'rotate(-8deg) scale(1.15)', userSelect:'none', pointerEvents:'none', filter:`drop-shadow(0 0 40px ${poster.accent}60)` }}>
        {poster.emoji}
      </div>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,transparent,${poster.accent},transparent)` }}/>
    </div>
  )
}

/* ─── Small poster thumbnail ───────────────────────────────────── */
function PosterThumb({ movie, size = 80 }) {
  return (
    <div style={{ width:`${size}px`, height:`${Math.round(size*1.45)}px`, borderRadius:'10px', overflow:'hidden', position:'relative', flexShrink:0, border:`1px solid ${movie.poster.accent}35` }}>
      <CinemaPoster movie={movie} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 50%)' }}/>
    </div>
  )
}

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

  const totalPrice = seatType ? seatType.price * numSeats : 0

  async function handleBook() {
    if (!userName.trim()) return addToast('Please enter your name', 'warning')
    if (!selectedShowtime) return addToast('Select a showtime', 'warning')
    if (!seatType) return addToast('Select a seat type', 'warning')
    setIsLoading(true)
    try {
      const res = await tokensAPI.create({
        queue_id:'queue-movies-001', user_name:userName.trim(), phone:phone.trim()||undefined,
        request_text:`${movie.title} — ${selectedCinema.name} — ${selectedShowtime} — ${numSeats}x ${seatType.label} (${selectedFormat})`,
        service_type:`Movie: ${movie.title}`, urgency:'medium', request_category:'appointment',
        estimated_service_duration:5, notes:`${numSeats} × ${seatType.label} | ${selectedFormat} | ₹${totalPrice}`,
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
      <div style={{ position:'relative', height:'460px', overflow:'hidden' }}>
        <CinemaPoster movie={movie} />
        {/* Left fade for text readability */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.7) 40%,rgba(0,0,0,0.15) 70%,transparent 100%)' }}/>
        {/* Bottom fade to page */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'180px', background:'linear-gradient(to top,#08090f 0%,transparent 100%)' }}/>

        {/* Content inside hero */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'40px 48px', maxWidth:'660px' }}>
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
      </div>

      {/* ── Content below hero ── */}
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 28px 80px', display:'grid', gridTemplateColumns:'1fr 340px', gap:'28px', alignItems:'start' }}>

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
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'20px' }}>
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
          <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'8px' }}>
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
      <div style={{ maxWidth:'540px', margin:'0 auto', padding:'0 20px 80px' }}>

        <button onClick={() => setStep('showtime')} style={{ display:'flex', alignItems:'center', gap:'6px', color:'#475569', fontSize:'13px', background:'none', border:'none', cursor:'pointer', marginBottom:'24px', padding:0 }}>
          ← Back
        </button>

        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:'#fff', marginBottom:'5px' }}>Select Seats</h1>
        <p style={{ fontSize:'13px', color:'#4b5563', marginBottom:'24px' }}>{movie.title} · {selectedShowtime} · {selectedFormat}</p>

        {/* Screen indicator */}
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ display:'inline-block', padding:'6px 40px', borderRadius:'0 0 20px 20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderTop:'none' }}>
            <p style={{ fontSize:'10px', color:'#374151', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', margin:0 }}>SCREEN ↓</p>
          </div>
        </div>

        {/* Seat type cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px' }}>
          {SEAT_TYPES.map(st => {
            const isSel = seatType?.id === st.id
            return (
              <button key={st.id} onClick={() => setSeatType(st)}
                style={{ width:'100%', textAlign:'left', padding:'16px 20px', borderRadius:'16px', cursor:'pointer', transition:'all 0.2s', background: isSel ? `${movie.poster.accent}12` : 'rgba(255,255,255,0.025)', border: `1px solid ${isSel ? movie.poster.accent+'50' : 'rgba(255,255,255,0.07)'}`, boxShadow: isSel ? `0 0 24px ${movie.poster.accent}15` : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                      <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'16px', color: isSel ? '#fff' : '#94a3b8' }}>{st.label}</span>
                      <span style={{ fontSize:'12px', color:'#4b5563' }}>{st.desc}</span>
                    </div>
                    {/* Mini seat visual */}
                    <div style={{ display:'flex', gap:'4px' }}>
                      {[...Array(8)].map((_,i) => (
                        <div key={i} style={{ width:'16px', height:'12px', borderRadius:'3px 3px 0 0', background: i<(isSel?3:1) ? (isSel?movie.poster.accent:'#374151') : '#1a1b23', border:`1px solid rgba(255,255,255,0.06)`, transition:'all 0.2s' }}/>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'22px', color: isSel ? movie.poster.accent : '#374151', margin:0 }}>₹{st.price}</p>
                    <p style={{ fontSize:'11px', color:'#374151', margin:'2px 0 0' }}>per ticket</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Ticket count */}
        {seatType && (
          <div style={{ borderRadius:'16px', padding:'18px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
              <span style={{ fontWeight:700, color:'#fff', fontSize:'15px' }}>Number of Tickets</span>
              <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                <button onClick={() => setNumSeats(Math.max(1,numSeats-1))} style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontSize:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:'#fff', minWidth:'24px', textAlign:'center' }}>{numSeats}</span>
                <button onClick={() => setNumSeats(Math.min(8,numSeats+1))} style={{ width:'36px', height:'36px', borderRadius:'10px', background:movie.poster.accent, border:'none', color:'#fff', fontSize:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'14px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:'13px', color:'#64748b' }}>{numSeats} × {seatType.label} ({selectedFormat})</span>
              <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'22px', color:movie.poster.accent }}>₹{totalPrice}</span>
            </div>
          </div>
        )}

        <button onClick={() => { if (!seatType) return addToast('Select a seat type','warning'); setStep('confirm') }}
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
              {[{l:'Seat Type',v:seatType?.label},{l:'Tickets',v:`${numSeats} ticket${numSeats>1?'s':''}`},{l:'Price / Ticket',v:`₹${seatType?.price}`},{l:'Convenience Fee',v:'₹0 🎉'}].map(({l,v}) => (
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

        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{ width:'64px', height:'64px', borderRadius:'20px', background:`${movie.poster.accent}18`, border:`1px solid ${movie.poster.accent}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', margin:'0 auto 16px' }}>🎉</div>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:'#fff', marginBottom:'6px' }}>Booking Confirmed!</h1>
          <p style={{ fontSize:'14px', color:'#64748b' }}>Collect your tickets at the cinema counter</p>
        </div>

        {/* Ticket */}
        <div style={{ borderRadius:'20px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', marginBottom:'14px', boxShadow:'0 8px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ height:'4px', background:`linear-gradient(90deg,${movie.poster.accent}80,${movie.poster.accent})` }}/>
          <div style={{ padding:'24px', background:'linear-gradient(135deg,#111218,#14151e)' }}>
            <div style={{ display:'flex', gap:'16px', marginBottom:'20px' }}>
              <PosterThumb movie={movie} size={72} />
              <div>
                <p style={{ fontSize:'12px', color:'#4b5563', marginBottom:'4px' }}>Token Number</p>
                <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'42px', color:movie.poster.accent, lineHeight:1, marginBottom:'5px' }}>{(liveToken||bookingToken).token_number}</p>
                <p style={{ fontWeight:700, color:'#e2e8f0', fontSize:'16px' }}>{(liveToken||bookingToken).user_name}</p>
              </div>
            </div>
            <div style={{ borderTop:'1px dashed rgba(255,255,255,0.08)', paddingTop:'18px', marginTop:'4px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              {[{l:'Movie',v:movie.title},{l:'Showtime',v:selectedShowtime},{l:'Seats',v:`${numSeats} × ${seatType?.label}`},{l:'Amount',v:`₹${totalPrice}`}].map(({l,v}) => (
                <div key={l}>
                  <p style={{ fontSize:'10px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'3px' }}>{l}</p>
                  <p style={{ fontSize:'14px', fontWeight:700, color: l==='Amount'?movie.poster.accent:'#e2e8f0', margin:0 }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding:'14px 24px', background:'rgba(255,255,255,0.02)', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'11px', fontWeight:800, padding:'4px 10px', borderRadius:'20px', background:'rgba(74,222,128,0.12)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.25)' }}>● CONFIRMED</span>
            <span style={{ fontSize:'12px', color:'#374151' }}>#{(liveToken||bookingToken).position || '—'} in counter queue</span>
          </div>
        </div>

        {/* Progress */}
        <div style={{ borderRadius:'14px', padding:'18px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:'14px' }}>
          <p style={{ fontSize:'11px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'16px' }}>Collection Queue Status</p>
          <QueueProgress status={(liveToken||bookingToken).status||'waiting'} position={(liveToken||bookingToken).position||1} accentColor={movie.poster.accent} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          <Link to="/" style={{ textDecoration:'none', padding:'12px', borderRadius:'12px', textAlign:'center', fontSize:'14px', fontWeight:600, color:'#e2e8f0', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>← Home</Link>
          <Link to="/provider" style={{ textDecoration:'none', padding:'12px', borderRadius:'12px', textAlign:'center', fontSize:'14px', fontWeight:700, color:movie.poster.accent, background:`${movie.poster.accent}12`, border:`1px solid ${movie.poster.accent}35` }}>View Counter</Link>
        </div>
      </div>
    </div>
  )

  return null
}
