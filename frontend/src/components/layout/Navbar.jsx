import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logout } from '../../store/slices/authSlice';
import Modal from '../Modal';
import styles from './Navbar.module.css';

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.inner}>
          <div className={styles.brand}>
            <span className={styles.brandText}>
              HR Management System
            </span>
          </div>
          
          <div className={styles.userInfo}>
            <div className={styles.userDetails}>
              <span className={styles.userName}>
                {user?.name}
              </span>
              <span className={styles.role}>
                ({user?.roles?.[0]?.name || 'User'})
              </span>
            </div>
            
            <button
              onClick={handleLogoutClick}
              className={styles.logoutButton}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Logout Confirmation"
        message="Do you want to logout?"
        confirmText="Yes"
        cancelText="No"
        variant="primary"
      />
    </nav>
  );
}

export default Navbar;
