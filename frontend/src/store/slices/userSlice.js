import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  users: [],
  pendingUsers: [],
  stats: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },
  loading: false,
  error: null
};

// Fetch all users
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch users' });
    }
  }
);

// Fetch pending users
export const fetchPendingUsers = createAsyncThunk(
  'users/fetchPendingUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/pending');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch pending users' });
    }
  }
);

// Fetch user stats
export const fetchUserStats = createAsyncThunk(
  'users/fetchUserStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch stats' });
    }
  }
);

// Approve user
export const approveUser = createAsyncThunk(
  'users/approveUser',
  async ({ id, roleIds }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/${id}/approve`, { roleIds });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to approve user' });
    }
  }
);

// Reject user
export const rejectUser = createAsyncThunk(
  'users/rejectUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/${id}/reject`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to reject user' });
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to delete user' });
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch pending users
      .addCase(fetchPendingUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingUsers = action.payload.users;
      })
      .addCase(fetchPendingUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch stats
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Approve user
      .addCase(approveUser.fulfilled, (state, action) => {
        state.pendingUsers = state.pendingUsers.filter(u => u.id !== action.payload.user.id);
      })
      // Reject user
      .addCase(rejectUser.fulfilled, (state, action) => {
        state.pendingUsers = state.pendingUsers.filter(u => u.id !== action.payload.user.id);
      })
      // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u.id !== action.payload.id);
      });
  }
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
