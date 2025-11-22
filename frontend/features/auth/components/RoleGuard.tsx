'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/lib/utils/auth'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { role } = useAuth()

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}