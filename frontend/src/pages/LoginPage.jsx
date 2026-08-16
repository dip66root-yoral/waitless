import { SignIn } from '@clerk/clerk-react'

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060810', paddingTop: '60px' }}>
      <SignIn path="/login" routing="path" signUpUrl="/login" />
    </div>
  )
}
