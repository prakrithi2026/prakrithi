import { useSiteConfig } from '../../context/SiteConfigContext';
import './PressSection.css';

export default function PressSection() {
  const { config } = useSiteConfig();
  const { press } = config;

  return (
    <section className="press-section" style={{ backgroundColor: press.bgColor || '#BDD681' }}>
      <div className="press-container">
        {press.logos.map((logo, i) => (
          <div key={i} className="press-logo">
            {logo.image ? (
              <img src={logo.image} alt={logo.name} className="press-logo-img" loading="lazy" />
            ) : (
              <span className={`press-text press-${logo.style || 'default'}`}>
                {logo.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
