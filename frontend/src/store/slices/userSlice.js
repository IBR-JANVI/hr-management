import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import api from '../../services/api';

const initialState = {
  users: [],
  pendingUsers: [],
  stats: null,
  statsLoading: false,
  statsError: null,
  attendance: null,
  attendanceLoading: false,
  attendanceError: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },
  loading: false,
  error: null,
  actionLoading: {},
  actionError: null
};

// Fetch all users
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to fetch users' });
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
      return rejectWithValue(error.data || { message: 'Failed to fetch pending users' });
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
      return rejectWithValue(error.data || { message: 'Failed to fetch stats' });
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
      return rejectWithValue(error.data || { message: 'Failed to approve user' });
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
      return rejectWithValue(error.data || { message: 'Failed to reject user' });
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
      return rejectWithValue(error.data || { message: 'Failed to delete user' });
    }
  }
);

// Create user
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to create user' });
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, ...userData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to update user' });
    }
  }
);

// Fetch user attendance
export const fetchUserAttendance = createAsyncThunk(
  'users/fetchUserAttendance',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/attendance/my-attendance', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to fetch attendance' });
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
      state.actionError = null;
      state.statsError = null;
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
        state.users = action.payload?.users || action.payload?.data?.users || [];
        state.pagination = action.payload?.pagination || action.payload?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
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
        state.pendingUsers = action.payload?.users || action.payload?.data?.users || [];
      })
      .addCase(fetchPendingUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch stats
      .addCase(fetchUserStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload || { message: 'Failed to load stats' };
      })
      // Approve user
      .addCase(approveUser.pending, (state) => {
        state.actionLoading.approveUser = true;
        state.actionError = null;
      })
      .addCase(approveUser.fulfilled, (state, action) => {
        state.actionLoading.approveUser = false;
        const user = action.payload?.user || action.payload?.data?.user;
        if (user) {
          state.pendingUsers = state.pendingUsers.filter(u => u.id !== user.id);
        }
      })
      .addCase(approveUser.rejected, (state, action) => {
        state.actionLoading.approveUser = false;
        state.actionError = action.payload || action.error;
      })
      // Reject user
      .addCase(rejectUser.pending, (state) => {
        state.actionLoading.rejectUser = true;
        state.actionError = null;
      })
      .addCase(rejectUser.fulfilled, (state, action) => {
        state.actionLoading.rejectUser = false;
        const user = action.payload?.user || action.payload?.data?.user;
        if (user) {
          state.pendingUsers = state.pendingUsers.filter(u => u.id !== user.id);
        }
      })
      .addCase(rejectUser.rejected, (state, action) => {
        state.actionLoading.rejectUser = false;
        state.actionError = action.payload || action.error;
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.actionLoading.deleteUser = true;
        state.actionError = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.actionLoading.deleteUser = false;
        state.users = state.users.filter(user => user.id !== action.payload.id);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        state.pagination.totalPages = Math.ceil(state.pagination.total / Math.max(1, state.pagination.limit));
        state.pagination.page = Math.min(state.pagination.page, Math.max(1, state.pagination.totalPages));
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.actionLoading.deleteUser = false;
        state.actionError = action.payload || action.error;
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.actionLoading.createUser = true;
        state.actionError = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.actionLoading.createUser = false;
        const newUser = action.payload?.user || action.payload?.data?.user;
        if (newUser) {
          state.users.unshift(newUser);
          state.pagination.total += 1;
          state.pagination.totalPages = Math.ceil(state.pagination.total / Math.max(1, state.pagination.limit));
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.actionLoading.createUser = false;
        state.actionError = action.payload || action.error;
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.actionLoading.updateUser = true;
        state.actionError = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.actionLoading.updateUser = false;
        const updatedUser = action.payload?.user || action.payload?.data?.user;
        if (updatedUser) {
          const index = state.users.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            state.users[index] = updatedUser;
          }
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.actionLoading.updateUser = false;
        state.actionError = action.payload || action.error;
      })
      // Fetch user attendance
      .addCase(fetchUserAttendance.pending, (state) => {
        state.attendanceLoading = true;
        state.attendanceError = null;
      })
      .addCase(fetchUserAttendance.fulfilled, (state, action) => {
        state.attendanceLoading = false;
        state.attendance = action.payload?.data || null;
      })
      .addCase(fetchUserAttendance.rejected, (state, action) => {
        state.attendanceLoading = false;
        state.attendanceError = action.payload || { message: 'Failed to load attendance' };
      });
  }
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
