import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { useAuth } from '../../context/AuthContext';
import defaultConfig from '../../data/defaultConfig';
import { svgToDataUrl } from '../../utils/imageOptimizer';
import { fetchReviews, deleteReviewById, isOwnReview } from '../../utils/reviewsApi';
import './ReviewSection.css';

export default function ReviewSection() {
  const { config } = useSiteConfig();
  const { user } = useAuth();
  const { reviewsSection = {} } = config;
  const { image = '', googleRating = 0, totalReviews = 0 } = reviewsSection;
  const [customerReviews, setCustomerReviews] = useState([]);

  const loadCustomerReviews = useCallback(async () => {
    const data = await fetchReviews();
    setCustomerReviews(Array.isArray(data) ? data : []);
  }, []);

  const handleDeleteOwnReview = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return;
    await deleteReviewById(reviewId);
    setCustomerReviews((prev) => prev.filter((r) => String(r.id) !== String(reviewId)));
  };

  useEffect(() => {
    loadCustomerReviews();
    const handleSync = () => loadCustomerReviews();
    window.addEventListener('prakrithi-reviews-updated', handleSync);
    let ch = null;
    if (typeof BroadcastChannel !== 'undefined') {
      ch = new BroadcastChannel('prakrithi-reviews-sync');
      ch.onmessage = () => loadCustomerReviews();
    }
    return () => {
      window.removeEventListener('prakrithi-reviews-updated', handleSync);
      ch?.close();
    };
  }, [loadCustomerReviews]);

  const dynamicStyle = {
    background: 'linear-gradient(90deg, #00433D 0%, #00433D 32%, #A0D075 100%)'
  };

  // Only display image if admin provided an image URL or SVG code, or fallback to default
  const isLegacy = typeof image === 'string' && (
    image === '/images/rating.png' ||
    image.startsWith('data:image/webp;base64,UklGRsgMAAB')
  );
  const rawImage = (!image || isLegacy) ? (defaultConfig.reviewsSection?.image || '') : image;
  const reviewImage = rawImage ? svgToDataUrl(rawImage) : '';

  const baseCount = Number(totalReviews || 1183);
  const displayCount = baseCount + customerReviews.length;

  return (
    <div className="review-section-wrap">
      <section className="review-section" style={dynamicStyle}>
        <div className={`review-container ${!reviewImage ? 'review-container--no-image' : ''}`}>
          
          {/* Left Image Column - Only displayed if admin added an image URL or SVG code */}
          {reviewImage ? (
            <div className="review-laurel-col">
              <img src={reviewImage} alt="Reviews Graphic" className="review-left-uploaded-img" />
            </div>
          ) : null}

          {/* Right Google Rating Column */}
          <div className="review-rating-col">
            <div className="google-rating-card">
              <div className="google-info">
                <p className="google-label">Google Rating</p>
                <div className="google-score-row">
                  <span className="google-score">{googleRating || 4.9}</span>
                  <span className="google-stars">★★★★★</span>
                  <span className="google-count">
                    {displayCount.toLocaleString('en-IN')} Reviews
                  </span>
                </div>
              </div>
              <Link
                to="/write-review"
                className="btn-write-review-link"
              >
                Write a review
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Customer Reviews Showcase (when reviews exist) */}
      {customerReviews.length > 0 && (
        <div className="review-showcase">
          <div className="review-showcase__header">
            <h3 className="review-showcase__title">Recent Customer Reviews</h3>
            <Link to="/write-review" className="review-showcase__view-all">
              View All / Write a Review →
            </Link>
          </div>

          <div className="review-showcase__grid">
            {customerReviews.slice(0, 3).map((rev) => {
              const starsCount = Math.max(1, Math.min(5, Number(rev.rating) || 5));
              const canDelete = isOwnReview(rev, user);
              return (
                <div key={rev.id} className="review-showcase__card">
                  <div className="review-showcase__card-top">
                    <span className="review-showcase__author">{rev.customer_name}</span>
                    <div className="review-showcase__top-actions">
                      <span className="review-showcase__stars">
                        {'★'.repeat(starsCount)}
                        <span className="review-showcase__stars-empty">
                          {'★'.repeat(5 - starsCount)}
                        </span>
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          className="review-showcase__delete-btn"
                          onClick={() => handleDeleteOwnReview(rev.id)}
                          title="Delete your review"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {rev.product_name && (
                    <div className="review-showcase__product">🌿 {rev.product_name}</div>
                  )}
                  {rev.title && <div className="review-showcase__headline">{rev.title}</div>}
                  <p className="review-showcase__comment">{rev.comment}</p>

                  {rev.admin_reply && (
                    <div className="review-showcase__reply">
                      <div className="review-showcase__reply-label">
                        🌿 Prakrithi Naturals Replied:
                      </div>
                      <p className="review-showcase__reply-text">{rev.admin_reply}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


