import { useSelector } from 'react-redux';

export const usePermissions = () => {
  const { user } = useSelector((state) => state.auth);
  
  const hasPermission = (module, action) => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    
    return user.permissions?.some(
      (p) => p.module === module && p.action === action
    ) || false;
  };

  const hasAnyPermission = (requiredPermissions) => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    
    return requiredPermissions.some(
      ({ module, action }) => hasPermission(module, action)
    );
  };

  const hasAllPermissions = (requiredPermissions) => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    
    return requiredPermissions.every(
      ({ module, action }) => hasPermission(module, action)
    );
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin: user?.isSuperAdmin || false,
    permissions: user?.permissions || [],
    user
  };
};

export const canAccess = (module, action) => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return false;
  
  const user = JSON.parse(storedUser);
  if (user.isSuperAdmin) return true;
  
  return user.permissions?.some(
    (p) => p.module === module && p.action === action
  ) || false;
};

export default usePermissions;