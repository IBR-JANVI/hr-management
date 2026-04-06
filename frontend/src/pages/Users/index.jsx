import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchUsers, deleteUser } from '../../store/slices/userSlice';
import { usePermissions } from '../../hooks/usePermissions';
import { formatDate } from '../../utils/helpers';

function Users() {
  const dispatch = useDispatch();
  const { users, loading, error, pagination } = useSelector((state) => state.users);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { canAccess } = usePermissions();
  const canDelete = canAccess('users', 'delete');
  const canCreate = canAccess('users', 'create');

  const handleCreateUser = () => {
    toast.success('Create user feature coming soon');
  };

  useEffect(() => {
    dispatch(fetchUsers({ page, search, status }));
  }, [dispatch, page, search, status]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await dispatch(deleteUser(id)).unwrap();
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error(error?.error?.message || 'Failed to delete user');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-text-primary)' }}>User Management</h1>
        {canCreate && (
          <button onClick={handleCreateUser} style={{ padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
            Create User
          </button>
        )}
      </div>

      <div style={{ backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
          <input
            id="search-users"
            type="text"
            aria-label="Search users by name or email"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: 'var(--spacing-2) var(--spacing-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
          />
          <select
            id="status-filter"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: 'var(--spacing-2) var(--spacing-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button
            type="submit"
            style={{ padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
          >
            Search
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <tr>
              <th style={{ padding: 'var(--spacing-3) var(--spacing-6)', textAlign: 'left', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Name
              </th>
              <th style={{ padding: 'var(--spacing-3) var(--spacing-6)', textAlign: 'left', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Email
              </th>
              <th style={{ padding: 'var(--spacing-3) var(--spacing-6)', textAlign: 'left', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Status
              </th>
              <th style={{ padding: 'var(--spacing-3) var(--spacing-6)', textAlign: 'left', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Roles
              </th>
              <th style={{ padding: 'var(--spacing-3) var(--spacing-6)', textAlign: 'left', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Created At
              </th>
              {canDelete && (
                <th style={{ padding: 'var(--spacing-3) var(--spacing-6)', textAlign: 'right', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'var(--color-bg-primary)', borderTop: '1px solid var(--color-border)' }}>
            {error && (
              <tr>
                <td colSpan={canDelete ? 6 : 5} style={{ padding: 'var(--spacing-4)', textAlign: 'center', color: 'var(--color-error)' }}>
                  {error.message || 'Failed to load users'}
                </td>
              </tr>
            )}
            {loading ? (
              <tr aria-busy="true">
                <td colSpan={canDelete ? 6 : 5} style={{ padding: 'var(--spacing-4)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={canDelete ? 6 : 5} style={{ padding: 'var(--spacing-4)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--spacing-4)', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                      {user.name}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--spacing-4)', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{user.email}</div>
                  </td>
                  <td style={{ padding: 'var(--spacing-4)', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        padding: 'var(--spacing-1) var(--spacing-2)',
                        fontSize: 'var(--font-size-sm)',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: user.status === 'ACTIVE' ? 'var(--color-success)' : user.status === 'PENDING' ? 'var(--color-warning)' : 'var(--color-error)',
                        color: 'white'
                      }}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--spacing-4)', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      {user.roles?.map((r) => r.name).join(', ')}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--spacing-4)', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  {canDelete && (
                    <td style={{ padding: 'var(--spacing-4)', whiteSpace: 'nowrap', textAlign: 'right', fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
                      <button
                        onClick={() => handleDelete(user.id)}
                        style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'var(--spacing-4)', gap: 'var(--spacing-2)' }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{ padding: 'var(--spacing-2) var(--spacing-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
            style={{ padding: 'var(--spacing-2) var(--spacing-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', opacity: page === pagination.totalPages ? 0.5 : 1, cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Users;
