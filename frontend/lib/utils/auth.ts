export type UserRole = 'admin' | 'student'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
}

/** Check if any token exists in localStorage (client only). */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('access_token')
}

/** Get stored access token. */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

/** Dashboard path for a given role. */
export const getDefaultRedirectPath = (role: UserRole): string => {
  return role === 'admin' ? '/admin' : '/student'
}

/** Can this role access the given path? */
export const canAccessPath = (path: string, role: UserRole): boolean => {
  if (path.startsWith('/admin')) return role === 'admin'
  if (path.startsWith('/student')) return role === 'student'

  const publicPaths = ['/', '/login', '/register']
  return publicPaths.includes(path)
}

/** Get where to redirect a user based on role and current path. */
export const getRedirectPath = (
  currentPath: string,
  isAuthenticated: boolean,
  role: UserRole | null
): string | null => {
  const isAuthPage = ['/login', '/register'].includes(currentPath)
  const isProtectedPage = ['/admin', '/student'].some((p) =>
    currentPath.startsWith(p)
  )

  // RULE: Authenticated user should not stay on `/`
  if (isAuthenticated && role && currentPath === '/') {
    return getDefaultRedirectPath(role)
  }

  // 1) Not authenticated on a protected page
  if (!isAuthenticated && isProtectedPage) {
    return '/login'
  }

  // 2) Authenticated but on an auth page
  if (isAuthenticated && isAuthPage) {
    return role ? getDefaultRedirectPath(role) : '/'
  }

  // 3) Authenticated but on a page they don't have access to
  if (isAuthenticated && role && !canAccessPath(currentPath, role)) {
    return role ? getDefaultRedirectPath(role) : '/'
  }

  return null
}
