'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getRedirectPath, UserRole } from '@/lib/utils/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, role } = useAuth()

  useEffect(() => {
    if (isLoading || pathname === null) return

    const redirect = getRedirectPath(pathname, isAuthenticated as boolean, role as UserRole | null)
    if (redirect) {
      router.replace(redirect)
      return
    }

    if (allowedRoles && role && !allowedRoles.includes(role as UserRole)) {
      router.replace(getRedirectPath(pathname, isAuthenticated as boolean, role as UserRole | null) || '/')
      return
    }
  }, [isLoading, pathname, role, allowedRoles, router, isAuthenticated])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Checking access…</p>
        </div>
      </div>
    )
  }


  return <>{children}</>
}