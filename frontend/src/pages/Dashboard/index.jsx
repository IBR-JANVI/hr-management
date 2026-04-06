import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserStats } from '../../store/slices/userSlice';
import { canAccess } from '../../utils/permissions';

function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats, statsLoading, statsError } = useSelector((state) => state.users);

  const canViewUsers = canAccess('users', 'view');

  useEffect(() => {
    dispatch(fetchUserStats());
  }, [dispatch]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      color: 'var(--color-primary)',
      icon: '👥'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      color: 'var(--color-success)',
      icon: '✓'
    },
    {
      title: 'Pending Approval',
      value: stats?.pendingUsers || 0,
      color: 'var(--color-warning)',
      icon: '⏳'
    },
    {
      title: 'Rejected',
      value: stats?.rejectedUsers || 0,
      color: 'var(--color-error)',
      icon: '✕'
    }
  ];

  if (statsLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="error-container" style={{ padding: '2rem', color: 'var(--color-error)' }}>
        {statsError.message || 'Failed to load stats'}
      </div>
    );
  }

  if (!stats || (stats.totalUsers === 0 && stats.activeUsers === 0 && stats.pendingUsers === 0 && stats.rejectedUsers === 0)) {
    return (
      <div className="empty-container" style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>
        No data available
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-6)' }}>
        Welcome back, {user?.name}!
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        {statCards.map((stat, index) => (
          <div key={index} style={{ backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: 'var(--spacing-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{stat.title}</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-text-primary)', marginTop: 'var(--spacing-1)' }}>{stat.value}</p>
              </div>
              <div style={{ backgroundColor: stat.color, borderRadius: 'var(--radius-full)', padding: 'var(--spacing-3)' }}>
                <span style={{ color: 'white', fontSize: 'var(--font-size-xl)' }}>{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: 'var(--spacing-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-4)' }}>
          Your Profile
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-text-muted)', width: '6rem' }}>Name:</span>
            <span style={{ color: 'var(--color-text-primary)' }}>{user?.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-text-muted)', width: '6rem' }}>Email:</span>
            <span style={{ color: 'var(--color-text-primary)' }}>{user?.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-text-muted)', width: '6rem' }}>Role:</span>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {user?.roles?.[0]?.name || 'User'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-text-muted)', width: '6rem' }}>Status:</span>
            <span style={{ padding: 'var(--spacing-1) var(--spacing-2)', backgroundColor: 'var(--color-success)', color: 'white', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)' }}>
              Active
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--spacing-6)', backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: 'var(--spacing-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-4)' }}>
          Your Permissions
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
          {user?.permissions && user.permissions.length > 0 ? (
            user.permissions.map((permission, index) => (
              <span
                key={index}
                style={{ padding: 'var(--spacing-1) var(--spacing-3)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)' }}
              >
                {permission.module}: {permission.action}
              </span>
            ))
          ) : (
            <p style={{ color: 'var(--color-text-muted)' }}>No permissions assigned</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
