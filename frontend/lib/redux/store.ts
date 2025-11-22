import { configureStore } from '@reduxjs/toolkit'
// import counterReducer from './features/counter/counterSlice'
import { baseApi } from '../api/baseApi'
// import { apiSlice } from './api/apiSlice';
// import chatReducer from './features/chatSlice';
// import authReducer from './features/auth/slices/authSlice'
// import { aimodelApi } from './features/ai/aiModelApi';
// import { productsApi } from './features/productsApi';
// import {userApi} from "./features/user/userApi"
// import {activityApi} from './features/activityApi'
// import {userApi as userSuperAdminApi} from "./features/superadmin/userApi"

import { api } from './api';
import authReducer from './slices/authSlice';
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    // counter: counterReducer,
    // [baseApi.reducerPath]: baseApi.reducer,
    // [apiSlice.reducerPath]: apiSlice.reducer,
    // [aimodelApi.reducerPath]: aimodelApi.reducer,
    // [productsApi.reducerPath]: productsApi.reducer,
    // [userApi.reducerPath]: userApi.reducer,
    // [userSuperAdminApi.reducerPath]: userSuperAdminApi.reducer,
    // [activityApi.reducerPath]: activityApi.reducer,
    //  chat: chatReducer,
    // auth: authReducer,
  },
// Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      api.middleware,
        // baseApi.middleware

    //   apiSlice.middleware,
    //   aimodelApi.middleware,
    //   productsApi.middleware,
    //   userApi.middleware,
    //   userSuperAdminApi.middleware,
    //   activityApi.middleware,
    ),
  // Optional: configure dev tools in development
  devTools: process.env.NODE_ENV !== "production",
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch