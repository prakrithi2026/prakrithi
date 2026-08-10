import { useSiteConfig } from '../../context/SiteConfigContext';
import './ReviewSection.css';

export default function ReviewSection() {
  const { config } = useSiteConfig();
  const { reviewsSection = {}, theme } = config;
  const { image = '', googleRating = 0, totalReviews = 0 } = reviewsSection;

  const dynamicStyle = {
    background: `radial-gradient(rgba(255, 255, 255, 0.18) 18%, transparent 18%), linear-gradient(135deg, ${theme.primaryColor || '#00472A'} 0%, ${theme.accentColor || '#BDD681'} 100%)`,
    backgroundSize: '16px 16px, 100% 100%'
  };

  return (
    <section className="review-section" style={dynamicStyle}>
      <div className="review-container">
        
        {/* Left Laurel Wreath Column */}
        <div className="review-laurel-col">
          <div className="laurel-wreath-wrap">
            <svg width="200" height="130" viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Stars at the top */}
              <path d="M100 10 L102.5 15 L108 15.5 L104 19.5 L105 25 L100 22 L95 25 L96 19.5 L92 15.5 L97.5 15 Z" fill="white" />
              <path d="M84 15 L86 19 L91 19.5 L87.5 23 L88 28 L84 25.5 L80 28 L80.5 23 L77 19.5 L82 19 Z" fill="white" opacity="0.8" />
              <path d="M116 15 L118 19 L123 19.5 L119.5 23 L120 28 L116 25.5 L112 28 L112.5 23 L109 19.5 L114 19 Z" fill="white" opacity="0.8" />
              
              {/* Left branch */}
              <path d="M75 40 C50 50, 45 90, 75 110" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M54 53 C49 51, 45 55, 49 60 C53 65, 59 60, 54 53 Z" fill="white" />
              <path d="M47 70 C42 69, 39 74, 43 78 C47 82, 52 76, 47 70 Z" fill="white" />
              <path d="M49 88 C45 88, 43 93, 48 96 C53 99, 56 93, 49 88 Z" fill="white" />
              <path d="M59 103 C55 105, 55 111, 60 112 C65 113, 67 107, 59 103 Z" fill="white" />

              {/* Right branch */}
              <path d="M125 40 C150 50, 155 90, 125 110" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M146 53 C151 51, 155 55, 151 60 C147 65, 141 60, 146 53 Z" fill="white" />
              <path d="M153 70 C158 69, 161 74, 157 78 C153 82, 148 76, 153 70 Z" fill="white" />
              <path d="M151 88 C155 88, 157 93, 152 96 C147 99, 144 93, 151 88 Z" fill="white" />
              <path d="M141 103 C145 105, 145 111, 140 112 C135 113, 133 107, 141 103 Z" fill="white" />
            </svg>
            <div className="laurel-text-overlay">
              <span className="laurel-title">Loved By</span>
              <span className="laurel-subtitle">{reviewsSection.familyCount || '1K+'} Families</span>
            </div>
          </div>
        </div>

        {/* Right Google Rating Column */}
        <div className="review-rating-col">
          <div className="google-rating-card" style={{ backgroundColor: theme.primaryColor || '#00472A' }}>
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
