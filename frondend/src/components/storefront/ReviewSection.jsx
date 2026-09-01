import { useSiteConfig } from '../../context/SiteConfigContext';
import './ReviewSection.css';

export default function ReviewSection() {
  const { config } = useSiteConfig();
  const { reviewsSection = {}, theme } = config;
  const { image = '', googleRating = 0, totalReviews = 0 } = reviewsSection;

  const dynamicStyle = {
    background: `linear-gradient(90deg, #0D5130 0%, #9FBD58 100%)`
  };

  const reviewImage = image || '/images/rating.png';

  return (
    <section className="review-section" style={dynamicStyle}>
      <div className="review-container">
        
        {/* Left Image Column */}
        {reviewImage ? (
          <div className="review-laurel-col">
            <img src={reviewImage} alt="Reviews Graphic" className="review-left-uploaded-img" />
          </div>
        ) : null}

        {/* Right Google Rating Column */}
        <div className="review-rating-col">
          <div className="google-rating-card" style={{ backgroundColor: '#0D5130' }}>
            <div className="google-info">
              <p className="google-label">Google Rating</p>
              <div className="google-score-row">
                <span className="google-score">{googleRating || 4.9}</span>
                <span className="google-stars">★★★★★</span>
                <span className="google-count">
                  {Number(totalReviews || 1183).toLocaleString('en-IN')} Reviews
                </span>
              </div>
            </div>
            <a 
              href="https://g.page/r/search" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-write-review-link"
            >
              Write a review
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
