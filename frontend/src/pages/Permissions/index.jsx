import { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchPermissions, fetchModules, createPermission, deletePermission, updatePermission } from '../../store/slices/roleSlice';
import { canAccess } from '../../utils/permissions';
import Modal from '../../components/Modal';
import styles from './Permissions.module.css';

function Permissions() {
  const dispatch = useDispatch();
  const { permissions: permissionsData, modules, loadingPermissions: loading, error } = useSelector((state) => state.roles);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePermissionId, setDeletePermissionId] = useState(null);
  const [editingPermissionId, setEditingPermissionId] = useState(null);
  const [newPermission, setNewPermission] = useState({ module: '', action: '' });
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  const canCreate = canAccess('permissions', 'create');
  const canDelete = canAccess('permissions', 'delete');
  const canView = canAccess('permissions', 'view');
  const canUpdate = canAccess('permissions', 'update');

  const defaultActions = ['view', 'create', 'update', 'delete'];

  const groupedPermissions = useMemo(() => {
    if (!permissionsData) {
      return {};
    }
    const grouped = {};
    permissionsData.forEach((permission) => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    return grouped;
  }, [permissionsData]);

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
        setEditingPermissionId(null);
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

  const handleUpdatePermission = async () => {
    if (newPermission.module && newPermission.action && editingPermissionId) {
      try {
        await dispatch(updatePermission({ id: editingPermissionId, module: newPermission.module, action: newPermission.action })).unwrap();
        toast.success('Permission updated successfully');
        setShowModal(false);
        setNewPermission({ module: '', action: '' });
        setEditingPermissionId(null);
      } catch (error) {
        toast.error(error?.error?.message || 'Failed to update permission');
      }
    }
  };

  const openEditModal = (permission) => {
    setEditingPermissionId(permission.id);
    setNewPermission({ module: permission.module, action: permission.action });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewPermission({ module: '', action: '' });
    setEditingPermissionId(null);
  };

  const handleDeletePermission = (id) => {
    setDeletePermissionId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deletePermission(deletePermissionId)).unwrap();
      toast.success('Permission deleted successfully');
      setShowDeleteModal(false);
      setDeletePermissionId(null);
    } catch (error) {
      toast.error(error?.error?.message || 'Failed to delete permission');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletePermissionId(null);
  };

  if (!canAccess('permissions', 'view')) {
    return (
      <div className={styles.lockedContainer}>
        <div className={styles.lockedText}>
          <p className={styles.lockedIcon}>🔒</p>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Permission Management</h1>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className={styles.createButton}
          >
            Create Permission
          </button>
        )}
      </div>

      {loading ? (
        <div aria-busy="true" className={styles.loadingWrapper}>Loading...</div>
      ) : error ? (
        <div className={styles.errorState}>{error?.message || 'Failed to load permissions'}</div>
      ) : permissionsData && permissionsData.length === 0 ? (
        <div className={styles.emptyState}>No permissions found</div>
      ) : (
        <div className={styles.modulesGrid}>
          {Object.keys(groupedPermissions).map((moduleName) => (
            <div key={moduleName} className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <h2 className={styles.moduleTitle}>
                  {moduleName} Module
                </h2>
              </div>
              <div className={styles.moduleContent}>
                <div className={styles.actionsGrid}>
                  {defaultActions.map((action) => {
                    const permission = groupedPermissions[moduleName]?.find(permissionEntry => permissionEntry.action === action);
                    return (
                      <div
                        key={action}
                        className={styles.actionItem}
                      >
                        <div className={styles.actionInfo}>
                          <span className={styles.actionName}>
                            {action}
                          </span>
                          <span className={styles.actionCount}>
                            ({permission?.roleCount || 0} roles)
                          </span>
                        </div>
                        <div className={styles.actionButtons}>
                          {permission ? (
                            <>
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() => openEditModal(permission)}
                                  className={styles.editButton}
                                  aria-label="Edit permission"
                                >
                                  ✎
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePermission(permission.id)}
                                  className={styles.deleteButton}
                                  aria-label="Delete permission"
                                >
                                    ✕
                                  </button>
                                )}
                              </>
                            ) : canCreate ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setNewPermission({ module: moduleName, action });
                                  setEditingPermissionId(null);
                                  setShowModal(true);
                                }}
                                className={styles.addButton}
                              >
                                + Add
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div 
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="permission-modal-title"
        >
          <div className={styles.modal}>
            <h2 id="permission-modal-title" className={styles.modalTitle}>
              {editingPermissionId ? 'Edit Permission' : 'Create New Permission'}
            </h2>

            <div className={styles.formGroup}>
              <div>
                <label htmlFor="permission-module" className={styles.label}>
                  Module
                </label>
                <input
                  ref={firstFocusableRef}
                  id="permission-module"
                  type="text"
                  value={newPermission.module}
                  onChange={(e) => setNewPermission({ ...newPermission, module: e.target.value })}
                  placeholder="e.g., users, roles, dashboard"
                  className={styles.input}
                />
              </div>

              <div>
                <label htmlFor="permission-action" className={styles.label}>
                  Action
                </label>
                <input
                  id="permission-action"
                  type="text"
                  value={newPermission.action}
                  onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
                  placeholder="e.g., view, create, edit, delete"
                  className={styles.input}
                />
              </div>

              {Array.isArray(modules) && modules.length > 0 && (
                <div>
                  <label className={styles.label}>
                    Existing Modules
                  </label>
                  <div className={styles.modulesContainer}>
                    {modules.map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setNewPermission({ ...newPermission, module: m })}
                        className={styles.moduleButton}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={editingPermissionId ? handleUpdatePermission : handleCreatePermission}
                disabled={!newPermission.module || !newPermission.action}
                className={styles.confirmButton}
              >
                {editingPermissionId ? 'Update Permission' : 'Create Permission'}
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Permission"
        message="Are you sure you want to delete this permission?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default Permissions;
