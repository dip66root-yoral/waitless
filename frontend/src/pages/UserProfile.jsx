import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { tokensAPI } from '../api/client.js'

export default function UserProfile() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('bookings')
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'My Profile — WAITLESS'
    if (user?.phone) {
      tokensAPI.getUserTokens(user.phone)
        .then(res => setTokens(res.data || []))
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  const S = {
    page: { minHeight: '100vh', padding: '100px 28px 40px', background: 'var(--bg-main)' },
    container: { maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start' },
    sidebar: { width: '260px', flexShrink: 0 },
    content: { flex: 1 },
    tab: (active) => ({
      padding: '14px 20px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
      display: 'block', width: '100%', textAlign: 'left', border: 'none',
      background: active ? 'rgba(229,9,20,0.1)' : 'transparent',
      color: active ? '#f87171' : 'var(--text-muted)',
      transition: 'all 0.2s ease', marginBottom: '8px'
    }),
    card: {
      background: 'rgba(var(--rgb-white),0.03)', border: '1px solid rgba(var(--rgb-white),0.08)',
      borderRadius: '20px', padding: '32px', backdropFilter: 'blur(20px)',
    }
  }

  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* Sidebar */}
        <aside style={S.sidebar}>
          <div style={{ padding: '0 12px 24px' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>Hey, {user?.name?.split(' ')[0]}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{user?.phone || user?.email}</p>
          </div>
          <button style={S.tab(activeTab === 'bookings')} onClick={() => setActiveTab('bookings')}>🎟️ My Bookings</button>
          <button style={S.tab(activeTab === 'account')} onClick={() => setActiveTab('account')}>⚙️ Account Settings</button>
          <button style={S.tab(activeTab === 'payment')} onClick={() => setActiveTab('payment')}>💳 Payment Methods</button>
          <button style={S.tab(activeTab === 'notifications')} onClick={() => setActiveTab('notifications')}>🔔 Notifications</button>
          <button style={S.tab(activeTab === 'support')} onClick={() => setActiveTab('support')}>💬 Support History</button>
          <button style={S.tab(activeTab === 'gifts')} onClick={() => setActiveTab('gifts')}>🎁 Gift Cards</button>
          
          <button onClick={logout} style={{ ...S.tab(false), marginTop: '32px', color: '#ef4444' }}>🚪 Sign Out</button>
        </aside>

        {/* Content */}
        <main style={S.content}>
          {activeTab === 'bookings' && (
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '24px' }}>My Bookings & Tokens</h3>
              {loading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading bookings...</p>
              ) : tokens.length === 0 ? (
                <div style={S.card}>
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>You have no past bookings.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {tokens.map(t => (
                    <div key={t.id} style={{ ...S.card, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 900, color: '#e50914' }}>{t.token_number}</span>
                          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', 
                            background: t.status === 'done' ? 'rgba(74,222,128,0.1)' : t.status === 'in-progress' ? 'rgba(56,189,248,0.1)' : 'rgba(var(--rgb-white),0.05)',
                            color: t.status === 'done' ? '#4ade80' : t.status === 'in-progress' ? '#38bdf8' : '#e2e8f0' }}>
                            {t.status}
                          </span>
                        </div>
                        <h4 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: 600 }}>{t.service_name}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Requested: {new Date(t.created_at).toLocaleString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>{t.service_type || 'General'}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Priority: {t.urgency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'account' && (
            <div style={S.card}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '24px' }}>Account Settings</h3>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Full Name</label>
                <input type="text" readOnly value={user?.name || ''} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(var(--rgb-white),0.05)', border: '1px solid rgba(var(--rgb-white),0.1)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Phone Number</label>
                <input type="text" readOnly value={user?.phone || ''} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(var(--rgb-white),0.05)', border: '1px solid rgba(var(--rgb-white),0.1)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Email</label>
                <input type="email" readOnly value={user?.email || ''} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(var(--rgb-white),0.05)', border: '1px solid rgba(var(--rgb-white),0.1)', color: 'var(--text-main)' }} />
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div style={S.card}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '24px' }}>Payment Methods</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(var(--rgb-white),0.05)', borderRadius: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>💳</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '15px' }}>Visa ending in 4242</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Expires 12/28</p>
                </div>
                <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 700 }}>DEFAULT</span>
              </div>
              <button className="btn-primary" style={{ padding: '10px 20px', borderRadius: '12px', border: '1px dashed rgba(var(--rgb-white),0.2)', background: 'transparent', color: 'var(--text-main)', width: '100%', cursor: 'pointer' }}>
                + Add New Payment Method
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={S.card}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '24px' }}>Notifications</h3>
              {[
                { title: 'Email Alerts', desc: 'Receive booking confirmations and updates via email.', active: true },
                { title: 'SMS Updates', desc: 'Get live queue tracking alerts on your phone.', active: true },
                { title: 'Promotional Offers', desc: 'Hear about new hubs and discounts.', active: false }
              ].map((n, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(var(--rgb-white),0.05)' }}>
                  <div>
                    <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '15px' }}>{n.title}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>{n.desc}</p>
                  </div>
                  <div style={{ width: '40px', height: '24px', borderRadius: '12px', background: n.active ? '#38bdf8' : 'rgba(var(--rgb-white),0.1)', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--text-main)', position: 'absolute', top: '3px', left: n.active ? '19px' : '3px', transition: 'left 0.2s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'support' && (
            <div style={S.card}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '24px' }}>Support History</h3>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>You have no open support tickets.</p>
            </div>
          )}

          {activeTab === 'gifts' && (
            <div style={{ ...S.card, textAlign: 'center', padding: '60px 20px' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🎁</span>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>Gift Cards</h3>
              <p style={{ color: 'var(--text-muted)' }}>Buy WAITLESS gift cards for your friends and family.<br/>Coming soon!</p>
              <button style={{ marginTop: '24px', padding: '12px 24px', borderRadius: '12px', background: '#e50914', color: 'var(--text-main)', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Buy a Gift Card</button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
