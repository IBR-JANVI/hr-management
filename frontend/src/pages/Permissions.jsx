import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchPermissions, fetchModules, createPermission, deletePermission } from '../store/slices/roleSlice';
import { canAccess } from '../utils/permissions';

function Permissions() {
  const dispatch = useDispatch();
  const { permissions, modules, loading } = useSelector((state) => state.roles);
  const [showModal, setShowModal] = useState(false);
  const [newPermission, setNewPermission] = useState({ module: '', action: '' });
  const [groupedPermissions, setGroupedPermissions] = useState({});

  const canCreate = canAccess('permissions', 'create');
  const canDelete = canAccess('permissions', 'delete');

  useEffect(() => {
    dispatch(fetchPermissions());
    dispatch(fetchModules());
  }, [dispatch]);

  useEffect(() => {
    const grouped = {};
    permissions.forEach((permission) => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    setGroupedPermissions(grouped);
  }, [permissions]);

  const handleCreatePermission = async () => {
    if (newPermission.module && newPermission.action) {
      try {
        await dispatch(createPermission(newPermission)).unwrap();
        toast.success('Permission created successfully');
        setShowModal(false);
        setNewPermission({ module: '', action: '' });
      } catch (error) {
        toast.error(error?.error?.message || 'Failed to create permission');
      }
    }
  };

  const handleDeletePermission = async (id) => {
    if (window.confirm('Are you sure you want to delete this permission?')) {
      try {
        await dispatch(deletePermission(id)).unwrap();
        toast.success('Permission deleted successfully');
      } catch (error) {
        toast.error(error?.error?.message || 'Failed to delete permission');
      }
    }
  };

  if (!canAccess('permissions', 'view')) {
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
        <h1 className="text-2xl font-bold text-gray-800">Permission Management</h1>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Permission
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedPermissions).length === 0 ? (
            <div className="text-center text-gray-500">No permissions found</div>
          ) : (
            Object.keys(groupedPermissions).map((module) => (
              <div key={module} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 px-6 py-3">
                  <h2 className="text-lg font-semibold text-gray-800 capitalize">
                    {module} Module
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {groupedPermissions[module].map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-800 capitalize">
                            {permission.action}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({permission.roleCount} roles)
                          </span>
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => handleDeletePermission(permission.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Permission Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Create New Permission
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Module
                </label>
                <input
                  type="text"
                  value={newPermission.module}
                  onChange={(e) => setNewPermission({ ...newPermission, module: e.target.value })}
                  placeholder="e.g., users, roles, dashboard"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Action
                </label>
                <input
                  type="text"
                  value={newPermission.action}
                  onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
                  placeholder="e.g., view, create, edit, delete"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {modules.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Existing Modules
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {modules.map((m) => (
                      <button
                        key={m}
                        onClick={() => setNewPermission({ ...newPermission, module: m })}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 capitalize"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreatePermission}
                disabled={!newPermission.module || !newPermission.action}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Create Permission
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewPermission({ module: '', action: '' });
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

export default Permissions;
