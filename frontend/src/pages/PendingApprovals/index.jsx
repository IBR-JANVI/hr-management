import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchPendingUsers, approveUser, rejectUser } from '../../store/slices/userSlice';
import { fetchRoles as fetchAllRoles } from '../../store/slices/roleSlice';
import { usePermissions } from '../../hooks/usePermissions';
import Modal from '../../components/Modal';
import styles from './PendingApprovals.module.css';

function PendingApprovals() {
  const dispatch = useDispatch();
  const { pendingUsers, loading } = useSelector((state) => state.users);
  const { roles } = useSelector((state) => state.roles);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectUserId, setRejectUserId] = useState(null);
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  const { canAccess } = usePermissions();
  const canApprove = canAccess('users', 'approve');
  const canReject = canAccess('users', 'reject');

  useEffect(() => {
    if (canApprove || canReject) {
      dispatch(fetchPendingUsers());
    }
  }, [dispatch, canApprove, canReject]);

  useEffect(() => {
    if (canApprove) {
      dispatch(fetchAllRoles());
    }
  }, [dispatch, canApprove]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedUser) {
        setSelectedUser(null);
        setSelectedRoles([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [selectedUser]);

  const handleApprove = async () => {
    if (selectedUser && selectedRoles.length > 0) {
      try {
        await dispatch(approveUser({ id: selectedUser.id, roleIds: selectedRoles })).unwrap();
        toast.success(`User ${selectedUser.name} has been approved successfully`);
        setSelectedUser(null);
        setSelectedRoles([]);
      } catch (error) {
        toast.error(error?.error?.message || 'Failed to approve user');
      }
    }
  };

  const handleRejectClick = (id) => {
    setRejectUserId(id);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    const user = pendingUsers.find(u => u.id === rejectUserId);
    try {
      await dispatch(rejectUser(rejectUserId)).unwrap();
      toast.success(`User ${user?.name || 'User'} has been rejected`);
      setShowRejectModal(false);
      setRejectUserId(null);
    } catch (error) {
      toast.error(error?.error?.message || 'Failed to reject user');
    }
  };

  const handleCancelReject = () => {
    setShowRejectModal(false);
    setRejectUserId(null);
  };

  if (!canApprove && !canReject) {
    return (
      <div className={styles.lockedContainer}>
        <div className={styles.lockedText}>
          <p className={styles.lockedIcon}>🔒</p>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div aria-busy="true" aria-live="polite" className={styles.loadingWrapper}>
        Loading...
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>
        Pending Approvals
      </h1>

      {pendingUsers.length === 0 ? (
        <div className={styles.emptyState}>
          No pending users to approve
        </div>
      ) : (
        <div className={styles.grid}>
          {pendingUsers.map((user) => (
            <div key={user.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.userName}>
                    {user.name}
                  </h3>
                  <p className={styles.userEmail}>{user.email}</p>
                </div>
                <span className={styles.statusBadge}>
                  Pending
                </span>
              </div>

              <p className={styles.registeredText}>
                Registered: {new Date(user.createdAt).toLocaleDateString()}
              </p>

              <div className={styles.buttonGroup}>
                {canApprove && (
                  <button
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className={styles.approveButton}
                  >
                    Approve
                  </button>
                )}
                {canReject && (
                  <button
                    type="button"
                    onClick={() => handleRejectClick(user.id)}
                    className={styles.rejectButton}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <div 
          className={styles.modalOverlay}
          ref={modalRef}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>
              Approve User
            </h2>
            <p className={styles.modalDescription}>
              Select roles for {selectedUser.name}
            </p>

            <div className={styles.roleList}>
              {roles.map((role) => (
                <label key={role.id} className={styles.roleLabel}>
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, role.id]);
                      } else {
                        setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                      }
                    }}
                    className={styles.roleCheckbox}
                  />
                  <span className={styles.roleName}>{role.name}</span>
                  {role.isDefault && (
                    <span className={styles.roleDefault}>(Default)</span>
                  )}
                </label>
              ))}
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                ref={firstFocusableRef}
                onClick={handleApprove}
                disabled={selectedRoles.length === 0}
                className={styles.approveButton}
                style={{ opacity: selectedRoles.length === 0 ? 0.5 : 1, cursor: selectedRoles.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setSelectedRoles([]);
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
        isOpen={showRejectModal}
        onClose={handleCancelReject}
        onConfirm={handleConfirmReject}
        title="Reject User"
        message="Are you sure you want to reject this user?"
        confirmText="Reject"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default PendingApprovals;
