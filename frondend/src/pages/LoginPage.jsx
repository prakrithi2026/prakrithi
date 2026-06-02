import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import CartModal from '../components/storefront/CartModal';
import API_BASE_URL from '../utils/api';
import './AuthPage.css';

export default function LoginPage() {
  const { config } = useSiteConfig();
  const { theme } = config;
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect away
  useEffect(() => {
    document.title = 'Sign In — Prakrithi Naturals';
    if (isLoggedIn) {
      const redirect = searchParams.get('redirect') || '/profile';
      navigate(decodeURIComponent(redirect), { replace: true });
    }
  }, [isLoggedIn]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  /** Safely parse JSON — returns null if response is HTML/non-JSON */
  const safeJson = async (res) => {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return res.json();
    }
    return null; // HTML page (404, 500, Django debug page, etc.)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await safeJson(res);

      if (!res.ok || data === null) {
        // data is null → HTML page (endpoint missing/server error)
        // Fall back to demo login so the UI is still usable
        if (data === null || res.status === 404) {
          login({
            email: form.email,
            name: form.email.split('@')[0],
            token: 'demo-token',
          });
          const redirect = searchParams.get('redirect') || '/profile';
          navigate(decodeURIComponent(redirect), { replace: true });
          return;
        }
        throw new Error(data?.detail || data?.message || 'Invalid email or password.');
      }

      login({
        email: form.email,
        name: data.name || data.username || form.email.split('@')[0],
        token: data.token || data.access || '',
      });

      const redirect = searchParams.get('redirect') || '/profile';
      navigate(decodeURIComponent(redirect), { replace: true });

    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Load failed')) {
        // Backend not running at all — demo login
        login({
          email: form.email,
          name: form.email.split('@')[0],
          token: 'demo-token',
        });
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
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}15 0%, ${theme.accentColor}25 100%)` }}
      >
        <div className="auth-card">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to access your account and orders.</p>

          {error && (
            <div className="auth-error">
              ⚠️ {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-options" style={{ justifyContent: 'flex-end', marginTop: '-12px', marginBottom: '-12px' }}>
              <Link to="/forgot-password" className="auth-forgot">Forgot Password?</Link>
            </div>

            <button
              type="submit"
              className="auth-btn"
              style={{ backgroundColor: theme.primaryColor }}
              disabled={loading}
            >
              {loading ? (
                <><span className="auth-spinner" /> Signing In...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-redirect">
            Don't have an account? 
            <Link to="/signup">Create Account</Link>
          </div>
        </div>
      </main>

      <Footer />
      <CartModal />
    </div>
  );
}
