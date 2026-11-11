import { useState, useRef, useEffect, useCallback } from 'react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import './ReviewSection.css';

// SVG Double Quote Icon (exact user-provided SVG)
function QuoteIcon({ color = 'currentColor' }) {
  return (
    <svg
      className="review-quote-icon"
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M35.89 12L36.4765 13.1707C35.6293 13.4959 34.7495 13.9512 33.8372 14.5366C32.99 15.0569 32.208 15.6098 31.4911 16.1951C30.7742 16.7805 30.2203 17.3984 29.8293 18.0488L30.9046 18.9268H31.8821C33.4462 18.9268 34.7821 19.2195 35.89 19.8049C36.9978 20.3252 37.845 21.1057 38.4316 22.1463C39.0832 23.122 39.4091 24.2276 39.4091 25.4634C39.4091 26.7642 39.0507 27.9024 38.3338 28.878C37.6821 29.8537 36.8023 30.6341 35.6945 31.2195C34.5866 31.7398 33.2832 32 31.7844 32C30.3506 32 29.0799 31.7073 27.972 31.122C26.8641 30.5366 25.9844 29.7561 25.3327 28.7805C24.681 27.7398 24.3551 26.5691 24.3551 25.2683C24.3551 23.7724 24.6158 22.374 25.1372 21.0732C25.7237 19.7073 26.5383 18.439 27.581 17.2683C28.6237 16.0976 29.8619 15.0569 31.2956 14.1463C32.7293 13.2358 34.2608 12.5203 35.89 12ZM16.5349 12L17.1214 13.1707C16.2742 13.4959 15.3945 13.9512 14.4821 14.5366C13.6349 15.0569 12.8529 15.6098 12.136 16.1951C11.4192 16.7805 10.8652 17.3984 10.4742 18.0488L11.5495 18.9268H12.527C14.0911 18.9268 15.427 19.2195 16.5349 19.8049C17.6428 20.3252 18.49 21.1057 19.0765 22.1463C19.7282 23.122 20.054 24.2276 20.054 25.4634C20.054 26.7642 19.6956 27.9024 18.9787 28.878C18.327 29.8537 17.4473 30.6341 16.3394 31.2195C15.2315 31.7398 13.9282 32 12.4293 32C10.9956 32 9.72478 31.7073 8.61692 31.122C7.50905 30.5366 6.62928 29.7561 5.97759 28.7805C5.3259 27.7398 5.00006 26.5691 5.00006 25.2683C5.00006 23.7724 5.26074 22.374 5.78208 21.0732C6.3686 19.7073 7.18321 18.439 8.22591 17.2683C9.2686 16.0976 10.5068 15.0569 11.9405 14.1463C13.3742 13.2358 14.9057 12.5203 16.5349 12Z"
        fill={color}
      />
    </svg>
  );
}

// SVG Verified Customer Badge
function VerifiedBadge({ color = 'currentColor' }) {
  return (
    <svg
      className="review-verified-badge"
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Verified Customer"
    >
      <path
        fillRule="evenodd"
        d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.707 6.293a1 1 0 00-1.414-1.414L7 8.586 5.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// 5-Star Rating
function StarRating({ count = 5, color = 'currentColor' }) {
  return (
    <div className="review-card-stars" aria-label={`${count} out of 5 stars`}>
      {[...Array(count)].map((_, i) => (
        <svg
          key={i}
          className="review-star-icon"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={color}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

// Crisp self-contained SVG avatars matching customer profiles
const AVATAR_SEETHA_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23b86b43"/><stop offset="100%" stop-color="%237a3f24"/></linearGradient></defs><circle cx="40" cy="40" r="40" fill="url(%23bg1)"/><circle cx="40" cy="38" r="16" fill="%23d68b59"/><path d="M24 36c0-10 7-18 16-18s16 8 16 18c0 4-2 7-4 7s-4-6-6-6-4 3-6 3-4-1-6-3-4-1-4-1z" fill="%232b1d16"/><path d="M40 29a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="%239e1a1a"/><circle cx="34" cy="36" r="2" fill="%232b1d16"/><circle cx="46" cy="36" r="2" fill="%232b1d16"/><path d="M37 42c1.5 2 4.5 2 6 0" stroke="%232b1d16" stroke-width="1.8" stroke-linecap="round" fill="none"/><circle cx="23" cy="42" r="2.5" fill="%23f4b41a"/><circle cx="57" cy="42" r="2.5" fill="%23f4b41a"/><path d="M20 74c3-16 11-22 20-22s17 6 20 22" fill="%23a83232"/></svg>`;

const AVATAR_CATHERIN = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80"><defs><linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23966042"/><stop offset="100%" stop-color="%235c3621"/></linearGradient></defs><circle cx="40" cy="40" r="40" fill="url(%23bg2)"/><circle cx="40" cy="37" r="16" fill="%23df9e6e"/><path d="M24 35c0-11 7-17 16-17s16 6 16 17c0 4-3 5-5 5s-3-4-5-4-4 2-6 2-4-1-6-2-4 0-4-1z" fill="%233a2820"/><circle cx="34" cy="36" r="2" fill="%233a2820"/><circle cx="46" cy="36" r="2" fill="%233a2820"/><path d="M36 43c2 2.5 6 2.5 8 0" stroke="%233a2820" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M19 74c3-16 12-21 21-21s18 5 21 21" fill="%23306b5b"/></svg>`;

const AVATAR_SEETHA_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80"><defs><linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23c27448"/><stop offset="100%" stop-color="%23854523"/></linearGradient></defs><circle cx="40" cy="40" r="40" fill="url(%23bg3)"/><circle cx="40" cy="38" r="16" fill="%23e09869"/><path d="M22 38c0-12 8-19 18-19s18 7 18 19c0 6-3 7-5 7s-4-6-6-6-4 4-7 4-5-2-6-4-5 0-5 2z" fill="%23261a15"/><circle cx="34" cy="37" r="2" fill="%23261a15"/><circle cx="46" cy="37" r="2" fill="%23261a15"/><path d="M37 43c1.5 2 4.5 2 6 0" stroke="%23261a15" stroke-width="1.8" stroke-linecap="round" fill="none"/><circle cx="23" cy="43" r="2.5" fill="%23f4b41a"/><circle cx="57" cy="43" r="2.5" fill="%23f4b41a"/><path d="M18 74c4-17 12-22 22-22s18 5 22 22" fill="%23d46333"/></svg>`;

const AVATAR_SANTHOSH = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80"><defs><linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23556c82"/><stop offset="100%" stop-color="%232c3f52"/></linearGradient></defs><circle cx="40" cy="40" r="40" fill="url(%23bg4)"/><circle cx="40" cy="37" r="16" fill="%23cf8f60"/><path d="M26 30c0-10 6-13 14-13s14 3 14 13c0 2-2 3-4 3s-3-2-5-2-3 1-5 1-3-1-5-1-4 0-4 1z" fill="%231e1e1e"/><rect x="30" y="32" width="8" height="7" rx="2" fill="none" stroke="%231e1e1e" stroke-width="1.8"/><rect x="42" y="32" width="8" height="7" rx="2" fill="none" stroke="%231e1e1e" stroke-width="1.8"/><line x1="38" y1="35" x2="42" y2="35" stroke="%231e1e1e" stroke-width="1.8"/><circle cx="34" cy="35" r="1.5" fill="%231e1e1e"/><circle cx="46" cy="35" r="1.5" fill="%231e1e1e"/><path d="M37 42c1.5 1.5 4.5 1.5 6 0" stroke="%231e1e1e" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M18 74c3-16 12-21 22-21s19 5 22 21" fill="%2324426b"/></svg>`;

// Customer Avatar with reliable fallback
function CustomerAvatar({ src, name, isDark, darkColor = '#004E38', lightColor = '#C6E095' }) {
  const [hasError, setHasError] = useState(false);

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name}
        className="review-customer-avatar"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : 'P';
  const bgColor = isDark ? '#00694B' : '#B8DC8E';
  const textColor = isDark ? '#FFFFFF' : '#004E38';

  return (
    <div
      className="review-customer-avatar review-customer-avatar--fallback"
      style={{ backgroundColor: bgColor, color: textColor }}
      aria-label={name}
    >
      <span>{initial}</span>
    </div>
  );
}

// Default reviews matching the design attached by user
export const DEFAULT_CUSTOMER_REVIEWS = [
  {
    id: 1,
    title: 'Excellent Quality!',
    text: 'Really impressed with the quality of products from prakrithi origins. the freshness and natural taste are amazing. definitely ordering again!',
    rating: 5,
    name: 'Seetha Kalyani',
    location: 'Trivandrum, India',
    verified: true,
    avatar: AVATAR_SEETHA_1,
  },
  {
    id: 2,
    title: 'Authentic Kerala taste!',
    text: 'You can really feel the quality. the spices are fresh, aromatic and full of flavour. happy to find a brand that focuses on natural products.',
    rating: 5,
    name: 'Catherin John',
    location: 'Alain, UAE',
    verified: true,
    avatar: AVATAR_CATHERIN,
  },
  {
    id: 3,
    title: 'Great packaging & quality!',
    text: 'received my order in perfect condition. the packaging is neat and premium, and the product quality is excellent, highly recommended!',
    rating: 5,
    name: 'Seetha Kalyani',
    location: 'Trivandrum, India',
    verified: true,
    avatar: AVATAR_SEETHA_2,
  },
  {
    id: 4,
    title: 'Worth every penny!',
    text: 'Very good quality products for a reasonable price. the products are fresh, aromatic and natural. had a wonderful shopping experience!',
    rating: 5,
    name: 'Santhosh Kumar',
    location: 'Alain, UAE',
    verified: true,
    avatar: AVATAR_SANTHOSH,
  },
  {
    id: 5,
    title: 'Pure & Organic Goodness!',
    text: 'The cardamom and wild honey are top notch. Pure aroma and authentic flavors that elevate our daily cooking. Will definitely order again!',
    rating: 5,
    name: 'Priya Nair',
    location: 'Bangalore, India',
    verified: true,
    avatar: AVATAR_SEETHA_1,
  },
  {
    id: 6,
    title: 'Fresh harvest aroma!',
    text: 'You can smell the freshness the moment you open the seal. Superior grade products delivered quickly and packed with great care.',
    rating: 5,
    name: 'Rajesh Menon',
    location: 'Kochi, India',
    verified: true,
    avatar: AVATAR_SANTHOSH,
  },
];

export default function ReviewSection() {
  const { config } = useSiteConfig();
  const darkColor = '#004E38';
  const lightColor = '#C6E095';
  const { reviewsSection = {} } = config;
  const {
    title: customTitle = '',
    googleRating = 4.9,
    totalReviews = 1000,
    reviews: customReviews,
  } = reviewsSection;

  const trackRef = useRef(null);
  const [activeDot, setActiveDot] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimeoutRef = useRef(null);

  // Mouse drag support state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Reviews list to display
  const reviewsList =
    Array.isArray(customReviews) && customReviews.length > 0
      ? customReviews
      : DEFAULT_CUSTOMER_REVIEWS;

  // Title formatting: default to design string, or format from config
  const displayTitle =
    customTitle ||
    `Rated ${googleRating || 4.9}/5 By ${
      totalReviews ? Number(totalReviews).toLocaleString('en-IN') + '+' : '1,000+'
    } Happy Customers`;

  // Update dots indicator on scroll
  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setActiveDot(0);
      return;
    }

    const progress = el.scrollLeft / maxScroll;
    const dotIndex = Math.min(2, Math.max(0, Math.round(progress * 2)));
    setActiveDot(dotIndex);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, reviewsList]);

  // Navigate directly to a dot index (0, 1, 2)
  const scrollToDot = (dotIndex) => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const targetLeft = (dotIndex / 2) * maxScroll;
    el.scrollTo({ left: targetLeft, behavior: 'smooth' });
    setActiveDot(dotIndex);
  };

  // Set up automatic scrolling interval matching HeroSection (5 seconds interval, pause on hover/interaction)
  useEffect(() => {
    if (isPaused || reviewsList.length < 2) return;

    const interval = setInterval(() => {
      const el = trackRef.current;
      if (!el || isDraggingRef.current) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 5) return;

      setActiveDot((prevDot) => {
        const nextDot = (prevDot + 1) % 3;
        const targetLeft = (nextDot / 2) * maxScroll;
        el.scrollTo({ left: targetLeft, behavior: 'smooth' });
        return nextDot;
      });
    }, 5000); // 5 seconds interval matching hero banner

    return () => clearInterval(interval);
  }, [isPaused, reviewsList.length]);

  // Touch handlers for mobile/tablet pause & resume
  const handleTouchStart = () => {
    setIsPaused(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleTouchEnd = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  // Mouse drag handlers for smooth desktop carousel dragging
  const handleMouseDown = (e) => {
    const el = trackRef.current;
    if (!el) return;
    setIsPaused(true);
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    el.classList.add('is-dragging');
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const el = trackRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const stopDragging = () => {
    isDraggingRef.current = false;
    if (trackRef.current) {
      trackRef.current.classList.remove('is-dragging');
    }
  };

  return (
    <div className="review-section-wrap">
      <section
        className="review-section"
        style={{
          '--card-dark-bg': darkColor,
          '--card-light-bg': lightColor,
          '--review-primary': darkColor,
        }}
        aria-label="Customer Reviews and Ratings"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header Title */}
        <h2 className="review-section-title">{displayTitle}</h2>

        {/* Carousel Track Container */}
        <div className="review-cards-wrapper">
          {/* Scrolling Track */}
          <div
            className="review-cards-track"
            ref={trackRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
          >
            {reviewsList.map((review, index) => {
              const isDark = index % 2 === 0;
              const cardClass = isDark ? 'review-card--dark' : 'review-card--light';
              const iconColor = isDark ? 'white' : darkColor;
              const reviewTitle = review.title || 'Exceptional Quality!';
              const reviewText = review.text || review.comment || '';
              const reviewName = review.name || review.customer_name || 'Happy Customer';
              const reviewRating = Number(review.rating) || 5;
              const reviewAvatar = review.avatar || review.media_url;
              const reviewLocation =
                review.location ||
                (review.product_name ? `Verified Buyer · ${review.product_name}` : 'Verified Customer');
              const isVerified = review.verified !== false;

              return (
                <article
                  key={review.id || index}
                  className={`review-card ${cardClass}`}
                  style={{
                    backgroundColor: isDark ? darkColor : lightColor,
                    color: isDark ? '#FFFFFF' : darkColor,
                  }}
                >
                  <div className="review-card-top">
                    {/* Exact Quotation Icon provided by user */}
                    <div className="review-quote-wrap">
                      <QuoteIcon color={iconColor} />
                    </div>

                    {/* Review Title */}
                    <h3
                      className="review-card-title"
                      style={{ color: isDark ? '#FFFFFF' : darkColor }}
                    >
                      {reviewTitle}
                    </h3>

                    {/* Review Body */}
                    <p
                      className="review-card-text"
                      style={{
                        color: isDark ? 'rgba(255, 255, 255, 0.92)' : 'rgba(0, 78, 56, 0.92)',
                      }}
                    >
                      {reviewText}
                    </p>

                    {/* Star Rating */}
                    <StarRating count={reviewRating} color={iconColor} />
                  </div>

                  {/* Customer Information Bottom Row */}
                  <div className="review-card-bottom">
                    <CustomerAvatar
                      src={reviewAvatar}
                      name={reviewName}
                      isDark={isDark}
                      darkColor={darkColor}
                      lightColor={lightColor}
                    />
                    <div className="review-customer-info">
                      <div className="review-customer-name-row">
                        <span
                          className="review-customer-name"
                          style={{ color: isDark ? '#FFFFFF' : darkColor }}
                        >
                          {reviewName}
                        </span>
                        {isVerified && (
                          <VerifiedBadge color={iconColor} />
                        )}
                      </div>
                      {reviewLocation && (
                        <span
                          className="review-customer-location"
                          style={{
                            color: isDark ? 'rgba(255, 255, 255, 0.78)' : 'rgba(0, 78, 56, 0.78)',
                          }}
                        >
                          {reviewLocation}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Pagination Dots matching Hero Banner */}
        <div className="review-dots-container" role="tablist" aria-label="Review Carousel Navigation">
          {[0, 1, 2].map((dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              role="tab"
              aria-selected={activeDot === dotIndex}
              aria-label={`Go to slide ${dotIndex + 1}`}
              className={`review-dot-btn ${
                activeDot === dotIndex ? 'review-dot-btn--active' : ''
              }`}
              onClick={() => scrollToDot(dotIndex)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
