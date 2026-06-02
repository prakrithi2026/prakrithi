import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import CartModal from '../components/storefront/CartModal';
import './AuthPage.css';

export default function ForgotPasswordPage() {
  const { config } = useSiteConfig();
  const { theme } = config;

  // Flow steps: 1 (email), 2 (code), 3 (new password), 4 (success)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    document.title = 'Forgot Password — Prakrithi Naturals';
  }, []);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Simulate sending email
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setStep(2);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Simulate verifying code
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    // Simulate resetting password
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setStep(4);
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
        <div className="auth-card" style={{ maxWidth: step === 3 ? '540px' : '440px', transition: 'max-width 0.3s ease' }}>
          
          {(step === 1 || step === 2) && (
            <>
              <h1 className="auth-title">Forgot Password?</h1>
              <p className="auth-subtitle">
                Enter your email address to receive a verification code.
              </p>

              <form className="auth-form" onSubmit={step === 1 ? handleSendCode : handleVerifyCode}>
                <div className="auth-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="reset-email">Email Address</label>
                    {step === 2 && (
                      <button 
                        type="button" 
                        onClick={() => { setStep(1); setCode(''); }} 
                        style={{background:'none', border:'none', color:'var(--primary)', fontWeight:'600', cursor:'pointer', padding:0, fontSize: '0.8rem'}}
                      >
                        Change Email
                      </button>
                    )}
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={step === 2}
                  />
                </div>

                <div className="auth-field" style={{ opacity: step === 1 ? 0.4 : 1, transition: 'opacity 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="reset-code">Verification Code</label>
                    {step === 2 && (
                      <button 
                        type="button" 
                        onClick={handleSendCode} 
                        style={{background:'none', border:'none', color:'var(--primary)', fontWeight:'600', cursor:'pointer', padding:0, fontSize: '0.8rem'}}
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                  <input
                    id="reset-code"
                    type="text"
                    placeholder={step === 1 ? 'Waiting for email...' : 'Enter 6-digit code'}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required={step === 2}
                    disabled={step === 1}
                    style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: step === 2 ? '4px' : 'normal' }}
                  />
                </div>

                <button
                  type="submit"
                  className="auth-btn"
                  style={{ backgroundColor: theme.primaryColor, marginTop: '8px' }}
                  disabled={loading}
                >
                  {loading 
                    ? <><span className="auth-spinner" /> {step === 1 ? 'Sending Code...' : 'Verifying...'}</> 
                    : step === 1 ? 'Send Verification Code' : 'Verify Code'}
                </button>
              </form>
              
              <div className="auth-redirect">
                Remembered your password? <Link to="/login">Sign In</Link>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="auth-title">Create New Password</h1>
              <p className="auth-subtitle">Enter a new secure password for your account.</p>

              {error && (
                <div className="auth-error" style={{ color: '#ef1c1c', marginBottom: '16px', fontSize: '0.9rem', fontWeight: '600', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px' }}>
                  {error}
                </div>
              )}
              
              <form className="auth-form" onSubmit={handleResetPassword}>
                <div className="auth-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="auth-field">
                    <label htmlFor="new-password">New Password</label>
                    <input
                      id="new-password"
                      type="password"
                      placeholder="Create new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <label htmlFor="confirm-new-password">Confirm Password</label>
                    <input
                      id="confirm-new-password"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-btn"
                  style={{ backgroundColor: theme.primaryColor, marginTop: '8px' }}
                  disabled={loading}
                >
                  {loading ? <><span className="auth-spinner" /> Resetting...</> : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {step === 4 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontSize: '1.2rem', color: '#012B28', marginBottom: '10px' }}>Password Reset Successful</h3>
              <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
                Your password has been successfully updated. You can now log in with your new password.
              </p>
              <Link 
                to="/login" 
                className="auth-btn" 
                style={{ backgroundColor: theme.primaryColor, textDecoration: 'none' }}
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
