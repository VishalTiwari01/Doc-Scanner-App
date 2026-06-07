import { combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer } from 'redux-persist';
import authReducer from './slices/authSlice';
import pdfReducer from './slices/pdfSlice';
import { apiSlice } from '../services/api';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'accessToken', 'refreshToken', 'isAuthenticated'],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  pdf: pdfReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;
