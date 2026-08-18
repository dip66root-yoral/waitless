import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

import ReactMarkdown from 'react-markdown'

const S = {
  widget: { position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999 },
  bubble: {
    width: '62px', height: '62px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
    boxShadow: '0 8px 32px rgba(168,85,247,0.55), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(var(--rgb-white),0.25)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '26px', transition: 'all 0.25s cubic-bezier(0.25,1,0.5,1)',
    border: '1px solid rgba(var(--rgb-white),0.15)',
  },
  chatWindow: {
    position: 'absolute', bottom: '82px', right: '0',
    width: '370px', height: '520px',
    background: 'rgba(6,8,18,0.97)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: '1px solid rgba(var(--rgb-white),0.08)',
    borderRadius: '28px',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(var(--rgb-white),0.04), inset 0 1px 0 rgba(var(--rgb-white),0.06)',
  },
  header: {
    padding: '18px 22px',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(236,72,153,0.08) 100%)',
    borderBottom: '1px solid rgba(var(--rgb-white),0.06)',
    display: 'flex', alignItems: 'center', gap: '14px'
  },
  messages: { flex: 1, padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' },
  msgUser: {
    alignSelf: 'flex-end',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'var(--text-main)', padding: '11px 16px',
    borderRadius: '18px 18px 4px 18px', maxWidth: '82%',
    fontSize: '14px', lineHeight: 1.5,
    boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
    fontWeight: 500,
  },
  msgAi: {
    alignSelf: 'flex-start',
    background: 'rgba(var(--rgb-white),0.06)',
    border: '1px solid rgba(var(--rgb-white),0.08)',
    color: '#e2e8f0', padding: '11px 16px',
    borderRadius: '4px 18px 18px 18px', maxWidth: '82%',
    fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word',
    backdropFilter: 'blur(10px)',
  },
  inputArea: {
    padding: '16px 18px',
    borderTop: '1px solid rgba(var(--rgb-white),0.05)',
    background: 'rgba(0,0,0,0.2)',
    display: 'flex', gap: '10px', alignItems: 'center'
  },
  input: {
    flex: 1, padding: '11px 16px', borderRadius: '22px',
    background: 'rgba(var(--rgb-white),0.06)',
    border: '1px solid rgba(var(--rgb-white),0.1)',
    color: 'var(--text-main)', fontSize: '14px', outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: "'Inter', sans-serif",
  },
  sendBtn: {
    width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)',
    color: 'var(--text-main)', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', fontWeight: 800,
    boxShadow: '0 4px 16px rgba(168,85,247,0.4)',
    transition: 'all 0.2s ease',
  }
}

export default function AIHelpWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([{ id: 1, text: "Hi! I'm WAITLESS AI. How can I help you today?", isAi: true }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), text: userMsg, isAi: false }])
    setLoading(true)

    try {
      const res = await fetch('/api/gemini/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMsg, userId: user?.id, userName: user?.name })
      })
      const data = await res.json()
      
      if (data.success) {
        setMessages(prev => [...prev, { id: Date.now(), text: data.reply, isAi: true }])
        if (data.forwarded) {
          setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now()+1, text: "I've forwarded your issue to an admin. They'll review it shortly.", isAi: true, system: true }])
          }, 1000)
        }
      } else {
        throw new Error(data.error || 'API Error')
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { id: Date.now(), text: "Sorry, I couldn't process that right now.", isAi: true }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.widget}>
      {isOpen && (
        <div style={S.chatWindow}>
          <div style={S.header}>
            <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 16px rgba(168,85,247,0.4), inset 0 1px 0 rgba(var(--rgb-white),0.2)', flexShrink: 0 }}>✨</div>
            <div>
              <h4 style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: 800, margin: 0, fontFamily: "'Outfit',sans-serif", letterSpacing: '0.04em' }}>WAITLESS AI</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.8)', animation: 'live-pulse 1.8s ease infinite' }} />
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0, fontWeight: 500 }}>Online · Support Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ marginLeft: 'auto', background: 'rgba(var(--rgb-white),0.06)', border: '1px solid rgba(var(--rgb-white),0.08)', color: '#64748b', cursor: 'pointer', fontSize: '14px', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>✕</button>
          </div>
          
          <div style={S.messages}>
            {messages.map(m => (
              <div key={m.id} style={m.isAi ? S.msgAi : S.msgUser}>
                {m.isAi ? (
                  <ReactMarkdown components={{ p: ({node, ...props}) => <p style={{margin:0, paddingBottom: '4px'}} {...props} /> }}>
                    {m.text}
                  </ReactMarkdown>
                ) : (
                  m.text
                )}
                {m.system && <div style={{ fontSize: '11px', color: '#a855f7', marginTop: '4px', fontWeight: 600 }}>System Note</div>}
              </div>
            ))}
            {loading && <div style={{ ...S.msgAi, display: 'flex', gap: '4px' }}><span className="dot-bounce">.</span><span className="dot-bounce" style={{animationDelay:'0.1s'}}>.</span><span className="dot-bounce" style={{animationDelay:'0.2s'}}>.</span></div>}
            <div ref={messagesEndRef} />
          </div>
          
          <form style={S.inputArea} onSubmit={handleSend}>
            <input type="text" placeholder={user ? "Type your question..." : "Login to ask questions"} value={input} onChange={e => setInput(e.target.value)} style={S.input} disabled={!user || loading} />
            <button type="submit" style={S.sendBtn} disabled={!user || loading}>↑</button>
          </form>
          <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } } .dot-bounce { display: inline-block; animation: bounce 0.6s infinite; }`}</style>
        </div>
      )}
      <div style={{ ...S.bubble, transform: isOpen ? 'scale(0.8)' : 'scale(1)' }} onClick={() => setIsOpen(!isOpen)}>✨</div>
    </div>
  )
}
