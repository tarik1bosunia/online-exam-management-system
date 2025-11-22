import { createApi, fetchBaseQuery, FetchArgs, BaseQueryApi } from '@reduxjs/toolkit/query/react'
import { RootState } from '@/lib/redux/store'

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

const baseQueryWithReauth = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: {}
) => {
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