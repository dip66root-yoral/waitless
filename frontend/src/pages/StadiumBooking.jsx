import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MATCHES } from '../data/matches.js'

const FILTERS = ['All', 'Football', 'Cricket']

export default function StadiumBooking() {
  const [filter, setFilter] = useState('All')
  const [hovered, setHovered] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Live Sports & Matches — WAITLESS'
  }, [])

  const filteredMatches = MATCHES.filter(m => filter === 'All' || m.type === filter)

  return (
    <div style={{ minHeight: '100vh', background: '#060810', paddingTop: '72px' }}>

      {/* ── Hero header ─────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '60px 28px 80px',
        background: 'linear-gradient(180deg, rgba(229,9,20,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Decorative glow */}
        <div style={{
          position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(229,9,20,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '99px', background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)', marginBottom: '24px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e50914', animation: 'live-pulse 1.8s ease infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#f87171', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live Events</span>
          </div>

          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, color: '#fff', marginBottom: '16px', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Stadium Tickets &amp;<br />
            <span style={{ background: 'linear-gradient(135deg, #e50914, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Live Matches
            </span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '520px', margin: '0 auto 36px', lineHeight: 1.7 }}>
            Skip the queue. Book your entry pass for the world's biggest sports events — cricket, football, and more.
          </p>

          {/* Filter pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '10px 24px', borderRadius: '99px', fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.22s ease',
                  background: filter === f
                    ? 'linear-gradient(135deg, #e50914, #c8070f)'
                    : 'rgba(255,255,255,0.05)',
                  color: filter === f ? '#fff' : '#64748b',
                  border: filter === f ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: filter === f ? '0 4px 20px rgba(229,9,20,0.4)' : 'none',
                }}
              >
                {f === 'Football' ? '⚽ Football' : f === 'Cricket' ? '🏏 Cricket' : '🏟️ All Events'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Match grid ─────────────────────── */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '48px 28px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
          {filteredMatches.map(m => (
            <Link
              key={m.id}
              to={`/user/${m.queueId}`}
              className="match-card"
              style={{ textDecoration: 'none', background: '#111218' }}
              onMouseEnter={() => setHovered(m.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Image */}
              <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                <img
                  src={m.posterUrl}
                  alt={m.title}
                  className="match-img"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(6,8,16,1) 0%, rgba(6,8,16,0.2) 60%, rgba(6,8,16,0) 100%)',
                }} />
                {/* Type badge top-right */}
                <div style={{
                  position: 'absolute', top: '14px', right: '14px',
                  padding: '5px 12px', borderRadius: '99px',
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '11px', fontWeight: 800, color: '#fff',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  {m.type === 'Football' ? '⚽' : '🏏'} {m.type}
                </div>
                {/* Live badge top-left */}
                <div style={{
                  position: 'absolute', top: '14px', left: '14px',
                  padding: '5px 12px', borderRadius: '99px',
                  background: 'rgba(229,9,20,0.15)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(229,9,20,0.3)',
                  fontSize: '10px', fontWeight: 800, color: '#f87171',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#e50914', animation: 'live-pulse 1.8s ease infinite', display: 'inline-block' }} />
                  LIVE
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '22px 24px 24px' }}>
                {/* Subtitle pill */}
                <div style={{
                  display: 'inline-block', marginBottom: '12px',
                  padding: '4px 12px', borderRadius: '99px',
                  background: `${m.accent}18`, border: `1px solid ${m.accent}40`,
                  fontSize: '10px', fontWeight: 800, color: m.accent,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {m.subtitle}
                </div>

                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                  {m.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px' }}>📍</span>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>{m.stadium}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '12px' }}>🗓</span>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>{m.date}</p>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '20px' }} />

                {/* CTA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${m.accent}15`, border: `1px solid ${m.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                      🎟️
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Skip the queue</span>
                  </div>
                  <div style={{
                    padding: '9px 20px',
                    background: hovered === m.id
                      ? `linear-gradient(135deg, ${m.accent}, ${m.accent}cc)`
                      : 'rgba(255,255,255,0.06)',
                    color: hovered === m.id ? '#fff' : '#94a3b8',
                    border: `1px solid ${hovered === m.id ? m.accent : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 800,
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.04em',
                    boxShadow: hovered === m.id ? `0 4px 18px ${m.accent}50` : 'none',
                  }}>
                    Book Queue →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredMatches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏟️</p>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '24px', color: '#fff', marginBottom: '8px' }}>No events found</p>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Try selecting a different sport filter</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes live-pulse {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  )
}
