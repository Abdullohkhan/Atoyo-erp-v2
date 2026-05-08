import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import type { UserRole } from './authSlice'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const user = useAppSelector((s) => s.auth.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
