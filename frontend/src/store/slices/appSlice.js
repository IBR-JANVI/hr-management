import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  error: null,
  notifications: [],
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  addNotification,
  removeNotification,
} = appSlice.actions;

export const selectAppLoading = (state) => state.app.loading;
export const selectAppError = (state) => state.app.error;
export const selectAppNotifications = (state) => state.app.notifications;

export default appSlice.reducer;
