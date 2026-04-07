import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { assignPermissions, fetchRoles } from '../store/slices/roleSlice';
import styles from './RolePermissionsModal.module.css';

const ALL_ACTIONS = ['create', 'view', 'update', 'delete'];

const ACTION_LABELS = {
  create: 'Create',
  view: 'View',
  update: 'Update',
  edit: 'Update',
  delete: 'Delete'
};

const normalizeAction = (action) => {
  const normalized = action?.toLowerCase();
  if (normalized === 'edit') return 'update';
  if (normalized === 'read') return 'view';
  return normalized;
};

function RolePermissionsModal({ role, permissions, onClose }) {
  const dispatch = useDispatch();
  const [rolePermissions, setRolePermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (role?.permissions) {
      setRolePermissions(role.permissions.map(p => p.id));
    }
  }, [role]);

  useEffect(() => {
    if (!role || !permissions) return;

    previousFocusRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }, 0);

    return () => {
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [role, permissions]);

  useEffect(() => {
    if (!role || !permissions || !modalRef.current) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [role, permissions, onClose]);

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

  const getAllModuleActions = (moduleName) => {
    const modulePerms = getModulePermissions(moduleName);
    return modulePerms.map(p => normalizeAction(p.action));
  };

  const hasModulePermission = (moduleName, action) => {
    const modulePerms = getModulePermissions(moduleName);
    const permission = modulePerms.find(p => p.action === action);
    return permission ? rolePermissions.includes(permission.id) : false;
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
                <div key={moduleName} className={styles.moduleCard}>
                  <div className={styles.moduleHeader}>
                    <div className={styles.moduleCheckbox}>
                      <input
                        type="checkbox"
                        id={`module-${moduleName}`}
                        checked={isModuleAllChecked(moduleName)}
                        ref={el => {
                          if (el) el.indeterminate = isModuleIndeterminate(moduleName);
                        }}
                        onChange={(e) => toggleModuleAll(moduleName, e.target.checked)}
                      />
                      <label htmlFor={`module-${moduleName}`} className={styles.moduleName}>
                        {moduleName}
                      </label>
                    </div>
                    <button
                      type="button"
                      className={styles.selectAllBtn}
                      onClick={() => toggleModuleAll(moduleName, !isModuleAllChecked(moduleName))}
                    >
                      {isModuleAllChecked(moduleName) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className={styles.permissionsList}>
                    {ALL_ACTIONS.map(action => {
                      const modulePerms = getModulePermissions(moduleName);
                      const permission = modulePerms.find(p => normalizeAction(p.action) === action);
                      if (!permission) {
                        return (
                          <label key={action} className={`${styles.permissionItem} ${styles.permissionDisabled}`}>
                            <input type="checkbox" disabled />
                            <span className={styles.permissionLabel}>{ACTION_LABELS[action]}</span>
                            <span className={styles.notAvailableText}>(not available)</span>
                          </label>
                        );
                      }
                      return (
                        <label key={action} className={styles.permissionItem}>
                          <input
                            type="checkbox"
                            checked={rolePermissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                          />
                          <span className={styles.permissionLabel}>{ACTION_LABELS[action]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
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