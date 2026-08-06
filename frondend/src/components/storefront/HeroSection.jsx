import { useState } from 'react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import './HeroSection.css';

export default function HeroSection() {
  const { config } = useSiteConfig();
  const { hero, theme } = config;
  const [copied, setCopied] = useState(false);

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

  // Parse ctaText into "USE CODE" and the actual code (e.g. "PR10")
  const ctaText = hero.ctaText || "";
  let labelText = "USE CODE";
  let codeText = "";

  if (ctaText.includes(":")) {
    const parts = ctaText.split(":");
    labelText = parts[0].trim().toUpperCase();
    codeText = parts[1].trim().toUpperCase();
  } else if (ctaText.toLowerCase().startsWith("use code")) {
    labelText = "USE CODE";
    codeText = ctaText.substring(8).trim().toUpperCase();
  } else {
    labelText = "USE CODE";
    codeText = ctaText.trim().toUpperCase();
  }

  const handleCopy = () => {
    if (codeText) {
      navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const textColorStyle = hero.textColor ? { color: hero.textColor } : {};

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
          {hero.tagline && <p className="hero-tagline" style={textColorStyle}>{hero.tagline}</p>}
          <h1 className="hero-title" style={textColorStyle}>{hero.title}</h1>
          {hero.subtitle && <p className="hero-subtitle" style={textColorStyle}>{hero.subtitle}</p>}
          {hero.ctaText && (
            <div 
              className="hero-coupon-badge"
              onClick={handleCopy}
              title="Click to copy coupon code"
              style={{
                borderColor: hero.ctaBgColor || theme.primaryColor,
                color: hero.ctaBgColor || theme.primaryColor,
              }}
            >
              <div className="hero-coupon-left">
                {labelText}
              </div>
              <div 
                className="hero-coupon-divider" 
                style={{ borderLeftStyle: 'dashed', borderLeftWidth: '1px', borderLeftColor: hero.ctaBgColor || theme.primaryColor }}
              />
              <div className="hero-coupon-right">
                {codeText}
              </div>
              {copied && <span className="hero-coupon-tooltip">Copied!</span>}
            </div>
          )}
        </div>

        <span className="hero-tc">*T&C Apply</span>
      </div>
    </section>
  );
}

