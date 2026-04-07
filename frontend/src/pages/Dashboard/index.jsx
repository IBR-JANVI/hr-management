import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserStats, fetchUserAttendance } from '../../store/slices/userSlice';
import Attendance from '../../components/Attendance';
import styles from './Dashboard.module.css';

function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats, statsLoading, statsError, attendance, attendanceLoading, attendanceError } = useSelector((state) => state.users);
  const [currentDate] = useState(() => new Date());

  const isAdmin = Array.isArray(user?.roles) && user.roles.some(role => role?.name?.toLowerCase() === 'admin' || role?.name?.toLowerCase() === 'super admin');

  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const renderProfilePanel = () => (
    <div className={styles.panel}>
      <h2 className={styles.panelHeader}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.panelHeaderIcon} style={{ width: 20, height: 20 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        Your Profile
      </h2>
      <div className={styles.profileCard}>
        <div className={styles.profileItem}>
          <span className={styles.profileLabel}>Name</span>
          <span className={styles.profileValue}>{user?.name}</span>
        </div>
        <div className={styles.profileItem}>
          <span className={styles.profileLabel}>Email</span>
          <span className={styles.profileValue}>{user?.email}</span>
        </div>
        <div className={styles.profileItem}>
          <span className={styles.profileLabel}>Role</span>
          <span className={styles.profileValue}>{user?.roles?.map(r => r.name).join(', ') || 'User'}</span>
        </div>
        <div className={styles.profileItem}>
          <span className={styles.profileLabel}>Status</span>
          <span className={styles.badge}>Active</span>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchUserStats());
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    dispatch(fetchUserAttendance({ month, year }));
  }, [dispatch, month, year]);

  const isLoading = isAdmin && statsLoading;
  const hasError = isAdmin && statsError;
  const hasNoData = isAdmin && !statsLoading && stats !== null && stats.totalUsers === 0 && stats.activeUsers === 0 && stats.pendingUsers === 0 && stats.rejectedUsers === 0;

  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <div className={styles.loadingContainer}>
          Loading...
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={styles.errorContainer}>
        {statsError.message || 'Failed to load stats'}
      </div>
    );
  }

  if (hasNoData) {
    return (
      <div className={styles.emptyContainer}>
        No data available
      </div>
    );
  }

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

  return (
    <div>
      <div className={styles.header}>
        <p className={styles.welcomeText}>Welcome back,</p>
        <h1 className={styles.userName}>{user?.name}!</h1>
      </div>

      {isAdmin ? (
        <>
          <div className={styles.statsGrid}>
            {statCards.map((stat) => (
              <div key={stat.title} className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <div>
                    <p className={styles.statLabel}>{stat.title}</p>
                    <p className={styles.valueLarge}>{stat.value}</p>
                  </div>
                  <div className={styles.statIcon} style={{ backgroundColor: stat.color }}>
                    <span className={styles.statIconText}>{stat.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {renderProfilePanel()}

          <div className={styles.panel}>
            <h2 className={styles.panelHeader}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.panelHeaderIcon} style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              Your Permissions
            </h2>
            <div className={styles.permissionsWrapper}>
              {user?.permissions && user.permissions.length > 0 ? (
                user.permissions.map((permission) => (
                  <span
                    key={`${permission.module}-${permission.action}`}
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
        </>
      ) : (
        <>
          {renderProfilePanel()}

          <div className={styles.panel}>
            <Attendance 
              attendance={attendance} 
              attendanceLoading={attendanceLoading} 
              attendanceError={attendanceError} 
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
