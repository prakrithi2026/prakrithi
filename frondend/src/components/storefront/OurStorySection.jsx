import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import './OurStorySection.css';

export default function OurStorySection() {
  const { config } = useSiteConfig();
  const { ourStory, theme } = config;

  if (!ourStory) return null;

  // Extract a shorter preview from the story
  const paragraphs = ourStory.content.split('\n').filter(p => p.trim() && !p.startsWith('## '));
  const previewText = [paragraphs[0] + '...'];

  return (
    <section className="our-story-section">
      <div 
        className="our-story-wrapper" 
        style={{ backgroundColor: theme.accentColor || '#BDD681' }}
      >
        <div className="our-story-content">
          <h2 className="our-story-title" style={{ color: theme.headingColor }}>
            {ourStory.title}
          </h2>
          {ourStory.subtitle && (
            <h3 className="our-story-subtitle" style={{ color: theme.primaryColor }}>
              {ourStory.subtitle}
            </h3>
          )}
          <div className="our-story-text" style={{ color: theme.textColor }}>
            {previewText.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <Link 
            to="/our-story" 
            className="our-story-btn" 
            style={{ 
              backgroundColor: theme.primaryColor, 
              color: '#FFF' 
            }}
          >
            View All →
          </Link>
        </div>
        {ourStory.image && (
          <div className="our-story-image-container">
            <img src={ourStory.image} alt={ourStory.title} className="our-story-image" loading="lazy" />
          </div>
        )}
      </div>
    </section>
  );
}
