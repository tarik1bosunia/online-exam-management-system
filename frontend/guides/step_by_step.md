# Next.js Frontend - Complete Implementation Guide

## 📋 Prerequisites Checklist

```bash
✅ Next.js 15+ project initialized
✅ Dependencies installed:
   - @reduxjs/toolkit
   - react-redux
   - axios
   - tailwindcss
   - shadcn/ui components
   - react-hook-form
   - zod
   - date-fns
   - sonner (toast notifications)
```

---

## 🎯 Implementation Roadmap

```
PHASE 1: Foundation (Steps 1-5)
  → Configuration & Setup
  → Redux Store Setup
  → API Configuration

PHASE 2: Authentication (Steps 6-10)
  → Auth API & Slice
  → Login/Register Pages
  → Protected Routes

PHASE 3: Admin Features (Steps 11-15)
  → Question Management
  → Exam Management
  → Excel Import

PHASE 4: Student Features (Steps 16-20)
  → Exam Taking Interface
  → Timer & Auto-Save
  → Resume Functionality

PHASE 5: Results & Polish (Steps 21-25)
  → Results Display
  → UI Components
  → Testing & Refinement
```

---

## 📁 STEP 1: Project Structure Setup

**Create the following folder structure:**

```bash
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── questions/
│   │   │   │   └── page.tsx
│   │   │   └── exams/
│   │   │       ├── page.tsx
│   │   │       └── create/
│   │   │           └── page.tsx
│   │   └── student/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── exams/
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── take/
│   │       │           └── page.tsx
│   │       └── results/
│   │           ├── page.tsx
│   │           └── [id]/
│   │               └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── auth/
│   ├── admin/
│   ├── student/
│   ├── shared/
│   └── ui/
├── lib/
│   ├── store/
│   │   ├── store.ts
│   │   ├── hooks.ts
│   │   └── slices/
│   ├── api/
│   └── utils/
└── hooks/
```

**Terminal Commands:**

```bash
# Create all directories at once
mkdir -p src/app/\(auth\)/{login,register}
mkdir -p src/app/\(dashboard\)/admin/{questions,exams/create}
mkdir -p src/app/\(dashboard\)/student/{exams/\[id\]/take,results/\[id\]}
mkdir -p src/components/{auth,admin,student,shared,ui}
mkdir -p src/lib/{store/slices,api,utils}
mkdir -p src/hooks
```

---

## ⚙️ STEP 2: Environment Configuration

**File: `.env.local`**

```bash
# Create this file in project root
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME=Exam Management System
NEXT_PUBLIC_AUTO_SAVE_INTERVAL=30000
```

**File: `next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
```

---

## 🎨 STEP 3: Global Styles & Tailwind

**File: `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 🏪 STEP 4: Redux Store Configuration

**File: `src/lib/store/store.ts`**

```typescript
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { baseApi } from '@/lib/api/baseApi'
import authReducer from './slices/authSlice'
import examReducer from './slices/examSlice'
import uiReducer from './slices/uiSlice'

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: authReducer,
      exam: examReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  })

  setupListeners(store.dispatch)
  return store
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
```

**File: `src/lib/store/hooks.ts`**

```typescript
import { useDispatch, useSelector, useStore } from 'react-redux'
import type { AppDispatch, AppStore, RootState } from './store'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
```

---

## 🔌 STEP 5: Base API Configuration

**File: `src/lib/api/baseApi.ts`**

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { RootState } from '@/lib/store/store'

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions)
  
  if (result.error && result.error.status === 401) {
    // Token expired - redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
  
  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Question', 'Exam', 'StudentExam', 'Result'],
  endpoints: () => ({}),
})
```

---

## 🔐 STEP 6: Auth Slice

**File: `src/lib/store/slices/authSlice.ts`**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'student'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// Load token from localStorage on init
const getInitialToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

const initialState: AuthState = {
  user: null,
  token: getInitialToken(),
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', action.payload.token)
      }
    },
    
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
      }
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => 
  state.auth.isAuthenticated
export const selectUserRole = (state: { auth: AuthState }) => 
  state.auth.user?.role
```

---

## 🎓 STEP 7: Exam Slice (For taking exams)

**File: `src/lib/store/slices/examSlice.ts`**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ExamState {
  currentExamId: string | null
  studentExamId: string | null
  answers: Record<string, any>
  timeRemaining: number | null
  isSubmitting: boolean
  lastSaved: string | null
}

const initialState: ExamState = {
  currentExamId: null,
  studentExamId: null,
  answers: {},
  timeRemaining: null,
  isSubmitting: false,
  lastSaved: null,
}

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    startExam: (
      state,
      action: PayloadAction<{
        examId: string
        studentExamId: string
        timeRemaining: number
      }>
    ) => {
      state.currentExamId = action.payload.examId
      state.studentExamId = action.payload.studentExamId
      state.timeRemaining = action.payload.timeRemaining
      state.answers = {}
    },
    
    saveAnswer: (
      state,
      action: PayloadAction<{ questionId: string; answer: any }>
    ) => {
      state.answers[action.payload.questionId] = action.payload.answer
      state.lastSaved = new Date().toISOString()
    },
    
    loadSavedAnswers: (
      state,
      action: PayloadAction<Record<string, any>>
    ) => {
      state.answers = action.payload
    },
    
    decrementTime: (state) => {
      if (state.timeRemaining && state.timeRemaining > 0) {
        state.timeRemaining -= 1
      }
    },
    
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload
    },
    
    resetExam: (state) => {
      state.currentExamId = null
      state.studentExamId = null
      state.answers = {}
      state.timeRemaining = null
      state.isSubmitting = false
      state.lastSaved = null
    },
  },
})

export const {
  startExam,
  saveAnswer,
  loadSavedAnswers,
  decrementTime,
  setSubmitting,
  resetExam,
} = examSlice.actions

export default examSlice.reducer

export const selectCurrentAnswer = (questionId: string) => 
  (state: { exam: ExamState }) => state.exam.answers[questionId]

export const selectAllAnswers = (state: { exam: ExamState }) => 
  state.exam.answers

export const selectTimeRemaining = (state: { exam: ExamState }) => 
  state.exam.timeRemaining
```

---

## 🎨 STEP 8: UI Slice (For global UI state)

**File: `src/lib/store/slices/uiSlice.ts`**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarOpen: boolean
  loading: boolean
}

const initialState: UIState = {
  sidebarOpen: true,
  loading: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const { toggleSidebar, setLoading } = uiSlice.actions
export default uiSlice.reducer
```

---

## 🌐 STEP 9: Auth API Endpoints

**File: `src/lib/api/authApi.ts`**

```typescript
import { baseApi } from './baseApi'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'student'
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'student'
  is_active: boolean
  created_at: string
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: new URLSearchParams(credentials),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    }),
    
    register: builder.mutation<User, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
} = authApi
```

---

## 📚 STEP 10: Participation API (Exam Taking)

**File: `src/lib/api/participationApi.ts`**

```typescript
import { baseApi } from './baseApi'

export interface AvailableExam {
  exam_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  duration_minutes: number
  question_count: number
  total_score: number
  status: 'not_started' | 'in_progress' | 'submitted' | 'expired'
  can_start: boolean
  can_resume: boolean
}

export interface ExamStartResponse {
  student_exam_id: string
  exam: any
  started_at: string
  deadline: string
}

export interface SaveAnswerRequest {
  student_exam_id: string
  question_id: string
  answer: any
}

export interface ResumeExamResponse {
  student_exam_id: string
  exam: any
  started_at: string
  deadline: string
  saved_answers: Record<string, any>
  time_remaining_seconds: number
}

export interface SubmitExamResponse {
  success: boolean
  student_exam_id: string
  submitted_at: string
  total_score: number
  max_possible_score: number
  percentage: number
  graded_count: number
  pending_count: number
  results: any[]
}

export const participationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAvailableExams: builder.query<AvailableExam[], void>({
      query: () => '/participation/available',
      providesTags: ['StudentExam'],
    }),
    
    startExam: builder.mutation<ExamStartResponse, string>({
      query: (examId) => ({
        url: `/participation/start/${examId}`,
        method: 'POST',
      }),
      invalidatesTags: ['StudentExam'],
    }),
    
    saveAnswer: builder.mutation<any, SaveAnswerRequest>({
      query: (data) => ({
        url: '/participation/save-answer',
        method: 'POST',
        body: data,
      }),
    }),
    
    resumeExam: builder.query<ResumeExamResponse, string>({
      query: (examId) => `/participation/resume/${examId}`,
    }),
    
    submitExam: builder.mutation<SubmitExamResponse, string>({
      query: (studentExamId) => ({
        url: `/participation/submit/${studentExamId}`,
        method: 'POST',
      }),
      invalidatesTags: ['StudentExam', 'Result'],
    }),
  }),
})

export const {
  useGetAvailableExamsQuery,
  useStartExamMutation,
  useSaveAnswerMutation,
  useResumeExamQuery,
  useSubmitExamMutation,
} = participationApi
```

---

## 🎯 STEP 11: Root Layout & Providers

**File: `src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Online Exam Management System',
  description: 'Complete exam management with auto-grading',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
```

**File: `src/app/providers.tsx`**

```typescript
'use client'

import { useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from '@/lib/store/store'

export function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>()
  
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}
```

---

## 🏠 STEP 12: Home/Landing Page

**File: `src/app/page.tsx`**

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Online Exam Management System
        </h1>
        
        <p className="text-xl text-gray-600 mb-12">
          Complete exam platform with auto-grading, auto-save, and resume functionality
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="px-8">
              Login
            </Button>
          </Link>
          
          <Link href="/register">
            <Button size="lg" variant="outline" className="px-8">
              Register
            </Button>
          </Link>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">⚡ Auto-Save</h3>
            <p className="text-gray-600">
              Your answers are automatically saved every 30 seconds
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">🔄 Resume Anytime</h3>
            <p className="text-gray-600">
              Browser crashed? Resume your exam from where you left off
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">⚡ Instant Results</h3>
            <p className="text-gray-600">
              Get your scores immediately after submission
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 🔑 STEP 13: Login Page

**File: `src/app/(auth)/login/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useLoginMutation } from '@/lib/api/authApi'
import { useAppDispatch } from '@/lib/store/hooks'
import { setCredentials } from '@/lib/store/slices/authSlice'
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
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
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
      
      const user = await userResponse.json()

      dispatch(setCredentials({ user, token: result.access_token }))
      toast.success('Login successful!')

      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/student')
      }
    } catch (error: any) {
      toast.error(error.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
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
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:underline">
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## ✍️ CHECKPOINT 1: Test Authentication

**At this point, you should be able to:**

```bash
✅ Run: npm run dev
✅ Visit: http://localhost:3000
✅ See home page with Login/Register buttons
✅ Click Login → See login form
✅ Try logging in (should connect to backend)
✅ Check Redux DevTools (see auth state update)
✅ Check localStorage (see access_token saved)
```

**If issues occur:**
- Check backend is running on port 8000
- Check NEXT_PUBLIC_API_URL in .env.local
- Check browser console for errors
- Check Network tab for API calls

---

## 📝 NEXT STEPS PREVIEW

**Steps 14-25 will cover:**
- Register page (similar to login)
- Protected route wrapper
- Student dashboard
- Exam taking interface with timer
- Auto-save hook implementation
- Resume functionality
- Admin pages (question/exam management)
- Results display
- UI polish

**Continue to Part 2?** Let me know and I'll provide Steps 14-25! 🚀

---

## 💡 Quick Tips

1. **Test frequently**: After each step, test in browser
2. **Use Redux DevTools**: Monitor state changes
3. **Check Network tab**: Verify API calls
4. **Console logs**: Add `console.log()` for debugging
5. **Git commits**: Commit after each working step

**You're making great progress! 🎉**