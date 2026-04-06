import styles from './Button.module.css';
import { classNames } from '../utils/helpers';

function Button({ children, onClick, variant = 'primary', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={classNames(styles.base, styles[variant], className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
