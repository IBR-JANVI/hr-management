import { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchPermissions, fetchModules, createPermission, deletePermission } from '../../store/slices/roleSlice';
import { canAccess } from '../../utils/permissions';

function Permissions() {
  const dispatch = useDispatch();
  const { permissions, modules, loadingPermissions: loading } = useSelector((state) => state.roles);
  const [showModal, setShowModal] = useState(false);
  const [newPermission, setNewPermission] = useState({ module: '', action: '' });
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  const canCreate = canAccess('permissions', 'create');
  const canDelete = canAccess('permissions', 'delete');
  const canView = canAccess('permissions', 'view');

  const groupedPermissions = useMemo(() => {
    const grouped = {};
    permissions.forEach((permission) => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    return grouped;
  }, [permissions]);

  useEffect(() => {
    if (canView) {
      dispatch(fetchPermissions());
    }
  }, [dispatch, canView]);

  useEffect(() => {
    if (canCreate) {
      dispatch(fetchModules());
    }
  }, [dispatch, canCreate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
        setNewPermission({ module: '', action: '' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  useEffect(() => {
    if (showModal && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [showModal]);

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
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-text-primary)' }}>Permission Management</h1>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{ padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
          >
            Create Permission
          </button>
        )}
      </div>

      {loading ? (
        <div aria-busy="true" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {Object.keys(groupedPermissions).length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No permissions found</div>
          ) : (
            Object.keys(groupedPermissions).map((module) => (
              <div key={module} style={{ backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
                <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: 'var(--spacing-3) var(--spacing-6)' }}>
                  <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                    {module} Module
                  </h2>
                </div>
                <div style={{ padding: 'var(--spacing-6)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--spacing-4)' }}>
                    {groupedPermissions[module].map((permission) => (
                      <div
                        key={permission.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacing-3)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}
                      >
                        <div>
                          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                            {permission.action}
                          </span>
                          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginLeft: 'var(--spacing-2)' }}>
                            ({permission.roleCount} roles)
                          </span>
                        </div>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeletePermission(permission.id)}
                            style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}
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

      {showModal && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--color-overlay-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-modal)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="permission-modal-title"
        >
          <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', padding: 'var(--spacing-6)', maxWidth: '28rem', width: '100%', margin: 'var(--spacing-4)' }}>
            <h2 id="permission-modal-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-4)' }}>
              Create New Permission
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div>
                <label htmlFor="permission-module" style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-700)' }}>
                  Module
                </label>
                <input
                  id="permission-module"
                  type="text"
                  value={newPermission.module}
                  onChange={(e) => setNewPermission({ ...newPermission, module: e.target.value })}
                  placeholder="e.g., users, roles, dashboard"
                  style={{ marginTop: 'var(--spacing-1)', display: 'block', width: '100%', padding: 'var(--spacing-2) var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div>
                <label htmlFor="permission-action" style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-700)' }}>
                  Action
                </label>
                <input
                  id="permission-action"
                  type="text"
                  value={newPermission.action}
                  onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
                  placeholder="e.g., view, create, edit, delete"
                  style={{ marginTop: 'var(--spacing-1)', display: 'block', width: '100%', padding: 'var(--spacing-2) var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              {modules.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-700)', marginBottom: 'var(--spacing-2)' }}>
                    Existing Modules
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                    {modules.map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setNewPermission({ ...newPermission, module: m })}
                        style={{ padding: 'var(--spacing-1) var(--spacing-3)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)', border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-6)' }}>
              <button
                type="button"
                onClick={handleCreatePermission}
                disabled={!newPermission.module || !newPermission.action}
                style={{ flex: 1, padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: !newPermission.module || !newPermission.action ? 'not-allowed' : 'pointer', opacity: !newPermission.module || !newPermission.action ? 0.5 : 1 }}
              >
                Create Permission
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setNewPermission({ module: '', action: '' });
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

export default Permissions;
