import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

/* ─── Styles ──────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#08090f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '40px 36px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '32px',
    justifyContent: 'center',
  },
  logoBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #e50914, #ff4040)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(229,9,20,0.4)',
  },
  logoText: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 900,
    fontSize: '22px',
    color: '#fff',
    letterSpacing: '0.08em',
  },
  tabs: {
    display: 'flex',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '28px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  tab: (active) => ({
    flex: 1,
    padding: '10px',
    borderRadius: '9px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    background: active ? 'rgba(229,9,20,0.15)' : 'transparent',
    color: active ? '#f87171' : '#4b5563',
    outline: active ? '1px solid rgba(229,9,20,0.3)' : 'none',
  }),
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#4b5563',
    marginBottom: '6px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '13px 16px',
    fontSize: '14px',
    color: '#e2e8f0',
    outline: 'none',
    transition: 'border 0.2s',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
  },
  btn: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    background: 'linear-gradient(135deg, #e50914, #ff4040)',
    color: '#fff',
    letterSpacing: '0.02em',
    transition: 'opacity 0.2s, transform 0.1s',
    fontFamily: "'Outfit', sans-serif",
    boxShadow: '0 4px 20px rgba(229,9,20,0.35)',
    marginTop: '8px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255,255,255,0.07)',
  },
  googleBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'all 0.2s',
    fontFamily: "'Inter', sans-serif",
    marginBottom: '20px',
  },
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={S.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...S.input,
          border: focused ? '1px solid rgba(229,9,20,0.5)' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: focused ? '0 0 0 3px rgba(229,9,20,0.08)' : 'none',
        }}
      />
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()
  const { addToast } = useToast()

  // Where to redirect after login (passed via ?next=...)
  const nextPath = new URLSearchParams(location.search).get('next') || '/'

  const [mode, setMode]           = useState('signin')  // 'signin' | 'signup'
  const [loading, setLoading]     = useState(false)

  // Sign In fields
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]     = useState('')

  // Sign Up fields
  const [name, setName]           = useState('')
  const [regIdentifier, setRegId] = useState('')   // email or phone
  const [regPassword, setRegPass] = useState('')
  const [confirm, setConfirm]     = useState('')
  const [role, setRole]           = useState('user')

  function handleGoogleLogin() {
    addToast('Google login is coming soon!', 'info')
  }

  async function handleSignIn(e) {
    e.preventDefault()
    if (!identifier.trim() || !password) return addToast('Fill all fields', 'warning')
    setLoading(true)
    try {
      const user = await login({ identifier: identifier.trim(), password })
      addToast(`Welcome back, ${user.name}! 👋`, 'success')
      navigate(user.role === 'provider' ? '/provider' : nextPath)
    } catch (err) {
      addToast(err?.error || 'Login failed', 'error')
    } finally { setLoading(false) }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    if (!name.trim() || !regIdentifier.trim() || !regPassword) return addToast('Fill all fields', 'warning')
    if (regPassword !== confirm) return addToast('Passwords do not match', 'error')
    if (regPassword.length < 6) return addToast('Password must be at least 6 characters', 'warning')

    // Detect if email or phone
    const isEmail = regIdentifier.includes('@')
    const payload = {
      name: name.trim(),
      password: regPassword,
      role,
      [isEmail ? 'email' : 'phone']: regIdentifier.trim(),
    }

    setLoading(true)
    try {
      const user = await register(payload)
      addToast(`Welcome to WAITLESS, ${user.name}! 🎉`, 'success')
      navigate(user.role === 'provider' ? '/provider' : nextPath)
    } catch (err) {
      addToast(err?.error || 'Registration failed', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div style={S.page}>
      {/* Animated background glows */}
      <div style={{ position: 'fixed', top: '10%', left: '20%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(229,9,20,0.04)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(229,9,20,0.03)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoBox}>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, color: '#fff', fontSize: '20px' }}>W</span>
          </div>
          <span style={S.logoText}>WAITLESS</span>
        </div>

        <p style={{ textAlign: 'center', color: '#4b5563', fontSize: '13px', marginBottom: '24px', marginTop: '-20px' }}>
          {mode === 'signin' ? 'Sign in to manage your queues' : 'Create your account to get started'}
        </p>

        {/* Tabs */}
        <div style={S.tabs} role="tablist">
          <button role="tab" aria-selected={mode === 'signin'} style={S.tab(mode === 'signin')} onClick={() => setMode('signin')}>Sign In</button>
          <button role="tab" aria-selected={mode === 'signup'} style={S.tab(mode === 'signup')} onClick={() => setMode('signup')}>Sign Up</button>
        </div>

        {/* ── SIGN IN FORM ── */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn}>
            <button type="button" onClick={handleGoogleLogin} style={S.googleBtn}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <div style={S.divider}>
              <div style={S.dividerLine} />
              <span style={{ fontSize: '12px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>or sign in with email</span>
              <div style={S.dividerLine} />
            </div>

            <Field label="Email or Phone" value={identifier} onChange={e => setIdentifier(e.target.value)}
              placeholder="you@email.com or +91..." autoComplete="username" />
            <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your password" autoComplete="current-password" />
            <button type="submit" disabled={loading} aria-label="Sign in"
              style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>

            <div style={S.divider}>
              <div style={S.dividerLine} />
              <span style={{ fontSize: '12px', color: '#374151' }}>new here?</span>
              <div style={S.dividerLine} />
            </div>
            <button type="button" onClick={() => setMode('signup')}
              style={{ ...S.btn, background: 'rgba(255,255,255,0.04)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', marginTop: 0 }}>
              Create Account
            </button>
          </form>
        )}

        {/* ── SIGN UP FORM ── */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp}>
            <button type="button" onClick={handleGoogleLogin} style={S.googleBtn}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <div style={S.divider}>
              <div style={S.dividerLine} />
              <span style={{ fontSize: '12px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>or create account with email</span>
              <div style={S.dividerLine} />
            </div>

            <Field label="Full Name" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your full name" autoComplete="name" />
            <Field label="Email or Phone" value={regIdentifier} onChange={e => setRegId(e.target.value)}
              placeholder="you@email.com or 9876543210" autoComplete="username" />
            <Field label="Password" type="password" value={regPassword} onChange={e => setRegPass(e.target.value)}
              placeholder="Min 6 characters" autoComplete="new-password" />
            <Field label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password" autoComplete="new-password" />

            {/* Role selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={S.label}>I am a…</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{ val: 'user', icon: '👤', label: 'Customer' }, { val: 'provider', icon: '🏢', label: 'Service Provider' }].map(r => (
                  <button key={r.val} type="button" onClick={() => setRole(r.val)}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: role === r.val ? '1px solid rgba(229,9,20,0.4)' : '1px solid rgba(255,255,255,0.07)', background: role === r.val ? 'rgba(229,9,20,0.1)' : 'rgba(255,255,255,0.03)', color: role === r.val ? '#f87171' : '#4b5563', transition: 'all 0.2s' }}>
                    {r.icon} {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} aria-label="Create account"
              style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
