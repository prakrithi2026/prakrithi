import { useState, useCallback } from 'react';
import { FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiLogIn } from 'react-icons/fi';
import './AdminLogin.css';

// ─── Fixed admin credentials (not changeable) ────────────────────────────────
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'vijiadmin@123';
const SESSION_KEY    = 'dashboard_admin_auth';

// ─── Hook — exposes isAuthenticated + login/logout helpers ───────────────────
export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );

  const login = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}

// ─── Login Screen Component ──────────────────────────────────────────────────
export default function AdminLogin({ onLogin }) {
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [shake, setShake]           = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 460);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      triggerShake();
      return;
    }

    setLoading(true);

    // Simulate a brief auth delay for UX polish
    setTimeout(() => {
      if (
        username.trim() === ADMIN_USERNAME &&
        password          === ADMIN_PASSWORD
      ) {
        onLogin();
      } else {
        setLoading(false);
        setError('Invalid username or password. Please try again.');
        setPassword('');
        triggerShake();
      }
    }, 700);
  };

  return (
    <div className="admin-login">
      {/* Subtle grid texture */}
      <div className="admin-login__grid" />

      <div className={`admin-login__card${shake ? ' admin-login__card--shake' : ''}`}>
        {/* Icon */}
        <div className="admin-login__icon-wrap">
          <div className="admin-login__icon">⚙️</div>
        </div>

        {/* Heading */}
        <h1 className="admin-login__title">Admin Dashboard</h1>
        <p className="admin-login__subtitle">
          Sign in to manage your store&apos;s theme, products&nbsp;&amp;&nbsp;orders.
        </p>

        {/* Error */}
        {error && (
          <div className="admin-login__error" role="alert">
            <FiAlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Form */}
        <form className="admin-login__form" onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="admin-login__field">
            <label className="admin-login__label" htmlFor="admin-username">
              Username
            </label>
            <div className="admin-login__input-wrap">
              <span className="admin-login__input-icon">
                <FiUser size={16} />
              </span>
              <input
                id="admin-username"
                type="text"
                className="admin-login__input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className="admin-login__field">
            <label className="admin-login__label" htmlFor="admin-password">
              Password
            </label>
            <div className="admin-login__input-wrap">
              <span className="admin-login__input-icon">
                <FiLock size={16} />
              </span>
              <input
                id="admin-password"
                type={showPwd ? 'text' : 'password'}
                className="admin-login__input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="admin-login__eye-btn"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
                title={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="admin-login__btn"
            disabled={loading}
            id="admin-login-submit"
          >
            {loading ? (
              <>
                <span className="admin-login__spinner" />
                Signing in…
              </>
            ) : (
              <>
                <FiLogIn size={17} />
                Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        {/* Footer note */}
        <div className="admin-login__note">
          <span className="admin-login__note-dot" />
          Secure admin access only
          <span className="admin-login__note-dot" />
        </div>
      </div>
    </div>
  );
}
