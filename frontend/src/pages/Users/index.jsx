import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchUsers, deleteUser, createUser, updateUser } from '../../store/slices/userSlice';
import { fetchRoles } from '../../store/slices/roleSlice';
import { usePermissions } from '../../hooks/usePermissions';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/helpers';
import Modal from '../../components/Modal';
import styles from './Users.module.css';

function Users() {
  const dispatch = useDispatch();
  const { users, loading, error, pagination, actionLoading } = useSelector((state) => state.users);
  const { roles } = useSelector((state) => state.roles);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const firstFocusRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleIds: []
  });

  const [formErrors, setFormErrors] = useState({});

  const { canAccess } = usePermissions();
  const canDelete = canAccess('users', 'delete');
  const canCreate = canAccess('users', 'create');
  const canUpdate = canAccess('users', 'update');

  useEffect(() => {
    dispatch(fetchUsers({ page, search: debouncedSearch, status }));
    dispatch(fetchRoles());
  }, [dispatch, page, debouncedSearch, status]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  useEffect(() => {
    if (showCreateModal && firstFocusRef.current) {
      firstFocusRef.current.focus();
    }
  }, [showCreateModal]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!showEditModal && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (formData.roleIds.length === 0) {
      errors.roleIds = 'At least one role is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', roleIds: [] });
    setFormErrors({});
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      roleIds: user.roles?.map(r => r.id) || []
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      await dispatch(createUser(formData)).unwrap();
      toast.success('User created successfully');
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      toast.error(err?.message || 'Failed to create user');
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    try {
      await dispatch(updateUser({ id: selectedUser.id, ...formData })).unwrap();
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } catch (err) {
      toast.error(err?.message || 'Failed to update user');
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteUser(selectedUser.id)).unwrap();
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete user');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const renderModal = (isOpen, onClose, title, onConfirm, confirmText, children, confirmDisabled = false) => {
    if (!isOpen) return null;
    return (
      <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <h2 id="modal-title" className={styles.modalTitle}>{title}</h2>
          <div className={styles.formContainer}>
            {children}
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmDisabled}
              className={styles.confirmButton}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getStatusClass = (status) => {
    return status === 'ACTIVE' ? styles.statusActive : status === 'PENDING' ? styles.statusPending : styles.statusRejected;
  };

  const renderRoleCheckboxes = (formData, setFormData) => (
    <div className={styles.rolesContainer}>
      {Array.isArray(roles) && roles.length > 0 ? roles.map((role) => (
        <label key={role.id} className={styles.roleCheckbox}>
          <input
            type="checkbox"
            checked={formData.roleIds.includes(role.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setFormData({ ...formData, roleIds: [...formData.roleIds, role.id] });
              } else {
                setFormData({ ...formData, roleIds: formData.roleIds.filter(id => id !== role.id) });
              }
            }}
          />
          <span>{role.name}</span>
        </label>
      )) : <span className={styles.noRolesText}>No roles available</span>}
    </div>
  );

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
        {canCreate && (
          <button type="button" onClick={handleOpenCreate} className={styles.createButton}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={styles.buttonIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create User
          </button>
        )}
      </div>

      <div className={styles.filterContainer}>
        <form onSubmit={handleSearch} className={styles.filterForm}>
          <input
            id="search-users"
            type="text"
            aria-label="Search users by name or email"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.filterInput}
          />
          <select
            id="status-filter"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button type="submit" className={styles.submitButton}>Search</button>
        </form>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Roles</th>
              <th>Created At</th>
              {(canDelete || canUpdate) && <th className={styles.actions}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={canDelete || canUpdate ? 6 : 5} className={`${styles.messageCell} ${styles.errorCell}`}>{error.message || 'Failed to load users'}</td>
              </tr>
            ) : loading ? (
              <tr aria-busy="true">
                <td colSpan={canDelete || canUpdate ? 6 : 5} className={styles.messageCell}>Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={canDelete || canUpdate ? 6 : 5} className={styles.messageCell}>No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userName}>{user.name}</div>
                  </td>
                  <td>
                    <div className={styles.userEmail}>{user.email}</div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(user.status)}`}>{user.status}</span>
                  </td>
                  <td>
                    <div className={styles.roleList}>{user.roles?.map((r) => r.name).join(', ') || 'No role'}</div>
                  </td>
                  <td>
                    <div className={styles.userEmail}>{formatDate(user.createdAt)}</div>
                  </td>
                  {(canDelete || canUpdate) && (
                    <td className={styles.actions}>
                      {canUpdate && (
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className={styles.editButton}
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleOpenDelete(user)}
                          className={styles.deleteButton}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className={styles.pageButton}>Previous</button>
          <span className={styles.pageInfo}>Page {page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages} className={styles.pageButton}>Next</button>
        </div>
      )}

      {renderModal(showCreateModal, () => { setShowCreateModal(false); resetForm(); }, 'Create User', handleCreate, 'Create', (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="createName" className={styles.label}>Name *</label>
            <input ref={firstFocusRef} id="createName" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`${styles.input} ${formErrors.name ? styles.inputError : ''}`} />
            {formErrors.name && <span className={styles.errorText}>{formErrors.name}</span>}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="createEmail" className={styles.label}>Email *</label>
            <input id="createEmail" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`${styles.input} ${formErrors.email ? styles.inputError : ''}`} />
            {formErrors.email && <span className={styles.errorText}>{formErrors.email}</span>}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="createPassword" className={styles.label}>Password *</label>
            <input id="createPassword" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`${styles.input} ${formErrors.password ? styles.inputError : ''}`} />
            {formErrors.password && <span className={styles.errorText}>{formErrors.password}</span>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Roles *</label>
            {renderRoleCheckboxes(formData, setFormData)}
            {formErrors.roleIds && <span className={styles.errorText}>{formErrors.roleIds}</span>}
          </div>
        </>
      ), !formData.name || !formData.email || !formData.password || formData.roleIds.length === 0, actionLoading?.createUser)}

      {renderModal(showEditModal, () => { setShowEditModal(false); setSelectedUser(null); resetForm(); }, 'Edit User', handleUpdate, 'Update', (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="editName" className={styles.label}>Name *</label>
            <input id="editName" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`${styles.input} ${formErrors.name ? styles.inputError : ''}`} />
            {formErrors.name && <span className={styles.errorText}>{formErrors.name}</span>}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="editEmail" className={styles.label}>Email *</label>
            <input id="editEmail" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`${styles.input} ${formErrors.email ? styles.inputError : ''}`} />
            {formErrors.email && <span className={styles.errorText}>{formErrors.email}</span>}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="editPassword" className={styles.label}>Password <span className={styles.optional}>(leave blank to keep current)</span></label>
            <input id="editPassword" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`${styles.input} ${formErrors.password ? styles.inputError : ''}`} />
            {formErrors.password && <span className={styles.errorText}>{formErrors.password}</span>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Roles *</label>
            {renderRoleCheckboxes(formData, setFormData)}
            {formErrors.roleIds && <span className={styles.errorText}>{formErrors.roleIds}</span>}
          </div>
        </>
      ), !formData.name || !formData.email || formData.roleIds.length === 0, actionLoading?.updateUser)}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedUser(null); }}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default Users;