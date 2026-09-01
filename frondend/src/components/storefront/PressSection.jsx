import { useSiteConfig } from '../../context/SiteConfigContext';
import defaultConfig from '../../data/defaultConfig';
import './PressSection.css';

export default function PressSection() {
  const { config } = useSiteConfig();
  const { press } = config;

  return (
    <section className="press-section" style={{ backgroundColor: press.bgColor || '#BDD681' }}>
      <div className="press-container">
        {press.logos.map((logo, i) => {
          const logoImage = logo.image !== undefined ? logo.image : defaultConfig.press?.logos?.[i]?.image;
          return (
            <div key={i} className="press-logo">
              {logoImage ? (
                <img src={logoImage} alt={logo.name} className="press-logo-img" loading="lazy" />
              ) : (
              <span className={`press-text press-${logo.style || 'default'}`}>
                {logo.style === 'thehindu' && (
                  <svg className="thehindu-emblem" viewBox="0 0 100 45" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    {/* Center shield / crest */}
                    <path d="M 50 12 C 55 12, 57 15, 57 20 C 57 28, 50 35, 50 35 C 50 35, 43 28, 43 20 C 43 15, 45 12, 50 12 Z" opacity="0.9"/>
                    <circle cx="50" cy="21" r="3" fill="#BDD681" />
                    {/* Crown on top */}
                    <path d="M 46 8 L 48 11 L 50 8 L 52 11 L 54 8 L 53 13 L 47 13 Z" />
                    {/* Elephant Left */}
                    <path d="M 38 33 C 38 25, 33 22, 28 22 C 27 22, 25 23, 24 24 C 23 23, 21 22, 19 22 C 15 22, 12 26, 12 30 C 12 33, 14 34, 16 34 C 18 34, 19 32, 19 30 C 19 27, 22 25, 25 25 C 27 25, 29 27, 29 30 C 29 33, 31 34, 33 34 C 35 34, 36 33, 37 31 L 38 33 Z" />
                    <path d="M 42 22 C 40 22, 38 25, 38 28 L 40 33 L 42 33 L 42 22 Z" />
                    {/* Elephant Right */}
                    <path d="M 62 33 C 62 25, 67 22, 72 22 C 73 22, 75 23, 76 24 C 77 23, 79 22, 81 22 C 85 22, 88 26, 88 30 C 88 33, 86 34, 84 34 C 82 34, 81 32, 81 30 C 81 27, 78 25, 75 25 C 73 25, 71 27, 71 30 C 71 33, 69 34, 67 34 C 65 34, 64 33, 63 31 L 62 33 Z" />
                    <path d="M 58 22 C 60 22, 62 25, 62 28 L 60 33 L 58 33 L 58 22 Z" />
                  </svg>
                )}
                {logo.style === 'indiatoday' ? (
                  <>
                    INDIA
                    <br />
                    TODAY
                  </>
                ) : (
                  logo.name
                )}
              </span>
            )}
          </div>
          );
        })}
      </div>
    </section>
  );
}
