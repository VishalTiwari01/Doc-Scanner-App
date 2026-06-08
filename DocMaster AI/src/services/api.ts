import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { Platform } from 'react-native';
import { RootState } from '../redux/store';
import { setTokens, logout } from '../redux/slices/authSlice';

export const API_BASE_URL = 'https://docmaster-backend.onrender.com/api/v1';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Custom base query that handles automatic token refresh on 401 Unauthorized
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to get a new token using the refresh token
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    if (refreshToken) {
      try {
        // We call the refresh endpoint directly using the raw fetch
        const refreshResult = await baseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const data = refreshResult.data as { success: boolean; data: { accessToken: string; refreshToken: string } };
          // Save the new tokens to the store
          api.dispatch(
            setTokens({
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken,
            })
          );
          // Retry the original request with the new access token
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed - force logout
          api.dispatch(logout());
        }
      } catch (err) {
        api.dispatch(logout());
      }
    } else {
      // No refresh token available - force logout
      api.dispatch(logout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'FileHistory', 'OCRHistory'],
  endpoints: () => ({}),
});
