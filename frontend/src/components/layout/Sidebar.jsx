import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { canAccess } from '../../utils/permissions';

function Sidebar() {
  const { user } = useSelector((state) => state.auth);

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: '📊',
      show: true
    },
    {
      path: '/dashboard/users',
      label: 'Users',
      icon: '👥',
      show: canAccess('users', 'view')
    },
    {
      path: '/dashboard/users/pending',
      label: 'Pending Approvals',
      icon: '⏳',
      show: canAccess('users', 'approve')
    },
    {
      path: '/dashboard/roles',
      label: 'Roles',
      icon: '🔐',
      show: canAccess('roles', 'view')
    },
    {
      path: '/dashboard/permissions',
      label: 'Permissions',
      icon: '🔑',
      show: canAccess('permissions', 'view')
    }
  ];

  const filteredItems = menuItems.filter(item => item.show);

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold">HRM System</h1>
        <p className="text-xs text-gray-400 mt-1">Welcome, {user?.name || 'User'}</p>
      </div>
      
      <nav className="mt-4">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white ${
                isActive ? 'bg-gray-700 text-white border-l-4 border-blue-500' : ''
              }`
            }
          >
            <span className="mr-3">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
