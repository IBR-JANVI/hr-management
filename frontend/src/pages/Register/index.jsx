import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { register, clearAuthError } from '../../store/slices/authSlice';
import styles from './index.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const errorMessage = error?.error?.message || error?.message || 'Registration failed';
      toast.error(errorMessage);
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Name is required');
      return;
    }

    if (!email.trim()) {
      setValidationError('Email is required');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setValidationError('Invalid email format');
      return;
    }

    if (!password) {
      setValidationError('Password is required');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    await dispatch(register({ name: name.trim(), email: email.trim(), password })).unwrap();
    setRegistrationSuccess(true);
    toast.success('Registration successful. Please wait for admin approval.');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>HRM System</h1>
          <p className={styles.subtitle}>Create a new account</p>
        </div>

        {registrationSuccess ? (
          <div className={styles.successContainer}>
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✓</div>
              <h3 className={styles.successTitle}>Registration Successful!</h3>
              <p className={styles.successText}>
                Your account is pending approval. You will be able to login after admin approval.
              </p>
            </div>
            <Link
              to="/login"
              className={styles.loginLink}
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <label htmlFor="name" className={styles.label}>
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationError('');
                }}
                className={styles.input}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationError('');
                }}
                className={styles.input}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError('');
                }}
                className={styles.input}
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setValidationError('');
                }}
                className={styles.input}
                placeholder="Confirm your password"
              />
            </div>

            {validationError && (
              <p className={styles.error}>{validationError}</p>
            )}

            <div className={styles.checkboxLabel}>
              <input
                id="showPassword"
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="showPassword" className={styles.checkboxText}>
                Show password
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className={styles.submitButton}
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Already have an account?{' '}
            <Link to="/login" className={styles.footerLink}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
