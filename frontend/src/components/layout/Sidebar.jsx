import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePermissions } from '../../hooks/usePermissions';
import styles from './Sidebar.module.css';
import { classNames } from '../../utils/helpers';

const DASHBOARD_PATH = '/dashboard';
const USERS_PATH = '/dashboard/users';
const PENDING_APPROVALS_PATH = '/dashboard/users/pending';
const ROLES_PATH = '/dashboard/roles';
const PERMISSIONS_PATH = '/dashboard/permissions';

const MODULE_USERS = 'users';
const MODULE_ROLES = 'roles';
const MODULE_PERMISSIONS = 'permissions';

const ACTION_VIEW = 'view';
const ACTION_APPROVE = 'approve';

const LABEL_DASHBOARD = 'Dashboard';
const LABEL_USERS = 'Users';
const LABEL_PENDING_APPROVALS = 'Pending Approvals';
const LABEL_ROLES = 'Roles';
const LABEL_PERMISSIONS = 'Permissions';

const ICON_DASHBOARD = '📊';
const ICON_USERS = '👥';
const ICON_PENDING_APPROVALS = '⏳';
const ICON_ROLES = '🔐';
const ICON_PERMISSIONS = '🔑';

function Sidebar() {
  const { user } = useSelector((state) => state.auth);
  const { canAccess } = usePermissions();

  const menuItems = [
    {
      path: DASHBOARD_PATH,
      label: LABEL_DASHBOARD,
      icon: ICON_DASHBOARD,
      show: true
    },
    {
      path: USERS_PATH,
      label: LABEL_USERS,
      icon: ICON_USERS,
      show: canAccess(MODULE_USERS, ACTION_VIEW)
    },
    {
      path: PENDING_APPROVALS_PATH,
      label: LABEL_PENDING_APPROVALS,
      icon: ICON_PENDING_APPROVALS,
      show: canAccess(MODULE_USERS, ACTION_APPROVE)
    },
    {
      path: ROLES_PATH,
      label: LABEL_ROLES,
      icon: ICON_ROLES,
      show: canAccess(MODULE_ROLES, ACTION_VIEW)
    },
    {
      path: PERMISSIONS_PATH,
      label: LABEL_PERMISSIONS,
      icon: ICON_PERMISSIONS,
      show: canAccess(MODULE_PERMISSIONS, ACTION_VIEW)
    }
  ];

  const filteredItems = menuItems.filter(item => item.show);

  return (
    <aside className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>HRM System</h1>
        <p className={styles.userText}>Welcome, {user?.name || 'User'}</p>
      </div>
      
      <nav className={styles.nav}>
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              classNames(
                styles.navLink,
                isActive ? styles.navLinkActive : ''
              )
            }
          >
            <span className={styles.icon} aria-hidden="true">{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
