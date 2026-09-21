import { useState, useEffect, useMemo } from 'react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import './HeroSection.css';

export default function HeroSection() {
  const { config } = useSiteConfig();
  const hero = config?.hero || {};
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Memoize sanitized image arrays so reference doesn't change every render
  const desktopImages = useMemo(() => (
    Array.isArray(hero.images)
      ? hero.images
      : (hero.bgImage ? [hero.bgImage] : [])
  ).filter(Boolean), [hero.images, hero.bgImage]);

  const mobileImages = useMemo(() => (
    Array.isArray(hero.mobileImages) ? hero.mobileImages : []
  ).filter(Boolean), [hero.mobileImages]);

  // Desktop images are the primary banners for the storefront.
  // If no desktop banners exist, the hero section is hidden everywhere.
  const slideCount = desktopImages.length;
  const enabled = hero.enabled !== false && slideCount > 0;

  // Pre-construct slides pairing desktop and mobile images cleanly
  const slides = useMemo(() => {
    if (slideCount === 0) return [];
    const list = [];
    for (let i = 0; i < desktopImages.length; i++) {
      const desktop = desktopImages[i];
      // Use mobile-specific image if configured for this slide; otherwise fall back to desktop
      const mobile = mobileImages[i] || desktop;
      list.push({ desktop, mobile });
    }
    return list;
  }, [desktopImages, mobileImages, slideCount]);

  // Set up automatic scrolling interval if there are 2 or more images
  useEffect(() => {
    if (!enabled || slideCount < 2 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000); // 5 seconds interval

    return () => clearInterval(interval);
  }, [slideCount, enabled, isPaused]);

  // Reset currentSlide if it goes out of bounds when images are updated
  useEffect(() => {
    if (currentSlide >= slideCount && slideCount > 0) {
      setCurrentSlide(0);
    }
  }, [slideCount, currentSlide]);

  // Touch handlers for mobile swipe navigation
  const minSwipeDistance = 45;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      // Swiped left -> next slide
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev slide
      setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
    }
  };

  // If explicitly disabled or no banners, render nothing
  if (hero.enabled === false || !enabled) return null;

  return (
    <section
      className={`hero-section ${mobileImages.length === 0 ? 'hero-section--desktop-fallback' : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-slider-viewport">
        <div 
          className="hero-slides-container"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => {
            const isActive = index === currentSlide || slideCount === 1;
            return (
              <div
                key={index}
                className={`hero-slide ${isActive ? 'active' : ''}`}
              >
                <picture className="hero-picture">
                  {slide.mobile && (
                    <source media="(max-width: 768px)" srcSet={slide.mobile} />
                  )}
                  <img
                    src={slide.desktop || slide.mobile}
                    alt={`Banner ${index + 1}`}
                    className="hero-img"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={index === 0 ? 'high' : 'low'}
                  />
                </picture>
              </div>
            );
          })}
        </div>
      </div>

      {/* Render navigation indicators (dots) only if 2 or more images */}
      {slideCount >= 2 && (
        <div className="hero-dots">
          {slides.map((_, index) => (
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


