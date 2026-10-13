import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAppSelector } from '@/app/hooks'
import type { Permission } from '@/app/permissions'

interface Props {
  children: ReactNode
  /** User needs any of these; empty or missing = any signed-in user. */
  perms?: Permission[]
}

export default function ProtectedRoute({ children, perms }: Props) {
  const user = useAppSelector((s) => s.auth.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (perms?.length && !perms.some((p) => user.permissions.includes(p))) return <Navigate to="/" replace />
  return <>{children}</>
}
