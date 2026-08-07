import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { queuesAPI } from '../api/client.js'
import { MOVIES } from '../data/movies.js'

/* ─── Constants ────────────────────────────────────────────────── */
const MAX_W = '1160px'
const NAV_H = '60px'

/* ═══════════════════════════════════════════════════════════════
   PREMIUM CINEMA POSTER — each movie gets unique visual treatment
═══════════════════════════════════════════════════════════════ */
function CinemaPoster({ movie, height = '100%' }) {
  const { poster, title, genre, rating } = movie

  // Each pattern style is unique to the film
  const renderPattern = () => {
    switch (poster.pattern) {
      case 'web': // Spider-Man
        return (
          <>
            {/* Radial web lines from corner */}
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.15 }} viewBox="0 0 300 450" preserveAspectRatio="xMidYMid slice">
              {[...Array(12)].map((_,i) => <line key={i} x1="280" y1="420" x2={i*28} y2="0" stroke={poster.accent} strokeWidth="0.8"/>)}
              {[60,130,200,270,340].map(r => <circle key={r} cx="280" cy="420" r={r} fill="none" stroke={poster.accent} strokeWidth="0.7" opacity="0.8"/>)}
            </svg>
            {/* Red glow burst from corner */}
            <div style={{ position:'absolute', bottom:'-20px', right:'-20px', width:'220px', height:'220px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent}35 0%, transparent 70%)` }}/>
            {/* Blue glow top left */}
            <div style={{ position:'absolute', top:'-10px', left:'-10px', width:'150px', height:'150px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent2}25 0%, transparent 70%)` }}/>
          </>
        )
      case 'stars': // Odyssey
        return (
          <>
            {/* Star field */}
            {[...Array(60)].map((_,i) => (
              <div key={i} style={{ position:'absolute', borderRadius:'50%', background:'#fff', width: i%6===0?'2.5px':i%3===0?'1.5px':'1px', height: i%6===0?'2.5px':i%3===0?'1.5px':'1px', left:`${(i*41+7)%100}%`, top:`${(i*67+13)%100}%`, opacity: 0.08 + (i%7)*0.08 }}/>
            ))}
            {/* Planet ring */}
            <div style={{ position:'absolute', top:'18%', right:'8%', width:'90px', height:'90px', borderRadius:'50%', background:`radial-gradient(circle at 35% 35%, ${poster.accent}60 0%, ${poster.accent}20 50%, transparent 70%)`, boxShadow:`0 0 30px ${poster.accent}40`}}>
              {/* Ring around planet */}
              <div style={{ position:'absolute', top:'50%', left:'-30%', right:'-30%', height:'12px', borderRadius:'50%', border:`2px solid ${poster.accent}50`, transform:'translateY(-50%) rotateX(70deg)' }}/>
            </div>
            {/* Nebula glow */}
            <div style={{ position:'absolute', top:'30%', left:'20%', width:'180px', height:'120px', borderRadius:'50%', background:`radial-gradient(ellipse, ${poster.accent2}20 0%, transparent 70%)` }}/>
          </>
        )
      case 'fire': // Pushpa
        return (
          <>
            {/* Fire gradient from bottom */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'55%', background:`linear-gradient(to top, ${poster.accent}40 0%, ${poster.accent2}20 40%, transparent 100%)` }}/>
            {/* Hot glow */}
            <div style={{ position:'absolute', bottom:'-30px', left:'50%', transform:'translateX(-50%)', width:'300px', height:'200px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent}30 0%, transparent 70%)` }}/>
            {/* Diagonal slash accent */}
            <div style={{ position:'absolute', top:'10%', left:'-20%', width:'200%', height:'3px', background:`linear-gradient(90deg, transparent, ${poster.accent}60, transparent)`, transform:'rotate(-15deg)' }}/>
            <div style={{ position:'absolute', top:'25%', left:'-20%', width:'200%', height:'1px', background:`linear-gradient(90deg, transparent, ${poster.accent2}40, transparent)`, transform:'rotate(-15deg)' }}/>
          </>
        )
      case 'dust': // KGF
        return (
          <>
            {/* Gold dust particles */}
            {[...Array(20)].map((_,i) => (
              <div key={i} style={{ position:'absolute', width: i%4===0?'3px':'2px', height: i%4===0?'3px':'2px', borderRadius:'50%', background: poster.accent, left:`${(i*47+11)%100}%`, top:`${(i*73+17)%100}%`, opacity: 0.1 + (i%5)*0.08 }}/>
            ))}
            {/* Gold explosion from bottom center */}
            <div style={{ position:'absolute', bottom:'-40px', left:'50%', transform:'translateX(-50%)', width:'350px', height:'250px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent}25 0%, transparent 65%)` }}/>
            {/* Dark rock texture lines */}
            {[20,40,60,80].map(y => (
              <div key={y} style={{ position:'absolute', left:0, right:0, top:`${y}%`, height:'1px', background:`linear-gradient(90deg,transparent,${poster.accent}15,transparent)` }}/>
            ))}
          </>
        )
      case 'biolum': // Avatar
        return (
          <>
            {/* Bioluminescent dots */}
            {[...Array(25)].map((_,i) => (
              <div key={i} style={{ position:'absolute', width:'4px', height:'4px', borderRadius:'50%', background: i%2===0?poster.accent:poster.accent2, left:`${(i*43+9)%100}%`, top:`${(i*71+15)%100}%`, opacity: 0.12 + (i%6)*0.07, boxShadow:`0 0 6px ${i%2===0?poster.accent:poster.accent2}` }}/>
            ))}
            {/* Forest glow from sides */}
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 40% 80% at 10% 60%, ${poster.accent}18 0%, transparent 60%)` }}/>
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 40% 80% at 90% 40%, ${poster.accent2}15 0%, transparent 60%)` }}/>
            {/* Volcano glow from bottom right */}
            <div style={{ position:'absolute', bottom:'-20px', right:'10%', width:'180px', height:'180px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent2}30 0%, transparent 70%)` }}/>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ position:'relative', width:'100%', height, background:poster.bg, overflow:'hidden', borderRadius:'inherit' }}>
      {/* Base atmosphere */}
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 80% 60% at 50% 30%, ${poster.accent}20 0%, transparent 65%)` }}/>

      {/* Pattern layer */}
      {renderPattern()}

      {/* Center hero emoji — large & dramatic */}
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', userSelect:'none' }}>
        <span style={{ fontSize:'5.5rem', filter:`drop-shadow(0 0 24px ${poster.accent}80)`, opacity:0.35, transform:'translateY(-10%)' }}>
          {poster.emoji}
        </span>
      </div>

      {/* Top accent bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg, transparent, ${poster.accent}, transparent)` }}/>

      {/* Bottom info gradient */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'68%', background:'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.7) 40%, transparent 100%)' }}/>
    </div>
  )
}

/* ─── Movie Card (landing grid) ────────────────────────────────── */
function MovieCard({ movie }) {
  const [hov, setHov] = useState(false)
  return (
    <Link to={`/movie/${movie.id}`} style={{ textDecoration:'none', display:'block' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{
        position:'relative', borderRadius:'14px', overflow:'hidden', aspectRatio:'2/3',
        border:`1px solid ${hov ? movie.poster.accent+'60' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hov ? `0 0 28px ${movie.poster.accent}25, 0 12px 40px rgba(0,0,0,0.7)` : '0 4px 20px rgba(0,0,0,0.5)',
        transform: hov ? 'translateY(-7px) scale(1.01)' : 'none',
        transition:'all 0.28s cubic-bezier(.22,.68,0,1.2)',
      }}>
        <CinemaPoster movie={movie} />

        {/* NEW badge */}
        {movie.isNew && (
          <div style={{ position:'absolute', top:'10px', left:'10px', background:'#e50914', color:'#fff', fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'4px', zIndex:3, letterSpacing:'0.05em' }}>NEW</div>
        )}
        {/* Rating */}
        <div style={{ position:'absolute', top:'10px', right:'10px', background:'rgba(0,0,0,0.85)', color:movie.poster.accent, fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'4px', border:`1px solid ${movie.poster.accent}50`, zIndex:3 }}>
          {movie.rating}
        </div>

        {/* Info overlay */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px', zIndex:3 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'3px' }}>
            <span style={{ color:'#fbbf24', fontSize:'10px', fontWeight:700 }}>⭐ {movie.imdb}</span>
            <span style={{ color:'#374151' }}>·</span>
            <span style={{ color:'#6b7280', fontSize:'10px' }}>{movie.duration}</span>
          </div>
          <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'#fff', fontSize:'12px', lineHeight:1.35, marginBottom:'3px' }}>{movie.title}</h3>
          <p style={{ color:movie.poster.accent, fontSize:'10px', marginBottom: hov?'10px':'0', transition:'margin 0.2s' }}>{movie.genre.slice(0,2).join(' · ')}</p>
          <div style={{ overflow:'hidden', maxHeight: hov?'40px':'0', transition:'max-height 0.25s ease', opacity: hov?1:0 }}>
            <div className="btn-book" style={{ padding:'6px 10px', fontSize:'11px', width:'100%', borderRadius:'9px', textAlign:'center', display:'block' }}>
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

  const handleClick = (e) => {
    e.preventDefault()
    if (onClick) onClick()
    else navigate('/user')
  }

  return (
    <div onClick={handleClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:'18px', overflow:'hidden', cursor:'pointer',
        background:hub.bg, border:`1px solid ${hov ? hub.accent+'50' : hub.border}`,
        boxShadow: hov ? `0 0 40px ${hub.accentDim}, 0 8px 32px rgba(0,0,0,0.5)` : '0 4px 24px rgba(0,0,0,0.35)',
        transform: hov ? 'translateY(-4px)' : 'none',
        transition:'all 0.25s ease',
      }}>
      <div style={{ padding:'22px 22px 18px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
          <span style={{ fontSize:'30px', lineHeight:1 }}>{hub.icon}</span>
          {hub.queueId ? (
            <div style={{ textAlign:'right' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', justifyContent:'flex-end', marginBottom:'2px' }}>
                <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:hub.accent, animation:'live-pulse 1.8s ease infinite' }}/>
                <span style={{ fontSize:'10px', fontWeight:700, color:hub.accent }}>LIVE</span>
              </div>
              <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'20px', color:hub.accent }}>{waiting}</span>
              <p style={{ fontSize:'10px', color:'#4b5563', marginTop:'1px' }}>in queue · ~{wait}m</p>
            </div>
          ) : (
            <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', background:hub.accentDim, color:hub.accent, border:`1px solid ${hub.border}` }}>OPEN</span>
          )}
        </div>
        <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'19px', color:'#fff', marginBottom:'5px' }}>{hub.title}</h3>
        <p style={{ fontSize:'13px', color:'#94a3b8', marginBottom:'14px', lineHeight:1.5 }}>{hub.desc}</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
          {hub.tags.map(t => (
            <span key={t} style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'8px', fontWeight:600, background:hub.accentDim, color:hub.accent, border:`1px solid ${hub.border}` }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ padding:'11px 22px', borderTop:`1px solid ${hub.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background: hov ? hub.accentDim : 'transparent', transition:'background 0.2s' }}>
        <span style={{ fontSize:'13px', fontWeight:700, color:hub.accent }}>{hub.cta}</span>
        <span style={{ fontSize:'16px', color:hub.accent, transform: hov ? 'translateX(4px)' : 'none', transition:'transform 0.2s' }}>→</span>
      </div>
    </div>
  )
}

/* ─── Hub Data ─────────────────────────────────────────────────── */
const HUBS = [
  { key:'movies',  icon:'🎬', title:'Movies',         cta:'Browse Movies',  desc:'Book cinema tickets at PVR, INOX & Cinépolis', accent:'#e50914', accentDim:'rgba(229,9,20,0.08)', border:'rgba(229,9,20,0.18)', bg:'linear-gradient(135deg,#140404 0%,#220808 100%)', tags:['Now Showing','IMAX · 3D · 4DX','Recliner · Gold'] },
  { key:'train',   icon:'🚆', title:'Train Tickets',  cta:'Book Seat',      desc:'Reserve seats, Tatkal booking & pass renewal', accent:'#4ade80', accentDim:'rgba(74,222,128,0.08)', border:'rgba(74,222,128,0.18)', bg:'linear-gradient(135deg,#061208 0%,#0a1e0d 100%)', tags:['Rajdhani · Shatabdi','Tatkal','Senior Pass'], queueId:'queue-train-001' },
  { key:'flight',  icon:'✈️', title:'Flight Services',cta:'Get Token',      desc:'Check-in, baggage, upgrades & rebooking', accent:'#38bdf8', accentDim:'rgba(56,189,248,0.08)', border:'rgba(56,189,248,0.18)', bg:'linear-gradient(135deg,#040e18 0%,#071525 100%)', tags:['Check-in','Seat Upgrade','Lost Baggage'], queueId:'queue-flight-001' },
  { key:'medical', icon:'🏥', title:'Medical OPD',    cta:'Get Token',      desc:'Doctor consultations, blood tests & diagnostics', accent:'#a78bfa', accentDim:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.18)', bg:'linear-gradient(135deg,#0c0814 0%,#140e20 100%)', tags:['OPD Walk-in','Blood Tests','Specialist'], queueId:'queue-clinic-001' },
]

/* ─── Divider & Section wrappers ───────────────────────────────── */
function Divider() {
  return (
    <div style={{ padding:'0 28px' }}>
      <div style={{ maxWidth:MAX_W, margin:'0 auto', height:'1px', background:'linear-gradient(to right,transparent,rgba(255,255,255,0.07),transparent)' }}/>
    </div>
  )
}

/* ─── Main ─────────────────────────────────────────────────────── */
export default function Landing() {
  const [queues, setQueues] = useState({})
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
      <section aria-label="Hero Section" style={{ padding:'120px 28px 64px' }}>
        <div style={{ maxWidth:MAX_W, margin:'0 auto' }}>

          {/* Heading */}
          <header style={{ textAlign:'center', marginBottom:'40px' }}>
            <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'52px', color:'#fff', margin:'0 0 16px', lineHeight:1.15, letterSpacing:'-0.02em' }}>
              What do you want to book today?
            </h1>
            <p style={{ fontSize:'15px', color:'#64748b', maxWidth:'420px', margin:'0 auto', lineHeight:1.65 }}>
              Movies, train, flights or hospital OPD — skip the queue, book your spot instantly.
            </p>
          </header>

          {/* 2×2 Hub cards — max 780px centered */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'16px', maxWidth:'780px', margin:'0 auto' }}>
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
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:'#fff', marginBottom:'3px' }}>🎬 Movies in Cinemas</h2>
              <p style={{ fontSize:'13px', color:'#4b5563' }}>PVR · INOX · Cinépolis · Miraj</p>
            </div>
            <Link to="/user" style={{ textDecoration:'none', fontSize:'13px', fontWeight:600, color:'#e50914' }}>See all →</Link>
          </div>

          {/* Filter chips */}
          <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'24px', overflowX:'auto', paddingBottom:'4px' }}>
            {['All Languages','Hindi','English','Tamil','Telugu'].map((l,i) => (
              <button key={l} style={{ flexShrink:0, padding:'5px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', background: i===0?'rgba(229,9,20,0.12)':'rgba(255,255,255,0.04)', color: i===0?'#f87171':'#475569', border: i===0?'1px solid rgba(229,9,20,0.25)':'1px solid rgba(255,255,255,0.06)' }}>{l}</button>
            ))}
            <div style={{ width:'1px', height:'14px', background:'rgba(255,255,255,0.09)', flexShrink:0, margin:'0 3px' }}/>
            {['All Formats','2D','3D','IMAX','4DX'].map((f,i) => (
              <button key={f} style={{ flexShrink:0, padding:'5px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', background: i===0?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.03)', color: i===0?'#e2e8f0':'#374151', border:'1px solid rgba(255,255,255,0.06)' }}>{f}</button>
            ))}
          </div>

          {/* Movie grid — 5 columns */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'16px' }}>
            {MOVIES.map(m => <MovieCard key={m.id} movie={m} />)}
            {/* Coming soon */}
            <div style={{ borderRadius:'14px', aspectRatio:'2/3', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', background:'rgba(255,255,255,0.015)', border:'1px dashed rgba(255,255,255,0.07)' }}>
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
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:'#fff', marginBottom:'3px' }}>🎟️ Live Service Counters</h2>
              <p style={{ fontSize:'13px', color:'#4b5563' }}>Get a virtual token — track your spot from your phone</p>
            </div>
            <Link to="/user" className="btn-book" style={{ padding:'9px 20px', fontSize:'13px', textDecoration:'none' }}>Get Token →</Link>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
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
                      <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'17px', color:'#fff', marginBottom:'3px' }}>{s.name}</h3>
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
                      <div style={{ height:'3px', borderRadius:'3px', background:'rgba(255,255,255,0.05)' }}>
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
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'22px 28px' }}>
        <div style={{ maxWidth:MAX_W, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'linear-gradient(135deg, #e50914, #ff4040)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, color:'#fff', fontSize:'14px' }}>W</span>
            </div>
            <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, color:'#fff', fontSize:'15px', letterSpacing:'0.05em' }}>WAITLESS</span>
            <span style={{ color:'#374151', fontSize:'13px' }}>· Built for India 🇮🇳</span>
          </div>
          <div style={{ display:'flex', gap:'24px', fontSize:'12px', color:'#374151' }}>
            <span>Powered by <span style={{ color:'#e50914' }}>Gemini AI</span></span>
            <span>Real-time via Socket.io</span>
          </div>
        </div>
      </div>
    </div>
  )
}
