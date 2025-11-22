# Authentication & Routing Strategy – Complete Implementation

## 🎯 Overview

This document describes a full authentication and routing strategy for your Online Exam Management System using:

* **Next.js App Router**
* **RTK Query (authApi)**
* **Redux authSlice**
* **LocalStorage for token persistence**
* **Role-based routing** for `admin` and `student`

The goals:

1. Cleanly separate **auth logic**, **route protection**, and **UI**.
2. Support **two roles** (`admin`, `student`) with different dashboards.
3. Handle redirects for:

   * unauthenticated users
   * logged-in users visiting `/login` or `/register`
   * users hitting routes they don’t have permission for
4. Avoid infinite redirect loops and layout flashes.

---

## 🔀 Authentication States & Routing

```text
┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION STATES                    │
└─────────────────────────────────────────────────────────────┘

NOT AUTHENTICATED (Public)
    │
    ├─ / (Home/Landing)         → Accessible
    ├─ /login                   → Accessible
    └─ /register                → Accessible

AUTHENTICATED - STUDENT
    │
    ├─ /student/*               → Accessible
    ├─ /admin/*                 → Redirect → /admin or /student (depending on design)
    ├─ /login                   → Redirect → /student
    └─ /register                → Redirect → /student

AUTHENTICATED - ADMIN
    │
    ├─ /admin/*                 → Accessible
    ├─ /student/*               → Redirect → /student or /admin (depending on design)
    ├─ /login                   → Redirect → /admin
    └─ /register                → Redirect → /admin
```

> **Note:** You can choose either strict separation (`admin` cannot see `/student/*` and vice versa) or partial visibility. The utilities below assume strict separation.

---

## 📁 Recommended File Structure

```text
src/
├── middleware.ts                 # Optional: edge redirect checks
├── lib/
│   └── utils/
│       └── auth.ts               # Auth helper functions (pure)
├── lib/store/
│   ├── slices/
│   │   └── authSlice.ts          # Redux auth slice
│   └── hooks.ts                  # useAppDispatch/useAppSelector
├── lib/api/
│   └── authApi.ts                # RTK Query auth endpoints
├── hooks/
│   ├── useAuth.ts                # Central auth hook
│   └── useRequireAuth.ts         # Simple hook wrapper for pages/components
└── components/
    └── auth/
        ├── ProtectedRoute.tsx    # Route protection wrapper
        └── RoleGuard.tsx         # Role-based UI guard
```

Keep **business logic** in `lib/utils` and **React/Next logic** in `hooks` and `components`.

---

## 🔧 STEP 1 – Auth Utility Functions

**File: `src/lib/utils/auth.ts`**

```ts
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
  role: UserRole | null
): string | null => {
  const protectedRoots = ['/admin', '/student']

  // 1) Not authenticated
  if (!role) {
    if (protectedRoots.some((p) => currentPath.startsWith(p))) {
      return '/login'
    }
    return null
  }

  // 2) Authenticated – wrong area
  if (!canAccessPath(currentPath, role)) {
    return getDefaultRedirectPath(role)
  }

  // 3) Authenticated – on auth pages
  if (['/login', '/register'].includes(currentPath)) {
    return getDefaultRedirectPath(role)
  }

  return null
}
```

---

## 🧠 STEP 2 – Central `useAuth` Hook

**File: `src/hooks/useAuth.ts`**

This hook:

* Reads `user` and `token` from Redux/localStorage.
* Uses `useGetCurrentUserQuery` to fetch fresh user data when needed.
* Auto-logs out if the token is invalid.

```ts
'use client'

import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { selectCurrentUser, selectIsAuthenticated, setCredentials, logout } from '@/lib/store/slices/authSlice'
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
```

---

## 🛡️ STEP 3 – `ProtectedRoute` Wrapper

Use this at layout/page level to protect routes.

**File: `src/components/auth/ProtectedRoute.tsx`**

```ts
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
    if (isLoading) return

    const redirect = getRedirectPath(pathname, role || null)
    if (redirect) {
      router.push(redirect)
      return
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.push(redirect || '/login')
    }
  }, [isLoading, pathname, role, allowedRoles, router, isAuthenticated])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking access…</p>
        </div>
      </div>
    )
  }

  if (allowedRoles && !role) return null
  if (allowedRoles && role && !allowedRoles.includes(role)) return null

  return <>{children}</>
}
```

---

## 🎭 STEP 4 – `RoleGuard` for Conditional UI

**File: `src/components/auth/RoleGuard.tsx`**

```ts
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
```

---

## 🧱 STEP 5 – Securing Dashboards via Layouts

### Admin Layout

**File: `src/app/(dashboard)/admin/layout.tsx`**

```ts
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Navbar } from '@/components/shared/Navbar'
import { Sidebar } from '@/components/shared/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar role="admin" />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

### Student Layout

**File: `src/app/(dashboard)/student/layout.tsx`**

```ts
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Navbar } from '@/components/shared/Navbar'
import { Sidebar } from '@/components/shared/Sidebar'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar role="student" />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

---

## 🔐 STEP 6 – Login Page (Improved)

Key improvements:

* Uses **Zod** + **React Hook Form**.
* Handles **redirect after login** using `redirect` query param.
* Fetches `/auth/me` once after login and stores `user + token` in Redux.

**File: `src/app/(auth)/login/page.tsx`**

```ts
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
  const redirectTo = searchParams.get('redirect')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (isAuthenticated && role) {
      const target = redirectTo || getDefaultRedirectPath(role)
      router.push(target)
    }
  }, [isAuthenticated, role, redirectTo, router])

  const onSubmit = async (data: LoginFormData) => {
    try {
      const auth = await login({
        username: data.email,
        password: data.password,
      }).unwrap()

      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${auth.access_token}` },
      })

      if (!meRes.ok) {
        throw new Error('Failed to fetch user details')
      }

      const user = await meRes.json()
      dispatch(setCredentials({ user, token: auth.access_token }))

      toast.success(`Welcome back, ${user.full_name}!`)

      const target = redirectTo || getDefaultRedirectPath(user.role)
      router.push(target)
    } catch (err: any) {
      const message = err?.data?.detail || 'Login failed. Check your credentials.'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="student@example.com" disabled={isLoading} {...register('email')} />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" disabled={isLoading} {...register('password')} />
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in…' : 'Login'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-blue-600 hover:underline font-medium">
                  Register
                </Link>
              </p>
              <Link href="/" className="text-sm text-gray-600 hover:underline block">
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

## 🚪 STEP 7 – Logout Flow (Navbar Example)

**File: `src/components/shared/Navbar.tsx`**

```ts
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/lib/store/hooks'
import { logout } from '@/lib/store/slices/authSlice'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, Settings } from 'lucide-react'
import { toast } from 'sonner'

export function Navbar() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, role } = useAuth()

  if (!user) return null

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    router.push('/login')
  }

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

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
          <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium capitalize">
            {role}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-blue-600 text-white">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
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
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
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

## 🧩 STEP 8 – Simple `useRequireAuth` Hook (Optional)

You can use this in components where you just need a quick auth gate.

**File: `src/hooks/useRequireAuth.ts`**

```ts
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
```

---

## 📊 STEP 9 – Routing Decision Table

```text
Current Path        | Not Auth  | Student          | Admin
--------------------|-----------|------------------|-----------------
/                   | Show      | Show             | Show
/login              | Show      | → /student       | → /admin
/register           | Show      | → /student       | → /admin
/student/*          | → /login  | Show             | → /admin
/admin/*            | → /login  | → /student       | Show
```

Rules:

1. Protected routes (`/student/*`, `/admin/*`) require auth.
2. Auth pages (`/login`, `/register`) redirect away if already logged in.
3. Wrong role on a route → redirect to that role’s dashboard.

---

## ✅ Best Practices Summary

* Use **`ProtectedRoute`** for all role-specific layouts.
* Centralize auth in **`useAuth`** and **`authSlice`**.
* Use **RTK Query** for `/auth/me` and other API calls.
* Store only the **token** in `localStorage`; keep user in Redux.
* Handle **401** in `baseApi` to auto-logout on expiry.
* Always gate redirects by `isLoading` to avoid UI flicker.
* Prefer `RoleGuard` for **show/hide buttons** rather than routing.

This setup gives you a clean, extensible base for your Online Exam Management System with proper role-based auth and navigation.
