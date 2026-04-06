import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import roleReducer from './slices/roleSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    users: userReducer,
    roles: roleReducer
  },
  devTools: import.meta.env.DEV,
});
