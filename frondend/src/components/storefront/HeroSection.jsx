import { useSiteConfig } from '../../context/SiteConfigContext';
import './HeroSection.css';

export default function HeroSection() {
  const { config } = useSiteConfig();
  const { hero, theme } = config;

  // If the hero section is disabled, render nothing
  if (hero.enabled === false) return null;

  const sectionStyle = hero.bgImage
    ? {
        backgroundImage: `url(${hero.bgImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }
    : {
        background: `linear-gradient(135deg, #a8d5ba 0%, #c5e1a5 30%, #dcedc8 60%, #f1f8e9 100%)`,
      };

  const productImages = hero.productImages || [];
  const showImages = hero.showProductImages !== false && productImages.length > 0;

  return (
    <section className="hero-section" style={sectionStyle}>
      <div className="hero-container">
        {/* Product image area — only shown if enabled and has items */}
        {showImages && (
          <div className="hero-image">
            <div className="hero-image__placeholder">
              {productImages.filter(item => item.image).map((item, index) => (
                <div
                  key={item.id}
                  className={`hero-product-bag ${index > 0 ? 'hero-product-bag--offset' : ''} hero-product-bag--transparent`}
                  style={{
                    width: item.width ? `${item.width}px` : undefined,
                    height: item.width ? 'auto' : undefined,
                    animationDelay: `${index * 0.8}s`
                  }}
                >
                  <img
                    src={item.image}
                    alt="Product"
                    className="hero-product-bag__img"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`hero-content ${!showImages ? 'hero-content--full' : ''}`}>
          {hero.tagline && <p className="hero-tagline">{hero.tagline}</p>}
          <h1 className="hero-title">{hero.title}</h1>
          {hero.subtitle && <p className="hero-subtitle">{hero.subtitle}</p>}
          {hero.ctaText && (
            <a
              href={hero.ctaLink}
              className="btn-promo"
              style={{
                backgroundColor: hero.ctaBgColor || theme.primaryColor,
                color: hero.ctaTextColor || '#fff',
              }}
            >
              {hero.ctaText}
            </a>
          )}
        </div>

        <span className="hero-tc">*T&C Apply</span>
      </div>
    </section>
  );
}
