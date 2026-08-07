import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { queuesAPI, tokensAPI, geminiAPI, getSocket } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import QueueProgress from '../components/QueueProgress.jsx'

/* ─── Service metadata ─────────────────────────────────────────── */
const META = {
  'queue-movies-001': { icon:'🎬', accent:'#e50914', accentDim:'rgba(229,9,20,0.08)', border:'rgba(229,9,20,0.2)',   bg:'linear-gradient(135deg,#140404,#220808)', label:'Cinema',  examples:['Collect 2 IMAX tickets for Spider-Man 7:45 PM','Group booking 5 seats KGF 3 Sunday evening','Seat upgrade Recliner Avatar 4DX show tonight'] },
  'queue-clinic-001': { icon:'🏥', accent:'#a78bfa', accentDim:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.2)', bg:'linear-gradient(135deg,#0c0814,#140e20)', label:'Medical', examples:['Blood test not urgent, walk-in','Urgent chest pain, emergency','Diabetes follow-up with cardiologist'] },
  'queue-train-001':  { icon:'🚆', accent:'#4ade80', accentDim:'rgba(74,222,128,0.08)',  border:'rgba(74,222,128,0.2)',  bg:'linear-gradient(135deg,#061208,#0a1e0d)', label:'Railway', examples:['Book 2 seats Rajdhani Delhi to Mumbai 3AC','Cancel PNR 4521893476 need refund','Tatkal booking Mumbai to Hyderabad tomorrow'] },
  'queue-flight-001': { icon:'✈️', accent:'#38bdf8', accentDim:'rgba(56,189,248,0.08)',  border:'rgba(56,189,248,0.2)',  bg:'linear-gradient(135deg,#040e18,#071525)', label:'Airport',  examples:['Check-in IndiGo 6E-204 Delhi, 2 bags','Missed flight, urgent rebooking needed','Upgrade to business class Air India'] },
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
    <div className="app-bg" style={{ minHeight:'100vh', paddingTop:'60px' }}>
      <div style={{ maxWidth:'560px', margin:'0 auto', padding:'40px 20px 80px' }}>
        {children}
      </div>
    </div>
  )
}

/* ─── Step pill ────────────────────────────────────────────────── */
function StepPill({ step, total, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
        {[...Array(total)].map((_,i) => (
          <div key={i} style={{ width: i < step ? '20px' : '7px', height:'7px', borderRadius:'4px', background: i < step ? '#e50914' : 'rgba(255,255,255,0.1)', transition:'all 0.3s ease' }}/>
        ))}
      </div>
      <span style={{ fontSize:'12px', color:'#64748b', fontWeight:600 }}>Step {step} of {total} — {label}</span>
    </div>
  )
}

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
  const { addToast } = useToast()
  const [step, setStep] = useState('select')
  const [queues, setQueues] = useState([])
  const [selected, setSelected] = useState(null)
  const [meta, setMeta] = useState(null)
  const [requestText, setRequestText] = useState('')
  const [userName, setUserName] = useState('')
  const [phone, setPhone] = useState('')
  const [parsed, setParsed] = useState(null)
  const [parseSource, setParseSource] = useState(null)
  const [myToken, setMyToken] = useState(null)
  const [liveToken, setLiveToken] = useState(null)
  const [queueData, setQueueData] = useState(null)
  const [isTurn, setIsTurn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const socketRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    document.title = 'Book Now — QueueIQ'
    queuesAPI.list().then(r => setQueues(r.data || [])).catch(() => addToast('Could not load services', 'error'))
    return () => {
      clearInterval(pollRef.current)
      if (socketRef.current) { socketRef.current.off('queue:updated'); socketRef.current.off('your:turn') }
    }
  }, [])

  async function handleParse() {
    if (!requestText.trim()) return addToast('Please describe your request', 'warning')
    setStep('parsing')
    try {
      const res = await geminiAPI.parse(requestText)
      setParsed(res.data); setParseSource(res.source); setStep('confirm')
    } catch { setStep('request'); addToast('Parse failed, please retry', 'error') }
  }

  async function handleBook() {
    if (!userName.trim()) return addToast('Please enter your name', 'warning')
    setIsLoading(true)
    try {
      const res = await tokensAPI.create({
        queue_id: selected.id, user_name: userName.trim(), phone: phone.trim() || undefined,
        request_text: requestText, service_type: parsed?.service_type, urgency: parsed?.urgency || 'medium',
        request_category: parsed?.request_category || 'walk-in',
        estimated_service_duration: parsed?.estimated_service_duration_mins || 10, notes: parsed?.notes,
      })
      const token = res.data
      setMyToken(token); setLiveToken(token); setStep('tracking')
      addToast(`Booking confirmed! Token ${token.token_number}`, 'success')
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
    setParsed(null); setMyToken(null); setLiveToken(null); setQueueData(null); setIsTurn(false)
    clearInterval(pollRef.current)
    if (socketRef.current) { socketRef.current.off('queue:updated'); socketRef.current.off('your:turn') }
  }

  /* ── STEP 1: Select service ─────────────────────────────────── */
  if (step === 'select') return (
    <Page>
      <StepPill step={1} total={4} label="Choose a Service" />
      <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'28px', color:'#fff', marginBottom:'6px' }}>Choose a Service</h1>
      <p style={{ fontSize:'14px', color:'#64748b', marginBottom:'28px' }}>Select the counter you want to book your spot at</p>

      {queues.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height:'80px', borderRadius:'16px' }} />)}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {queues.map((q, i) => {
            const m = META[q.id] || { icon:'🏢', accent:'#94a3b8', accentDim:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)', bg:'linear-gradient(135deg,#111218,#1a1b23)' }
            const waiting = q.stats?.waiting_count ?? 0
            const wait = waiting * (q.avg_service_time ?? 10)
            return (
              <button key={q.id} onClick={() => { setSelected(q); setMeta(m); setStep('request') }}
                style={{ width:'100%', textAlign:'left', borderRadius:'16px', overflow:'hidden', border:`1px solid ${m.border}`, background:m.bg, cursor:'pointer', transition:'all 0.22s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 0 32px ${m.accentDim}, 0 8px 28px rgba(0,0,0,0.5)` }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'18px 20px' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:`${m.accent}15`, border:`1px solid ${m.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                    {m.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                      <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'15px', color:'#fff', margin:0 }}>{q.service_name}</h3>
                      <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 7px', borderRadius:'20px', background:'rgba(229,9,20,0.15)', color:'#f87171', border:'1px solid rgba(229,9,20,0.25)', flexShrink:0 }}>LIVE</span>
                    </div>
                    <p style={{ fontSize:'12px', color:'#4b5563', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{q.description}</p>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'22px', color:m.accent, margin:0, lineHeight:1 }}>{waiting}</p>
                    <p style={{ fontSize:'11px', color:'#374151', margin:'2px 0 0' }}>~{wait}m wait</p>
                  </div>
                  <span style={{ color:'#374151', fontSize:'18px', flexShrink:0 }}>›</span>
                </div>
                <div style={{ height:'2px', background:`linear-gradient(90deg,${m.accent}80,${m.accent})`, width:`${Math.min((waiting/8)*100,100)}%`, transition:'width 0.7s ease' }}/>
              </button>
            )
          })}
        </div>
      )}
    </Page>
  )

  /* ── STEP 2: Describe request ───────────────────────────────── */
  if (step === 'request') return (
    <Page>
      <BackBtn onClick={() => setStep('select')} />
      <StepPill step={2} total={4} label="Describe Your Request" />
      <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:'#fff', marginBottom:'6px' }}>What do you need?</h1>
      <p style={{ fontSize:'14px', color:'#64748b', marginBottom:'24px' }}>Describe freely — AI will parse and prioritize automatically</p>

      {/* Selected service chip */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', borderRadius:'12px', background:meta?.accentDim, border:`1px solid ${meta?.border}`, marginBottom:'20px' }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${meta?.accent}15`, border:`1px solid ${meta?.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
          {meta?.icon}
        </div>
        <div>
          <p style={{ fontWeight:700, color:'#fff', fontSize:'14px', margin:0 }}>{selected?.service_name}</p>
          <p style={{ fontSize:'12px', color:'#4b5563', margin:0 }}>{selected?.stats?.waiting_count ?? 0} ahead · ~{(selected?.stats?.waiting_count ?? 0) * (selected?.avg_service_time ?? 10)}m wait</p>
        </div>
        <button onClick={() => setStep('select')} style={{ marginLeft:'auto', fontSize:'12px', color:meta?.accent, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Change</button>
      </div>

      {/* Textarea */}
      <div style={{ borderRadius:'14px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.03)', overflow:'hidden', marginBottom:'12px' }}>
        <textarea
          rows={4}
          value={requestText}
          onChange={e => setRequestText(e.target.value)}
          onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleParse() }}
          placeholder={meta?.examples?.[0] || 'Describe your request naturally…'}
          style={{ width:'100%', background:'transparent', border:'none', outline:'none', padding:'16px', fontSize:'14px', color:'#e2e8f0', resize:'none', fontFamily:'Inter,sans-serif', lineHeight:1.6 }}
        />
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:'12px', color:'#374151' }}>{requestText.length} chars · Ctrl+Enter to submit</span>
          {requestText && <button onClick={() => setRequestText('')} style={{ fontSize:'12px', color:'#374151', background:'none', border:'none', cursor:'pointer' }}>Clear</button>}
        </div>
      </div>

      {/* Service info card */}
      <ServiceInfoCard meta={meta} selected={selected} />

      <button onClick={handleParse} disabled={!requestText.trim()} className="btn-book"
        style={{ width:'100%', padding:'14px', fontSize:'15px' }}>
        ✨ Analyze with AI & Continue
      </button>
    </Page>
  )

  /* ── STEP: AI Parsing ───────────────────────────────────────── */
  if (step === 'parsing') return (
    <div className="app-bg" style={{ minHeight:'100vh', paddingTop:'60px', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:'40px 20px' }}>
        <div style={{ width:'80px', height:'80px', borderRadius:'24px', background:'#e50914', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', margin:'0 auto 24px', boxShadow:'0 8px 40px rgba(229,9,20,0.4)', animation:'pulse-dot 1.5s ease-in-out infinite' }}>🧠</div>
        <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'24px', color:'#fff', marginBottom:'8px' }}>Analyzing your request…</h2>
        <p style={{ fontSize:'14px', color:'#64748b', marginBottom:'28px' }}>Gemini AI is understanding your request and determining priority</p>
        <div style={{ display:'flex', justifyContent:'center', gap:'8px' }}>
          {[0,1,2].map(i => <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#e50914', animation:`pulse-dot 1s ease-in-out ${i*0.18}s infinite` }} />)}
        </div>
      </div>
    </div>
  )

  /* ── STEP 3: Confirm ────────────────────────────────────────── */
  if (step === 'confirm' && parsed) {
    const urg = URGENCY[parsed.urgency] || URGENCY.medium
    return (
      <Page>
        <BackBtn onClick={() => setStep('request')} />
        <StepPill step={3} total={4} label="Review & Confirm" />
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:'#fff', marginBottom:'6px' }}>Review & Confirm</h1>
        <p style={{ fontSize:'14px', color:'#64748b', marginBottom:'24px' }}>AI has analyzed your request — confirm to get your token</p>

        {/* AI Analysis card */}
        <div style={{ borderRadius:'16px', padding:'20px', background:'linear-gradient(135deg,#111218,#14151e)', border:`1px solid ${urg.border}`, marginBottom:'14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', paddingBottom:'14px', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:'16px' }}>
            <span style={{ fontSize:'16px' }}>{parseSource === 'gemini' ? '✨' : '⚙️'}</span>
            <span style={{ fontWeight:700, color:'#fff', fontSize:'14px' }}>AI Analysis</span>
            <span style={{ marginLeft:'auto', fontSize:'11px', padding:'3px 9px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', color:'#4b5563', fontWeight:600 }}>
              {parseSource === 'gemini' ? 'Gemini AI' : 'Rule Engine'}
            </span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            {[
              { label:'Service',  val: parsed.service_type },
              { label:'Priority', val: urg.label, color: urg.color },
              { label:'Category', val: parsed.request_category?.replace('_', ' ') },
              { label:'Duration', val: `~${parsed.estimated_service_duration_mins}min` },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ padding:'12px', borderRadius:'10px', background:'rgba(255,255,255,0.03)' }}>
                <p style={{ fontSize:'10px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>{label}</p>
                <p style={{ fontSize:'14px', fontWeight:700, color: color || '#e2e8f0', margin:0 }}>{val}</p>
              </div>
            ))}
            {parsed.notes && (
              <div style={{ gridColumn:'1/-1', padding:'12px', borderRadius:'10px', background:'rgba(255,255,255,0.03)' }}>
                <p style={{ fontSize:'10px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>Notes</p>
                <p style={{ fontSize:'13px', color:'#94a3b8', fontStyle:'italic', margin:0 }}>"{parsed.notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Your details */}
        <div style={{ borderRadius:'16px', padding:'20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:'14px' }}>
          <p style={{ fontSize:'11px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'14px' }}>Your Details</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div>
              <label style={{ display:'block', fontSize:'12px', color:'#64748b', marginBottom:'6px' }}>Full Name *</label>
              <input className="input-field" placeholder="Enter your full name" value={userName} onChange={e => setUserName(e.target.value)} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'12px', color:'#64748b', marginBottom:'6px' }}>Phone (optional)</label>
              <input className="input-field" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
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
        <StepPill step={4} total={4} label="Track Your Booking" />
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'26px', color:'#fff', marginBottom:'24px' }}>Track Your Booking</h1>

        {/* Your turn banner */}
        {(isTurn || isServing) && (
          <div style={{ borderRadius:'16px', padding:'20px', textAlign:'center', background:'linear-gradient(135deg,#0d1f0d,#0a2e0a)', border:'1px solid rgba(74,222,128,0.3)', boxShadow:'0 0 40px rgba(74,222,128,0.15)', marginBottom:'16px' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'8px' }}>🎉</div>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'22px', color:'#fff', marginBottom:'5px' }}>It's Your Turn!</h2>
            <p style={{ fontSize:'14px', color:'#4ade80', fontWeight:600 }}>Please proceed to the counter now</p>
          </div>
        )}

        {/* Ticket */}
        <div style={{ borderRadius:'20px', background:'linear-gradient(135deg,#111218,#14151e)', border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden', marginBottom:'14px', boxShadow:'0 8px 40px rgba(0,0,0,0.5)' }}>
          {/* Colored top strip */}
          <div style={{ height:'4px', background:`linear-gradient(90deg,${m.accent || '#e50914'}80,${m.accent || '#e50914'})` }}/>

          <div style={{ padding:'24px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  <span style={{ fontSize:'18px' }}>{m.icon}</span>
                  <span style={{ fontSize:'12px', color:'#4b5563' }}>{selected?.service_name || liveToken.service_type}</span>
                </div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'56px', color:m.accent || '#e50914', lineHeight:1, marginBottom:'4px' }}>
                  {liveToken.token_number}
                </div>
                <p style={{ fontWeight:700, color:'#e2e8f0', fontSize:'17px', margin:0 }}>{liveToken.user_name}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ display:'inline-block', padding:'5px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:800, background: isServing ? 'rgba(74,222,128,0.15)' : isDone ? 'rgba(148,163,184,0.1)' : 'rgba(245,158,11,0.1)', color: isServing ? '#4ade80' : isDone ? '#94a3b8' : '#fbbf24', border: isServing ? '1px solid rgba(74,222,128,0.3)' : isDone ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(245,158,11,0.3)', marginBottom:'8px' }}>
                  {isServing ? '● NOW SERVING' : isDone ? '✓ DONE' : isSkipped ? '↷ SKIPPED' : '⏳ WAITING'}
                </div>
                {!isDone && !isSkipped && !isServing && liveToken.estimated_wait_time > 0 && (
                  <p style={{ fontSize:'20px', fontFamily:'Outfit,sans-serif', fontWeight:900, color:m.accent || '#e50914', margin:0 }}>~{liveToken.estimated_wait_time}m</p>
                )}
                {!isDone && !isSkipped && (
                  <p style={{ fontSize:'12px', color:'#374151', margin:'2px 0 0' }}>Position #{liveToken.position}</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop:'1px dashed rgba(255,255,255,0.08)', margin:'0 0 20px' }}/>

            {/* Progress */}
            <QueueProgress status={status} position={liveToken.position || 0} accentColor={m.accent} />
          </div>
        </div>

        {/* Queue list */}
        {!isDone && !isSkipped && waitingList.length > 0 && (
          <div style={{ borderRadius:'14px', padding:'16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', marginBottom:'14px' }}>
            <p style={{ fontSize:'11px', color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'12px' }}>Queue Position</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {waitingList.slice(0, 5).map((t, i) => {
                const isMe = t.id === liveToken.id
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:'10px', background: isMe ? (m.accentDim || 'rgba(56,189,248,0.08)') : 'rgba(255,255,255,0.02)', border: isMe ? `1px solid ${m.border || 'rgba(56,189,248,0.2)'}` : '1px solid transparent' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'22px', height:'22px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, background: isMe ? (m.accent || '#38bdf8') : '#1f2937', color: isMe ? '#000' : '#6b7280' }}>{i+1}</span>
                      <span style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:700, color: isMe ? (m.accent || '#38bdf8') : '#475569' }}>{t.token_number}</span>
                      {isMe && <span style={{ fontSize:'11px', fontWeight:800, color:m.accent }}>← You</span>}
                    </div>
                    <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'6px', fontWeight:700, background: t.urgency==='high'?'rgba(239,68,68,0.1)':t.urgency==='medium'?'rgba(245,158,11,0.1)':'rgba(34,197,94,0.1)', color: t.urgency==='high'?'#f87171':t.urgency==='medium'?'#fbbf24':'#4ade80' }}>{t.urgency}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(isDone || isSkipped) && (
          <div style={{ borderRadius:'16px', padding:'36px 20px', textAlign:'center', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:'14px' }}>
            <div style={{ fontSize:'3rem', marginBottom:'12px' }}>{isDone ? '✅' : '⏭️'}</div>
            <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'20px', color:'#fff', marginBottom:'8px' }}>{isDone ? 'Booking Complete!' : 'Token Skipped'}</h3>
            <p style={{ fontSize:'14px', color:'#64748b', marginBottom:'24px' }}>{isDone ? 'Thank you for using QueueIQ.' : 'Please approach the counter directly.'}</p>
            <button onClick={reset} className="btn-book" style={{ padding:'12px 32px', fontSize:'14px' }}>Book Another Slot</button>
          </div>
        )}

        <p style={{ textAlign:'center', fontSize:'12px', color:'#1f2937', marginTop:'8px' }}>Live updates via Socket.io · Refreshes every 5s</p>
      </Page>
    )
  }

  return null
}
