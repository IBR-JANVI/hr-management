import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

const AUTH_SESSIONS_ENDPOINT = '/auth/sessions';
const AUTH_TOKENS_ENDPOINT = '/auth/tokens';
const AUTH_PROFILES_ENDPOINT = '/auth/profiles/me';
const AUTH_USERS_ENDPOINT = '/auth/users';

const FALLBACK_LOGIN_ERROR = { message: 'Login failed' };
const FALLBACK_REGISTER_ERROR = { message: 'Registration failed' };
const FALLBACK_PROFILE_ERROR = { message: 'Failed to fetch profile' };
const FALLBACK_REFRESH_ERROR = { message: 'Token refresh failed' };
const NO_REFRESH_TOKEN_ERROR = { message: 'No refresh token' };

const getStoredAuth = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  try {
    return {
      token: token || null,
      user: user ? JSON.parse(user) : null,
      isAuthenticated: !!token
    };
  } catch (error) {
    localStorage.removeItem(USER_KEY);
    return {
      token: token || null,
      user: null,
      isAuthenticated: !!token
    };
  }
};

const storedAuth = getStoredAuth();

const initialState = {
  user: storedAuth.user,
  token: storedAuth.token,
  isAuthenticated: storedAuth.isAuthenticated,
  loading: false,
  error: null
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_SESSIONS_ENDPOINT, credentials, { credentials: 'include' });
      const { user, accessToken } = response.data;
      
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      return { user, token: accessToken };
    } catch (error) {
      return rejectWithValue(error.data || FALLBACK_LOGIN_ERROR);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_USERS_ENDPOINT, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || FALLBACK_REGISTER_ERROR);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      await api.delete(AUTH_SESSIONS_ENDPOINT);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return { success: true };
    } catch (error) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return rejectWithValue(error.data || error.response?.data || error.message);
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(AUTH_PROFILES_ENDPOINT);
      const user = response.data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue(error.data || FALLBACK_PROFILE_ERROR);
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_TOKENS_ENDPOINT, {}, { withCredentials: true });
      const { accessToken } = response.data;
      
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      return accessToken;
    } catch (error) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return rejectWithValue(error.data || FALLBACK_REFRESH_ERROR);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = Boolean(action.payload.token);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        const user = action.payload?.user || action.payload?.data?.user;
        const token = action.payload?.token || action.payload?.data?.accessToken;
        state.user = user;
        state.token = token;
        state.isAuthenticated = Boolean(token);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        const user = action.payload?.user || action.payload?.data?.user || action.payload;
        state.user = user;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        const token = action.payload?.accessToken || action.payload?.data?.accessToken || action.payload;
        state.token = token;
        state.isAuthenticated = Boolean(token);
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  }
});

export const { clearAuthError, setUser } = authSlice.actions;
export default authSlice.reducer;
