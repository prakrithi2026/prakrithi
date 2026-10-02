import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useSiteConfig } from '../context/SiteConfigContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import CartModal from '../components/storefront/CartModal';
import API_BASE_URL from '../utils/api';
import './AuthPage.css';

export default function ForgotPasswordPage() {
  const { config } = useSiteConfig();
  const { theme } = config;

  const [searchParams] = useSearchParams();
  const emailFromQuery = (searchParams.get('email') || '').trim();

  // If email was already entered on the login page, start directly at step 2 (enter code)
  const [step, setStep] = useState(emailFromQuery ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [devCode, setDevCode] = useState('');
  const [emailSent, setEmailSent] = useState(true);

  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const autoSentRef = useRef(false);

  useEffect(() => {
    document.title = 'Forgot Password — Prakrithi Naturals';
  }, []);

  // Cooldown countdown for Resend Code
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const safeJson = async (res) => {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return res.json();
    }
    return null;
  };

  // Send verification code to email
  const sendOtpCode = useCallback(async (targetEmail) => {
    const toEmail = (targetEmail || email).trim();
    if (!toEmail) {
      setError('Please enter your email address.');
      setStep(1);
      return;
    }

    setLoading(true);
    setError('');
    setInfoMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: toEmail }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || 'Failed to send verification code.');
      }

      if (data?.dev_code) {
        setDevCode(data.dev_code);
      }
      setEmailSent(data?.email_sent !== false);
      setInfoMsg(data?.detail || `A 6-digit verification code has been sent to ${toEmail}.`);
      setCooldown(60);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);


  // Automatically trigger sending code if user came from login page with their email
  useEffect(() => {
    if (emailFromQuery && !autoSentRef.current) {
      autoSentRef.current = true;
      sendOtpCode(emailFromQuery);
    }
  }, [emailFromQuery, sendOtpCode]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-reset-code/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: cleanCode }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || 'Invalid or expired verification code.');
      }

      setInfoMsg('');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          password: password,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || 'Failed to reset password.');
      }

      setStep(4);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
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
        <div className="auth-card" style={{ maxWidth: step === 3 ? '520px' : '440px', transition: 'max-width 0.3s ease' }}>
          
          {/* STEP 1: Enter Email (Only displayed if no email was entered on the login page) */}
          {step === 1 && (
            <>
              <h1 className="auth-title">Forgot Password?</h1>
              <p className="auth-subtitle">
                Enter your registered email address to receive a 6-digit verification code.
              </p>

              {error && <div className="auth-error">{error}</div>}

              {infoMsg && (
                <div 
                  className="auth-info" 
                  style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.87rem',
                    fontWeight: '500',
                    marginBottom: '16px',
                    textAlign: 'left'
                  }}
                >
                  {infoMsg}
                </div>
              )}

              <form className="auth-form" onSubmit={(e) => { e.preventDefault(); sendOtpCode(email); }}>
                <div className="auth-field">
                  <label htmlFor="reset-email">Email Address</label>
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    required
                    autoFocus
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="auth-btn"
                  style={{ backgroundColor: theme.primaryColor, marginTop: '8px' }}
                  disabled={loading || !email.trim()}
                >
                  {loading ? <><span className="auth-spinner" /> Sending Code...</> : 'Send Verification Code'}
                </button>
              </form>
              
              <div className="auth-redirect">
                Remembered your password? <Link to="/login">Sign In</Link>
              </div>
            </>
          )}

          {/* STEP 2: Enter 6-Digit Code (Email input is NOT shown here) */}
          {step === 2 && (
            <>
              <h1 className="auth-title">Enter Verification Code</h1>
              <p className="auth-subtitle" style={{ marginBottom: '20px' }}>
                We sent a 6-digit code to <strong>{email}</strong>
                {' · '}
                <button 
                  type="button" 
                  onClick={() => { setStep(1); setCode(''); setError(''); setInfoMsg(''); }} 
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    fontSize: '0.85rem'
                  }}
                >
                  Change
                </button>
              </p>

              {error && <div className="auth-error">{error}</div>}

              {devCode && !emailSent && (
                <div 
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '0.86rem',
                    marginBottom: '16px',
                    textAlign: 'left',
                    lineHeight: '1.5'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    ⚠️ Note: Resend test sandbox delivers emails to <strong>sale.prakrithi@gmail.com</strong>.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span>Your code: <strong style={{ letterSpacing: '2px', fontSize: '1.15rem', color: '#b45309' }}>{devCode}</strong></span>
                    <button 
                      type="button" 
                      onClick={() => { setCode(devCode); setError(''); }}
                      style={{
                        background: '#f59e0b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Auto-fill Code
                    </button>
                  </div>
                </div>
              )}

              {infoMsg && emailSent && (
                <div 
                  className="auth-info" 
                  style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.87rem',
                    fontWeight: '500',
                    marginBottom: '16px',
                    textAlign: 'left'
                  }}
                >
                  {infoMsg}
                </div>
              )}

              <form className="auth-form" onSubmit={handleVerifyCode}>
                <div className="auth-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="reset-code">6-Digit Verification Code</label>
                    <button 
                      type="button" 
                      onClick={() => sendOtpCode(email)} 
                      disabled={cooldown > 0 || loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: cooldown > 0 ? '#999' : 'var(--primary)',
                        fontWeight: '600',
                        cursor: cooldown > 0 ? 'default' : 'pointer',
                        padding: 0,
                        fontSize: '0.8rem'
                      }}
                    >
                      {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
                    </button>
                  </div>
                  <input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(val);
                      setError('');
                    }}
                    required
                    autoFocus
                    disabled={loading}
                    style={{
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      letterSpacing: '8px',
                      fontWeight: '700',
                      color: theme.primaryColor || '#00472A'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="auth-btn"
                  style={{ backgroundColor: theme.primaryColor, marginTop: '8px' }}
                  disabled={loading || code.length !== 6}
                >
                  {loading 
                    ? <><span className="auth-spinner" /> Verifying...</> 
                    : 'Verify Code'}
                </button>
              </form>
              
              <div className="auth-redirect">
                Remembered your password? <Link to="/login">Sign In</Link>
              </div>
            </>
          )}

          {/* STEP 3: Create New Password */}
          {step === 3 && (
            <>
              <h1 className="auth-title">Create New Password</h1>
              <p className="auth-subtitle">Enter a new secure password for your account.</p>

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}
              
              <form className="auth-form" onSubmit={handleResetPassword}>
                <div className="auth-field">
                  <label htmlFor="new-password">New Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      required
                      minLength={6}
                      disabled={loading}
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
                  <label htmlFor="confirm-new-password">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="confirm-new-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      required
                      minLength={6}
                      disabled={loading}
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
                  {confirmPassword && password && (
                    <span className={`auth-field-hint ${password === confirmPassword ? 'auth-field-hint--success' : 'auth-field-hint--error'}`}>
                      {password === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-btn"
                  style={{ backgroundColor: theme.primaryColor, marginTop: '8px' }}
                  disabled={loading}
                >
                  {loading ? <><span className="auth-spinner" /> Updating Password...</> : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontSize: '1.3rem', color: '#012B28', marginBottom: '10px' }}>Password Reset Successful</h3>
              <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
                Your password has been successfully updated. You can now log in with your new password.
              </p>
              <Link 
                to="/login" 
                className="auth-btn" 
                style={{ backgroundColor: theme.primaryColor, textDecoration: 'none', display: 'inline-flex', justifyContent: 'center' }}
              >
                Return to Login
              </Link>
            </div>
          )}

        </div>
      </main>

      <Footer />
      <CartModal />
    </div>
  );
}
