import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchPendingUsers, approveUser, rejectUser } from '../../store/slices/userSlice';
import { fetchRoles as fetchAllRoles } from '../../store/slices/roleSlice';
import { canAccess } from '../../utils/permissions';

function PendingApprovals() {
  const dispatch = useDispatch();
  const { pendingUsers, loading } = useSelector((state) => state.users);
  const { roles } = useSelector((state) => state.roles);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  const canApprove = canAccess('users', 'approve');
  const canReject = canAccess('users', 'reject');

  useEffect(() => {
    dispatch(fetchPendingUsers());
    dispatch(fetchAllRoles());
  }, [dispatch]);

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

  const handleReject = async (id) => {
    const user = pendingUsers.find(u => u.id === id);
    if (window.confirm('Are you sure you want to reject this user?')) {
      try {
        await dispatch(rejectUser(id)).unwrap();
        toast.success(`User ${user?.name || 'User'} has been rejected`);
      } catch (error) {
        toast.error(error?.error?.message || 'Failed to reject user');
      }
    }
  };

  if (!canApprove && !canReject) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-2)' }}>🔒</p>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div aria-busy="true" aria-live="polite" style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-6)' }}>
        Pending Approvals
      </h1>

      {pendingUsers.length === 0 ? (
        <div style={{ backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: 'var(--spacing-6)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No pending users to approve
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-6)' }}>
          {pendingUsers.map((user) => (
            <div key={user.id} style={{ backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: 'var(--spacing-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                    {user.name}
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{user.email}</p>
                </div>
                <span style={{ padding: 'var(--spacing-1) var(--spacing-2)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-warning)', color: 'white', borderRadius: 'var(--radius-full)' }}>
                  Pending
                </span>
              </div>

              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>
                Registered: {new Date(user.createdAt).toLocaleDateString()}
              </p>

              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                {canApprove && (
                  <button
                    onClick={() => setSelectedUser(user)}
                    style={{ flex: 1, padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-success)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
                  >
                    Approve
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={() => handleReject(user.id)}
                    style={{ padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-error)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-modal)' }}
          ref={modalRef}
        >
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', padding: 'var(--spacing-6)', maxWidth: '28rem', width: '100%', margin: 'var(--spacing-4)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-4)' }}>
              Approve User
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-4)' }}>
              Select roles for {selectedUser.name}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-6)', maxHeight: '300px', overflowY: 'auto' }}>
              {roles.map((role) => (
                <label key={role.id} style={{ display: 'flex', alignItems: 'center' }}>
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
                    style={{ marginRight: 'var(--spacing-2)' }}
                  />
                  <span style={{ color: 'var(--color-text-primary)' }}>{role.name}</span>
                  {role.isDefault && (
                    <span style={{ marginLeft: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>(Default)</span>
                  )}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
              <button
                ref={firstFocusableRef}
                onClick={handleApprove}
                disabled={selectedRoles.length === 0}
                style={{ flex: 1, padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-success)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: selectedRoles.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedRoles.length === 0 ? 0.5 : 1 }}
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSelectedRoles([]);
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

export default PendingApprovals;
