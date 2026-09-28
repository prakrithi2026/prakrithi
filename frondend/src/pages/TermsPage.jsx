import { useEffect } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import './LegalPage.css';

export default function TermsPage() {
  const { config } = useSiteConfig();
  const { theme } = config;

  useEffect(() => {
    document.title = 'Terms of service — Prakrithi.in';
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
          <h1 className="policy-title">Terms of service</h1>

          <div className="policy-content">
            <h2 className="policy-section-heading">OVERVIEW</h2>
            <p>Welcome to Prakrithi.in. These Terms &amp; Conditions (“Terms”) govern your access to and use of the Prakrithi.in website and your purchase of products through our online store.</p>
            <p>In these Terms, “we”, “us”, “our” and “Prakrithi” refer to the business operating Prakrithi.in. “You” and “your” refer to any visitor, customer or user of the website.</p>
            <p>By accessing our website, placing an order, or using any service provided through the website, you agree to these Terms &amp; Conditions. Please read them carefully before using our website or purchasing our products.</p>
            <p>If you do not agree with these Terms, please do not use the website or place an order.</p>

            <h2 className="policy-section-heading">1. ABOUT OUR STORE</h2>
            <p>Prakrithi.in is an online ecommerce store offering food and natural products, which may include spices, spice powders, honey, ghee, tea and other related products.</p>
            <p>Product availability, product range and services may change from time to time.</p>
            <p>We reserve the right to update, modify, discontinue or introduce products and services at our discretion.</p>

            <h2 className="policy-section-heading">2. ELIGIBILITY</h2>
            <p>By using this website or placing an order, you confirm that:</p>
            <ul className="policy-list">
              <li>You are legally capable of entering into a binding agreement under applicable Indian law.</li>
              <li>The information you provide to us is accurate and complete.</li>
              <li>You will use the website only for lawful purposes.</li>
              <li>You will not use the website in a manner that violates applicable laws or regulations.</li>
            </ul>
            <p>If you are purchasing products on behalf of another person or organisation, you confirm that you have the necessary authority to do so.</p>

            <h2 className="policy-section-heading">3. PRODUCT INFORMATION</h2>
            <p>We make reasonable efforts to ensure that product descriptions, photographs, ingredients, weights, specifications and other information displayed on the website are accurate.</p>
            <p>However:</p>
            <ul className="policy-list">
              <li>Product colours and appearance may vary slightly from photographs displayed on different screens.</li>
              <li>Natural food products may vary in colour, texture, aroma or appearance from batch to batch.</li>
              <li>Product weights may be subject to reasonable manufacturing and packaging tolerances.</li>
              <li>Product availability may change without prior notice.</li>
              <li>Packaging, labels and product presentation may change from time to time.</li>
            </ul>
            <p>For food products, please read the product label, ingredients, allergen information, storage instructions and other information supplied with the product before consumption.</p>

            <h2 className="policy-section-heading">4. FOOD PRODUCTS AND ALLERGIES</h2>
            <p>Our products may contain or be processed in facilities that handle different food ingredients.</p>
            <p>Customers with food allergies, intolerances or specific dietary requirements should carefully review the product information and contact us before placing an order if clarification is required.</p>
            <p>Prakrithi shall not be responsible for an adverse reaction resulting from a customer's failure to review applicable ingredient, allergen or product information.</p>
            <p>Nothing on this website should be interpreted as medical, nutritional or professional healthcare advice.</p>

            <h2 className="policy-section-heading">5. PRODUCT PRICING</h2>
            <p>All product prices displayed on the website are subject to change without prior notice.</p>
            <p>Applicable taxes, delivery charges or other charges, where applicable, will be displayed during the purchase process or otherwise communicated to the customer.</p>
            <p>We make reasonable efforts to ensure that prices displayed on the website are accurate. If an obvious pricing or technical error occurs, we reserve the right to correct the error and, where necessary, cancel the affected order and refund any amount already paid.</p>

            <h2 className="policy-section-heading">6. ORDERS</h2>
            <p>When you place an order through our website, you are making a request to purchase the selected products.</p>
            <p>An order is considered accepted by us when we confirm the order or begin processing it.</p>
            <p>We reserve the right to refuse, cancel or limit an order in circumstances including, but not limited to:</p>
            <ul className="policy-list">
              <li>Product unavailability</li>
              <li>Incorrect pricing or product information</li>
              <li>Suspected fraudulent or unauthorised transactions</li>
              <li>Incorrect or incomplete customer information</li>
              <li>Delivery restrictions</li>
              <li>Unusual quantities or suspected resale activity</li>
              <li>Technical errors</li>
              <li>Violation of these Terms</li>
            </ul>
            <p>If an order is cancelled after payment has been received, the applicable amount will be refunded using the available refund method, subject to applicable payment and banking procedures.</p>

            <h2 className="policy-section-heading">7. PAYMENT</h2>
            <p>Payments may be processed through third-party payment service providers.</p>
            <p>You agree to provide accurate billing and payment information when placing an order.</p>
            <p>We do not ordinarily have access to or store your complete card, UPI or other sensitive payment credentials. Payment information may be processed directly by authorised payment service providers in accordance with their respective terms and privacy practices.</p>
            <p>We reserve the right to request additional information where reasonably necessary to verify an order or prevent fraudulent transactions.</p>

            <h2 className="policy-section-heading">8. SHIPPING AND DELIVERY</h2>
            <p>We aim to dispatch and deliver orders within the estimated timeframe communicated on the website or during checkout.</p>
            <p>Delivery times are estimates and may vary depending on:</p>
            <ul className="policy-list">
              <li>Delivery location</li>
              <li>Courier availability</li>
              <li>Weather conditions</li>
              <li>Public holidays</li>
              <li>Transportation disruptions</li>
              <li>Natural disasters</li>
              <li>Government restrictions</li>
              <li>Other circumstances beyond our reasonable control</li>
            </ul>
            <p>Once an order has been handed over to the delivery partner, delivery may be subject to the courier's operational timelines.</p>
            <p>Customers are responsible for providing a correct and complete delivery address and contact information.</p>
            <p>If an order cannot be delivered because of an incorrect address, unavailable recipient, refusal to accept delivery or other circumstances attributable to the customer, additional delivery charges or other consequences may apply.</p>

            <h2 className="policy-section-heading">9. ORDER CANCELLATION</h2>
            <p>Customers may request cancellation of an order before it has been dispatched.</p>
            <p>Once an order has been dispatched, cancellation may not be possible.</p>
            <p>To request cancellation, please contact us as soon as possible using the contact details provided on our website.</p>
            <p>Any refund arising from an approved cancellation will be processed according to our Refund and Cancellation Policy.</p>

            <h2 className="policy-section-heading">10. RETURNS, REPLACEMENTS AND REFUNDS</h2>
            <p>Because our products may include food and consumable products, returns may be subject to specific conditions.</p>
            <p>A product may be eligible for replacement or refund where, subject to verification:</p>
            <ul className="policy-list">
              <li>The wrong product was delivered.</li>
              <li>The product was damaged during delivery.</li>
              <li>The product received is defective or materially different from the product ordered.</li>
              <li>The package is materially damaged or tampered with upon delivery.</li>
              <li>The product is otherwise eligible under our applicable Return and Refund Policy.</li>
            </ul>
            <p>Customers should contact us promptly after receiving the order and provide relevant photographs, order details and other information reasonably required to verify the issue.</p>
            <p>Opened, used or consumed food products may generally not be eligible for return unless required under applicable law or approved by us based on the circumstances.</p>
            <p>Please refer to our Refund &amp; Return Policy for detailed conditions and procedures.</p>

            <h2 className="policy-section-heading">11. OFFERS AND PROMOTIONS</h2>
            <p>From time to time, we may provide promotional offers, discounts, coupon codes or other promotional benefits.</p>
            <p>Unless otherwise stated:</p>
            <ul className="policy-list">
              <li>Promotional offers cannot be combined with other offers.</li>
              <li>Each promotion may have its own eligibility conditions.</li>
              <li>We may limit the number of times an offer can be used.</li>
              <li>Promotional offers may have an expiry date.</li>
              <li>We reserve the right to modify or withdraw an offer where permitted by applicable law.</li>
            </ul>
            <p>Any promotional terms displayed with a particular offer will form part of that offer.</p>

            <h2 className="policy-section-heading">12. CUSTOMER ACCOUNTS</h2>
            <p>If account registration is available on our website, you are responsible for maintaining the confidentiality of your login credentials and for activities conducted through your account.</p>
            <p>You agree to provide accurate and current information.</p>
            <p>If you believe that your account has been accessed without authorisation, you should notify us promptly.</p>
            <p>We reserve the right to suspend or terminate accounts that are used in violation of these Terms or applicable law.</p>

            <h2 className="policy-section-heading">13. WEBSITE USE</h2>
            <p>You agree not to:</p>
            <ul className="policy-list">
              <li>Use the website for any unlawful purpose.</li>
              <li>Attempt to gain unauthorised access to the website or its systems.</li>
              <li>Introduce viruses, malware or other harmful code.</li>
              <li>Interfere with the security or operation of the website.</li>
              <li>Scrape, copy or systematically reproduce website content without permission.</li>
              <li>Use automated systems to access the website in a manner that may adversely affect its operation.</li>
              <li>Submit false, misleading or fraudulent information.</li>
              <li>Infringe the intellectual property or other legal rights of Prakrithi or third parties.</li>
            </ul>
            <p>We may restrict or terminate access to the website where we reasonably believe these Terms have been violated.</p>

            <h2 className="policy-section-heading">14. INTELLECTUAL PROPERTY</h2>
            <p>Unless otherwise stated, the content of this website, including:</p>
            <ul className="policy-list">
              <li>Brand names</li>
              <li>Logos</li>
              <li>Product photographs</li>
              <li>Graphics</li>
              <li>Illustrations</li>
              <li>Text</li>
              <li>Website design</li>
              <li>Product descriptions</li>
              <li>Videos</li>
              <li>Icons</li>
              <li>Other original content</li>
            </ul>
            <p>is owned by or licensed to Prakrithi and is protected by applicable intellectual property laws. You may not reproduce, modify, distribute, sell, publish or commercially exploit our content without prior written permission.</p>

            <h2 className="policy-section-heading">15. CUSTOMER REVIEWS AND USER CONTENT</h2>
            <p>If you submit reviews, photographs, comments, feedback or other content to us, you confirm that:</p>
            <ul className="policy-list">
              <li>The content is truthful to the best of your knowledge.</li>
              <li>You have the right to submit the content.</li>
              <li>The content does not infringe another person's rights.</li>
              <li>The content does not contain unlawful, defamatory, abusive or malicious material.</li>
            </ul>
            <p>By submitting content to us, you grant us a non-exclusive, royalty-free permission to use, reproduce, display and publish that content for legitimate business and promotional purposes, subject to applicable law.</p>
            <p>We reserve the right to remove content that we reasonably consider inappropriate, unlawful, misleading or in violation of these Terms.</p>

            <h2 className="policy-section-heading">16. THIRD-PARTY SERVICES AND LINKS</h2>
            <p>Our website may use third-party services such as payment gateways, delivery partners, analytics providers, communication platforms and other technology providers.</p>
            <p>The website may also contain links to third-party websites.</p>
            <p>We are not responsible for the content, security, availability, policies or practices of third-party websites or services.</p>
            <p>Your use of third-party services may be subject to the third party's own terms and privacy policies.</p>

            <h2 className="policy-section-heading">17. COMMUNICATIONS</h2>
            <p>By placing an order or contacting us, you agree that we may communicate with you regarding:</p>
            <ul className="policy-list">
              <li>Your order</li>
              <li>Payment</li>
              <li>Shipping and delivery</li>
              <li>Returns and refunds</li>
              <li>Customer support</li>
              <li>Account-related matters</li>
              <li>Other service-related communications</li>
            </ul>
            <p>Where legally permitted and where you have provided the required consent, we may also send promotional communications. You may opt out of promotional communications using the unsubscribe mechanism provided or by contacting us.</p>

            <h2 className="policy-section-heading">18. PERSONAL INFORMATION</h2>
            <p>Your use of our website and submission of personal information is governed by our Privacy Policy. We may collect and process information necessary to operate our ecommerce services, including information required for ordering, payment, delivery, customer support and other legitimate business purposes.</p>
            <p>Please review our Privacy Policy for further information about how personal information is handled.</p>

            <h2 className="policy-section-heading">19. ACCURACY OF WEBSITE INFORMATION</h2>
            <p>We make reasonable efforts to keep the information on our website accurate and up to date.</p>
            <p>However, the website may occasionally contain typographical errors, inaccuracies or omissions relating to product descriptions, pricing, availability, offers, shipping information or other content.</p>
            <p>We reserve the right to correct such errors and update information at any time. Where required, we may cancel an order affected by a material error and provide an applicable refund.</p>

            <h2 className="policy-section-heading">20. WEBSITE AVAILABILITY</h2>
            <p>We aim to keep our website available and functioning properly, but we do not guarantee that the website will always be:</p>
            <ul className="policy-list">
              <li>Available without interruption</li>
              <li>Free from errors</li>
              <li>Completely secure</li>
              <li>Free from viruses or other harmful components</li>
            </ul>
            <p>Website availability may be affected by maintenance, technical problems, hosting issues, network failures or circumstances beyond our reasonable control.</p>

            <h2 className="policy-section-heading">21. LIMITATION OF LIABILITY</h2>
            <p>To the extent permitted by applicable law, Prakrithi and its owners, employees, service providers and business partners shall not be liable for indirect, incidental, special or consequential losses arising from the use of the website or purchase of products.</p>
            <p>Nothing in these Terms is intended to exclude or limit any liability that cannot lawfully be excluded or limited under applicable Indian law. Our liability, where legally permitted to be limited, shall be limited to the extent permitted by applicable law.</p>

            <h2 className="policy-section-heading">22. FORCE MAJEURE</h2>
            <p>We shall not be responsible for delays or failures caused by circumstances beyond our reasonable control, including natural disasters, floods, fires, epidemics, pandemics, strikes, transportation disruptions, government restrictions, internet or telecommunications failures, or other unforeseen events.</p>

            <h2 className="policy-section-heading">23. INDEMNIFICATION</h2>
            <p>To the extent permitted by law, you agree to indemnify and hold harmless Prakrithi and its relevant personnel and service providers from claims, losses or expenses arising from your:</p>
            <ul className="policy-list">
              <li>Violation of these Terms;</li>
              <li>Unlawful use of the website;</li>
              <li>Misuse of our products or services; or</li>
              <li>Violation of the rights of another person or entity.</li>
            </ul>

            <h2 className="policy-section-heading">24. SUSPENSION OR TERMINATION</h2>
            <p>We may suspend or terminate your access to the website or services where we reasonably believe that you have violated these Terms, engaged in fraudulent activity, or used the website unlawfully.</p>
            <p>Termination shall not affect rights or obligations that arose before termination.</p>

            <h2 className="policy-section-heading">25. SEVERABILITY</h2>
            <p>If any provision of these Terms is found to be invalid, unlawful or unenforceable, that provision shall be modified or removed to the extent necessary, while the remaining provisions shall continue to apply to the extent permitted by law.</p>

            <h2 className="policy-section-heading">26. ENTIRE AGREEMENT</h2>
            <p>These Terms, together with our Privacy Policy, Refund &amp; Return Policy, Shipping Policy and any other policies specifically referenced on the website, constitute the terms governing your use of our website and services.</p>

            <h2 className="policy-section-heading">27. CHANGES TO THESE TERMS</h2>
            <p>We may update these Terms from time to time. The updated version will be published on this page with the revised “Last Updated” date.</p>
            <p>Your continued use of the website after changes are published may constitute acceptance of the updated Terms to the extent permitted by applicable law.</p>

            <h2 className="policy-section-heading">28. GOVERNING LAW AND JURISDICTION</h2>
            <p>These Terms shall be governed by and interpreted in accordance with the laws of India.</p>
            <p>Subject to applicable consumer protection laws and other mandatory legal provisions, disputes arising in connection with these Terms or your use of the website shall be subject to the jurisdiction of the courts having appropriate jurisdiction in Kerala, India.</p>
            <p>Nothing in these Terms is intended to restrict any statutory rights available to consumers under applicable Indian law.</p>

            <h2 className="policy-section-heading">29. CONSUMER RIGHTS</h2>
            <p>Nothing in these Terms is intended to exclude, restrict or waive any rights or remedies that cannot legally be excluded under applicable Indian consumer protection or other applicable laws.</p>
            <p>Where a mandatory legal right applies, that right shall prevail over any inconsistent provision of these Terms.</p>

            <h2 className="policy-section-heading">30. CONTACT US</h2>
            <p>If you have questions regarding these Terms, an order, product, return, refund or any other matter, please contact us:</p>
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
