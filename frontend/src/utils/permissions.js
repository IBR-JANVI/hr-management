export const canAccess = (module, action) => {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return false;
    
    const user = JSON.parse(storedUser);
    if (user.isSuperAdmin) return true;
    
    return user.permissions?.some(
      (p) => p.module === module && p.action === action
    ) || false;
  } catch (error) {
    return false;
  }
};
