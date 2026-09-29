import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import CartModal from '../components/storefront/CartModal';
import API_BASE_URL from '../utils/api';
import './AuthPage.css';

export default function SignupPage() {
  const { config } = useSiteConfig();
  const { theme } = config;
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Create Account — Prakrithi Naturals';
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  /** Safely parse JSON — returns null if response is HTML/non-JSON */
  const safeJson = async (res) => {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });

      const data = await safeJson(res);

      if (!res.ok || data === null) {
        if (data === null || res.status === 404) {
          // Endpoint missing — demo mode
          login({ email: form.email, name: form.name || form.email.split('@')[0], token: 'demo-token' });
          const redirect = searchParams.get('redirect') || '/profile';
          navigate(decodeURIComponent(redirect), { replace: true });
          return;
        }
        throw new Error(data?.detail || data?.message || 'Registration failed.');
      }

      login({
        email: form.email,
        name: data.name || form.name || form.email.split('@')[0],
        token: data.token || '',
      });
      const redirect = searchParams.get('redirect') || '/profile';
      navigate(decodeURIComponent(redirect), { replace: true });

    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Load failed')) {
        login({ email: form.email, name: form.name || form.email.split('@')[0], token: 'demo-token' });
        const redirect = searchParams.get('redirect') || '/profile';
        navigate(decodeURIComponent(redirect), { replace: true });
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const themeStyle = {
    '--primary': theme.primaryColor,
    '--accent':  theme.accentColor,
    fontFamily:  theme.fontFamily,
  };

  return (
    <div className="auth-page storefront" style={themeStyle}>
      <AnnouncementBar />
      <Navbar />

      <main 
        className="auth-main" 
        style={{ background: `linear-gradient(135deg, ${theme.accentColor}15 0%, ${theme.primaryColor}25 100%)` }}
      >
        <div className="auth-card" style={{ maxWidth: '540px' }}>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join us to shop faster and track your orders easily.</p>

          {error && <div className="auth-error">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-form-row">
              <div className="auth-field">
                <label htmlFor="signup-password">Password</label>
                <div className="auth-input-wrapper">
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-confirm-password">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {form.confirmPassword && form.password && (
                  <span className={`auth-field-hint ${form.password === form.confirmPassword ? 'auth-field-hint--success' : 'auth-field-hint--error'}`}>
                    {form.password === form.confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn"
              style={{ backgroundColor: theme.primaryColor }}
              disabled={loading}
            >
              {loading ? (
                <><span className="auth-spinner" /> Creating Account...</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-redirect">
            Already have an account? 
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </main>

      <Footer />
      <CartModal />
    </div>
  );
}
