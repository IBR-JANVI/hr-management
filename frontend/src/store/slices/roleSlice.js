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
      state.errorUpdate = null;
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
        state.roles = action.payload?.roles || action.payload?.data?.roles || [];
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
        const role = action.payload?.role || action.payload?.data?.role;
        if (role) state.roles.push(role);
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
        const role = action.payload?.role || action.payload?.data?.role;
        if (role) {
          const index = state.roles.findIndex(r => r.id === role.id);
          if (index !== -1) {
            state.roles[index] = role;
          }
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
        state.roles = state.roles.filter(role => role.id !== action.payload.id);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loadingDelete = false;
        state.errorDelete = action.payload;
      })
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload?.permissions || action.payload?.data?.permissions || [];
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchModules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loading = false;
        state.modules = action.payload?.modules || action.payload?.data?.modules || [];
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPermission.pending, (state) => {
        state.loadingCreate = true;
        state.errorCreate = null;
      })
      .addCase(createPermission.fulfilled, (state, action) => {
        state.loadingCreate = false;
        state.permissions.push(action.payload?.permission || action.payload?.data?.permission);
      })
      .addCase(createPermission.rejected, (state, action) => {
        state.loadingCreate = false;
        state.errorCreate = action.payload;
      })
      .addCase(deletePermission.pending, (state) => {
        state.loadingDelete = true;
        state.errorDelete = null;
      })
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.loadingDelete = false;
        state.permissions = state.permissions.filter(permission => permission.id !== action.payload.id);
      })
      .addCase(deletePermission.rejected, (state, action) => {
        state.loadingDelete = false;
        state.errorDelete = action.payload;
      });
  }
});

export const { clearRoleError } = roleSlice.actions;
export default roleSlice.reducer;
