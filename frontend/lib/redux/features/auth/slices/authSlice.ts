import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

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