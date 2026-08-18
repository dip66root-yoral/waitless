import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { queuesAPI } from '../api/client.js'
import { MOVIES } from '../data/movies.js'
import { STADIUMS } from '../data/stadiums.js'
import { use3DTilt } from '../hooks/use3DTilt.js'

/* ─── Constants ────────────────────────────────────────────────── */
const MAX_W = '1160px'
const NAV_H = '60px'

import { MoviePoster } from '../components/MoviePoster.jsx'

/* ─── Movie Card (landing grid) ────────────────────────────────── */
function MovieCard({ movie }) {
  const [hov, setHov] = useState(false)
  const { ref, glareRef, glareStyle, handlers } = use3DTilt({ max: 14, scale: 1.05 })
  return (
    <Link to={`/movie/${movie.id}`} style={{ textDecoration:'none', display:'block', height:'100%' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={(e) => { setHov(false); handlers.onMouseLeave(e) }}
      onMouseMove={handlers.onMouseMove}>
      <div ref={ref} className="tilt-wrap card-3d" style={{
        position:'relative', borderRadius:'20px', overflow:'hidden', height:'100%', display:'flex', flexDirection:'column',
        border:`1px solid ${hov ? movie.poster.accent+'80' : 'rgba(var(--rgb-white),0.08)'}`,
        boxShadow: hov ? `0 0 32px ${movie.poster.accent}30, 0 16px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(var(--rgb-white),0.1)` : '0 8px 24px rgba(0,0,0,0.6)',
        transition:'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
      }}>
        {/* Glare overlay */}
        <div ref={glareRef} style={glareStyle} />
        <div style={{ position:'relative', aspectRatio:'2/3', width:'100%' }}>
          <MoviePoster movie={movie} />
          {/* Info gradient overlay */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'80%', background:'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 30%, transparent 100%)' }}/>
        </div>

        {/* NEW badge */}
        {movie.isNew && (
          <div style={{ position:'absolute', top:'12px', left:'12px', background:'#e50914', color:'var(--text-main)', fontSize:'10px', fontWeight:800, padding:'3px 10px', borderRadius:'6px', zIndex:3, letterSpacing:'0.05em', boxShadow:'0 4px 12px rgba(229,9,20,0.4)' }}>NEW</div>
        )}
        {/* Rating */}
        <div style={{ position:'absolute', top:'12px', right:'12px', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', color:movie.poster.accent, fontSize:'11px', fontWeight:800, padding:'3px 10px', borderRadius:'6px', border:`1px solid ${movie.poster.accent}60`, zIndex:3 }}>
          {movie.rating}
        </div>

        {/* Info overlay */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px', zIndex:3, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
            <span style={{ color:'#fbbf24', fontSize:'11px', fontWeight:800 }}>⭐ {movie.imdb}</span>
            <span style={{ color:'#4b5563' }}>·</span>
            <span style={{ color:'var(--text-muted)', fontSize:'11px', fontWeight:600 }}>{movie.duration}</span>
          </div>
          <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'var(--text-main)', fontSize:'16px', lineHeight:1.2, marginBottom:'4px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', letterSpacing:'-0.01em' }}>{movie.title}</h3>
          <p style={{ color:movie.poster.accent, fontSize:'11px', fontWeight:700, marginBottom: hov?'12px':'0', transition:'margin 0.3s cubic-bezier(0.25, 1, 0.5, 1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{movie.genre.join(' · ')}</p>
          
          <div style={{ overflow:'hidden', maxHeight: hov?'44px':'0', transition:'max-height 0.3s cubic-bezier(0.25, 1, 0.5, 1)', opacity: hov?1:0 }}>
            <div className="btn-book" style={{ padding:'8px 12px', fontSize:'13px', width:'100%', borderRadius:'10px', textAlign:'center', display:'block', background: movie.poster.accent, color:'var(--text-main)' }}>
              Book Tickets →
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ─── Hub Card ─────────────────────────────────────────────────── */
function HubCard({ hub, waiting, wait, onClick }) {
  const [hov, setHov] = useState(false)
  const navigate = useNavigate()
  const { ref, glareRef, glareStyle, handlers } = use3DTilt({ max: 10, scale: 1.03 })

  const handleClick = (e) => {
    e.preventDefault()
    if (onClick) onClick()           // movies → scroll to section
    else navigate(hub.route || '/user')
  }

  return (
    <div ref={ref} onClick={handleClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={(e) => { setHov(false); handlers.onMouseLeave(e) }}
      onMouseMove={handlers.onMouseMove}
      className="tilt-wrap card-3d"
      style={{
        borderRadius:'24px', overflow:'hidden', cursor:'pointer', position: 'relative',
        background: hub.bg, 
        border:`1px solid ${hov ? hub.accent+'60' : hub.border}`,
        boxShadow: hov ? `0 0 40px ${hub.accentDim}, 0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(var(--rgb-white),0.15)` : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(var(--rgb-white),0.05)',
        transition:'border 0.3s, box-shadow 0.3s',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}>
      {/* Glare overlay */}
      <div ref={glareRef} style={glareStyle} />
      {/* Top glowing edge on hover */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background: hov ? hub.accent : 'transparent', boxShadow: hov ? `0 0 20px ${hub.accent}` : 'none', transition:'all 0.3s' }}/>
      
      <div style={{ padding:'32px 28px 24px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
          <span style={{ fontSize:'42px', lineHeight:1, filter: hov ? `drop-shadow(0 0 16px ${hub.accent}80)` : 'none', transition:'filter 0.3s' }}>{hub.icon}</span>
          {hub.queueId ? (
            <div style={{ textAlign:'right' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', justifyContent:'flex-end', marginBottom:'4px' }}>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:hub.accent, animation:'live-pulse 1.8s ease infinite' }}/>
                <span style={{ fontSize:'11px', fontWeight:800, color:hub.accent, letterSpacing:'0.08em' }}>LIVE</span>
              </div>
              <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:hub.accent, lineHeight:1 }}>{waiting}</span>
              <p style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px', fontWeight:600 }}>in queue · ~{wait}m</p>
            </div>
          ) : (
            <span style={{ fontSize:'11px', fontWeight:800, padding:'4px 12px', borderRadius:'20px', background:hub.accentDim, color:hub.accent, border:`1px solid ${hub.border}`, letterSpacing:'0.05em' }}>OPEN</span>
          )}
        </div>
        <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:'var(--text-main)', marginBottom:'8px', letterSpacing:'-0.01em' }}>{hub.title}</h3>
        <p style={{ fontSize:'15px', color:'var(--text-muted)', marginBottom:'24px', lineHeight:1.6 }}>{hub.desc}</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
          {hub.tags.map(t => (
            <span key={t} style={{ fontSize:'12px', padding:'5px 12px', borderRadius:'10px', fontWeight:700, background:'rgba(var(--rgb-white),0.03)', color:'#cbd5e1', border:'1px solid rgba(var(--rgb-white),0.06)' }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ padding:'18px 28px', borderTop:`1px solid ${hub.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background: hov ? hub.accentDim : 'rgba(var(--rgb-white),0.01)', transition:'background 0.3s' }}>
        <span style={{ fontSize:'14px', fontWeight:800, color:hub.accent, letterSpacing:'0.02em' }}>{hub.cta}</span>
        <span style={{ fontSize:'18px', color:hub.accent, transform: hov ? 'translateX(6px)' : 'none', transition:'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }}>→</span>
      </div>
    </div>
  )
}

/* ─── Hub Data ─────────────────────────────────────────────────── */
const HUBS = [
  { key:'movies',  icon:'🎬', title:'Movies',         cta:'Browse Movies',  desc:'Book cinema tickets at PVR, INOX & Cinépolis', accent:'#e50914', accentDim:'rgba(229,9,20,0.1)', border:'rgba(229,9,20,0.2)', bg:'linear-gradient(135deg, rgba(20,4,4,0.6) 0%, rgba(34,8,8,0.6) 100%)', tags:['Now Showing','IMAX · 3D · 4DX','Recliner · Gold'], route:null },
  { key:'train',   icon:'🚆', title:'Train Tickets',  cta:'Book Seat',      desc:'Reserve seats, Tatkal booking & pass renewal', accent:'#4ade80', accentDim:'rgba(74,222,128,0.1)', border:'rgba(74,222,128,0.2)', bg:'linear-gradient(135deg, rgba(6,18,8,0.6) 0%, rgba(10,30,13,0.6) 100%)', tags:['Rajdhani · Shatabdi','Tatkal','Senior Pass'], queueId:'queue-train-001',   route:'/user/queue-train-001' },
  { key:'flight',  icon:'✈️', title:'Flight Services',cta:'Get Token',      desc:'Check-in, baggage, upgrades & rebooking', accent:'#38bdf8', accentDim:'rgba(56,189,248,0.1)', border:'rgba(56,189,248,0.2)', bg:'linear-gradient(135deg, rgba(4,14,24,0.6) 0%, rgba(7,21,37,0.6) 100%)', tags:['Check-in','Seat Upgrade','Lost Baggage'], queueId:'queue-flight-001',  route:'/user/queue-flight-001' },
  { key:'medical', icon:'🏥', title:'Medical OPD',    cta:'Get Token',      desc:'Doctor consultations, blood tests & diagnostics', accent:'#a78bfa', accentDim:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.2)', bg:'linear-gradient(135deg, rgba(12,8,20,0.6) 0%, rgba(20,14,32,0.6) 100%)', tags:['OPD Walk-in','Blood Tests','Specialist'], queueId:'queue-clinic-001',  route:'/user/queue-clinic-001' },
  { key:'stadium', icon:'🏟️', title:'Stadium Booking',cta:'View Matches', desc:'Book VIP box entry for live sports', accent:'#f59e0b', accentDim:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.2)', bg:'linear-gradient(135deg, rgba(18,9,4,0.6) 0%, rgba(26,16,6,0.6) 100%)', tags:['Premier League','IPL','La Liga'], queueId:null, route:'/stadiums' }
]

/* ─── Divider & Section wrappers ───────────────────────────────── */
function Divider() {
  return (
    <div style={{ padding:'0 28px' }}>
      <div style={{ maxWidth:MAX_W, margin:'0 auto', height:'1px', background:'linear-gradient(to right,transparent,rgba(var(--rgb-white),0.07),transparent)' }}/>
    </div>
  )
}

/* ─── Stadium Card ─────────────────────────────────────────────── */
function StadiumCard({ stadium }) {
  const [hov, setHov] = useState(false)
  return (
    <Link to={`/user/queue-${stadium.id}`} style={{ textDecoration:'none', display:'block', height:'100%' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{
        position:'relative', borderRadius:'14px', overflow:'hidden', height:'100%', display:'flex', flexDirection:'column',
        border:`1px solid ${hov ? stadium.poster.accent+'60' : 'rgba(var(--rgb-white),0.08)'}`,
        boxShadow: hov ? `0 0 28px ${stadium.poster.accent}25, 0 12px 40px rgba(0,0,0,0.7)` : '0 4px 20px rgba(0,0,0,0.5)',
        transform: hov ? 'translateY(-7px) scale(1.01)' : 'none',
        transition:'all 0.28s cubic-bezier(.22,.68,0,1.2)',
      }}>
        <div style={{ position:'relative', aspectRatio:'4/3', width:'100%', background: 'rgba(var(--rgb-white),0.02)' }}>
          <img src={stadium.posterUrl} alt={stadium.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'70%', background:'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.7) 40%, transparent 100%)' }}/>
        </div>

        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px', zIndex:3, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'3px' }}>
            <span style={{ color:stadium.poster.accent, fontSize:'10px', fontWeight:700 }}>🏟️ {stadium.type}</span>
            <span style={{ color:'#374151' }}>·</span>
            <span style={{ color:'#6b7280', fontSize:'10px' }}>{stadium.capacity} Seats</span>
          </div>
          <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'var(--text-main)', fontSize:'14px', lineHeight:1.35, marginBottom:'3px' }}>{stadium.title}</h3>
          <p style={{ color:'var(--text-muted)', fontSize:'10px', marginBottom: hov?'10px':'0', transition:'margin 0.2s' }}>{stadium.location}</p>
          <div style={{ overflow:'hidden', maxHeight: hov?'40px':'0', transition:'max-height 0.25s ease', opacity: hov?1:0 }}>
            <div className="btn-book" style={{ padding:'6px 10px', fontSize:'11px', width:'100%', borderRadius:'9px', textAlign:'center', display:'block', background: stadium.poster.accent, color:'var(--text-main)' }}>
              Book Tickets
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ─── Main ─────────────────────────────────────────────────────── */
export default function Landing() {
  const [queues, setQueues] = useState({})
  const [langFilter, setLangFilter] = useState([])
  const [formatFilter, setFormatFilter] = useState('All Formats')
  const [sportsFilter, setSportsFilter] = useState('All Sports')
  const moviesRef = useRef(null)

  useEffect(() => {
    document.title = 'WAITLESS - Book Movies, Tickets & More'
    queuesAPI.list().then(r => {
      const m = {}; r.data?.forEach(q => { m[q.id] = q }); setQueues(m)
    }).catch(() => {})
  }, [])

  const scrollToMovies = () => {
    moviesRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })
  }

  return (
    <main className="app-bg" style={{ minHeight:'100vh' }}>

      {/* ═══════════════════════════════════════════════
          SECTION 1 — HERO & HUBS
      ═══════════════════════════════════════════════ */}
      <section aria-label="Hero Section" className="responsive-padding responsive-hero-padding" style={{ padding:'120px 28px 64px' }}>
        <div style={{ maxWidth:MAX_W, margin:'0 auto' }}>

          {/* Heading */}
          <header className="responsive-text-center" style={{ textAlign:'center', marginBottom:'64px' }}>
            <h1 className="hero-3d-text" style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'clamp(40px, 6vw, 64px)', color:'var(--text-main)', margin:'0 0 20px', lineHeight:1.1, letterSpacing:'-0.03em',
              textShadow: '0 2px 0 rgba(var(--rgb-white),0.1), 0 8px 30px rgba(0,0,0,0.5), 0 -2px 0 rgba(var(--rgb-white),0.05)'
            }}>
              What do you want to{' '}
              <span style={{ background:'linear-gradient(135deg, #38bdf8, #a855f7, #ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                filter:'drop-shadow(0 4px 24px rgba(168,85,247,0.6)) drop-shadow(0 8px 40px rgba(236,72,153,0.3))'
              }}>book today?</span>
            </h1>
            <p style={{
              color: 'var(--text-muted)', fontSize: '20px', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6, fontWeight: 500
            }}>
              Skip the line. Pre-book your spot across hospitals, salons, theatres, stadiums, and government offices. 
              Real-time tracking, zero waiting.
            </p>
          </header>

          {/* 2×2 Hub cards — max 780px centered */}
          <div className="responsive-grid-2" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'16px', maxWidth:'780px', margin:'0 auto' }}>
            {HUBS.map(hub => {
              const q = hub.queueId ? queues[hub.queueId] : null
              const waiting = q?.stats?.waiting_count ?? 0
              const wait = waiting * (q?.avg_service_time ?? 10)
              return (
                <HubCard key={hub.key} hub={hub} waiting={waiting} wait={wait}
                  onClick={hub.key === 'movies' ? scrollToMovies : null} />
              )
            })}
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════
          SECTION 2 — MOVIES IN CINEMAS
      ═══════════════════════════════════════════════ */}
      <section ref={moviesRef} style={{ padding:'60px 28px', scrollMarginTop:NAV_H }}>
        <div style={{ maxWidth:MAX_W, margin:'0 auto' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'20px' }}>
            <div>
              <p style={{ fontSize:'10px', fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'#e50914', marginBottom:'6px' }}>Now Showing</p>
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:'var(--text-main)', marginBottom:'3px' }}>🎬 Movies in Cinemas</h2>
              <p style={{ fontSize:'13px', color:'#4b5563' }}>PVR · INOX · Cinépolis · Miraj</p>
            </div>
            <Link to="/movies" style={{ textDecoration:'none', fontSize:'13px', fontWeight:600, color:'#e50914' }}>See all →</Link>
          </div>

          {/* Filter chips */}
          <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'24px', overflowX:'auto', paddingBottom:'4px' }}>
            {['Hindi','English','Tamil','Telugu'].map((l) => {
              const isSel = langFilter.includes(l)
              return (
                <button key={l} onClick={() => {
                  if (isSel) setLangFilter(langFilter.filter(x => x !== l))
                  else setLangFilter([...langFilter, l])
                }} style={{ flexShrink:0, padding:'5px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', background: isSel?'rgba(229,9,20,0.12)':'rgba(var(--rgb-white),0.04)', color: isSel?'#f87171':'#475569', border: isSel?'1px solid rgba(229,9,20,0.5)':'1px solid rgba(var(--rgb-white),0.06)', boxShadow: isSel?'0 0 12px rgba(229,9,20,0.2)':'none', transition:'all 0.2s' }}>{l}</button>
              )
            })}
            <div style={{ width:'1px', height:'14px', background:'rgba(var(--rgb-white),0.09)', flexShrink:0, margin:'0 3px' }}/>
            {['All Formats','2D','3D','IMAX','4DX'].map((f) => {
              const isSel = formatFilter === f
              return (
                <button key={f} onClick={() => setFormatFilter(f)} style={{ flexShrink:0, padding:'5px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', background: isSel?'rgba(var(--rgb-white),0.07)':'rgba(var(--rgb-white),0.03)', color: isSel?'#e2e8f0':'#374151', border: isSel?'1px solid rgba(var(--rgb-white),0.3)':'1px solid rgba(var(--rgb-white),0.06)', boxShadow: isSel?'0 0 12px rgba(var(--rgb-white),0.1)':'none', transition:'all 0.2s' }}>{f}</button>
              )
            })}
          </div>

          {/* Movie grid — 5 columns */}
          <div className="responsive-horizontal-slider" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'16px' }}>
            {MOVIES.filter(m => {
              if (langFilter.length > 0 && !langFilter.some(l => m.language.includes(l))) return false
              if (formatFilter !== 'All Formats' && !m.formats.some(f => f.includes(formatFilter))) return false
              return true
            }).map(m => <MovieCard key={m.id} movie={m} />)}
            {/* Coming soon */}
            <div style={{ borderRadius:'14px', aspectRatio:'2/3', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', background:'rgba(var(--rgb-white),0.015)', border:'1px dashed rgba(var(--rgb-white),0.07)' }}>
              <span style={{ fontSize:'26px', opacity:0.2 }}>🎬</span>
              <p style={{ fontSize:'11px', color:'#2d3748', textAlign:'center', lineHeight:1.5 }}>More releasing<br/>this week</p>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════
          SECTION 3 — LIVE SERVICE COUNTERS
      ═══════════════════════════════════════════════ */}
      <section style={{ padding:'60px 28px' }}>
        <div style={{ maxWidth:MAX_W, margin:'0 auto' }}>

          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'28px' }}>
            <div>
              <p style={{ fontSize:'10px', fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'#64748b', marginBottom:'6px' }}>Skip the Physical Line</p>
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:'var(--text-main)', marginBottom:'3px' }}>🎟️ Live Service Counters</h2>
              <p style={{ fontSize:'13px', color:'#4b5563' }}>Get a virtual token — track your spot from your phone</p>
            </div>
            <Link to="/user" className="btn-book" style={{ padding:'9px 20px', fontSize:'13px', textDecoration:'none' }}>Get Token →</Link>
          </div>

          <div className="responsive-grid-2" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
            {[
              { id:'queue-clinic-001', icon:'🏥', name:'City Medical Center', desc:'OPD · Diagnostics · Specialist', accent:'#a78bfa', border:'rgba(167,139,250,0.18)', bg:'linear-gradient(135deg,#0c0814,#140e20)' },
              { id:'queue-train-001',  icon:'🚆', name:'Indian Railways',      desc:'Booking · Tatkal · Passes',    accent:'#4ade80', border:'rgba(74,222,128,0.18)',   bg:'linear-gradient(135deg,#061208,#0a1e0d)' },
              { id:'queue-flight-001', icon:'✈️', name:'Airport Services',     desc:'Check-in · Upgrades · Baggage',accent:'#38bdf8', border:'rgba(56,189,248,0.18)',   bg:'linear-gradient(135deg,#040e18,#071525)' },
            ].map(s => {
              const q = queues[s.id]
              const waiting = q?.stats?.waiting_count ?? 0
              const wait = waiting * (q?.avg_service_time ?? 10)
              return (
                <Link to="/user" key={s.id} style={{ textDecoration:'none' }}>
                  <div style={{ borderRadius:'18px', overflow:'hidden', background:s.bg, border:`1px solid ${s.border}`, cursor:'pointer', transition:'transform 0.25s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateY(-5px)'}
                    onMouseLeave={e => e.currentTarget.style.transform='none'}>
                    <div style={{ padding:'22px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                        <span style={{ fontSize:'30px' }}>{s.icon}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10px', fontWeight:700, color:s.accent }}>
                          <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:s.accent, animation:'live-pulse 1.8s ease infinite' }}/>
                          LIVE
                        </div>
                      </div>
                      <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'17px', color:'var(--text-main)', marginBottom:'3px' }}>{s.name}</h3>
                      <p style={{ fontSize:'13px', color:'#64748b', marginBottom:'16px' }}>{s.desc}</p>
                      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'10px' }}>
                        <div>
                          <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:s.accent }}>{waiting}</span>
                          <span style={{ fontSize:'12px', color:'#4b5563', marginLeft:'7px' }}>in queue</span>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ fontSize:'13px', fontWeight:600, color:'#cbd5e1' }}>~{wait}m</p>
                          <p style={{ fontSize:'10px', color:'#374151' }}>wait time</p>
                        </div>
                      </div>
                      <div style={{ height:'3px', borderRadius:'3px', background:'rgba(var(--rgb-white),0.05)' }}>
                        <div style={{ height:'100%', borderRadius:'3px', width:`${Math.min((waiting/8)*100,100)}%`, background:`linear-gradient(90deg,${s.accent}70,${s.accent})`, transition:'width 0.7s ease' }}/>
                      </div>
                    </div>
                    <div style={{ padding:'11px 22px', borderTop:`1px solid ${s.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'13px', fontWeight:700, color:s.accent }}>Get Virtual Token</span>
                      <span style={{ fontSize:'15px', color:s.accent }}>→</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <div style={{ borderTop:'1px solid rgba(var(--rgb-white),0.05)', padding:'22px 28px' }}>
        <div style={{ maxWidth:MAX_W, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'linear-gradient(135deg, #e50914, #ff4040)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'var(--text-main)', fontSize:'14px' }}>W</span>
            </div>
            <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, color:'var(--text-main)', fontSize:'15px', letterSpacing:'0.05em' }}>WAITLESS</span>
            <span style={{ color:'#374151', fontSize:'13px' }}>· Built for India 🇮🇳</span>
          </div>
          <div style={{ display:'flex', gap:'24px', fontSize:'12px', color:'#374151' }}>
            <span>Real-time via Socket.io</span>
          </div>
        </div>
      </div>
    </main>
  )
}
