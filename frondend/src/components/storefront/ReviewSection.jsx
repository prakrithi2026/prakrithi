import { useSiteConfig } from '../../context/SiteConfigContext';
import defaultConfig from '../../data/defaultConfig';
import { svgToDataUrl } from '../../utils/imageOptimizer';
import './ReviewSection.css';

export default function ReviewSection() {
  const { config } = useSiteConfig();
  const { reviewsSection = {}, theme } = config;
  const { image = '', googleRating = 0, totalReviews = 0 } = reviewsSection;

  const dynamicStyle = {
    background: `linear-gradient(90deg, #0D5130 0%, #9FBD58 100%)`
  };

  // Only display image if admin provided an image URL or SVG code, or fallback to default
  const isLegacy = typeof image === 'string' && (
    image === '/images/rating.png' ||
    image.startsWith('data:image/webp;base64,UklGRsgMAAB')
  );
  const rawImage = (!image || isLegacy) ? (defaultConfig.reviewsSection?.image || '') : image;
  const reviewImage = rawImage ? svgToDataUrl(rawImage) : '';

  return (
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
