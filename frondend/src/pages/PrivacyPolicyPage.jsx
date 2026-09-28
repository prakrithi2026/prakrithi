import { useEffect } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import './LegalPage.css';

export default function PrivacyPolicyPage() {
  const { config } = useSiteConfig();
  const { theme } = config;

  useEffect(() => {
    document.title = 'Privacy policy — Prakrithi.in';
    window.scrollTo(0, 0);
  }, []);

  const themeStyle = {
    '--primary': theme.primaryColor,
    '--accent': theme.accentColor,
    fontFamily: theme.fontFamily,
  };

  return (
    <div className="policy-page storefront" style={themeStyle}>
      <AnnouncementBar />
      <Navbar />

      <main className="policy-main">
        <div className="policy-container">
          <h1 className="policy-title">Privacy policy</h1>

          <div className="policy-content">
            <h2 className="policy-section-heading">OVERVIEW</h2>
            <p>This Privacy Policy describes how Prakrithi.in (“we”, “us”, “our”, or “Prakrithi”) collects, uses, and discloses your personal information when you visit or make a purchase from our website.</p>
            <p>We are dedicated to safeguarding your privacy and protecting the personal data you share with us in compliance with applicable Indian laws, including the Digital Personal Data Protection Act 2023 and the Information Technology Act 2000.</p>
            <p>By using this website, you agree to the collection and use of your information in accordance with this Privacy Policy.</p>

            <h2 className="policy-section-heading">1. INFORMATION WE COLLECT</h2>
            <p>When you visit or place an order on Prakrithi.in, we collect certain personal information necessary to fulfill your request:</p>
            <ul className="policy-list">
              <li><strong>Personal Details:</strong> Name, delivery address, billing address, phone number, and email address.</li>
              <li><strong>Order Information:</strong> Items purchased, order value, payment status, and order history.</li>
              <li><strong>Technical Information:</strong> IP address, device type, browser information, and browsing behaviour collected via cookies and server logs.</li>
            </ul>

            <h2 className="policy-section-heading">2. HOW WE USE YOUR INFORMATION</h2>
            <p>We use the collected information for purposes including:</p>
            <ul className="policy-list">
              <li>Processing, packing, and delivering your orders.</li>
              <li>Sending order confirmations, tracking numbers, and delivery updates.</li>
              <li>Providing customer support and responding to inquiries.</li>
              <li>Facilitating returns, exchanges, or refunds where applicable.</li>
              <li>Screening orders for potential risk or fraud.</li>
              <li>Improving and optimizing our website and product offerings.</li>
            </ul>

            <h2 className="policy-section-heading">3. PAYMENT PROCESSING</h2>
            <p>Payments made on Prakrithi.in are handled through authorized, PCI-DSS compliant third-party payment gateways (such as Razorpay and other approved payment aggregators).</p>
            <p>Prakrithi does not store or have direct access to your confidential card numbers, CVV codes, or UPI security PINs. All financial transactions are encrypted through the payment gateway's secure servers in accordance with Reserve Bank of India (RBI) regulations.</p>

            <h2 className="policy-section-heading">4. SHARING YOUR INFORMATION</h2>
            <p>We do not sell, rent, or trade your personal information to third parties. We share your information only with trusted service providers strictly necessary to operate our store:</p>
            <ul className="policy-list">
              <li><strong>Courier &amp; Delivery Partners:</strong> To dispatch and deliver your packages to your address.</li>
              <li><strong>Payment Gateways:</strong> To authorize and process payments securely.</li>
              <li><strong>Legal Compliance:</strong> Where required by law, court order, or governmental regulations.</li>
            </ul>

            <h2 className="policy-section-heading">5. COOKIES</h2>
            <p>We use cookies and local storage to help ensure our website operates smoothly, remember your cart items, and understand how visitors interact with our site. You may configure your browser to block or alert you about cookies, but some features (such as checkout and cart storage) may not function properly without them.</p>

            <h2 className="policy-section-heading">6. DATA SECURITY</h2>
            <p>We take appropriate technical and organizational measures to ensure your personal information is protected against unauthorized access, loss, or misuse. All web communication is encrypted using industry-standard SSL/TLS protocols.</p>

            <h2 className="policy-section-heading">7. YOUR RIGHTS</h2>
            <p>Under applicable Indian data protection laws, you have the right to access, update, correct, or request the deletion of your personal data held by us, subject to statutory record-keeping and tax requirements. You may also opt out of promotional communications at any time.</p>

            <h2 className="policy-section-heading">8. CHANGES TO THIS POLICY</h2>
            <p>We may update this Privacy Policy from time to time in order to reflect changes to our operational practices or for legal and regulatory reasons. The updated version will be posted directly on this page.</p>

            <h2 className="policy-section-heading">9. CONTACT US</h2>
            <p>For more information about our privacy practices, or if you have questions or concerns, please contact us:</p>
            <div className="policy-contact-details">
              <p>Prakrithi / Prakrithi.in</p>
              <p>Kerala, India</p>
              <p>Email: <a href="mailto:sale.prakrithi@gmail.com">sale.prakrithi@gmail.com</a></p>
              <p>Website: <a href="https://prakrithi.in" target="_blank" rel="noopener noreferrer">Prakrithi.in</a></p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
