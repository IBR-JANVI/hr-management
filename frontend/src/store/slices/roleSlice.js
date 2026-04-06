import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  roles: null,
  permissions: null,
  modules: [],
  loadingRoles: false,
  loadingPermissions: false,
  loadingModules: false,
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

export const updatePermission = createAsyncThunk(
  'roles/updatePermission',
  async ({ id, ...permissionData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/permissions/${id}`, permissionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to update permission' });
    }
  }
);

export const assignPermissions = createAsyncThunk(
  'roles/assignPermissions',
  async ({ id, permissionIds }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/roles/${id}/permissions`, { permissionIds });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || { message: 'Failed to assign permissions' });
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
        state.loadingRoles = true;
        state.error = null;
      })
      // .addCase(fetchRoles.fulfilled, (state, action) => {
      //   state.loadingRoles = false;

      //   console.log('=== FETCH ROLES DEBUG ===');
      //   console.log('action.payload:', action.payload);
      //   console.log('action.payload.data:', action.payload?.data);
      //   console.log('action.payload.roles:', action.payload?.roles);

      //   const payload = action.payload;
      //         let rolesArr = [];
      //      if (Array.isArray(payload)) {
      //     rolesArr = payload;
      //   }
      //   else if (payload?.roles) {
      //     rolesArr = Array.isArray(payload.roles) ? payload.roles : [];
      //   }
      //   else if (payload?.data?.roles) {
      //     rolesArr = Array.isArray(payload.data.roles) ? payload.data.roles : [];
      //   }
      //   else if (Array.isArray(payload?.data)) {
      //     rolesArr = payload.data;
      //   }

      //   console.log('Final rolesArr:', rolesArr);
      //   state.roles = rolesArr;
      // })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loadingRoles = false;
        
        // Handle different response formats
        let rolesArr = [];
        
        if (action.payload?.roles?.roles) {
          rolesArr = action.payload.roles.roles;
        } else if (Array.isArray(action.payload?.roles)) {
          rolesArr = action.payload.roles;
        } else if (Array.isArray(action.payload?.data?.roles)) {
          rolesArr = action.payload.data.roles;
        } else if (Array.isArray(action.payload?.data)) {
          rolesArr = action.payload.data;
        }
        
        state.roles = rolesArr;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loadingRoles = false;
        state.error = action.payload;
      })
      .addCase(createRole.pending, (state) => {
        state.loadingCreate = true;
        state.errorCreate = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loadingCreate = false;
        const role = action.payload?.role || action.payload?.data?.role;
        if (role) {
          if (!state.roles) {
            state.roles = [];
          }
          state.roles.push(role);
        }
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
          if (!state.roles) {
            state.roles = [];
          }
          const index = state.roles.findIndex(existingRole => existingRole.id === role.id);
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
        if (state.roles && Array.isArray(state.roles)) {
          state.roles = state.roles.filter(role => role.id !== action.payload.id);
        }
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loadingDelete = false;
        state.errorDelete = action.payload;
      })
      .addCase(fetchPermissions.pending, (state) => {
        state.loadingPermissions = true;
        state.error = null;
      })
      // .addCase(fetchPermissions.fulfilled, (state, action) => {
      //   state.loadingPermissions = false;
      //   const payload = action.payload;
      //   let permissionsArr = [];

      //   if (payload?.data?.permissions) {
      //     permissionsArr = Array.isArray(payload.data.permissions) ? payload.data.permissions : payload.data.permissions.permissions || [];
      //   } else if (payload?.permissions) {
      //     permissionsArr = Array.isArray(payload.permissions) ? payload.permissions : [];
      //   } else if (Array.isArray(payload)) {
      //     permissionsArr = payload;
      //   }

      //   state.permissions = permissionsArr;
      // })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loadingPermissions = false;

        console.log('=== FETCH PERMISSIONS DEBUG ===');
        console.log('Full payload:', action.payload);

        // ✅ Exact correct mapping
        const permissionsArr = action.payload?.permissions?.permissions || [];

        console.log('Final permissionsArr:', permissionsArr);

        state.permissions = permissionsArr;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loadingPermissions = false;
        state.error = action.payload;
      })
      .addCase(fetchModules.pending, (state) => {
        state.loadingModules = true;
        state.error = null;
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loadingModules = false;
        state.modules = action.payload?.modules || action.payload?.data?.modules || [];
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.loadingModules = false;
        state.error = action.payload;
      })
      .addCase(createPermission.pending, (state) => {
        state.loadingCreate = true;
        state.errorCreate = null;
      })
      .addCase(createPermission.fulfilled, (state, action) => {
        state.loadingCreate = false;
        const created = action.payload?.permission || action.payload?.data?.permission;
        if (created) {
          state.permissions.push(created);
        }
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
      })
      .addCase(updatePermission.pending, (state) => {
        state.loadingUpdate = true;
        state.errorUpdate = null;
      })
      .addCase(updatePermission.fulfilled, (state, action) => {
        state.loadingUpdate = false;
        const updated = action.payload?.permission || action.payload?.data?.permission;
        if (updated) {
          const index = state.permissions.findIndex(permission => permission.id === updated.id);
          if (index !== -1) {
            state.permissions[index] = updated;
          }
        }
      })
      .addCase(updatePermission.rejected, (state, action) => {
        state.loadingUpdate = false;
        state.errorUpdate = action.payload;
      })
      .addCase(assignPermissions.pending, (state) => {
        state.loadingUpdate = true;
        state.errorUpdate = null;
      })
      .addCase(assignPermissions.fulfilled, (state, action) => {
        state.loadingUpdate = false;
      })
      .addCase(assignPermissions.rejected, (state, action) => {
        state.loadingUpdate = false;
        state.errorUpdate = action.payload;
      });
  }
});

export const { clearRoleError } = roleSlice.actions;
export default roleSlice.reducer;
