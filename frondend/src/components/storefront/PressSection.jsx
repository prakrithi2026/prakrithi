import { useSiteConfig } from '../../context/SiteConfigContext';
import OptimizedImage from './OptimizedImage';
import './PressSection.css';

export default function PressSection() {
  const { config } = useSiteConfig();
  const { press } = config;

  return (
    <section className="press-section">
      <div className="press-container" style={{ background: press.bgColor || '#BDD681' }}>
        {press.logos.map((logo, i) => (
          <div key={i} className="press-logo">
            {logo.image ? (
              <OptimizedImage src={logo.image} alt={logo.name} className="press-logo-img" />
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
