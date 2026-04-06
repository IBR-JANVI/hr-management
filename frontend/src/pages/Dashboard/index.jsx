import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserStats } from '../../store/slices/userSlice';
import styles from './Dashboard.module.css';

function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats, statsLoading, statsError } = useSelector((state) => state.users);

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
        <div className={styles.loadingContainer}>
          Loading...
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className={styles.errorContainer}>
        {statsError.message || 'Failed to load stats'}
      </div>
    );
  }

  if (!stats || (stats.totalUsers === 0 && stats.activeUsers === 0 && stats.pendingUsers === 0 && stats.rejectedUsers === 0)) {
    return (
      <div className={styles.emptyContainer}>
        No data available
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.header}>
        Welcome back, {user?.name}!
      </h1>

      <div className={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div>
                <p className={styles.statLabel}>{stat.title}</p>
                <p className={styles.valueLarge}>{stat.value}</p>
              </div>
              <div className={styles.statIcon} style={{ backgroundColor: stat.color }}>
                <span style={{ color: 'var(--color-on-error)', fontSize: 'var(--font-size-xl)' }}>{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelHeader}>
          Your Profile
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <div className={styles.profileRow}>
            <span className={styles.label}>Name:</span>
            <span className={styles.value}>{user?.name}</span>
          </div>
          <div className={styles.profileRow}>
            <span className={styles.label}>Email:</span>
            <span className={styles.value}>{user?.email}</span>
          </div>
          <div className={styles.profileRow}>
            <span className={styles.label}>Role:</span>
            <span className={styles.value}>
              {user?.roles?.[0]?.name || 'User'}
            </span>
          </div>
          <div className={styles.profileRow}>
            <span className={styles.label}>Status:</span>
            <span className={styles.badge}>
              Active
            </span>
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelHeader}>
          Your Permissions
        </h2>
        <div className={styles.permissionsWrapper}>
          {user?.permissions && user.permissions.length > 0 ? (
            user.permissions.map((permission, index) => (
              <span
                key={index}
                className={styles.permissionsTag}
              >
                {permission.module}: {permission.action}
              </span>
            ))
          ) : (
            <p className={styles.noPermissions}>No permissions assigned</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
