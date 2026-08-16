import { SignIn, SignInButton } from '@clerk/clerk-react'

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#060810', paddingTop: '60px' }}>
      <h2 style={{ color: 'white', marginBottom: '20px', fontFamily: 'Outfit, sans-serif' }}>Welcome to Waitless</h2>
      <SignInButton mode="modal">
        <button style={{ padding: '12px 24px', fontSize: '16px', background: '#e50914', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Sign In / Register
        </button>
      </SignInButton>
    </div>
  )
}
