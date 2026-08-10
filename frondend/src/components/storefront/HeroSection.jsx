import { useState, useEffect } from 'react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import './HeroSection.css';

export default function HeroSection() {
  const { config } = useSiteConfig();
  const { hero } = config;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fallback to old bgImage only if new images list is undefined (not yet migrated)
  const images = hero.images !== undefined
    ? hero.images
    : (hero.bgImage ? [hero.bgImage] : []);

  const enabled = hero.enabled !== false;

  // Set up automatic scrolling interval if there are 2 or more images
  useEffect(() => {
    if (!enabled || images.length < 2) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000); // 5 seconds fixed interval

    return () => clearInterval(interval);
  }, [images.length, enabled]);

  // Reset currentSlide if it goes out of bounds when images are removed/cleared
  useEffect(() => {
    if (currentSlide >= images.length && images.length > 0) {
      setCurrentSlide(0);
    }
  }, [images.length, currentSlide]);

  // If the hero section is disabled, render nothing
  if (!enabled) return null;

  return (
    <section className="hero-section">
      <div className="hero-slides-container">
        {images.map((image, index) => (
          <div
            key={index}
            className={`hero-slide ${index === currentSlide || images.length === 1 ? 'active' : ''}`}
            style={{
              backgroundImage: `url("${image}")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        ))}
      </div>

      {/* Render navigation indicators (dots) only if 2 or more images */}
      {images.length >= 2 && (
        <div className="hero-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`hero-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

