import { useSiteConfig } from '../../context/SiteConfigContext';
import './ReviewSection.css';

export default function ReviewSection() {
  const { config } = useSiteConfig();
  const { reviewsSection = {}, theme } = config;
  const { image = '', googleRating = 0, totalReviews = 0 } = reviewsSection;

  return (
    <section className="review-section" style={{ background: theme.primaryColor }}>
      <div className="review-container" style={{ background: theme.primaryColor }}>
        {/* Left image (optional) */}
        {image && (
          <div className="review-left">
            <img
              src={image}
              alt="Reviews"
              className="review-left__img"
              loading="lazy"
            />
          </div>
        )}

        {/* Google rating card */}
        <div className={`review-right${!image ? ' review-right--full' : ''}`}>
          <div className="google-rating-card">
            <div className="google-info">
              <p className="google-label">Google Rating</p>
              <div className="google-score-row">
                <span className="google-score">{googleRating}</span>
                <span className="google-stars">★★★★★</span>
                <span className="google-count">{Number(totalReviews).toLocaleString()} Reviews</span>
              </div>
            </div>
            <button className="btn-write-review" style={{ backgroundColor: theme.primaryColor }}>
              Write a review
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
