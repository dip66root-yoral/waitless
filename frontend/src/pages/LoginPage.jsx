import { SignIn } from '@clerk/clerk-react'

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', paddingTop: '60px' }}>
      <SignIn />
    </div>
  )
}
