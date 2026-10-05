import { useEffect } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import './LegalPage.css';

export default function RefundPolicyPage() {
  const { config } = useSiteConfig();
  const { theme } = config;

  useEffect(() => {
    document.title = 'Return & Refund Policy — Prakrithi.in';
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
          <h1 className="policy-title">Return &amp; Refund Policy</h1>

          <div className="policy-content">
            <h2 className="policy-section-heading">OVERVIEW</h2>
            <p>
              This Return &amp; Refund Policy explains the terms and conditions applicable to returns, exchanges,
              cancellations, and refunds for purchases made through Prakrithi.in (“we”, “us”, “our”, or “Prakrithi”).
            </p>
            <p>
              We aim to ensure that you receive your products in good condition and as described on our website.
              If you receive a damaged, defective, incorrect, or otherwise eligible product, you may request a
              return or replacement in accordance with this policy.
            </p>
            <p>
              By placing an order on Prakrithi.in, you agree to the terms of this Return &amp; Refund Policy.
            </p>

            <h2 className="policy-section-heading">1. ELIGIBILITY FOR RETURNS</h2>
            <p>Products may be eligible for return or replacement in the following situations:</p>
            <ul className="policy-list">
              <li>The product received is damaged or defective.</li>
              <li>The wrong product, size, colour, or quantity was delivered.</li>
              <li>The product received is materially different from the product description on our website.</li>
              <li>The product qualifies for return according to the specific product listing or promotional offer.</li>
            </ul>
            <p>
              Return requests for damaged, defective, or incorrect products must be submitted within <strong>48 hours</strong> of delivery.
              General return requests for eligible items must be submitted within <strong>7 days</strong> of delivery.
            </p>
            <p>
              Some products may be non-returnable due to their nature, hygiene requirements, food safety standards,
              customization, clearance status, or other applicable restrictions. Any such restrictions will be mentioned
              on the relevant product page where applicable.
            </p>

            <h2 className="policy-section-heading">2. PRODUCTS NOT ELIGIBLE FOR RETURN</h2>
            <p>A return may not be accepted if:</p>
            <ul className="policy-list">
              <li>The return request is made after the applicable return window (48 hours for damaged/wrong items; 7 days for eligible returns).</li>
              <li>The product has been used, opened, washed, altered, damaged, or misused after delivery.</li>
              <li>The product is a consumable food item, spice, honey, tea, or edible product where the safety seal has been opened or tampered with.</li>
              <li>The product is returned without its original packaging, tags, seals, invoices, accessories, or other items supplied with it.</li>
              <li>The product is damaged due to improper handling, storage, or use by the customer.</li>
              <li>The product is specifically marked as non-returnable on the website.</li>
              <li>The return does not meet the applicable eligibility requirements.</li>
            </ul>

            <h2 className="policy-section-heading">3. DAMAGED OR INCORRECT PRODUCTS</h2>
            <p>Please inspect your order as soon as it is delivered.</p>
            <p>
              If you receive a damaged, defective, or incorrect product, please contact us as soon as possible and within <strong>48 hours</strong> of delivery.
            </p>
            <p>To help us process and verify your request promptly, we may ask you to provide:</p>
            <ul className="policy-list">
              <li>Your order number and date of delivery.</li>
              <li>A clear description of the issue.</li>
              <li>Clear photographs and/or a brief unboxing video showing the product, defect/damage, and outer courier label.</li>
              <li>Photographs of the packaging where relevant.</li>
            </ul>
            <p>
              We will review the information provided and determine whether the product qualifies for a replacement, return, or refund.
            </p>

            <h2 className="policy-section-heading">4. RETURN REQUEST PROCESS</h2>
            <p>To request a return, please contact us using the contact details provided below.</p>
            <p>
              Once your request is received, we will review the order details and may request additional information or photographs where necessary.
            </p>
            <p>
              If the return is approved, we will provide instructions regarding the return handover or courier pickup.
            </p>
            <p>
              Please do not send products back without receiving return instructions from us, as unauthorized returns may not be accepted or processed.
            </p>

            <h2 className="policy-section-heading">5. RETURN SHIPPING</h2>
            <p>
              Where the return is due to an error on our part, such as a damaged, defective, or incorrect product, Prakrithi will arrange a reverse pickup or bear the applicable standard return shipping cost, subject to verification.
            </p>
            <p>
              For other eligible customer-initiated returns, return shipping charges and logistics arrangements may be the responsibility of the customer, where applicable.
            </p>
            <p>
              The applicable shipping arrangements and reverse pickup instructions will be communicated when the return is approved.
            </p>

            <h2 className="policy-section-heading">6. EXCHANGES</h2>
            <p>
              Where applicable, eligible products may be exchanged for another product or an alternative available option.
            </p>
            <p>Exchanges are subject to product availability.</p>
            <p>
              If the requested replacement product is unavailable, we may offer a full refund, store credit, or another suitable resolution, depending on your preference.
            </p>

            <h2 className="policy-section-heading">7. REFUNDS</h2>
            <p>
              Once an approved returned product is received and inspected at our facility, we will process the applicable refund.
            </p>
            <p>
              Refunds will be issued through the original payment method (Credit/Debit Card, Net Banking, UPI, or Wallet) or by bank transfer (NEFT) as agreed upon where appropriate.
            </p>
            <p>
              Refunds are initiated within <strong>3 to 5 business days</strong> of approval. The time required for the refund to reflect in your account typically ranges between <strong>5 to 7 business days</strong> depending on your bank, card issuer, or payment provider.
            </p>
            <p>
              Any applicable initial shipping charges, discounts, promotional benefits, or other adjustments may be considered when calculating the final refund amount.
            </p>

            <h2 className="policy-section-heading">8. CANCELLATION OF ORDERS</h2>
            <p>
              Order cancellation requests should be made as soon as possible after placing the order.
            </p>
            <p>
              If an order has not yet been processed or dispatched, we will make reasonable efforts to cancel it and issue a full refund.
            </p>
            <p>
              Once an order has been dispatched from our facility, cancellation is no longer possible. In such cases, the customer will need to follow the applicable return procedure after delivery.
            </p>

            <h2 className="policy-section-heading">9. NON-DELIVERY OR DELIVERY ISSUES</h2>
            <p>
              If your order has not been delivered within the expected delivery period, or if the tracking information indicates an unusual delivery issue, please contact us.
            </p>
            <p>
              We will coordinate with the relevant courier or delivery partner to investigate the shipment.
            </p>
            <p>
              Refunds or replacements for lost or undelivered shipments will be handled promptly based on the circumstances and the outcome of the delivery investigation.
            </p>

            <h2 className="policy-section-heading">10. REFUND EXCEPTIONS</h2>
            <p>
              We reserve the right to refuse a return, replacement, or refund where the product does not meet the eligibility requirements described in this policy or where there is evidence of misuse, abuse, deliberate tampering, fraudulent activity, or violation of our terms.
            </p>
            <p>
              Any decision will be made objectively based on the circumstances of the individual order and the information available to us.
            </p>

            <h2 className="policy-section-heading">11. CHANGES TO THIS POLICY</h2>
            <p>
              We may update this Return &amp; Refund Policy from time to time to reflect changes in our business practices, products, services, or applicable legal requirements.
            </p>
            <p>
              The updated version will be published directly on this page with the revised date. Customers are encouraged to review this policy before making a purchase.
            </p>

            <h2 className="policy-section-heading">12. CONTACT US &amp; GRIEVANCE REDRESSAL</h2>
            <p>
              For return, exchange, cancellation, or refund-related questions, please contact our customer support team:
            </p>
            <div className="policy-contact-details">
              <p><strong>Prakrithi / Prakrithi.in</strong></p>
              <p>Kerala, India</p>
              <p>Email: <a href="mailto:sale.prakrithi@gmail.com">sale.prakrithi@gmail.com</a></p>
              <p>Website: <a href="https://prakrithi.in" target="_blank" rel="noopener noreferrer">Prakrithi.in</a></p>
              <p>Customer Support Hours: Monday – Saturday, 9:30 AM to 6:00 PM IST</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
