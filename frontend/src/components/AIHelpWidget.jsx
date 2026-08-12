import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const S = {
  widget: { position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 },
  bubble: {
    width: '60px', height: '60px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    boxShadow: '0 8px 32px rgba(236,72,153,0.4)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '28px', transition: 'transform 0.2s ease',
  },
  chatWindow: {
    position: 'absolute', bottom: '80px', right: '0',
    width: '350px', height: '500px',
    background: 'rgba(15,15,25,0.95)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
  header: {
    padding: '16px 20px', background: 'rgba(255,255,255,0.05)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', alignItems: 'center', gap: '12px'
  },
  messages: { flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
  msgUser: { alignSelf: 'flex-end', background: '#3b82f6', color: '#fff', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', maxWidth: '85%', fontSize: '14px', lineHeight: 1.4 },
  msgAi: { alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', maxWidth: '85%', fontSize: '14px', lineHeight: 1.4 },
  inputArea: {
    padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', gap: '8px'
  },
  input: {
    flex: 1, padding: '10px 14px', borderRadius: '20px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: '14px', outline: 'none'
  },
  sendBtn: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: '#a855f7', color: '#fff', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
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
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✨</div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0 }}>WAITLESS AI</h4>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Support Assistant</p>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>
          
          <div style={S.messages}>
            {messages.map(m => (
              <div key={m.id} style={m.isAi ? S.msgAi : S.msgUser}>
                {m.text}
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
