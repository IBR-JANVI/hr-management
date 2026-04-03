import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserStats } from '../store/slices/userSlice';
import { canAccess } from '../utils/permissions';

function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats } = useSelector((state) => state.users);

  const canViewUsers = canAccess('users', 'view');

  useEffect(() => {
    dispatch(fetchUserStats());
  }, [dispatch]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      color: 'bg-blue-500',
      icon: '👥'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      color: 'bg-green-500',
      icon: '✓'
    },
    {
      title: 'Pending Approval',
      value: stats?.pendingUsers || 0,
      color: 'bg-yellow-500',
      icon: '⏳'
    },
    {
      title: 'Rejected',
      value: stats?.rejectedUsers || 0,
      color: 'bg-red-500',
      icon: '✕'
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Welcome back, {user?.name}!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-full p-3`}>
                <span className="text-white text-xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Your Profile
        </h2>
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="text-gray-500 w-24">Name:</span>
            <span className="text-gray-800">{user?.name}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500 w-24">Email:</span>
            <span className="text-gray-800">{user?.email}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500 w-24">Role:</span>
            <span className="text-gray-800">
              {user?.roles?.[0]?.name || 'User'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500 w-24">Status:</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              Active
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Your Permissions
        </h2>
        <div className="flex flex-wrap gap-2">
          {user?.permissions?.map((permission, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {permission.module}: {permission.action}
            </span>
          )) || (
            <p className="text-gray-500">No permissions assigned</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
