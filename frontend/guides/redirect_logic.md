# Authentication & Routing Strategy - Complete Implementation

## 🎯 **Authentication Flow Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION STATES                      │
└─────────────────────────────────────────────────────────────┘

NOT AUTHENTICATED (Public)
    │
    ├─ / (Home/Landing)         → Accessible
    ├─ /login                   → Accessible
    └─ /register                → Accessible

AUTHENTICATED - STUDENT
    │
    ├─ /student/*               → Accessible
    ├─ /admin/*                 → Redirect to /student
    ├─ /login                   → Redirect to /student
    └─ /register                → Redirect to /student

AUTHENTICATED - ADMIN
    │
    ├─ /admin/*                 → Accessible
    ├─ /student/*               → Redirect to /admin
    ├─ /login                   → Redirect to /admin
    └─ /register                → Redirect to /admin
```

---

## 📁 **File Structure for Auth Routing**

```
src/
├── middleware.ts                    # Next.js middleware (optional)
├── components/
│   └── auth/
│       ├── ProtectedRoute.tsx      # Route protection wrapper
│       ├── RoleGuard.tsx           # Role-based guard
│       └── AuthProvider.tsx        # Auth context provider
├── hooks/
│   ├── useAuth.ts                  # Auth hook
│   └── useRequireAuth.ts           # Auth requirement hook
└── lib/
    └── utils/
        └── auth.ts                 # Auth utility functions
```

---

## 🔧 **STEP 1: Auth Utility Functions**

**File: `src/lib/utils/auth.ts`**

```typescript
/**
 * Authentication utility functions
 * Centralized auth logic for consistency
 */

export type UserRole = 'admin' | 'student'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('access_token')
}

/**
 * Get stored token
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

/**
 * Get redirect path based on user role
 */
export const getDefaultRedirectPath = (role: UserRole): string => {
  return role === 'admin' ? '/admin' : '/student'
}

/**
 * Check if current path is accessible by role
 */
export const canAccessPath = (path: string, role: UserRole): boolean => {
  // Admin paths
  if (path.startsWith('/admin')) {
    return role === 'admin'
  }
  
  // Student paths
  if (path.startsWith('/student')) {
    return role === 'student'
  }
  
  // Public paths (accessible by all)
  const publicPaths = ['/', '/login', '/register']
  return publicPaths.includes(path)
}

/**
 * Get redirect path if user can't access current path
 */
export const getRedirectPath = (
  currentPath: string,
  role: UserRole | null
): string | null => {
  // Not authenticated - redirect auth pages based on current location
  if (!role) {
    const protectedPaths = ['/admin', '/student']
    if (protectedPaths.some(p => currentPath.startsWith(p))) {
      return '/login'
    }
    return null // Public page, no redirect needed
  }

  // Authenticated - check role access
  if (!canAccessPath(currentPath, role)) {
    return getDefaultRedirectPath(role)
  }

  // On auth pages while authenticated - redirect to dashboard
  if (['/login', '/register'].includes(currentPath)) {
    return getDefaultRedirectPath(role)
  }

  return null // No redirect needed
}
```

---

## 🪝 **STEP 2: Custom Auth Hook**

**File: `src/hooks/useAuth.ts`**

```typescript
'use client'

import { useAppSelector } from '@/lib/store/hooks'
import { selectCurrentUser, selectIsAuthenticated } from '@/lib/store/slices/authSlice'
import { useGetCurrentUserQuery } from '@/lib/api/authApi'
import { useEffect } from 'react'
import { useAppDispatch } from '@/lib/store/hooks'
import { setCredentials, logout } from '@/lib/store/slices/authSlice'
import { getToken } from '@/lib/utils/auth'

/**
 * Hook to get current authentication state
 * Automatically fetches user if token exists but user not loaded
 */
export function useAuth() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const token = getToken()

  // Auto-fetch user if token exists but user not loaded
  const { data: fetchedUser, isLoading, error } = useGetCurrentUserQuery(
    undefined,
    {
      skip: !token || !!user, // Skip if no token or user already loaded
    }
  )

  useEffect(() => {
    if (fetchedUser && token && !user) {
      // User fetched successfully, update Redux
      dispatch(setCredentials({ user: fetchedUser, token }))
    }
    
    if (error) {
      // Token invalid or expired
      dispatch(logout())
    }
  }, [fetchedUser, token, user, error, dispatch])

  return {
    user,
    isAuthenticated: !!token && !!user,
    isLoading,
    role: user?.role,
  }
}
```

---

## 🛡️ **STEP 3: Protected Route Component**

**File: `src/components/auth/ProtectedRoute.tsx`**

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getRedirectPath } from '@/lib/utils/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'student')[]
}

/**
 * Protects routes based on authentication and role
 * Redirects unauthorized users appropriately
 */
export function ProtectedRoute({ 
  children, 
  allowedRoles 
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, role } = useAuth()

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return

    // Check if redirect needed
    const redirectPath = getRedirectPath(pathname, role || null)
    
    if (redirectPath) {
      router.push(redirectPath)
      return
    }

    // Additional role check
    if (allowedRoles && role && !allowedRoles.includes(role)) {
      const defaultPath = role === 'admin' ? '/admin' : '/student'
      router.push(defaultPath)
    }
  }, [isAuthenticated, isLoading, role, pathname, allowedRoles, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated and trying to access protected route
  if (!isAuthenticated && allowedRoles) {
    return null // Will redirect via useEffect
  }

  // Authenticated but wrong role
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}
```

---

## 🎨 **STEP 4: Role-Based Guard Component**

**File: `src/components/auth/RoleGuard.tsx`**

```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { ReactNode } from 'react'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: ('admin' | 'student')[]
  fallback?: ReactNode
}

/**
 * Conditionally renders children based on user role
 * Useful for showing/hiding UI elements
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleGuardProps) {
  const { role } = useAuth()

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
```

---

## 📄 **STEP 5: Admin Layout with Protection**

**File: `src/app/(dashboard)/admin/layout.tsx`**

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Navbar } from '@/components/shared/Navbar'
import { Sidebar } from '@/components/shared/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar role="admin" />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

---

## 📄 **STEP 6: Student Layout with Protection**

**File: `src/app/(dashboard)/student/layout.tsx`**

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Navbar } from '@/components/shared/Navbar'
import { Sidebar } from '@/components/shared/Sidebar'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar role="student" />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

---

## 🔄 **STEP 7: Enhanced Login with Redirect**

**File: `src/app/(auth)/login/page.tsx` (Updated)**

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useLoginMutation } from '@/lib/api/authApi'
import { useAppDispatch } from '@/lib/store/hooks'
import { setCredentials } from '@/lib/store/slices/authSlice'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRedirectPath } from '@/lib/utils/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const { isAuthenticated, role } = useAuth()
  const [login, { isLoading }] = useLoginMutation()
  
  // Get redirect URL from query params (optional)
  const redirectTo = searchParams.get('redirect')
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      const path = redirectTo || getDefaultRedirectPath(role)
      router.push(path)
    }
  }, [isAuthenticated, role, redirectTo, router])

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Login
      const result = await login({
        username: data.email,
        password: data.password,
      }).unwrap()

      // Fetch user details
      const userResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${result.access_token}`,
          },
        }
      )
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user details')
      }

      const user = await userResponse.json()

      // Update Redux
      dispatch(setCredentials({ user, token: result.access_token }))
      
      toast.success(`Welcome back, ${user.full_name}!`)

      // Redirect based on role or query param
      const path = redirectTo || getDefaultRedirectPath(user.role)
      router.push(path)
      
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.data?.detail || 'Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                disabled={isLoading}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={isLoading}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  href="/register" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  Register
                </Link>
              </p>
              
              <Link 
                href="/" 
                className="text-sm text-gray-600 hover:underline block"
              >
                ← Back to Home
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🚪 **STEP 8: Logout Functionality**

**File: `src/components/shared/Navbar.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/lib/store/hooks'
import { logout } from '@/lib/store/slices/authSlice'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, Settings } from 'lucide-react'
import { toast } from 'sonner'

export function Navbar() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, role } = useAuth()

  const handleLogout = () => {
    // Clear Redux state and localStorage
    dispatch(logout())
    
    // Show toast
    toast.success('Logged out successfully')
    
    // Redirect to login
    router.push('/login')
  }

  if (!user) return null

  const getInitials = () => {
    return user.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const dashboardPath = role === 'admin' ? '/admin' : '/student'

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href={dashboardPath} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">E</span>
          </div>
          <h1 className="text-xl font-bold">Exam System</h1>
        </Link>

        <div className="flex items-center gap-4">
          {/* Role Badge */}
          <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium capitalize">
            {role}
          </span>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link href={dashboardPath} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
```

---

## 🔒 **STEP 9: Session Management Hook**

**File: `src/hooks/useRequireAuth.ts`**

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth(requiredRole?: 'admin' | 'student') {
  const router = useRouter()
  const { isAuthenticated, role, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    // Not authenticated
    if (!isAuthenticated) {
      toast.error('Please login to continue')
      router.push('/login')
      return
    }

    // Wrong role
    if (requiredRole && role !== requiredRole) {
      toast.error('Access denied')
      const redirectPath = role === 'admin' ? '/admin' : '/student'
      router.push(redirectPath)
    }
  }, [isAuthenticated, role, requiredRole, isLoading, router])

  return { isAuthenticated, role, isLoading }
}
```

---

## 🎯 **STEP 10: Complete Routing Matrix**

```typescript
/**
 * ROUTING DECISION TABLE
 * 
 * Current Path        | Not Auth  | Student   | Admin
 * --------------------|-----------|-----------|----------
 * /                   | ✓ Show    | ✓ Show    | ✓ Show
 * /login              | ✓ Show    | → /student| → /admin
 * /register           | ✓ Show    | → /student| → /admin
 * /student/*          | → /login  | ✓ Show    | → /admin
 * /admin/*            | → /login  | → /student| ✓ Show
 * 
 * REDIRECT PRIORITY:
 * 1. Not authenticated on protected route → /login
 * 2. Authenticated on auth page → Dashboard
 * 3. Wrong role on role-specific route → Correct dashboard
 */
```

---

## 📋 **STEP 11: Usage Examples**

### **Example 1: Simple Page Protection**

```typescript
// src/app/(dashboard)/student/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function StudentDashboard() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div>Student Dashboard Content</div>
    </ProtectedRoute>
  )
}
```

### **Example 2: Conditional UI Rendering**

```typescript
import { RoleGuard } from '@/components/auth/RoleGuard'
import { useAuth } from '@/hooks/useAuth'

export function Header() {
  const { user } = useAuth()

  return (
    <header>
      <h1>Welcome, {user?.full_name}</h1>
      
      {/* Show only to admins */}
      <RoleGuard allowedRoles={['admin']}>
        <Button>Create Exam</Button>
      </RoleGuard>
      
      {/* Show only to students */}
      <RoleGuard allowedRoles={['student']}>
        <Button>View Available Exams</Button>
      </RoleGuard>
    </header>
  )
}
```

### **Example 3: Programmatic Auth Check**

```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export function MyComponent() {
  const { isAuthenticated, role } = useAuth()
  const router = useRouter()

  const handleAction = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/student/exams')
      return
    }

    if (role === 'student') {
      // Proceed with action
    }
  }

  return <button onClick={handleAction}>Take Exam</button>
}
```

---

## ✅ **Complete Authentication Flow Checklist**

```bash
✅ User visits /login
✅ Submits credentials
✅ Backend validates and returns JWT
✅ Frontend stores token in localStorage
✅ Redux state updated with user info
✅ Redirects to role-appropriate dashboard
✅ Protected routes check authentication
✅ Wrong role attempts redirect correctly
✅ Logout clears state and redirects to login
✅ Token expiry (401) triggers logout
✅ Page refresh preserves auth state
✅ Browser back/forward works correctly
```

---

## 🚨 **Common Pitfalls & Solutions**

### **Problem 1: Infinite Redirect Loop**

```typescript
// ❌ BAD: Can cause infinite redirects
useEffect(() => {
  if (!isAuthenticated) {
    router.push('/login')
  }
}, []) // Missing dependencies

// ✅ GOOD: Proper dependency array
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push('/login')
  }
}, [isLoading, isAuthenticated, router])
```

### **Problem 2: Flash of Wrong Content**

```typescript
// ❌ BAD: Shows content before redirect
export default function AdminPage() {
  const { role } = useAuth()
  
  if (role !== 'admin') {
    redirect('/student') // Content already rendered!
  }
  
  return <div>Admin Content</div>
}

// ✅ GOOD: Use ProtectedRoute wrapper
export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div>Admin Content</div>
    </ProtectedRoute>
  )
}
```

### **Problem 3: localStorage SSR Error**

```typescript
// ❌ BAD: Crashes on server
const token = localStorage.getItem('token')

// ✅ GOOD: Check for window
const token = typeof window !== 'undefined' 
  ? localStorage.getItem('token') 
  : null
```

---

## 🎯 **Best Practices Summary**

1. **Always use `ProtectedRoute` wrapper** for protected pages
2. **Check `isLoading` before redirecting** to avoid flashing
3. **Store minimal data in localStorage** (only token)
4. **Keep user data in Redux** for easy access
5. **Handle 401 errors globally** in base API
6. **Show loading states** during auth checks
7. **Clear all state on logout** (Redux + localStorage)
8. **Use `useAuth` hook** for consistent auth access
9. **Implement proper error handling** for network failures
10. **Test all navigation paths** (forward, back, refresh)

This architecture provides **secure, user-friendly authentication** with proper redirects! 🚀