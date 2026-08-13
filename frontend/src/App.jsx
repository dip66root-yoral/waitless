import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { LocationProvider, useLocation as useCityLocation } from './context/LocationContext.jsx'
import ToastContainer from './components/ToastContainer.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import AIHelpWidget from './components/AIHelpWidget.jsx'

const Landing      = React.lazy(() => import('./pages/Landing.jsx'))
const UserView     = React.lazy(() => import('./pages/UserView.jsx'))
const ProviderView = React.lazy(() => import('./pages/ProviderView.jsx'))
const MovieBooking = React.lazy(() => import('./pages/MovieBooking.jsx'))
const StadiumBooking = React.lazy(() => import('./pages/StadiumBooking.jsx'))
const LoginPage    = React.lazy(() => import('./pages/LoginPage.jsx'))
const AdminView    = React.lazy(() => import('./pages/AdminView.jsx'))
const UserProfile  = React.lazy(() => import('./pages/UserProfile.jsx'))
const AllMovies    = React.lazy(() => import('./pages/AllMovies.jsx'))

/** Redirects to /login if user is not authenticated */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  if (loading) return null
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />
  return children
}

const NAV_LINKS = [
  { to: '/',         label: 'Home' },
  { to: '/user',     label: 'Book Services' },
  { to: '/provider', label: 'Dashboard' },
]

function NavBar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const { city, CITIES, changeCity } = useCityLocation()
  const [showCities, setShowCities] = React.useState(false)

  return (
    <nav className="responsive-navbar" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '60px',
      background: 'rgba(6,8,16,0.82)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center',
    }}>
      <div className="responsive-navbar-inner responsive-padding" style={{
        maxWidth: '1200px', width: '100%', margin: '0 auto',
        padding: '0 28px',
        display: 'flex', alignItems: 'center', gap: '0',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginRight: '40px', flexShrink: 0 }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #e50914 0%, #ff4040 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(229,9,20,0.45)', border: '1px solid rgba(255,100,100,0.2)' }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: '#fff', fontSize: '16px', lineHeight: 1 }}>W</span>
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: '#fff', fontSize: '18px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>WAITLESS</span>
        </Link>

        {/* Location Selector */}
        <div style={{ position: 'relative', marginRight: '24px' }}>
          <button onClick={() => setShowCities(!showCities)} style={{ display:'flex', alignItems:'center', gap:'6px', background: showCities ? 'rgba(229,9,20,0.1)' : 'rgba(255,255,255,0.04)', border:'1px solid ' + (showCities ? 'rgba(229,9,20,0.25)' : 'rgba(255,255,255,0.07)'), color:'#e2e8f0', cursor:'pointer', fontSize:'13px', fontWeight:600, padding:'6px 14px', borderRadius:'99px', transition: 'all 0.2s ease' }}>
            📍 <span style={{ color:'#f87171' }}>{city}</span> <span style={{ color: '#4b5563' }}>▾</span>
          </button>
          {showCities && (
            <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, background:'rgba(14,16,26,0.95)', backdropFilter: 'blur(20px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'8px', zIndex:50, minWidth:'160px', boxShadow:'0 16px 40px rgba(0,0,0,0.6)' }}>
              {CITIES.map(c => (
                <button key={c} onClick={() => { changeCity(c); setShowCities(false) }} style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 14px', background: city===c?'rgba(229,9,20,0.12)':'transparent', color: city===c?'#f87171':'#94a3b8', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight: city===c ? 700 : 400, transition: 'all 0.15s' }}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nav links */}
        <div className="responsive-navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
          {NAV_LINKS.map(({ to, label }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link key={to} to={to} style={{
                textDecoration: 'none',
                padding: '7px 16px',
                borderRadius: '99px',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#fff' : '#4b5563',
                background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side: auth buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" style={{ color: '#f87171', fontSize: '13px', fontWeight: 700, textDecoration: 'none', padding: '7px 14px', borderRadius: '99px', background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.2)' }}>Owner Dashboard</Link>
              )}
              {user.role === 'provider' && (
                <Link to="/provider" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Dashboard</Link>
              )}
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #e50914, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 800, boxShadow: '0 0 0 2px rgba(229,9,20,0.3)' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </Link>
              <button onClick={handleLogout} style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '99px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#4b5563', cursor: 'pointer', transition: 'all 0.2s' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ padding: '7px 18px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', borderRadius: '99px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', transition: 'all 0.2s' }}>
                Sign In
              </Link>
              <Link to="/user" className="btn-book" style={{ padding: '8px 22px', fontSize: '14px', textDecoration: 'none', borderRadius: '99px' }}>
                Book Now
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

/** Suspense loading fallback */
function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090f' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(229,9,20,0.3)', borderTop: '3px solid #e50914', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontSize: '13px' }}>Loading…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  return (
    <LocationProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <div className="app-bg">
              <NavBar />
              <ToastContainer />
              <AIHelpWidget />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/"                   element={<Landing />} />
                  <Route path="/movies"             element={<AllMovies />} />
                  <Route path="/login"              element={<LoginPage />} />
                  <Route path="/profile"            element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                  <Route path="/user"               element={<ProtectedRoute><UserView /></ProtectedRoute>} />
                  <Route path="/user/:queueId"      element={<ProtectedRoute><UserView /></ProtectedRoute>} />
                  <Route path="/movie/:movieId"     element={<ProtectedRoute><MovieBooking /></ProtectedRoute>} />
                  <Route path="/stadiums"           element={<ProtectedRoute><StadiumBooking /></ProtectedRoute>} />
                  <Route path="/provider"           element={<ProtectedRoute><ProviderView /></ProtectedRoute>} />
                  <Route path="/provider/:queueId"  element={<ProtectedRoute><ProviderView /></ProtectedRoute>} />
                  <Route path="/admin"              element={<ProtectedRoute><AdminView /></ProtectedRoute>} />
                  <Route path="*"                   element={<Navigate to="/" />} />
                </Routes>
              </Suspense>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </LocationProvider>
  )
}
