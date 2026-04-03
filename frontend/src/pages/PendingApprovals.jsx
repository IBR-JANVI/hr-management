import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchPendingUsers, approveUser, rejectUser } from '../store/slices/userSlice';
import { fetchRoles as fetchAllRoles } from '../store/slices/roleSlice';
import { canAccess } from '../utils/permissions';

function PendingApprovals() {
  const dispatch = useDispatch();
  const { pendingUsers, loading } = useSelector((state) => state.users);
  const { roles } = useSelector((state) => state.roles);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);

  const canApprove = canAccess('users', 'approve');
  const canReject = canAccess('users', 'reject');

  useEffect(() => {
    dispatch(fetchPendingUsers());
    dispatch(fetchAllRoles());
  }, [dispatch]);

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
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <p className="text-xl mb-2">🔒</p>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Pending Approvals
      </h1>

      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No pending users to approve
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Pending
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Registered: {new Date(user.createdAt).toLocaleDateString()}
              </p>

              <div className="flex gap-2">
                {canApprove && (
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={() => handleReject(user.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Approve User
            </h2>
            <p className="text-gray-600 mb-4">
              Select roles for {selectedUser.name}
            </p>

            <div className="space-y-2 mb-6">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center">
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
                    className="mr-2"
                  />
                  <span className="text-gray-700">{role.name}</span>
                  {role.isDefault && (
                    <span className="ml-2 text-xs text-gray-500">(Default)</span>
                  )}
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={selectedRoles.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSelectedRoles([]);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
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
