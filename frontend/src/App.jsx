import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'

const Landing = React.lazy(() => import('./pages/Landing.jsx'))
const UserView = React.lazy(() => import('./pages/UserView.jsx'))
const ProviderView = React.lazy(() => import('./pages/ProviderView.jsx'))
const MovieBooking = React.lazy(() => import('./pages/MovieBooking.jsx'))
import ToastContainer from './components/ToastContainer.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

const NAV_LINKS = [
  { to: '/',         label: 'Home' },
  { to: '/user',     label: 'Book Services' },
  { to: '/provider', label: 'Dashboard' },
]

function NavBar() {
  const { pathname } = useLocation()
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '60px',
      background: 'rgba(8,9,15,0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        maxWidth: '1200px', width: '100%', margin: '0 auto',
        padding: '0 28px',
        display: 'flex', alignItems: 'center', gap: '0',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginRight: '40px', flexShrink: 0 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #e50914, #ff4040)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(229,9,20,0.4)' }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: '#fff', fontSize: '16px', lineHeight: 1 }}>W</span>
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: '#fff', fontSize: '18px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>WAITLESS</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
          {NAV_LINKS.map(({ to, label }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link key={to} to={to} style={{
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 500,
                color: isActive ? '#fff' : '#64748b',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </Link>
            )
          })}
        </div>

        {/* Divider + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '16px' }}>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
          <Link to="/user" className="btn-book" style={{ padding: '9px 22px', fontSize: '14px', textDecoration: 'none' }}>
            Book Now
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="app-bg">
          <NavBar />
          <ToastContainer />
          <Suspense fallback={<div style={{ padding: '40px', color: '#fff', textAlign: 'center' }}>Loading...</div>}>
            <Routes>
              <Route path="/"               element={<Landing />} />
              <Route path="/user"           element={<UserView />} />
              <Route path="/movie/:movieId" element={<MovieBooking />} />
              <Route path="/provider"       element={<ProviderView />} />
              <Route path="/provider/:queueId" element={<ProviderView />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </ToastProvider>
  )
}
