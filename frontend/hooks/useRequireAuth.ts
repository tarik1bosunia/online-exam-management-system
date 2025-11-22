'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'
import { UserRole } from '@/lib/utils/auth'
import { toast } from 'sonner'

export function useRequireAuth(requiredRole?: UserRole) {
  const router = useRouter()
  const { isAuthenticated, role, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      toast.error('Please login to continue')
      router.push('/login')
      return
    }

    if (requiredRole && role !== requiredRole) {
      toast.error('Access denied')
      const fallback = role === 'admin' ? '/admin' : '/student'
      router.push(fallback)
    }
  }, [isAuthenticated, role, requiredRole, isLoading, router])

  return { isAuthenticated, role, isLoading }
}