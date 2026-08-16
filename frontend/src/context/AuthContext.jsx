import { createContext, useContext } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'

const AuthContext = createContext(null)

/** Provides auth state mapped from Clerk to the component tree. */
export function AuthProvider({ children }) {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const loading = !isLoaded

  const mappedUser = user ? {
    id: user.id,
    name: user.fullName || user.firstName || 'User',
    email: user.primaryEmailAddress?.emailAddress,
    role: user.publicMetadata?.role || 'user'
  } : null

  return (
    <AuthContext.Provider value={{ user: mappedUser, loading, login: () => {}, register: () => {}, logout: () => signOut() }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext
