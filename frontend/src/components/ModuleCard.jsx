import styles from '../components/ModuleCard.module.css';
import { normalizeAction } from '../utils/actions';

function ModuleCard({
  moduleName,
  getModulePermissions,
  ALL_ACTIONS,
  ACTION_LABELS,
  rolePermissions,
  togglePermission,
  isModuleAllChecked,
  isModuleIndeterminate,
  toggleModuleAll
}) {
  const modulePerms = getModulePermissions(moduleName);
  
  return (
    <div className={styles.moduleCard}>
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
  );
}

export default ModuleCard;