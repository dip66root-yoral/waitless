import { SignIn } from '@clerk/clerk-react'

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', background: '#060810' }}>
      <SignIn routing="hash" />
    </div>
  )
}
