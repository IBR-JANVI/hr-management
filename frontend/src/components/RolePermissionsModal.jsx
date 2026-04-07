import { useState, useMemo, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { assignPermissions, fetchRoles } from '../store/slices/roleSlice';
import useModalFocus from '../hooks/useModalFocus';
import ModuleCard from './ModuleCard';
import { normalizeAction } from '../utils/actions';
import styles from './RolePermissionsModal.module.css';

const ALL_ACTIONS = ['create', 'view', 'update', 'delete'];

const ACTION_LABELS = {
  create: 'Create',
  view: 'View',
  update: 'Update',
  edit: 'Update',
  delete: 'Delete'
};

function RolePermissionsModal({ role, permissions, onClose }) {
  const dispatch = useDispatch();
  const [rolePermissions, setRolePermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);

  useModalFocus(modalRef, role && permissions, onClose);

  useEffect(() => {
    if (role?.permissions) {
      setRolePermissions(role.permissions.map(p => p.id));
    }
  }, [role]);

  const modules = useMemo(() => {
    if (!Array.isArray(permissions)) return {};
    const moduleMap = {};
    permissions.forEach(permission => {
      if (!moduleMap[permission.module]) {
        moduleMap[permission.module] = [];
      }
      moduleMap[permission.module].push(permission);
    });
    return moduleMap;
  }, [permissions]);

  const getModulePermissions = (moduleName) => {
    return modules[moduleName] || [];
  };

  const togglePermission = (permissionId) => {
    setRolePermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleModuleAll = (moduleName, checked) => {
    const modulePerms = getModulePermissions(moduleName);
    const permittedModulePerms = modulePerms.filter(p => ALL_ACTIONS.includes(normalizeAction(p.action)));
    
    if (checked) {
      setRolePermissions(prev => {
        const ids = permittedModulePerms.map(p => p.id);
        return [...new Set([...prev, ...ids])];
      });
    } else {
      const modulePermIds = permittedModulePerms.map(p => p.id);
      setRolePermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
    }
  };

  const isModuleAllChecked = (moduleName) => {
    const modulePerms = getModulePermissions(moduleName);
    const permittedModulePerms = modulePerms.filter(p => ALL_ACTIONS.includes(normalizeAction(p.action)));
    if (permittedModulePerms.length === 0) return false;
    return permittedModulePerms.every(p => rolePermissions.includes(p.id));
  };

  const isModuleIndeterminate = (moduleName) => {
    const modulePerms = getModulePermissions(moduleName);
    const permittedModulePerms = modulePerms.filter(p => ALL_ACTIONS.includes(normalizeAction(p.action)));
    if (permittedModulePerms.length === 0) return false;
    const checkedCount = permittedModulePerms.filter(p => rolePermissions.includes(p.id)).length;
    return checkedCount > 0 && checkedCount < permittedModulePerms.length;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(assignPermissions({ 
        id: role.id, 
        permissionIds: rolePermissions 
      })).unwrap();
      toast.success('Permissions updated successfully');
      onClose();
      dispatch(fetchRoles());
    } catch (error) {
      toast.error(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="permissions-modal-title">
      <div className={styles.modal} ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 id="permissions-modal-title" className={styles.title}>
              Manage Permissions
            </h2>
            <p className={styles.subtitle}>{role.name}</p>
          </div>
          <button type="button" onClick={onClose} className={styles.closeButton}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {Object.keys(modules).length === 0 ? (
            <div className={styles.empty}>No permissions available</div>
          ) : (
            <div className={styles.modulesGrid}>
              {Object.keys(modules).map(moduleName => (
                <ModuleCard
                  key={moduleName}
                  moduleName={moduleName}
                  getModulePermissions={getModulePermissions}
                  ALL_ACTIONS={ALL_ACTIONS}
                  ACTION_LABELS={ACTION_LABELS}
                  rolePermissions={rolePermissions}
                  togglePermission={togglePermission}
                  isModuleAllChecked={isModuleAllChecked}
                  isModuleIndeterminate={isModuleIndeterminate}
                  toggleModuleAll={toggleModuleAll}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RolePermissionsModal;