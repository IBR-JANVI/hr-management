import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchRoles, fetchPermissions, createRole, deleteRole, updateRole } from '../../store/slices/roleSlice';
import { canAccess } from '../../utils/permissions';
import Modal from '../../components/Modal';
import RolePermissionsModal from '../../components/RolePermissionsModal';
import styles from './Roles.module.css';

function Roles() {
  const dispatch = useDispatch();
  const { roles: rolesData = [], permissions: permissionsData = [], loadingRoles: loading, error } = useSelector((state) => state.roles);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const firstFocusableRef = useRef(null);

  const canCreate = canAccess('roles', 'create');
  const canDelete = canAccess('roles', 'delete');
  const canView = canAccess('roles', 'view');

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchPermissions());
  }, [dispatch]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
        setNewRole({ name: '', description: '' });
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

  const handleCreateRole = async () => {
    if (!newRole.name) {
      toast.error('Role name is required');
      return;
    }

    try {
      await dispatch(createRole({ name: newRole.name, description: newRole.description })).unwrap();
      toast.success('Role created successfully');
      setShowModal(false);
      setNewRole({ name: '', description: '' });
      dispatch(fetchRoles());
    } catch (error) {
      toast.error(error?.message || 'Something went wrong. Please try again.');
    }
  };

  const handleDeleteClick = (role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (roleToDelete) {
      try {
        await dispatch(deleteRole(roleToDelete.id)).unwrap();
        toast.success('Role deleted successfully');
        setShowDeleteModal(false);
        setRoleToDelete(null);
        dispatch(fetchRoles());
      } catch (error) {
        toast.error(error?.message || 'Something went wrong. Please try again.');
      }
    }
  };

  const handleManagePermissions = (role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setNewRole({ name: role.name, description: role.description || '' });
    setShowModal(true);
  };

  const handleUpdateRole = async () => {
    if (!newRole.name) {
      toast.error('Role name is required');
      return;
    }

    try {
      await dispatch(updateRole({ id: selectedRole.id, name: newRole.name, description: newRole.description })).unwrap();
      toast.success('Role updated successfully');
      setShowModal(false);
      setNewRole({ name: '', description: '' });
      setSelectedRole(null);
      dispatch(fetchRoles());
    } catch (error) {
      toast.error(error?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Role Management</h1>
        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setSelectedRole(null);
              setNewRole({ name: '', description: '' });
              setShowModal(true);
            }}
            className={styles.createButton}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={styles.buttonIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Role
          </button>
        )}
      </div>

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.loading} aria-busy="true">Loading...</div>
        ) : !rolesData || rolesData.length === 0 ? (
          <div className={styles.empty}>No roles found</div>
        ) : (
          rolesData.map((role) => (
            <div key={role.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{role.name}</h3>
                  <p className={styles.cardDescription}>{role.description || 'No description'}</p>
                </div>
                {role.isSuperAdmin && (
                  <span className={`${styles.badge} ${styles.badgeSuperAdmin}`}>
                    Super Admin
                  </span>
                )}
                {role.isDefault && !role.isSuperAdmin && (
                  <span className={`${styles.badge} ${styles.badgeDefault}`}>
                    Default
                  </span>
                )}
              </div>

              <p className={styles.userCount}>
                {role.userCount || 0} user(s) assigned
              </p>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  onClick={() => handleManagePermissions(role)}
                  className={styles.manageButton}
                >
                  Manage Permissions
                </button>
                {!role.isSuperAdmin && (
                  <div className={styles.actionButtons}>
                    <button
                      type="button"
                      onClick={() => handleEditRole(role)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(role)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div 
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
        >
          <div className={styles.modal}>
            <h2 id="role-modal-title" className={styles.modalTitle}>
              {selectedRole ? 'Edit Role' : 'Create New Role'}
            </h2>

            <div>
              <div className={styles.formGroup}>
                <label htmlFor="roleNameId" className={styles.label}>
                  Role Name <span className={styles.required}>*</span>
                </label>
                <input
                  ref={firstFocusableRef}
                  id="roleNameId"
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className={styles.input}
                  placeholder="Enter role name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="roleDescriptionId" className={styles.label}>
                  Description
                </label>
                <textarea
                  id="roleDescriptionId"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className={styles.textarea}
                  placeholder="Enter role description (optional)"
                  rows="3"
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={selectedRole ? handleUpdateRole : handleCreateRole}
                disabled={!newRole.name}
                className={styles.submitButton}
              >
                {selectedRole ? 'Update Role' : 'Create Role'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setNewRole({ name: '', description: '' });
                  setSelectedRole(null);
                }}
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
        onClose={() => { setShowDeleteModal(false); setRoleToDelete(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${roleToDelete?.name}"? This will remove the role from all assigned users.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {showPermissionsModal && selectedRole && (
        <RolePermissionsModal
          role={selectedRole}
          permissions={permissionsData}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedRole(null);
          }}
        />
      )}
    </div>
  );
}

export default Roles;