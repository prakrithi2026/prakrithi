import { useState, useEffect } from 'react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import './HeroSection.css';

export default function HeroSection() {
  const { config } = useSiteConfig();
  const { hero } = config;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  // Track window resize to switch between desktop and mobile image sets
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Desktop images (fallback to legacy bgImage if needed)
  const desktopImages = hero.images !== undefined
    ? hero.images
    : (hero.bgImage ? [hero.bgImage] : []);

  // Mobile images
  const mobileImages = Array.isArray(hero.mobileImages) ? hero.mobileImages : [];

  // If on mobile viewport and mobileImages exist, use mobileImages; otherwise fallback to desktopImages
  const isUsingMobileImages = isMobile && mobileImages.length > 0;
  const images = isUsingMobileImages ? mobileImages : desktopImages;

  const enabled = hero.enabled !== false;

  // Calculate dynamic aspect ratio from the first image if available
  const [aspectRatio, setAspectRatio] = useState(null);

  // Preload first hero image immediately for instant LCP render and determine exact aspect ratio
  useEffect(() => {
    if (images.length > 0 && images[0]) {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
        }
      };
      img.src = images[0];
    } else {
      setAspectRatio(null);
    }
  }, [images]);

  // Set up automatic scrolling interval if there are 2 or more images
  useEffect(() => {
    if (!enabled || images.length < 2) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000); // 5 seconds interval

    return () => clearInterval(interval);
  }, [images.length, enabled]);

  // Reset currentSlide if it goes out of bounds when images are swapped/cleared
  useEffect(() => {
    if (currentSlide >= images.length && images.length > 0) {
      setCurrentSlide(0);
    }
  }, [images.length, currentSlide]);

  // If the hero section is disabled or has no images, render nothing (no empty blank space)
  if (!enabled || images.length === 0) return null;

  return (
    <section
      className={`hero-section ${isUsingMobileImages ? 'hero-section--mobile-view' : ''}`}
      style={isMobile && aspectRatio ? { aspectRatio } : undefined}
    >
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

