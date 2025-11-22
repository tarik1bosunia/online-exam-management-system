import { baseApi } from './baseApi'

export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];


export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  role: UserRole
}


export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}


export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: new URLSearchParams({
          username: credentials.username,
          password: credentials.password,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
      invalidatesTags: ['User'],
    }),
    
    register: builder.mutation<User, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
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