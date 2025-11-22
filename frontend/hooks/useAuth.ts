'use client'

import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { selectCurrentUser, selectIsAuthenticated, setCredentials, logout } from '@/lib/redux/features/auth/slices/authSlice'
import { useGetCurrentUserQuery } from '@/lib/api/authApi'
import { getToken } from '@/lib/utils/auth'

export function useAuth() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const isAuthFlag = useAppSelector(selectIsAuthenticated)
  const token = getToken()

  const { data: fetchedUser, isLoading, error } = useGetCurrentUserQuery(
    undefined,
    {
      skip: !token || !!user,
    }
  )

  useEffect(() => {
    if (fetchedUser && token && !user) {
      dispatch(setCredentials({ user: fetchedUser, token }))
    }

    if (error) {
      dispatch(logout())
    }
  }, [fetchedUser, token, user, error, dispatch])

  return {
    user,
    role: user?.role,
    isAuthenticated: !!token && !!user && isAuthFlag,
    isLoading,
  }
}