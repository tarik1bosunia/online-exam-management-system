import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { RootState } from './store';
import { logout } from './slices/authSlice';

// 1. Define the standard base query
const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:8000/api/v1', // Docker/Local Backend URL
  prepareHeaders: (headers, { getState }) => {
    // Auto-attach token to every request if it exists
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// 2. Create a custom wrapper to handle 401 errors globally
const baseQueryWithLogout: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Make the API call
  let result = await baseQuery(args, api, extraOptions);
  
  // Check if the response is 401 Unauthorized
  if (result.error && result.error.status === 401) {
    // Dispatch logout action to clear token/user from Redux & LocalStorage
    api.dispatch(logout());
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithLogout,
  tagTypes: ['Auth', 'Exam', 'Question', 'Attempt'],
  endpoints: () => ({}), 
});