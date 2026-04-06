import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchRoles, fetchPermissions, createRole, deleteRole } from '../../store/slices/roleSlice';
import { canAccess } from '../../utils/permissions';

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
        toast.error(error?.message || 'Failed to create role');
      }
    }
  };

  const handleDeleteRole = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await dispatch(deleteRole(id)).unwrap();
        toast.success('Role deleted successfully');
      } catch (error) {
        toast.error(error?.message || 'Failed to delete role');
      }
    }
  };

  if (!canAccess('roles', 'view')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-2)' }}>🔒</p>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-text-primary)' }}>Role Management</h1>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
          >
            Create Role
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-6)' }}>
        {loading ? (
          <div aria-busy="true" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
        ) : roles.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)' }}>No roles found</div>
        ) : (
          roles.map((role) => (
            <div key={role.id} style={{ backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: 'var(--spacing-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--color-text-primary)' }}>{role.name}</h3>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{role.description}</p>
                </div>
                {role.isSuperAdmin && (
                  <span style={{ padding: 'var(--spacing-1) var(--spacing-2)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-purple-500)', color: 'white', borderRadius: 'var(--radius-full)' }}>
                    Super Admin
                  </span>
                )}
                {role.isDefault && !role.isSuperAdmin && (
                  <span style={{ padding: 'var(--spacing-1) var(--spacing-2)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-full)' }}>
                    Default
                  </span>
                )}
              </div>

              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2)' }}>Permissions:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-1)' }}>
                  {role.permissions?.slice(0, 5).map((p) => (
                    <span key={p.id} style={{ padding: 'var(--spacing-1) var(--spacing-2)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)' }}>
                      {p.module}:{p.action}
                    </span>
                  ))}
                  {role.permissions?.length > 5 && (
                    <span style={{ padding: 'var(--spacing-1) var(--spacing-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>
                {role.userCount} user(s) assigned
              </p>

              {canDelete && !role.isSuperAdmin && (
                <button
                  onClick={() => handleDeleteRole(role.id)}
                  style={{ width: '100%', padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-error)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--color-overlay-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-modal)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
        >
            <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', padding: 'var(--spacing-6)', maxWidth: '32rem', width: '100%', margin: 'var(--spacing-4)', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 id="role-modal-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-4)' }}>
              Create New Role
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div>
                <label htmlFor="roleNameId" style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-secondary)' }}>
                  Role Name
                </label>
                <input
                  id="roleNameId"
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  style={{ marginTop: 'var(--spacing-1)', display: 'block', width: '100%', padding: 'var(--spacing-2) var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div>
                <label htmlFor="roleDescriptionId" style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-secondary)' }}>
                  Description
                </label>
                <textarea
                  id="roleDescriptionId"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  style={{ marginTop: 'var(--spacing-1)', display: 'block', width: '100%', padding: 'var(--spacing-2) var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                  rows="2"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  id="roleIsDefaultId"
                  type="checkbox"
                  checked={newRole.isDefault}
                  onChange={(e) => setNewRole({ ...newRole, isDefault: e.target.checked })}
                  style={{ marginRight: 'var(--spacing-2)' }}
                />
                <label htmlFor="roleIsDefaultId" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>Set as default role</label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-2)' }}>
                  Permissions
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', maxHeight: '15rem', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)' }}>
                  {permissions.map((permission) => (
                    <label key={permission.id} style={{ display: 'flex', alignItems: 'center' }}>
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
                        style={{ marginRight: 'var(--spacing-2)' }}
                      />
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                        {permission.module}: {permission.action}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-6)' }}>
              <button
                onClick={handleCreateRole}
                disabled={!newRole.name || newRole.permissionIds.length === 0}
                style={{ flex: 1, padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: !newRole.name || newRole.permissionIds.length === 0 ? 'not-allowed' : 'pointer', opacity: !newRole.name || newRole.permissionIds.length === 0 ? 0.5 : 1 }}
              >
                Create Role
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewRole({ name: '', description: '', isDefault: false, permissionIds: [] });
                }}
                style={{ padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
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
