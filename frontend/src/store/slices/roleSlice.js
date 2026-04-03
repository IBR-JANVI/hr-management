import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  roles: [],
  permissions: [],
  modules: [],
  loading: false,
  error: null
};

// Fetch all roles
export const fetchRoles = createAsyncThunk(
  'roles/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch roles' });
    }
  }
);

// Create role
export const createRole = createAsyncThunk(
  'roles/createRole',
  async (roleData, { rejectWithValue }) => {
    try {
      const response = await api.post('/roles', roleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to create role' });
    }
  }
);

// Update role
export const updateRole = createAsyncThunk(
  'roles/updateRole',
  async ({ id, ...roleData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/roles/${id}`, roleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update role' });
    }
  }
);

// Delete role
export const deleteRole = createAsyncThunk(
  'roles/deleteRole',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/roles/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to delete role' });
    }
  }
);

// Fetch all permissions
export const fetchPermissions = createAsyncThunk(
  'roles/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/permissions');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch permissions' });
    }
  }
);

// Fetch all modules
export const fetchModules = createAsyncThunk(
  'roles/fetchModules',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/permissions/modules');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch modules' });
    }
  }
);

// Create permission
export const createPermission = createAsyncThunk(
  'roles/createPermission',
  async (permissionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/permissions', permissionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to create permission' });
    }
  }
);

// Delete permission
export const deletePermission = createAsyncThunk(
  'roles/deletePermission',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/permissions/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to delete permission' });
    }
  }
);

const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearRoleError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload.roles;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create role
      .addCase(createRole.fulfilled, (state, action) => {
        state.roles.push(action.payload.role);
      })
      // Update role
      .addCase(updateRole.fulfilled, (state, action) => {
        const index = state.roles.findIndex(r => r.id === action.payload.role.id);
        if (index !== -1) {
          state.roles[index] = action.payload.role;
        }
      })
      // Delete role
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.roles = state.roles.filter(r => r.id !== action.payload.id);
      })
      // Fetch permissions
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload.permissions;
      })
      // Fetch modules
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.modules = action.payload.modules;
      })
      // Create permission
      .addCase(createPermission.fulfilled, (state, action) => {
        state.permissions.push(action.payload.permission);
      })
      // Delete permission
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.permissions = state.permissions.filter(p => p.id !== action.payload.id);
      });
  }
});

export const { clearRoleError } = roleSlice.actions;
export default roleSlice.reducer;
