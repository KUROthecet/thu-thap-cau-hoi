import { Navigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

interface ProtectedRouteProps {
  allowedRole: 'admin' | 'doctor'
  children: React.ReactNode
}

export default function ProtectedRoute({ allowedRole, children }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }
  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/workspace'} replace />
  }
  return <>{children}</>
}
