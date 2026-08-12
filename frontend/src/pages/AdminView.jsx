import { useState, useEffect } from 'react'
import { authAPI } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'

export default function AdminView() {
  const [activeTab, setActiveTab] = useState('users') // 'users' or 'support'
  const [users, setUsers] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingTickets, setLoadingTickets] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    document.title = 'Admin Dashboard — WAITLESS'
    authAPI.users()
      .then(res => setUsers(res.data.users || []))
      .catch(err => addToast(err?.error || 'Failed to fetch users', 'error'))
      .finally(() => setLoading(false))

    authAPI.getSupportTickets()
      .then(res => setTickets(res.data.tickets || []))
      .catch(console.error)
      .finally(() => setLoadingTickets(false))
  }, [addToast])

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.is_active === 1 ? false : true;
      await authAPI.updateUserStatus(user.id, newStatus);
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus ? 1 : 0 } : u));
      addToast(`User ${user.name} has been ${newStatus ? 'activated' : 'suspended'}.`, 'success');
    } catch (err) {
      addToast(err?.error || 'Failed to update user status', 'error');
    }
  }

  const handleResolveTicket = async (id) => {
    try {
      await authAPI.resolveSupportTicket(id);
      setTickets(tickets.map(t => t.id === id ? { ...t, status: 'closed' } : t));
      addToast('Ticket marked as resolved', 'success');
    } catch (err) {
      addToast(err?.error || 'Failed to resolve ticket', 'error');
    }
  }

  return (
    <main className="app-bg" style={{ minHeight: '100vh', padding: '100px 24px 60px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '36px', color: '#fff', marginBottom: '8px' }}>
              Admin Dashboard
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '15px' }}>Manage all registered users and support tickets.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px' }}>
            <button 
              onClick={() => setActiveTab('users')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'users' ? '#3b82f6' : 'transparent', color: activeTab === 'users' ? '#fff' : '#94a3b8', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>
              Users
            </button>
            <button 
              onClick={() => setActiveTab('support')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'support' ? '#a855f7' : 'transparent', color: activeTab === 'support' ? '#fff' : '#94a3b8', fontWeight: 600, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Support Inbox
              {tickets.filter(t => t.status === 'open').length > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{tickets.filter(t => t.status === 'open').length}</span>
              )}
            </button>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
          {activeTab === 'users' ? (
            loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading users...</div>
            ) : users.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No users found.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>User</th>
                  <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Contact</th>
                  <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Joined</th>
                  <th style={{ textAlign: 'center', padding: '16px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Access</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #e50914, #ff4040)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', color: '#fff' }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: '#e2e8f0', fontSize: '14px' }}>{u.name}</p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>ID: {u.id.split('-')[0]}...</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#cbd5e1', fontSize: '13px' }}>
                      {u.email || u.phone || '—'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', 
                        background: u.role === 'admin' ? 'rgba(239,68,68,0.15)' : u.role === 'provider' ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)',
                        color: u.role === 'admin' ? '#f87171' : u.role === 'provider' ? '#38bdf8' : '#94a3b8',
                        border: `1px solid ${u.role === 'admin' ? 'rgba(239,68,68,0.3)' : u.role === 'provider' ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.1)'}`
                      }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '13px' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      {u.role !== 'admin' ? (
                        <button 
                          onClick={() => handleToggleStatus(u)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: 'none',
                            background: u.is_active === 1 ? 'rgba(220, 38, 38, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                            color: u.is_active === 1 ? '#ef4444' : '#22c55e',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {u.is_active === 1 ? 'Suspend' : 'Activate'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: 600 }}>Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )
          ) : (
            // Support Inbox Tab
            loadingTickets ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No support tickets.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {tickets.map(t => (
                  <div key={t.id} style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '24px' }}>
                    <div style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(168,85,247,0.2)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      {t.status === 'open' ? '?' : '✓'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <span style={{ color: '#fff', fontWeight: 600 }}>{t.user_name}</span>
                          <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '8px' }}>{new Date(t.created_at).toLocaleString()}</span>
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', background: t.status === 'open' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: t.status === 'open' ? '#ef4444' : '#22c55e' }}>
                          {t.status}
                        </span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                        <p style={{ margin: '0 0 8px', color: '#cbd5e1', fontSize: '14px', fontStyle: 'italic' }}>"{t.question}"</p>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}><strong>AI Replied:</strong> {t.ai_response}</p>
                      </div>
                      {t.status === 'open' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleResolveTicket(t.id)} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Mark as Resolved</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </main>
  )
}
