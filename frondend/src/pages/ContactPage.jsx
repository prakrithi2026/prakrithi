import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import CartModal from '../components/storefront/CartModal';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import './ContactPage.css';

export default function ContactPage() {
  const { config } = useSiteConfig();
  const { theme } = config;

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    document.title = 'Contact Us — Prakrithi Naturals';
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    await new Promise(r => setTimeout(r, 1200));
    setStatus('success');
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setStatus(null), 5000);
  };

  const themeStyle = {
    '--primary': theme.primaryColor,
    '--accent':  theme.accentColor,
    fontFamily:  theme.fontFamily,
  };

  return (
    <div className="contact-page storefront" style={themeStyle}>
      <AnnouncementBar />
      <Navbar />

      <main className="contact-main">
        {/* Breadcrumb */}
        <div className="contact-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/profile">My Account</Link>
          <span>/</span>
          <span>Contact Us</span>
        </div>

        {/* Hero banner */}
        <div
          className="contact-hero"
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}15 0%, ${theme.accentColor}25 100%)` }}
        >
          <div className="contact-hero__icon">💬</div>
          <h1 className="contact-hero__title">Get In Touch</h1>
          <p className="contact-hero__sub">
            Have a question, feedback, or need help with your order?<br />
            We'd love to hear from you — we typically respond within 24 hours.
          </p>
        </div>

        {/* Form (full width, top) */}
        <div className="contact-form-card">
          <h2 className="contact-form-title">Send Us a Message</h2>
          <p className="contact-form-sub">Fill out the form below and we'll get back to you shortly.</p>

          {status === 'success' ? (
            <div className="contact-success">
              <div className="contact-success__icon">✅</div>
              <h3>Message Sent!</h3>
              <p>Thank you for reaching out. We'll reply within 24 hours.</p>
              <button
                className="contact-new-btn"
                style={{ backgroundColor: theme.primaryColor }}
                onClick={() => setStatus(null)}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form-row">
                <div className="contact-form-field">
                  <label htmlFor="contact-name">Full Name *</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="contact-form-field">
                  <label htmlFor="contact-email">Email Address *</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="contact-form-field">
                <label htmlFor="contact-subject">Subject *</label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a topic…</option>
                  <option value="order">Order Issue</option>
                  <option value="product">Product Question</option>
                  <option value="return">Return / Refund</option>
                  <option value="bulk">Bulk / Wholesale Enquiry</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="contact-form-field">
                <label htmlFor="contact-message">Message *</label>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="Write your message here…"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="contact-submit-btn"
                style={{ backgroundColor: theme.primaryColor }}
                disabled={status === 'sending'}
              >
                {status === 'sending'
                  ? <><span className="contact-spinner" /> Sending…</>
                  : '📩 Send Message'
                }
              </button>
            </form>
          )}
        </div>


      </main>

      <Footer />
      <CartModal />
    </div>
  );
}
