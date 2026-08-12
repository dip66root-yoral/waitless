import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { queuesAPI, tokensAPI, getSocket } from '../api/client.js'
import confetti from 'canvas-confetti'
import { useToast } from '../context/ToastContext.jsx'
import QueueProgress from '../components/QueueProgress.jsx'
import { StepperBar } from '../components/StepperBar.jsx'
import { LiveTicket } from '../components/LiveTicket.jsx'

const STEPS = ['Service', 'Details', 'Confirm', 'Track']

const SERVICE_OPTIONS = {
  'queue-movies-001': ['Ticket Collection', 'Snacks', 'Seat Upgrade', 'General Enquiry'],
  'queue-clinic-001': ['Consultation', 'Follow-up', 'Emergency', 'Lab Test'],
  'queue-train-001': ['New Booking', 'Cancellation', 'Tatkal', 'Enquiry'],
  'queue-flight-001': ['Check-in', 'Baggage Drop', 'Rebooking', 'Upgrades'],
  'queue-stadium-eden': ['Match Entry', 'VIP Box', 'Food & Beverage', 'Merchandise'],
  'queue-stadium-modi': ['Match Entry', 'VIP Box', 'Food & Beverage', 'Merchandise'],
  'queue-stadium-wankhede': ['Match Entry', 'VIP Box', 'Food & Beverage', 'Merchandise'],
  'queue-stadium-saltlake': ['Match Entry', 'VIP Box', 'Food & Beverage', 'Merchandise'],
  'queue-stadium-oldtrafford': ['Match Entry', 'Sir Alex Stand', 'Food & Beverage', 'Merchandise'],
  'queue-match-manu-city': ['Match Entry', 'VIP Box', 'Food & Beverage', 'Merchandise'],
  'queue-match-che-liv': ['Match Entry', 'VIP Box', 'Food & Beverage', 'Merchandise'],
  'queue-match-barca-real': ['Match Entry', 'VIP Box', 'Food & Beverage', 'Merchandise'],
  'queue-match-ind-aus': ['Match Entry', 'VIP Box', 'Food & Beverage', 'Merchandise'],
  'queue-match-ind-sa': ['Match Entry', 'VIP Box', 'Food & Beverage', 'Merchandise'],
  'queue-match-csk-mi': ['Match Entry', 'VIP Box', 'Food & Beverage', 'Merchandise'],
}
const META = {
  'queue-movies-001': { icon:'🎬', accent:'#e50914', accentDim:'rgba(229,9,20,0.08)', border:'rgba(229,9,20,0.2)',   bg:'linear-gradient(135deg,#140404,#220808)', label:'Cinema',  examples:['Collect 2 IMAX tickets for Spider-Man 7:45 PM','Group booking 5 seats KGF 3 Sunday evening','Seat upgrade Recliner Avatar 4DX show tonight'] },
  'queue-clinic-001': { icon:'🏥', accent:'#a78bfa', accentDim:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.2)', bg:'linear-gradient(135deg,#0c0814,#140e20)', label:'Medical', examples:['Blood test not urgent, walk-in','Urgent chest pain, emergency','Diabetes follow-up with cardiologist'] },
  'queue-train-001':  { icon:'🚆', accent:'#4ade80', accentDim:'rgba(74,222,128,0.08)',  border:'rgba(74,222,128,0.2)',  bg:'linear-gradient(135deg,#061208,#0a1e0d)', label:'Railway', examples:['Book 2 seats Rajdhani Delhi to Mumbai 3AC','Cancel PNR 4521893476 need refund','Tatkal booking Mumbai to Hyderabad tomorrow'] },
  'queue-flight-001': { icon:'✈️', accent:'#38bdf8', accentDim:'rgba(56,189,248,0.08)',  border:'rgba(56,189,248,0.2)',  bg:'linear-gradient(135deg,#040e18,#071525)', label:'Airport',  examples:['Check-in IndiGo 6E-204 Delhi, 2 bags','Missed flight, urgent rebooking needed','Upgrade to business class Air India'] },
  'queue-stadium-eden': { icon:'🏟️', accent:'#38bdf8', accentDim:'rgba(56,189,248,0.08)', border:'rgba(56,189,248,0.2)', bg:'linear-gradient(135deg,#040e18,#071525)', label:'Eden Gardens', examples:['VIP Box Entry for KKR match','Pre-booked snacks collection','Merchandise pickup'] },
  'queue-stadium-modi': { icon:'🏟️', accent:'#f59e0b', accentDim:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)', bg:'linear-gradient(135deg,#120904,#1a1006)', label:'Modi Stadium', examples:['General Gallery Entry Gate 4','Collect pre-booked India jersey','Food pickup'] },
  'queue-stadium-wankhede': { icon:'🏟️', accent:'#e50914', accentDim:'rgba(229,9,20,0.08)', border:'rgba(229,9,20,0.2)', bg:'linear-gradient(135deg,#140404,#220808)', label:'Wankhede', examples:['VIP Box Entry for MI match','Snacks collection','Merchandise pickup'] },
  'queue-stadium-saltlake': { icon:'⚽', accent:'#22c55e', accentDim:'rgba(34,197,94,0.08)', border:'rgba(34,197,94,0.2)', bg:'linear-gradient(135deg,#061208,#0a1e0d)', label:'Salt Lake Stadium', examples:['VIP Box Entry for Mohun Bagan match','Merchandise pickup'] },
  'queue-stadium-oldtrafford': { icon:'⚽', accent:'#e50914', accentDim:'rgba(229,9,20,0.08)', border:'rgba(229,9,20,0.2)', bg:'linear-gradient(135deg,#140404,#220808)', label:'Old Trafford', examples:['Sir Alex Stand Entry','Merchandise pickup'] },
  'queue-match-manu-city': { icon:'⚽', accent:'#e50914', accentDim:'rgba(229,9,20,0.08)', border:'rgba(229,9,20,0.2)', bg:'linear-gradient(135deg,#140404,#220808)', label:'Man U vs City', examples:['VIP Box Entry','Food pickup'] },
  'queue-match-che-liv': { icon:'⚽', accent:'#2563eb', accentDim:'rgba(37,99,235,0.08)', border:'rgba(37,99,235,0.2)', bg:'linear-gradient(135deg,#040e18,#071525)', label:'Chelsea vs Liverpool', examples:['General Entry Gate 2','Merchandise pickup'] },
  'queue-match-barca-real': { icon:'⚽', accent:'#9333ea', accentDim:'rgba(147,51,234,0.08)', border:'rgba(147,51,234,0.2)', bg:'linear-gradient(135deg,#0c0814,#140e20)', label:'Barca vs Real', examples:['VIP Box Entry','Food pickup'] },
  'queue-match-ind-aus': { icon:'🏏', accent:'#f59e0b', accentDim:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)', bg:'linear-gradient(135deg,#120904,#1a1006)', label:'IND vs AUS', examples:['General Gallery Entry Gate 4','Merchandise pickup'] },
  'queue-match-ind-sa': { icon:'🏏', accent:'#38bdf8', accentDim:'rgba(56,189,248,0.08)', border:'rgba(56,189,248,0.2)', bg:'linear-gradient(135deg,#040e18,#071525)', label:'IND vs SA', examples:['VIP Box Entry','Food pickup'] },
  'queue-match-csk-mi': { icon:'🏏', accent:'#eab308', accentDim:'rgba(234,179,8,0.08)', border:'rgba(234,179,8,0.2)', bg:'linear-gradient(135deg,#141004,#221a08)', label:'CSK vs MI', examples:['General Entry','Merchandise pickup'] },
}

const URGENCY = {
  high:   { color:'#f87171', label:'High Priority',   bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.25)' },
  medium: { color:'#fbbf24', label:'Standard',        bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.25)' },
  low:    { color:'#4ade80', label:'Low Priority',    bg:'rgba(34,197,94,0.1)',   border:'rgba(34,197,94,0.25)' },
}

const SERVICE_INFO = {
  'queue-movies-001': { hours:'9:00 AM – 11:30 PM', avgTime:'~5 min', bring:['Booking ID / QR code','Valid photo ID','UPI / Card'], tip:'Collect tickets at least 15 mins before showtime.' },
  'queue-clinic-001': { hours:'8:00 AM – 8:00 PM',  avgTime:'~15 min', bring:['Aadhaar / ID proof','Previous reports','Insurance card'], tip:'Urgent cases are automatically prioritized by AI.' },
  'queue-train-001':  { hours:'6:00 AM – 10:00 PM', avgTime:'~12 min', bring:['PNR number / ticket','Aadhaar / ID','Payment method'], tip:'Tatkal bookings open 24 hrs before departure.' },
  'queue-flight-001': { hours:'24 hours',            avgTime:'~10 min', bring:['PNR / booking ref','Passport / Aadhaar','Baggage receipt'], tip:'Web check-in closes 1 hr before domestic flights.' },
  'queue-stadium-eden': { hours:'Match Days Only', avgTime:'~3 min', bring:['Match Ticket','Valid ID','Clear Bag'], tip:'Gates open 3 hours before the match starts.' },
  'queue-stadium-modi': { hours:'Match Days Only', avgTime:'~5 min', bring:['Match Ticket','Valid ID','Clear Bag'], tip:'Use the designated gate mentioned on your ticket.' },
  'queue-stadium-wankhede': { hours:'Match Days Only', avgTime:'~4 min', bring:['Match Ticket','Valid ID','Clear Bag'], tip:'Parking is limited, use public transport.' },
  'queue-stadium-saltlake': { hours:'Match Days Only', avgTime:'~6 min', bring:['Match Ticket','Valid ID','Clear Bag'], tip:'Arrive early for smooth entry.' },
  'queue-stadium-oldtrafford': { hours:'Match Days Only', avgTime:'~4 min', bring:['Match Ticket','Valid ID','Clear Bag'], tip:'Use the designated gate mentioned on your ticket.' },
  'queue-match-manu-city': { hours:'Match Days Only', avgTime:'~3 min', bring:['Match Ticket','Valid ID'], tip:'Arrive 2 hours early.' },
  'queue-match-che-liv': { hours:'Match Days Only', avgTime:'~3 min', bring:['Match Ticket','Valid ID'], tip:'Arrive 2 hours early.' },
  'queue-match-barca-real': { hours:'Match Days Only', avgTime:'~3 min', bring:['Match Ticket','Valid ID'], tip:'Arrive 2 hours early.' },
  'queue-match-ind-aus': { hours:'Match Days Only', avgTime:'~3 min', bring:['Match Ticket','Valid ID'], tip:'Arrive 2 hours early.' },
  'queue-match-ind-sa': { hours:'Match Days Only', avgTime:'~3 min', bring:['Match Ticket','Valid ID'], tip:'Arrive 2 hours early.' },
  'queue-match-csk-mi': { hours:'Match Days Only', avgTime:'~3 min', bring:['Match Ticket','Valid ID'], tip:'Arrive 2 hours early.' },
}

function ServiceInfoCard({ meta, selected }) {
  const info = SERVICE_INFO[selected?.id]
  if (!info || !meta) return null
  return (
    <div style={{ borderRadius:'14px', padding:'16px', background:'rgba(255,255,255,0.02)', border:`1px solid ${meta.border}`, marginBottom:'18px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
        <div style={{ padding:'11px', borderRadius:'10px', background:'rgba(255,255,255,0.03)' }}>
          <p style={{ fontSize:'10px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>🕐 Hours</p>
          <p style={{ fontSize:'13px', color:'#e2e8f0', fontWeight:600, margin:0 }}>{info.hours}</p>
        </div>
        <div style={{ padding:'11px', borderRadius:'10px', background:'rgba(255,255,255,0.03)' }}>
          <p style={{ fontSize:'10px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>⏱ Avg. Time</p>
          <p style={{ fontSize:'13px', color: meta.accent, fontWeight:700, margin:0 }}>{info.avgTime} per person</p>
        </div>
      </div>
      <div style={{ marginBottom:'12px' }}>
        <p style={{ fontSize:'10px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>📋 What to Bring</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
          {info.bring.map(b => (
            <span key={b} style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'8px', color:'#94a3b8', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>{b}</span>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'10px 12px', borderRadius:'10px', background:`${meta.accent}0a`, border:`1px solid ${meta.border}` }}>
        <span style={{ fontSize:'14px', flexShrink:0 }}>💡</span>
        <p style={{ fontSize:'12px', color:'#94a3b8', margin:0, lineHeight:1.5 }}>{info.tip}</p>
      </div>
    </div>
  )
}

/* ─── Shared layout wrapper ────────────────────────────────────── */
function Page({ children }) {
  return (
    <main className="app-bg" style={{ minHeight:'100vh', paddingTop:'60px' }}>
      <div style={{ maxWidth:'560px', margin:'0 auto', padding:'40px 20px 80px' }}>
        {children}
      </div>
    </main>
  )
}

/* ─── Removed StepPill ─────────────────────────────────────────── */

/* ─── Back button ──────────────────────────────────────────────── */
function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:'6px', color:'#475569', fontSize:'13px', fontWeight:500, background:'none', border:'none', cursor:'pointer', marginBottom:'28px', padding:0 }}>
      <span style={{ fontSize:'16px' }}>←</span> Back
    </button>
  )
}

/* ─── Main component ───────────────────────────────────────────── */
export default function UserView() {
  const { queueId: urlQueueId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { user } = useAuth()
  const [step, setStep] = useState('select')
  const [queues, setQueues] = useState([])
  const [selected, setSelected] = useState(null)
  const [meta, setMeta] = useState(null)
  const [requestText, setRequestText] = useState('')
  const [userName, setUserName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [serviceType, setServiceType] = useState('')
  const [urgency, setUrgency] = useState('medium')
  const [myToken, setMyToken] = useState(null)
  const [liveToken, setLiveToken] = useState(null)
  const [queueData, setQueueData] = useState(null)
  const [isTurn, setIsTurn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const socketRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    document.title = 'Book Now — WAITLESS'
    queuesAPI.list().then(r => {
      const list = r.data || []
      setQueues(list.filter(q => !q.id.startsWith('queue-stadium') && !q.id.startsWith('queue-match')))
      // Auto-select queue if queueId is in URL
      if (urlQueueId) {
        const q = list.find(x => x.id === urlQueueId)
        if (q) {
          const m = META[q.id] || { icon:'🏢', accent:'#94a3b8', accentDim:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)', bg:'linear-gradient(135deg,#111218,#1a1b23)' }
          setSelected(q); setMeta(m); setStep('request')
        }
      }
    }).catch(() => addToast('Could not load services', 'error'))
    return () => {
      clearInterval(pollRef.current)
      if (socketRef.current) { socketRef.current.off('queue:updated'); socketRef.current.off('your:turn') }
    }
  }, [])

  function handleNext() {
    if (!serviceType) return addToast('Please select a service option', 'warning')
    setStep('confirm')
  }

  async function handleBook() {
    if (!userName.trim()) return addToast('Please enter your name', 'warning')
    setIsLoading(true)
    try {
      const res = await tokensAPI.create({
        queue_id: selected.id, user_name: userName.trim(), phone: phone.trim() || undefined,
        request_text: requestText, service_type: serviceType, urgency: urgency,
        request_category: 'walk-in',
        estimated_service_duration: 10, notes: requestText,
      })
      const token = res.data
      setMyToken(token); setLiveToken(token); setStep('tracking')
      addToast(`Booking confirmed! Token ${token.token_number}`, 'success')
      
      // WOW Factor: Confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#e50914', '#ff4040', '#ffffff']
      })
      const socket = getSocket()
      socketRef.current = socket
      socket.emit('join:queue', token.queue_id)
      socket.emit('join:token', token.id)
      socket.on('queue:updated', () => refreshToken(token.id, token.queue_id))
      socket.on('your:turn', () => { setIsTurn(true); addToast(`🎉 It's your turn! Token ${token.token_number}`, 'success', 12000) })
      pollRef.current = setInterval(() => refreshToken(token.id, token.queue_id), 5000)
      refreshToken(token.id, token.queue_id)
    } catch (err) { addToast(err.error || 'Booking failed', 'error') }
    finally { setIsLoading(false) }
  }

  const refreshToken = useCallback(async (tid, qid) => {
    try {
      const [tr, qr] = await Promise.all([tokensAPI.get(tid), tokensAPI.getByQueue(qid)])
      setLiveToken(tr.data.token); setQueueData(qr.data)
      if (tr.data.token.status === 'in-progress') setIsTurn(true)
    } catch {}
  }, [])

  function reset() {
    setStep('select'); setSelected(null); setMeta(null); setRequestText(''); setUserName(''); setPhone('')
    setServiceType(''); setUrgency('medium'); setMyToken(null); setLiveToken(null); setQueueData(null); setIsTurn(false)
    clearInterval(pollRef.current)
    if (socketRef.current) { socketRef.current.off('queue:updated'); socketRef.current.off('your:turn') }
  }

  /* ── STEP 1: Select service ─────────────────────────────────── */
  if (step === 'select') return (
    <Page>
      <StepperBar steps={STEPS} currentStep={0} />
      <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:'#fff', marginBottom:'4px', letterSpacing:'-0.01em' }}>Choose a Service</h1>
      <p style={{ fontSize:'13px', color:'#4b5563', marginBottom:'28px' }}>Select the counter you want to book your spot at</p>

      {queues.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height:'82px', borderRadius:'18px' }} />)}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {queues.map((q, i) => {
            const m = META[q.id] || { icon:'🏢', accent:'#94a3b8', accentDim:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)', bg:'linear-gradient(135deg,#111218,#1a1b23)' }
            const waiting = q.stats?.waiting_count ?? 0
            const wait = waiting * (q.avg_service_time ?? 10)
            return (
              <button key={q.id} onClick={() => { setSelected(q); setMeta(m); setStep('request') }}
                style={{ width:'100%', textAlign:'left', borderRadius:'18px', overflow:'hidden', border:`1px solid ${m.border}`, background:m.bg, cursor:'pointer', transition:'all 0.28s cubic-bezier(0.22,1,0.36,1)', position:'relative' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${m.accent}40` }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'18px 20px' }}>
                  {/* Icon */}
                  <div style={{ width:'50px', height:'50px', borderRadius:'14px', background:`${m.accent}12`, border:`1px solid ${m.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0, boxShadow:`0 4px 16px ${m.accent}15` }}>
                    {m.icon}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                      <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'15px', color:'#fff', margin:0, letterSpacing:'-0.01em' }}>{q.service_name}</h3>
                      <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'20px', background:'rgba(239,68,68,0.12)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)', flexShrink:0, letterSpacing:'0.06em' }}>LIVE</span>
                    </div>
                    <p style={{ fontSize:'12px', color:'#374151', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{q.description}</p>
                  </div>
                  {/* Stats */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:m.accent, margin:0, lineHeight:1 }}>{waiting}</p>
                    <p style={{ fontSize:'10px', color:'#374151', margin:'3px 0 0', fontWeight:600 }}>~{wait}m wait</p>
                  </div>
                  <span style={{ color:'#2d3748', fontSize:'18px', flexShrink:0 }}>›</span>
                </div>
                {/* Bottom accent bar */}
                <div style={{ height:'2px', background:`linear-gradient(90deg,${m.accent}40,${m.accent},${m.accent}40)`, width:`${Math.max(Math.min((waiting/8)*100,100), 15)}%`, transition:'width 0.8s ease', opacity: 0.8 }}/>
              </button>
            )
          })}
          
          {/* Hardcoded Sports Counter */}
          <button onClick={() => navigate('/stadiums')}
            style={{ width:'100%', textAlign:'left', borderRadius:'18px', overflow:'hidden', border:`1px solid rgba(245,158,11,0.2)`, background:'linear-gradient(135deg,#120904,#1a1006)', cursor:'pointer', transition:'all 0.28s cubic-bezier(0.22,1,0.36,1)' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.4)` }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'18px 20px' }}>
              <div style={{ width:'50px', height:'50px', borderRadius:'14px', background:`rgba(245,158,11,0.1)`, border:`1px solid rgba(245,158,11,0.2)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0, boxShadow:`0 4px 16px rgba(245,158,11,0.1)` }}>
                🏟️
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                  <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'15px', color:'#fff', margin:0, letterSpacing:'-0.01em' }}>Stadiums &amp; Live Matches</h3>
                  <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'20px', background:'rgba(245,158,11,0.12)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.22)', flexShrink:0, letterSpacing:'0.06em' }}>HOT</span>
                </div>
                <p style={{ fontSize:'12px', color:'#374151', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Book VIP box entries for live cricket & football events</p>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ fontSize:'11px', color:'#4b5563', margin:'2px 0 0', fontWeight:600 }}>View Matches</p>
              </div>
              <span style={{ color:'#2d3748', fontSize:'18px', flexShrink:0 }}>›</span>
            </div>
            <div style={{ height:'2px', background:`linear-gradient(90deg,rgba(245,158,11,0.3),#f59e0b,rgba(245,158,11,0.3))`, width:`100%`, opacity: 0.7 }}/>
          </button>
        </div>
      )}
    </Page>
  )

  /* ── STEP 2: Describe request ───────────────────────────────── */
  if (step === 'request') {
    const options = SERVICE_OPTIONS[selected?.id] || ['General Enquiry', 'Other']
    return (
      <Page>
        <BackBtn onClick={() => setStep('select')} />
        <StepperBar steps={STEPS} currentStep={1} />
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:'#fff', marginBottom:'6px' }}>Service Details</h1>
        <p style={{ fontSize:'14px', color:'#64748b', marginBottom:'24px' }}>Please select the type of service you need</p>

        {/* Selected service chip */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 18px', borderRadius:'16px', background:meta?.accentDim, border:`1px solid ${meta?.border}`, marginBottom:'24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, width:'4px', height:'100%', background:meta?.accent }}/>
          <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:`${meta?.accent}15`, border:`1px solid ${meta?.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0, boxShadow:`0 4px 12px ${meta?.accentDim}` }}>
            {meta?.icon}
          </div>
          <div>
            <p style={{ fontWeight:800, color:'#fff', fontSize:'15px', margin:0, letterSpacing:'-0.01em' }}>{selected?.service_name}</p>
            <p style={{ fontSize:'12px', color:'#94a3b8', margin:0 }}>{selected?.stats?.waiting_count ?? 0} ahead · ~{(selected?.stats?.waiting_count ?? 0) * (selected?.avg_service_time ?? 10)}m wait</p>
          </div>
          <button aria-label="Change service" onClick={() => setStep('select')} style={{ marginLeft:'auto', fontSize:'12px', color:meta?.accent, background:'rgba(255,255,255,0.05)', padding:'6px 12px', borderRadius:'8px', border:`1px solid rgba(255,255,255,0.1)`, cursor:'pointer', fontWeight:700, transition:'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>Change</button>
        </div>

        {/* Service Type Pills */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'flex', alignItems:'center', gap:'8px', fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:meta?.accent }}/>
            What do you need?
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {options.map(opt => (
              <button key={opt} onClick={() => setServiceType(opt)} style={{
                padding: '12px 18px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
                background: serviceType === opt ? `${meta?.accent}15` : 'rgba(255,255,255,0.03)',
                color: serviceType === opt ? '#fff' : '#94a3b8',
                border: serviceType === opt ? `1px solid ${meta?.accent}` : '1px solid rgba(255,255,255,0.06)',
                boxShadow: serviceType === opt ? `0 8px 24px ${meta?.accentDim}` : 'none'
              }} onMouseEnter={e => { if(serviceType!==opt) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)' } }} onMouseLeave={e => { if(serviceType!==opt) { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.06)' } }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Urgency Pills */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'flex', alignItems:'center', gap:'8px', fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#f87171' }}/>
            Priority Level
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {Object.entries(URGENCY).map(([key, u]) => (
              <button key={key} onClick={() => setUrgency(key)} style={{
                padding: '14px', borderRadius: '14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)', textAlign: 'center',
                background: urgency === key ? u.bg : 'rgba(255,255,255,0.03)',
                color: urgency === key ? u.color : '#94a3b8',
                border: urgency === key ? `1px solid ${u.border}` : '1px solid rgba(255,255,255,0.06)',
                boxShadow: urgency === key ? `0 8px 24px ${u.bg}` : 'none'
              }} onMouseEnter={e => { if(urgency!==key) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)' } }} onMouseLeave={e => { if(urgency!==key) { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.06)' } }}>
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea (Optional) */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Additional Notes (Optional)</label>
          <section aria-label="Request input form" style={{ borderRadius:'14px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.03)', overflow:'hidden' }}>
            <textarea
              rows={3}
              value={requestText}
              onChange={e => setRequestText(e.target.value)}
              placeholder="Any specific requests?"
              style={{ width:'100%', background:'transparent', border:'none', outline:'none', padding:'16px', fontSize:'14px', color:'#e2e8f0', resize:'none', fontFamily:'Inter,sans-serif', lineHeight:1.6 }}
            />
          </section>
        </div>

        {/* Service info card */}
        <ServiceInfoCard meta={meta} selected={selected} />

        <button onClick={handleNext} disabled={!serviceType} className="btn-book"
          style={{ width:'100%', padding:'14px', fontSize:'15px', opacity: !serviceType ? 0.5 : 1 }}>
          Continue to Confirmation →
        </button>
      </Page>
    )
  }

  /* ── STEP 3: Confirm ────────────────────────────────────────── */
  if (step === 'confirm') {
    const urg = URGENCY[urgency] || URGENCY.medium
    return (
      <Page>
        <BackBtn onClick={() => setStep('request')} />
        <StepperBar steps={STEPS} currentStep={2} />
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:'#fff', marginBottom:'6px' }}>Review & Confirm</h1>
        <p style={{ fontSize:'14px', color:'#64748b', marginBottom:'24px' }}>Please check your details and confirm to get your token</p>

        {/* Booking Details card */}
        <div style={{ borderRadius:'18px', padding:'24px', background:`linear-gradient(135deg, rgba(17,18,24,0.9), rgba(20,21,30,0.95))`, border:`1px solid ${urg.border}`, marginBottom:'16px', position:'relative', overflow:'hidden', boxShadow:`0 16px 40px rgba(0,0,0,0.4)` }}>
          <div style={{ position:'absolute', top:0, right:0, width:'150px', height:'150px', background:urg.color, filter:'blur(100px)', opacity:0.1, pointerEvents:'none' }}/>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', paddingBottom:'16px', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:'20px' }}>
            <span style={{ fontSize:'20px' }}>📋</span>
            <span style={{ fontWeight:800, color:'#fff', fontSize:'16px' }}>Booking Summary</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            {[
              { label:'Service',  val: serviceType },
              { label:'Priority', val: urg.label, color: urg.color, bg: urg.bg },
              { label:'Category', val: 'Walk-in' },
              { label:'Wait Time', val: `~${(selected?.stats?.waiting_count ?? 0) * (selected?.avg_service_time ?? 10)}m` },
            ].map(({ label, val, color, bg }) => (
              <div key={label} style={{ padding:'14px', borderRadius:'14px', background: bg || 'rgba(255,255,255,0.02)', border: bg ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize:'10px', color:'#64748b', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' }}>{label}</p>
                <p style={{ fontSize:'15px', fontWeight:800, color: color || '#f8fafc', margin:0 }}>{val}</p>
              </div>
            ))}
            {requestText && (
              <div style={{ gridColumn:'1/-1', padding:'14px', borderRadius:'14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize:'10px', color:'#64748b', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' }}>Notes</p>
                <p style={{ fontSize:'14px', color:'#cbd5e1', fontStyle:'italic', margin:0, lineHeight:1.5 }}>"{requestText}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Your details */}
        <div style={{ borderRadius:'18px', padding:'24px', background:'rgba(14,16,26,0.5)', border:'1px solid rgba(255,255,255,0.05)', marginBottom:'20px' }}>
          <p style={{ fontSize:'11px', color:'#64748b', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'16px' }}>Your Details</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#94a3b8', marginBottom:'8px' }}>Full Name <span style={{ color:'#e50914' }}>*</span></label>
              <input className="input-field" style={{ padding:'14px 16px', borderRadius:'12px', background:'rgba(255,255,255,0.03)' }} placeholder="Enter your full name" value={userName} onChange={e => setUserName(e.target.value)} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#94a3b8', marginBottom:'8px' }}>Phone (optional)</label>
              <input className="input-field" style={{ padding:'14px 16px', borderRadius:'12px', background:'rgba(255,255,255,0.03)' }} placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
        </div>

        <button onClick={handleBook} disabled={isLoading || !userName.trim()} className="btn-book"
          style={{ width:'100%', padding:'14px', fontSize:'15px' }}>
          {isLoading
            ? <span style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'center' }}><span style={{ width:'16px', height:'16px', borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'spin 0.8s linear infinite', display:'block' }}/>Booking…</span>
            : '🎟️ Confirm & Get Token'}
        </button>
      </Page>
    )
  }

  /* ── STEP 4: Tracking ───────────────────────────────────────── */
  if (step === 'tracking' && liveToken) {
    const status = liveToken.status
    const isServing = status === 'in-progress'
    const isDone = status === 'done'
    const isSkipped = status === 'skipped'
    const waitingList = queueData?.tokens?.filter(t => t.status === 'waiting') || []
    const m = meta || META[liveToken.queue_id] || {}

    return (
      <Page>
        <StepperBar steps={STEPS} currentStep={3} />
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:'#fff', marginBottom:'24px' }}>Track Your Booking</h1>

        {/* Your turn banner */}
        {(isTurn || isServing) && (
          <div style={{ borderRadius:'18px', padding:'24px', textAlign:'center', background:'linear-gradient(135deg,#0d1f0d,#0a2e0a)', border:'1px solid rgba(74,222,128,0.4)', boxShadow:'0 0 40px rgba(74,222,128,0.2)', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', background:'#4ade80' }}/>
            <div style={{ fontSize:'3rem', marginBottom:'10px', animation:'pulse-dot 2s infinite' }}>🎉</div>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:'#fff', marginBottom:'5px', letterSpacing:'-0.01em' }}>It's Your Turn!</h2>
            <p style={{ fontSize:'15px', color:'#4ade80', fontWeight:700 }}>Please proceed to the counter now</p>
          </div>
        )}

        {/* Ticket */}
        <div style={{ marginBottom: '24px' }}>
          <LiveTicket token={liveToken} meta={meta} queueData={queueData} />
        </div>

        {/* Queue list */}
        {!isDone && !isSkipped && waitingList.length > 0 && (
          <div style={{ borderRadius:'18px', padding:'20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', marginBottom:'20px' }}>
            <p style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'11px', color:'#64748b', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'16px' }}>
              <span style={{ fontSize:'14px' }}>👥</span> Queue Position
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {waitingList.slice(0, 5).map((t, i) => {
                const isMe = t.id === liveToken.id
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderRadius:'14px', background: isMe ? (m.accentDim || 'rgba(56,189,248,0.08)') : 'rgba(255,255,255,0.03)', border: isMe ? `1px solid ${m.border || 'rgba(56,189,248,0.2)'}` : '1px solid transparent', boxShadow: isMe ? `0 8px 24px ${m.accentDim}` : 'none', transform: isMe ? 'scale(1.02)' : 'none', transition:'all 0.2s', position: isMe ? 'relative' : 'static', zIndex: isMe ? 2 : 1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <span style={{ width:'26px', height:'26px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:800, background: isMe ? (m.accent || '#38bdf8') : '#1f2937', color: isMe ? '#000' : '#6b7280' }}>{i+1}</span>
                      <span style={{ fontFamily:'monospace', fontSize:'15px', fontWeight:800, color: isMe ? (m.accent || '#38bdf8') : '#94a3b8' }}>{t.token_number}</span>
                      {isMe && <span style={{ fontSize:'11px', fontWeight:800, color:m.accent, background:`${m.accent}15`, padding:'2px 8px', borderRadius:'99px' }}>← You</span>}
                    </div>
                    <span style={{ fontSize:'10px', padding:'3px 10px', borderRadius:'8px', fontWeight:800, background: t.urgency==='high'?'rgba(239,68,68,0.12)':t.urgency==='medium'?'rgba(245,158,11,0.12)':'rgba(34,197,94,0.12)', color: t.urgency==='high'?'#f87171':t.urgency==='medium'?'#fbbf24':'#4ade80', border:`1px solid ${t.urgency==='high'?'rgba(239,68,68,0.2)':t.urgency==='medium'?'rgba(245,158,11,0.2)':'rgba(34,197,94,0.2)'}` }}>{t.urgency}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(isDone || isSkipped) && (
          <div style={{ borderRadius:'18px', padding:'40px 24px', textAlign:'center', background:'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border:'1px solid rgba(255,255,255,0.08)', marginBottom:'20px', backdropFilter:'blur(10px)' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:'16px' }}>{isDone ? '✅' : '⏭️'}</div>
            <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:'#fff', marginBottom:'8px', letterSpacing:'-0.01em' }}>{isDone ? 'Booking Complete!' : 'Token Skipped'}</h3>
            <p style={{ fontSize:'15px', color:'#94a3b8', marginBottom:'32px' }}>{isDone ? 'Thank you for using WAITLESS.' : 'Please approach the counter directly.'}</p>
            <button onClick={reset} className="btn-book" style={{ padding:'14px 36px', fontSize:'15px', borderRadius:'99px' }}>Book Another Slot</button>
          </div>
        )}

        <p style={{ textAlign:'center', fontSize:'12px', color:'#1f2937', marginTop:'8px' }}>Live updates via Socket.io · Refreshes every 5s</p>
      </Page>
    )
  }

  return null
}
