import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import QueueProgress from './QueueProgress.jsx'

export function LiveTicket({ token, movie, meta, queueData, children }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const m = meta || {}

  useEffect(() => {
    if (token) {
      QRCode.toDataURL(`waitless:token:${token.id}`, {
        width: 140,
        margin: 1,
        color: {
          dark: m.accent || '#e50914',
          light: '#00000000'
        }
      }).then(url => setQrCodeUrl(url)).catch(() => {})
    }
  }, [token, m.accent])

  if (!token) return null

  const status = token.status
  const isServing = status === 'in-progress'
  const isDone = status === 'done'
  const isSkipped = status === 'skipped'
  const waitingList = queueData?.tokens?.filter(t => t.status === 'waiting') || []

  return (
    <div style={{ borderRadius: '20px', background: 'linear-gradient(135deg,#111218,#14151e)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
      {/* Colored top strip */}
      <div style={{ height: '4px', background: `linear-gradient(90deg,${m.accent || '#e50914'}80,${m.accent || '#e50914'})` }} />

      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>{m.icon || '🎟️'}</span>
              <span style={{ fontSize: '12px', color: '#4b5563' }}>{token.service_type}</span>
            </div>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '56px', color: m.accent || '#e50914', lineHeight: 1, marginBottom: '4px' }}>
              {token.token_number}
            </div>
            <p style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '17px', margin: 0 }}>{token.user_name}</p>
          </div>
          
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <div style={{ display: 'inline-block', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, background: isServing ? 'rgba(74,222,128,0.15)' : isDone ? 'rgba(148,163,184,0.1)' : 'rgba(245,158,11,0.1)', color: isServing ? '#4ade80' : isDone ? '#94a3b8' : '#fbbf24', border: isServing ? '1px solid rgba(74,222,128,0.3)' : isDone ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(245,158,11,0.3)' }}>
              {isServing ? '● NOW SERVING' : isDone ? '✓ DONE' : isSkipped ? '↷ SKIPPED' : '⏳ WAITING'}
            </div>
            
            {/* QR Code */}
            {qrCodeUrl && (
              <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '8px', border: `1px solid ${m.accent || '#e50914'}30` }}>
                <img src={qrCodeUrl} alt="Ticket QR" style={{ width: '100%', height: '100%' }} />
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', margin: '0 0 20px' }} />

        {/* Custom Content */}
        {children && (
          <div style={{ marginBottom: '20px' }}>
            {children}
          </div>
        )}

        {/* Progress */}
        <QueueProgress status={status} position={token.position || 0} accentColor={m.accent} />
      </div>
    </div>
  )
}
