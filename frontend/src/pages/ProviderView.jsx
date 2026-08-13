import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { queuesAPI, tokensAPI, getSocket } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'

const NAV_H = '60px'

const SERVICE_META = {
  'queue-movies-001': { icon:'🎬', accent:'#e50914', accentDim:'rgba(229,9,20,0.08)',   border:'rgba(229,9,20,0.2)',   bg:'linear-gradient(135deg,#140404,#1e0606)', label:'Cinema'  },
  'queue-clinic-001': { icon:'🏥', accent:'#a78bfa', accentDim:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.2)', bg:'linear-gradient(135deg,#0c0814,#130c1e)', label:'Medical'  },
  'queue-train-001':  { icon:'🚆', accent:'#4ade80', accentDim:'rgba(74,222,128,0.08)',  border:'rgba(74,222,128,0.2)',  bg:'linear-gradient(135deg,#061208,#091a0c)', label:'Railway'  },
  'queue-flight-001': { icon:'✈️', accent:'#38bdf8', accentDim:'rgba(56,189,248,0.08)',  border:'rgba(56,189,248,0.2)',  bg:'linear-gradient(135deg,#040e18,#060f1e)', label:'Airport'  },
}

const URGENCY = {
  high:   { color:'#f87171', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.25)',   label:'HIGH' },
  medium: { color:'#fbbf24', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.25)',  label:'MED'  },
  low:    { color:'#4ade80', bg:'rgba(34,197,94,0.12)',   border:'rgba(34,197,94,0.25)',   label:'LOW'  },
}

/* ─── Token row ────────────────────────────────────────────────── */
function TokenRow({ token, onAction, loadingId, meta }) {
  const urg = URGENCY[token.urgency] || URGENCY.medium
  const isServing = token.status === 'in-progress'
  const isWaiting = token.status === 'waiting'
  const isDone    = token.status === 'done'
  const isSkipped = token.status === 'skipped'
  const busy = !!loadingId

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'16px',
      padding:'16px 20px', borderRadius:'16px', transition:'all 0.25s cubic-bezier(0.22,1,0.36,1)',
      background: isServing ? meta?.accentDim || 'rgba(229,9,20,0.08)' : 'rgba(255,255,255,0.03)',
      border: isServing ? `1px solid ${meta?.border || 'rgba(229,9,20,0.2)'}` : '1px solid rgba(255,255,255,0.06)',
      boxShadow: isServing ? `0 8px 32px ${meta?.accentDim}` : 'none',
      opacity: isDone || isSkipped ? 0.6 : 1,
      position: 'relative', overflow: 'hidden'
    }} onMouseEnter={e => { if(isWaiting) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)' } }} onMouseLeave={e => { if(isWaiting) { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.06)' } }}>
      {isServing && <div style={{ position:'absolute', top:0, left:0, width:'4px', height:'100%', background:meta?.accent || '#e50914' }}/>}

      {/* Token number badge */}
      <div style={{ width:'60px', height:'48px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'16px', flexShrink:0, background: isServing ? (meta?.accent || '#e50914') : 'rgba(255,255,255,0.05)', color: isServing ? '#fff' : '#94a3b8', border: isServing ? 'none' : '1px solid rgba(255,255,255,0.08)', letterSpacing:'0.02em', boxShadow: isServing ? `0 4px 16px ${meta?.accent}40` : 'none' }}>
        {token.token_number}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'7px', marginBottom:'4px' }}>
          <span style={{ fontWeight:800, color:'#fff', fontSize:'15px', letterSpacing:'-0.01em' }}>{token.user_name}</span>
          <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'20px', background:urg.bg, color:urg.color, border:`1px solid ${urg.border}`, letterSpacing:'0.05em' }}>{urg.label}</span>
          {isServing  && <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'20px', background:'rgba(74,222,128,0.12)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.25)', letterSpacing:'0.05em' }}>● SERVING</span>}
          {isDone     && <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'20px', background:'rgba(148,163,184,0.1)', color:'#94a3b8', border:'1px solid rgba(148,163,184,0.2)', letterSpacing:'0.05em' }}>✓ DONE</span>}
          {isSkipped  && <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'20px', background:'rgba(148,163,184,0.07)', color:'#64748b', border:'1px solid rgba(148,163,184,0.12)', letterSpacing:'0.05em' }}>↷ SKIPPED</span>}
          {isWaiting  && <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'20px', background:'rgba(245,158,11,0.12)', color:'#fbbf24', border:'1px solid rgba(245,158,11,0.25)', letterSpacing:'0.05em' }}>⏳ WAITING</span>}
        </div>
        <p style={{ fontSize:'13px', color:'#94a3b8', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {token.service_type || token.request_text || 'General booking'}
        </p>
        {token.notes && (
          <p style={{ fontSize:'11px', color:'#2d3748', margin:'2px 0 0', fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {token.notes}
          </p>
        )}
        {isWaiting && token.estimated_wait_time > 0 && (
          <p style={{ fontSize:'11px', color: meta?.accent || '#e50914', margin:'3px 0 0', fontWeight:600 }}>
            ~{token.estimated_wait_time}m wait · #{token.position} in line
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display:'flex', gap:'7px', flexShrink:0 }}>
        {isWaiting && (
          <>
            <button onClick={() => onAction(token.id,'serve')} disabled={busy}
              style={{ padding:'8px 16px', borderRadius:'10px', fontSize:'12px', fontWeight:800, cursor:'pointer', background:meta?.accent||'#e50914', color:'#fff', border:'none', opacity:busy?0.5:1, transition:'all 0.15s' }}>
              {loadingId===token.id ? '…' : '▶ Serve'}
            </button>
            <button onClick={() => onAction(token.id,'skip')} disabled={busy}
              style={{ padding:'8px 12px', borderRadius:'10px', fontSize:'12px', fontWeight:800, cursor:'pointer', background:'rgba(255,255,255,0.05)', color:'#64748b', border:'1px solid rgba(255,255,255,0.08)', opacity:busy?0.5:1 }}>
              ↷
            </button>
          </>
        )}
        {isServing && (
          <button onClick={() => onAction(token.id,'done')} disabled={busy}
            style={{ padding:'8px 16px', borderRadius:'10px', fontSize:'12px', fontWeight:800, cursor:'pointer', background:'rgba(74,222,128,0.15)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.3)', opacity:busy?0.5:1 }}>
            {loadingId===token.id ? '…' : '✓ Done'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Stat card ────────────────────────────────────────────────── */
function StatCard({ icon, value, label, color }) {
  return (
    <div style={{ borderRadius:'16px', padding:'20px 24px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', textAlign:'center', transition:'all 0.2s', cursor:'default' }} onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.transform='translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.02)'; e.currentTarget.style.transform='none' }}>
      <div style={{ fontSize:'24px', marginBottom:'12px' }}>{icon}</div>
      <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'36px', color, lineHeight:1, marginBottom:'6px' }}>{value}</div>
      <div style={{ fontSize:'13px', color:'#64748b', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</div>
    </div>
  )
}

/* ─── Section header ───────────────────────────────────────────── */
function SectionHead({ color, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
      <div style={{ width:'3px', height:'16px', borderRadius:'2px', background:color }} />
      <span style={{ fontSize:'11px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', color }}>{children}</span>
    </div>
  )
}

/* ─── Main ─────────────────────────────────────────────────────── */
export default function ProviderView() {
  const { queueId: paramId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [queues, setQueues] = useState([])
  const [activeQueue, setActiveQueue] = useState(null)
  const [tokens, setTokens] = useState([])
  const [stats, setStats] = useState(null)
  const [loadingTokenId, setLoadingTokenId] = useState(null)
  const [isCallingNext, setIsCallingNext] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const socketRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    document.title = 'Counter Dashboard - WAITLESS'
    queuesAPI.list().then(r => setQueues((r.data || []).filter(q => !q.id.startsWith('queue-stadium') && !q.id.startsWith('queue-match')))).catch(() => addToast('Failed to load queues','error'))
    return () => { clearInterval(pollRef.current); if (socketRef.current) socketRef.current.off('queue:updated') }
  }, [])

  useEffect(() => {
    if (!queues.length) return
    const target = paramId ? queues.find(q => q.id === paramId) : queues[0]
    if (target && (!activeQueue || activeQueue.id !== target.id)) switchQueue(target)
  }, [queues, paramId])

  function switchQueue(q) {
    setActiveQueue(q); clearInterval(pollRef.current)
    if (socketRef.current) socketRef.current.off('queue:updated')
    fetchTokens(q.id)
    const socket = getSocket(); socketRef.current = socket
    socket.emit('join:queue', q.id)
    socket.on('queue:updated', () => fetchTokens(q.id))
    pollRef.current = setInterval(() => fetchTokens(q.id), 5000)
  }

  const fetchTokens = useCallback(async (qid) => {
    try {
      const r = await tokensAPI.getByQueue(qid); setStats(r.data.stats)
      const all = r.data.tokens || []
      setTokens([
        ...all.filter(t => t.status==='in-progress'),
        ...all.filter(t => t.status==='waiting').sort((a,b) => b.priority-a.priority || new Date(a.created_at)-new Date(b.created_at)),
        ...all.filter(t => t.status==='skipped'),
        ...all.filter(t => t.status==='done'),
      ])
    } catch {}
  }, [])

  async function callNext() {
    if (!activeQueue) return
    setIsCallingNext(true)
    try {
      const r = await tokensAPI.callNext(activeQueue.id)
      if (r.data) {
        addToast(`Now serving: ${r.data.token_number} — ${r.data.user_name}`, 'success')
        
        // Voice Announcement (WOW Factor)
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(`Token ${r.data.token_number}, please proceed to the counter.`)
          utterance.rate = 0.9
          utterance.pitch = 1
          window.speechSynthesis.speak(utterance)
        }
      } else {
        addToast('Queue is empty!', 'info')
      }
      fetchTokens(activeQueue.id)
    } catch (e) { addToast(e.error||'Failed','error') }
    finally { setIsCallingNext(false) }
  }

  async function tokenAction(tid, action) {
    setLoadingTokenId(tid)
    const statusMap = { done: 'done', serve: 'in-progress', skip: 'skipped' }
    try {
      await tokensAPI.updateStatus(tid, statusMap[action])
      addToast({ done:'Marked as done', serve:'Now serving', skip:'Skipped' }[action], action==='skip'?'warning':'success')
      fetchTokens(activeQueue.id)
    } catch (e) { addToast(e.error||'Action failed','error') }
    finally { setLoadingTokenId(null) }
  }

  const meta     = activeQueue ? (SERVICE_META[activeQueue.id] || { icon:'🏢', accent:'#94a3b8', accentDim:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)', bg:'#111218' }) : {}
  const serving  = tokens.filter(t => t.status==='in-progress')
  const waiting  = tokens.filter(t => t.status==='waiting')
  const done     = tokens.filter(t => t.status==='done')
  const skipped  = tokens.filter(t => t.status==='skipped')

  return (
    <div className="app-bg" style={{ minHeight:'100vh', paddingTop:NAV_H, display:'flex' }}>

      {/* ═══════════════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════════════ */}
      <aside style={{ width:'220px', flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.05)', padding:'24px 14px', display:'flex', flexDirection:'column', gap:'6px', minHeight:`calc(100vh - ${NAV_H})` }}>
        <p style={{ fontSize:'10px', color:'#374151', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'12px', paddingLeft:'10px' }}>Service Counters</p>

        {queues.length === 0 ? (
          [1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height:'62px', borderRadius:'12px' }} />)
        ) : queues.map(q => {
          const m = SERVICE_META[q.id] || { icon:'🏢', accent:'#94a3b8', accentDim:'rgba(148,163,184,0.07)', border:'rgba(148,163,184,0.18)', bg:'#111218' }
          const isActive = activeQueue?.id === q.id
          const waiting_count = q.stats?.waiting_count ?? 0
          return (
            <button key={q.id}
              onClick={() => { switchQueue(q); navigate(`/provider/${q.id}`) }}
              style={{ width:'100%', textAlign:'left', padding:'12px 14px', borderRadius:'14px', cursor:'pointer', transition:'all 0.2s', background: isActive ? m.accentDim : 'transparent', border: `1px solid ${isActive ? m.border : 'transparent'}`, display:'flex', alignItems:'center', gap:'12px' }}
              onMouseEnter={e => { if(!isActive) e.currentTarget.style.background='rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if(!isActive) e.currentTarget.style.background='transparent' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0, background: isActive ? `${m.accent}20` : 'rgba(255,255,255,0.04)', border:`1px solid ${isActive ? m.border : 'rgba(255,255,255,0.06)'}`, boxShadow: isActive ? `0 4px 12px ${m.accentDim}` : 'none' }}>
                {m.icon}
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ fontWeight:700, fontSize:'14px', color: isActive ? '#fff' : '#94a3b8', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{q.service_name}</p>
                <p style={{ fontSize:'12px', color: isActive ? m.accent : '#4b5563', margin:'2px 0 0', fontWeight: isActive ? 700 : 500 }}>{waiting_count} waiting</p>
              </div>
            </button>
          )
        })}

        {/* Hardcoded Sports Counter link to remove the mess */}
        <button onClick={() => navigate('/stadiums')}
          style={{ width:'100%', textAlign:'left', padding:'12px 14px', borderRadius:'14px', cursor:'pointer', transition:'all 0.2s', background: 'transparent', border: '1px solid transparent', display:'flex', alignItems:'center', gap:'12px' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
          <div style={{ width:'38px', height:'38px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0, background: 'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.06)' }}>
            🏟️
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontWeight:700, fontSize:'14px', color: '#94a3b8', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Sports Counters</p>
            <p style={{ fontSize:'12px', color: '#4b5563', margin:'2px 0 0', fontWeight: 500 }}>View Matches</p>
          </div>
        </button>
      </aside>

      {/* ═══════════════════════════════════════════════
          MAIN PANEL
      ═══════════════════════════════════════════════ */}
      <main style={{ flex:1, minWidth:0, padding:'28px 32px', overflowY:'auto' }}>
        {activeQueue && (
          <>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', marginBottom:'24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                <div style={{ width:'46px', height:'46px', borderRadius:'13px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', background:meta?.accentDim, border:`1px solid ${meta?.border}` }}>
                  {meta?.icon}
                </div>
                <div>
                  <h1 style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:'22px', color:'#fff', margin:0, lineHeight:1.1 }}>{activeQueue.service_name}</h1>
                  <p style={{ fontSize:'12px', color:'#4b5563', margin:'3px 0 0' }}>{activeQueue.description}</p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:meta?.accent || '#e50914', animation:'live-pulse 1.8s ease infinite' }}/>
                  <span style={{ fontSize:'11px', fontWeight:700, color:meta?.accent || '#e50914' }}>LIVE</span>
                </div>
                <button onClick={callNext} disabled={isCallingNext || waiting.length===0} className="btn-book"
                  style={{ padding:'10px 22px', fontSize:'13px', opacity: waiting.length===0 ? 0.4 : 1 }}>
                  {isCallingNext
                    ? <span style={{ display:'flex', alignItems:'center', gap:'7px' }}><span style={{ width:'13px', height:'13px', borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'spin 0.8s linear infinite', display:'block' }}/>Calling…</span>
                    : '⏭️ Call Next'}
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="responsive-grid-2" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'28px' }}>
              <StatCard icon="⏳" value={stats?.waiting??0}  label="Waiting"    color="#fbbf24" />
              <StatCard icon="🎯" value={stats?.serving??0}  label="At Counter" color={meta?.accent||'#e50914'} />
              <StatCard icon="✅" value={stats?.done??0}     label="Served"     color="#4ade80" />
              <StatCard icon="↷"  value={stats?.skipped??0}  label="Skipped"    color="#475569" />
            </div>

            {/* Now Serving */}
            {serving.length > 0 && (
              <div style={{ marginBottom:'22px' }}>
                <SectionHead color={meta?.accent||'#e50914'}>Now Serving</SectionHead>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {serving.map(t => <TokenRow key={t.id} token={t} onAction={tokenAction} loadingId={loadingTokenId} meta={meta} />)}
                </div>
              </div>
            )}

            {/* Waiting */}
            {waiting.length > 0 && (
              <div style={{ marginBottom:'22px' }}>
                <SectionHead color="#fbbf24">Waiting Queue ({waiting.length})</SectionHead>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {waiting.map(t => <TokenRow key={t.id} token={t} onAction={tokenAction} loadingId={loadingTokenId} meta={meta} />)}
                </div>
              </div>
            )}

            {/* Empty state */}
            {waiting.length===0 && serving.length===0 && (
              <div style={{ padding:'60px 20px', textAlign:'center', borderRadius:'20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', marginBottom:'22px' }}>
                <div style={{ fontSize:'3rem', marginBottom:'12px' }}>✅</div>
                <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'20px', color:'#fff', marginBottom:'6px' }}>Counter Clear!</p>
                <p style={{ fontSize:'13px', color:'#374151' }}>All bookings have been served.</p>
              </div>
            )}

            {/* Skipped */}
            {skipped.length > 0 && (
              <div style={{ marginBottom:'22px', opacity:0.55 }}>
                <SectionHead color="#475569">Skipped ({skipped.length})</SectionHead>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {skipped.map(t => <TokenRow key={t.id} token={t} onAction={tokenAction} loadingId={loadingTokenId} meta={meta} />)}
                </div>
              </div>
            )}

            {/* Done */}
            {done.length > 0 && (
              <div style={{ opacity:0.4 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <SectionHead color="#374151">Completed ({done.length})</SectionHead>
                  {done.length > 3 && (
                    <button onClick={() => setShowDone(v => !v)} style={{ fontSize:'12px', color:'#374151', background:'none', border:'none', cursor:'pointer' }}>
                      {showDone ? 'Collapse' : 'Show all'}
                    </button>
                  )}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {(showDone ? done : done.slice(0,3)).map(t => <TokenRow key={t.id} token={t} onAction={tokenAction} loadingId={loadingTokenId} meta={meta} />)}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
