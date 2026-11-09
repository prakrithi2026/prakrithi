import { useState, useRef, useEffect, useCallback } from 'react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import './ReviewSection.css';

// SVG Double Quote Icon (exact user-provided SVG)
function QuoteIcon({ color = 'currentColor' }) {
  return (
    <svg
      className="review-quote-icon"
      width="23"
      height="13"
      viewBox="0 0 35 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M30.8899 0L31.4764 1.17073C30.6292 1.49594 29.7495 1.95122 28.8371 2.53659C27.9899 3.05691 27.2079 3.60976 26.491 4.19513C25.7742 4.78049 25.2202 5.39838 24.8292 6.04878L25.9045 6.92683H26.8821C28.4461 6.92683 29.7821 7.21951 30.8899 7.80488C31.9978 8.3252 32.845 9.10569 33.4315 10.1463C34.0832 11.122 34.409 12.2276 34.409 13.4634C34.409 14.7642 34.0506 15.9024 33.3337 16.878C32.6821 17.8537 31.8023 18.6341 30.6944 19.2195C29.5865 19.7398 28.2832 20 26.7843 20C25.3506 20 24.0798 19.7073 22.9719 19.122C21.8641 18.5366 20.9843 17.7561 20.3326 16.7805C19.6809 15.7398 19.3551 14.5691 19.3551 13.2683C19.3551 11.7724 19.6157 10.374 20.1371 9.07317C20.7236 7.70732 21.5382 6.43903 22.5809 5.26829C23.6236 4.09756 24.8618 3.05691 26.2955 2.14634C27.7292 1.23577 29.2607 0.520326 30.8899 0ZM11.5348 0L12.1214 1.17073C11.2742 1.49594 10.3944 1.95122 9.48203 2.53659C8.63484 3.05691 7.85282 3.60976 7.13596 4.19513C6.41911 4.78049 5.86517 5.39838 5.47416 6.04878L6.54945 6.92683H7.52697C9.09102 6.92683 10.427 7.21951 11.5348 7.80488C12.6427 8.3252 13.4899 9.10569 14.0764 10.1463C14.7281 11.122 15.0539 12.2276 15.0539 13.4634C15.0539 14.7642 14.6955 15.9024 13.9787 16.878C13.327 17.8537 12.4472 18.6341 11.3393 19.2195C10.2315 19.7398 8.9281 20 7.42922 20C5.99551 20 4.72472 19.7073 3.61686 19.122C2.50899 18.5366 1.62922 17.7561 0.977529 16.7805C0.325843 15.7398 0 14.5691 0 13.2683C0 11.7724 0.260674 10.374 0.782023 9.07317C1.36854 7.70732 2.18315 6.43903 2.25809 5.26829C2.36236 4.09756 2.48618 3.05691 2.62955 2.14634C2.77292 1.23577 2.92607 0.520326 3.08899 0Z"
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
      width="12"
      height="12"
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
          width="12"
          height="12"
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
function CustomerAvatar({ src, name, isDark }) {
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
  const bgColor = isDark ? '#0A584F' : '#B8DC8E';
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
  const { reviewsSection = {} } = config;
  const {
    title: customTitle = '',
    googleRating = 4.9,
    totalReviews = 1000,
    reviews: customReviews,
  } = reviewsSection;

  const trackRef = useRef(null);
  const [activeDot, setActiveDot] = useState(0);

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

  // Mouse drag handlers for smooth desktop carousel dragging
  const handleMouseDown = (e) => {
    const el = trackRef.current;
    if (!el) return;
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
      <section className="review-section" aria-label="Customer Reviews and Ratings">
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
              const iconColor = isDark ? 'white' : '#004E38';
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
                >
                  <div className="review-card-top">
                    {/* Exact Quotation Icon provided by user */}
                    <div className="review-quote-wrap">
                      <QuoteIcon color={iconColor} />
                    </div>

                    {/* Review Title */}
                    <h3 className="review-card-title">{reviewTitle}</h3>

                    {/* Review Body */}
                    <p className="review-card-text">{reviewText}</p>

                    {/* Star Rating */}
                    <StarRating count={reviewRating} color={iconColor} />
                  </div>

                  {/* Customer Information Bottom Row */}
                  <div className="review-card-bottom">
                    <CustomerAvatar
                      src={reviewAvatar}
                      name={reviewName}
                      isDark={isDark}
                    />
                    <div className="review-customer-info">
                      <div className="review-customer-name-row">
                        <span className="review-customer-name">{reviewName}</span>
                        {isVerified && (
                          <VerifiedBadge color={iconColor} />
                        )}
                      </div>
                      {reviewLocation && (
                        <span className="review-customer-location">
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

        {/* 3-Dot Pagination Indicator */}
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
