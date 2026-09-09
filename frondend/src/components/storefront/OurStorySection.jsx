import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { svgToDataUrl, getYouTubeEmbedUrl } from '../../utils/imageOptimizer';
import './OurStorySection.css';

export default function OurStorySection() {
  const { config } = useSiteConfig();
  const { ourStory, theme } = config;
  const [isPlaying, setIsPlaying] = useState(false);

  if (!ourStory) return null;

  const storyImgSrc = ourStory.image ? svgToDataUrl(ourStory.image) : '';
  const hasVideo = Boolean(ourStory.video);
  const isVideoMode = ourStory.mediaType === 'video' || (hasVideo && ourStory.mediaType !== 'image');
  const isYouTubeOrVimeo = hasVideo && (
    ourStory.video.includes('youtube.com') ||
    ourStory.video.includes('youtu.be') ||
    ourStory.video.includes('vimeo.com')
  );
  const embedUrl = isYouTubeOrVimeo ? getYouTubeEmbedUrl(ourStory.video) : '';
  const hasMedia = isVideoMode ? hasVideo || Boolean(storyImgSrc) : Boolean(storyImgSrc);

  // Extract the main paragraph content
  const paragraphs = ourStory.content.split('\n').filter(p => p.trim() && !p.startsWith('## '));
  const mainParagraphText = paragraphs[0] || '';

  const founderName = ourStory.founderName || 'Anjana KA';
  const founderTitle = ourStory.founderTitle || 'Founder Prakrithi India';

  return (
    <section 
      className="our-story-section" 
      style={{ 
        background: `linear-gradient(to bottom, ${theme.accentColor || '#BDD681'} 50%, ${theme.backgroundColor || '#fdfdfd'} 50%)`,
        width: '100%',
        maxWidth: 'none',
        margin: 0
      }}
    >
      <div className="our-story-card" style={{ backgroundColor: theme.primaryColor || '#00472A' }}>
        
        {/* Left Column: Media (Video or Image) */}
        {hasMedia && (
          <div className="our-story-media-col">
            {isVideoMode && hasVideo ? (
              isPlaying || !storyImgSrc ? (
                <div className="our-story-video-wrapper">
                  {isYouTubeOrVimeo && embedUrl ? (
                    <iframe
                      src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
                      title={ourStory.title || 'Our Story Video'}
                      className="our-story-iframe"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={ourStory.video}
                      controls
                      autoPlay={isPlaying}
                      playsInline
                      className="our-story-video"
                    >
                      Your browser does not support HTML5 video.
                    </video>
                  )}
                </div>
              ) : (
                <div
                  className="our-story-image-wrapper our-story-image-wrapper--clickable"
                  onClick={() => setIsPlaying(true)}
                  role="button"
                  tabIndex={0}
                  aria-label="Play video"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsPlaying(true); }}
                >
                  <img
                    src={storyImgSrc}
                    alt={ourStory.title}
                    className="our-story-img"
                    loading="lazy"
                    decoding="async"
                    width="600"
                    height="400"
                  />
                  <div className="our-story-play-overlay">
                    <svg width="50" height="50" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="30" cy="30" r="30" fill="#EF1C1C" />
                      <path d="M40 30L24 40V20L40 30Z" fill="white" />
                    </svg>
                  </div>
                </div>
              )
            ) : storyImgSrc ? (
              <div className="our-story-image-wrapper">
                <img
                  src={storyImgSrc}
                  alt={ourStory.title}
                  className="our-story-img"
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="400"
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Right Column: Content */}
        <div className="our-story-text-col">
          <h2 className="our-story-heading">
            {ourStory.title}
          </h2>
          <p className="our-story-description">
            {mainParagraphText}{' '}
            <Link to="/our-story" className="our-story-inline-link">
              read our story
            </Link>
          </p>

          <div className="our-story-founder">
            <h4 className="our-story-founder-name">{founderName}</h4>
            <p className="our-story-founder-title">{founderTitle}</p>
            <div className="our-story-signature-wrap">
              <svg width="150" height="60" viewBox="0 0 150 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 34 C 28 14, 38 42, 42 42 C 48 42, 52 24, 58 28 C 62 32, 68 36, 72 32 C 78 28, 82 22, 88 28 C 92 32, 98 36, 102 34 C 108 30, 114 18, 124 24 C 132 28, 120 40, 112 44 C 102 48, 88 50, 116 46 C 130 44, 138 42, 144 42" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
