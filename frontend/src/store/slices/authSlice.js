import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const getStoredAuth = () => {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  try {
    return {
      token: token || null,
      user: user ? JSON.parse(user) : null,
      isAuthenticated: !!token
    };
  } catch (error) {
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
      const response = await api.post('/auth/sessions', credentials, { credentials: 'include' });
      const { user, accessToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { user, token: accessToken };
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Login failed' });
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/users', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Registration failed' });
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.delete('/auth/sessions', { refreshToken });
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/profiles/me');
      const user = response.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to fetch profile' });
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        return rejectWithValue({ message: 'No refresh token' });
      }
      
      const response = await api.post('/auth/tokens', { refreshToken: refreshTokenValue });
      const { accessToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      return accessToken;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return rejectWithValue(error.data || { message: 'Token refresh failed' });
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
      state.isAuthenticated = true;
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
        state.isAuthenticated = true;
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
