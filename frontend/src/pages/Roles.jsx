import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchRoles, fetchPermissions, createRole, deleteRole } from '../store/slices/roleSlice';
import { canAccess } from '../utils/permissions';

function Roles() {
  const dispatch = useDispatch();
  const { roles, permissions, loading } = useSelector((state) => state.roles);
  const [showModal, setShowModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', isDefault: false, permissionIds: [] });

  const canCreate = canAccess('roles', 'create');
  const canDelete = canAccess('roles', 'delete');

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);

  const handleCreateRole = async () => {
    if (newRole.name && newRole.permissionIds.length > 0) {
      try {
        await dispatch(createRole(newRole)).unwrap();
        toast.success('Role created successfully');
        setShowModal(false);
        setNewRole({ name: '', description: '', isDefault: false, permissionIds: [] });
      } catch (error) {
        toast.error(error?.error?.message || 'Failed to create role');
      }
    }
  };

  const handleDeleteRole = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await dispatch(deleteRole(id)).unwrap();
        toast.success('Role deleted successfully');
      } catch (error) {
        toast.error(error?.error?.message || 'Failed to delete role');
      }
    }
  };

  if (!canAccess('roles', 'view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <p className="text-xl mb-2">🔒</p>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Role Management</h1>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Role
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500">Loading...</div>
        ) : roles.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">No roles found</div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{role.name}</h3>
                  <p className="text-sm text-gray-500">{role.description}</p>
                </div>
                {role.isSuperAdmin && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                    Super Admin
                  </span>
                )}
                {role.isDefault && !role.isSuperAdmin && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Default
                  </span>
                )}
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.slice(0, 5).map((p) => (
                    <span key={p.id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {p.module}:{p.action}
                    </span>
                  ))}
                  {role.permissions?.length > 5 && (
                    <span className="px-2 py-1 text-xs text-gray-500">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                {role.userCount} user(s) assigned
              </p>

              {canDelete && !role.isSuperAdmin && (
                <button
                  onClick={() => handleDeleteRole(role.id)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Create New Role
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newRole.isDefault}
                  onChange={(e) => setNewRole({ ...newRole, isDefault: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Set as default role</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newRole.permissionIds.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRole({
                              ...newRole,
                              permissionIds: [...newRole.permissionIds, permission.id]
                            });
                          } else {
                            setNewRole({
                              ...newRole,
                              permissionIds: newRole.permissionIds.filter(id => id !== permission.id)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        {permission.module}: {permission.action}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateRole}
                disabled={!newRole.name || newRole.permissionIds.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Create Role
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewRole({ name: '', description: '', isDefault: false, permissionIds: [] });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Roles;
