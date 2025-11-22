import { api } from '../api';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        // We send Form Data to match the backend's OAuth2 requirement
        body: new URLSearchParams(credentials), 
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    }),
    signup: builder.mutation({
      query: (data) => ({
        url: '/auth/signup',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useLoginMutation, useSignupMutation } = authApi;