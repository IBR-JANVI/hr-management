import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  roles: [],
  permissions: [],
  modules: [],
  loading: false,
  error: null,
  loadingCreate: false,
  loadingDelete: false,
  loadingUpdate: false,
  errorCreate: null,
  errorDelete: null,
  errorUpdate: null
};

export const fetchRoles = createAsyncThunk(
  'roles/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to fetch roles' });
    }
  }
);

export const createRole = createAsyncThunk(
  'roles/createRole',
  async (roleData, { rejectWithValue }) => {
    try {
      const response = await api.post('/roles', roleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to create role' });
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/updateRole',
  async ({ id, ...roleData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/roles/${id}`, roleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to update role' });
    }
  }
);

export const deleteRole = createAsyncThunk(
  'roles/deleteRole',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/roles/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to delete role' });
    }
  }
);

export const fetchPermissions = createAsyncThunk(
  'roles/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/permissions');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to fetch permissions' });
    }
  }
);

export const fetchModules = createAsyncThunk(
  'roles/fetchModules',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/permissions/modules');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to fetch modules' });
    }
  }
);

export const createPermission = createAsyncThunk(
  'roles/createPermission',
  async (permissionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/permissions', permissionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to create permission' });
    }
  }
);

export const deletePermission = createAsyncThunk(
  'roles/deletePermission',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/permissions/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to delete permission' });
    }
  }
);

const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearRoleError: (state) => {
      state.error = null;
      state.errorCreate = null;
      state.errorDelete = null;
    }
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(createRole.pending, (state) => {
        state.loadingCreate = true;
        state.errorCreate = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loadingCreate = false;
        state.roles.push(action.payload.role);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loadingCreate = false;
        state.errorCreate = action.payload;
      })
      .addCase(updateRole.pending, (state) => {
        state.loadingUpdate = true;
        state.errorUpdate = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loadingUpdate = false;
        const index = state.roles.findIndex(role => role.id === action.payload.role.id);
        if (index !== -1) {
          state.roles[index] = action.payload.role;
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loadingUpdate = false;
        state.errorUpdate = action.payload;
      })
      .addCase(deleteRole.pending, (state) => {
        state.loadingDelete = true;
        state.errorDelete = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loadingDelete = false;
        state.roles = state.roles.filter(r => r.id !== action.payload.id);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loadingDelete = false;
        state.errorDelete = action.payload;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload.permissions;
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.modules = action.payload.modules;
      })
      .addCase(createPermission.fulfilled, (state, action) => {
        state.permissions.push(action.payload.permission);
      })
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.permissions = state.permissions.filter(p => p.id !== action.payload.id);
      });
  }
});

export const { clearRoleError } = roleSlice.actions;
export default roleSlice.reducer;
