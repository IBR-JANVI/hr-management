import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { login, clearAuthError } from '../../store/slices/authSlice';
import styles from './index.module.css';
import { classNames } from '../../utils/helpers';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      toast.success('Login successful');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      const errorMessage = error?.error?.message || error?.message || 'Login failed';
      const normalized = String(errorMessage).toLowerCase();
      
      if (normalized.includes('not active') || normalized.includes('approval')) {
        toast.error('Your account is not approved yet. Please contact admin.');
      } else if (normalized.includes('invalid') || normalized.includes('credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(errorMessage);
      }
      
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await dispatch(login({ email: email.trim(), password })).unwrap();
    } catch (err) {
      // Error is handled by the useEffect above
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.card}>
        <div className={styles.title}>
          <h1 className={styles.titleText}>HRM System</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: '' }));
              }}
              className={classNames(styles.input, errors.email && styles.inputError)}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className={styles.errorText}>{errors.email}</p>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: '' }));
                }}
                className={classNames(styles.input, errors.password && styles.inputError)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <p className={styles.errorText}>{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footerLink}>
          <p>
            Don't have an account?{' '}
            <Link to="/register" className={styles.link}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
