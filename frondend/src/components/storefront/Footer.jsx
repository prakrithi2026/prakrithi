import { useSiteConfig } from '../../context/SiteConfigContext';
import './Footer.css';

export default function Footer() {
  const { config } = useSiteConfig();
  const { footer, theme } = config;

  return (
    <footer className="site-footer" style={{ backgroundColor: theme.primaryColor }}>
      <div className="footer-container">
        {/* Brand & Description */}
        <div className="footer-brand-block">
          <h3 className="footer-title">
            {footer.brandName}
            {footer.trademark && <sup>TM</sup>}
          </h3>
          <p className="footer-desc">{footer.aboutText}</p>
        </div>

        {/* Shop For Links */}
        {footer.columns.map((col, i) => (
          <div key={i} className="footer-shop-for">
            <h6>{col.title}</h6>
            <div className="shop-links">
              {col.links.map((link, j) => (
                <a key={j} href={link.href}>{link.label}</a>
              ))}
            </div>
          </div>
        ))}

        {/* Contact Row */}
        <div className="footer-contact-row">
          <div className="footer-contact-item">
            <h6>Call/Whatsapp Us</h6>
            <p>{footer.contact.phone}</p>
          </div>
          <div className="footer-contact-item">
            <h6>Order/Product Queries</h6>
            <p><a href={`mailto:${footer.contact.email}`}>{footer.contact.email}</a></p>
          </div>
          <div className="footer-contact-item">
            <h6>Collaborations</h6>
            <p><a href={`mailto:${footer.contact.orderEmail}`}>{footer.contact.orderEmail}</a></p>
          </div>
        </div>

        {/* Address */}
        <div className="footer-address">
          <h6>Office Address</h6>
          <p>{footer.address}</p>
        </div>

        {/* Social Icons */}
        <div className="footer-social">
          {footer.socialLinks.facebook && (
            <a href={footer.socialLinks.facebook} aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                <path d="M15 0C6.7158 0 0 6.7158 0 15C0 22.0344 4.8432 27.9372 11.3766 29.5584V19.584H8.2836V15H11.3766V13.0248C11.3766 7.9194 13.6872 5.553 18.6996 5.553C19.65 5.553 21.2898 5.7396 21.9606 5.9256V10.0806C21.6066 10.0434 20.9916 10.0248 20.2278 10.0248C17.7684 10.0248 16.818 10.9566 16.818 13.3788V15H21.7176L20.8758 19.584H16.818V29.8902C24.2454 28.9932 30.0006 22.6692 30.0006 15C30 6.7158 23.2842 0 15 0Z" fill="white"/>
              </svg>
            </a>
          )}
          {footer.socialLinks.twitter && (
            <a href={footer.socialLinks.twitter} aria-label="X / Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                <path d="M22.9079 2.37988H27.1247L17.9121 12.9092L28.75 27.2373H20.264L13.6175 18.5474L6.01243 27.2373H1.79304L11.6468 15.975L1.25 2.37988H9.95139L15.9592 10.3228L22.9079 2.37988ZM21.4279 24.7134H23.7645L8.68174 4.7713H6.17433L21.4279 24.7134Z" fill="white"/>
              </svg>
            </a>
          )}
          {footer.socialLinks.instagram && (
            <a href={footer.socialLinks.instagram} aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                <path d="M15 2.70117C19.0078 2.70117 19.4824 2.71875 21.0586 2.78906C22.5234 2.85352 23.3145 3.09961 23.8418 3.30469C24.5391 3.57422 25.043 3.90234 25.5645 4.42383C26.0918 4.95117 26.4141 5.44922 26.6836 6.14648C26.8887 6.67383 27.1348 7.4707 27.1992 8.92969C27.2695 10.5117 27.2871 10.9863 27.2871 14.9883C27.2871 18.9961 27.2695 19.4707 27.1992 21.0469C27.1348 22.5117 26.8887 23.3027 26.6836 23.8301C26.4141 24.5273 26.0859 25.0313 25.5645 25.5527C25.0371 26.0801 24.5391 26.4023 23.8418 26.6719C23.3145 26.877 22.5176 27.123 21.0586 27.1875C19.4766 27.2578 19.002 27.2754 15 27.2754C10.9922 27.2754 10.5176 27.2578 8.94141 27.1875C7.47656 27.123 6.68555 26.877 6.1582 26.6719C5.46094 26.4023 4.95703 26.0742 4.43555 25.5527C3.9082 25.0254 3.58594 24.5273 3.31641 23.8301C3.11133 23.3027 2.86523 22.5059 2.80078 21.0469C2.73047 19.4648 2.71289 18.9902 2.71289 14.9883C2.71289 10.9805 2.73047 10.5059 2.80078 8.92969C2.86523 7.46484 3.11133 6.67383 3.31641 6.14648C3.58594 5.44922 3.91406 4.94531 4.43555 4.42383C4.96289 3.89648 5.46094 3.57422 6.1582 3.30469C6.68555 3.09961 7.48242 2.85352 8.94141 2.78906C10.5176 2.71875 10.9922 2.70117 15 2.70117ZM15 0C10.9277 0 10.418 0.0175781 8.81836 0.0878906C7.22461 0.158203 6.12891 0.416016 5.17969 0.785156C4.18945 1.17187 3.35156 1.68164 2.51953 2.51953C1.68164 3.35156 1.17188 4.18945 0.785156 5.17383C0.416016 6.12891 0.158203 7.21875 0.0878906 8.8125C0.0175781 10.418 0 10.9277 0 15C0 19.0723 0.0175781 19.582 0.0878906 21.1816C0.158203 22.7754 0.416016 23.8711 0.785156 24.8203C1.17188 25.8105 1.68164 26.6484 2.51953 27.4805C3.35156 28.3125 4.18945 28.8281 5.17383 29.209C6.12891 29.5781 7.21875 29.8359 8.8125 29.9062C10.4121 29.9766 10.9219 29.9941 14.9941 29.9941C19.0664 29.9941 19.5762 29.9766 21.1758 29.9062C22.7695 29.8359 23.8652 29.5781 24.8145 29.209C25.7988 28.8281 26.6367 28.3125 27.4688 27.4805C28.3008 26.6484 28.8164 25.8105 29.1973 24.8262C29.5664 23.8711 29.8242 22.7813 29.8945 21.1875C29.9648 19.5879 29.9824 19.0781 29.9824 15.0059C29.9824 10.9336 29.9648 10.4238 29.8945 8.82422C29.8242 7.23047 29.5664 6.13477 29.1973 5.18555C28.8281 4.18945 28.3184 3.35156 27.4805 2.51953C26.6484 1.6875 25.8105 1.17188 24.8262 0.791016C23.8711 0.421875 22.7813 0.164062 21.1875 0.09375C19.582 0.0175781 19.0723 0 15 0Z" fill="white"/>
                <path d="M15 7.29492C10.7461 7.29492 7.29492 10.7461 7.29492 15C7.29492 19.2539 10.7461 22.7051 15 22.7051C19.2539 22.7051 22.7051 19.2539 22.7051 15C22.7051 10.7461 19.2539 7.29492 15 7.29492ZM15 19.998C12.2402 19.998 10.002 17.7598 10.002 15C10.002 12.2402 12.2402 10.002 15 10.002C17.7598 10.002 19.998 12.2402 19.998 15C19.998 17.7598 17.7598 19.998 15 19.998Z" fill="white"/>
                <path d="M24.8086 6.99024C24.8086 7.98633 24 8.78907 23.0098 8.78907C22.0137 8.78907 21.2109 7.98047 21.2109 6.99024C21.2109 5.99414 22.0195 5.19141 23.0098 5.19141C24 5.19141 24.8086 6 24.8086 6.99024Z" fill="white"/>
              </svg>
            </a>
          )}
          {footer.socialLinks.whatsapp && (
            <a href={footer.socialLinks.whatsapp} aria-label="WhatsApp">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                <path d="M0 30L2.10875 22.2962C0.807498 20.0413 0.12375 17.485 0.125 14.8637C0.12875 6.66875 6.79749 0 14.9912 0C18.9675 0.00125 22.7 1.55 25.5074 4.36C28.3137 7.17 29.8587 10.905 29.8574 14.8775C29.8537 23.0738 23.1849 29.7425 14.9912 29.7425C12.5037 29.7413 10.0525 29.1175 7.88123 27.9325L0 30Z" fill="white" fillOpacity="0.9"/>
              </svg>
            </a>
          )}
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p>{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
