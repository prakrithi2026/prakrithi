import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import defaultConfig from '../../data/defaultConfig';
import { svgToDataUrl, getYouTubeEmbedUrl } from '../../utils/imageOptimizer';
import './OurStorySection.css';

function getHighClarityImage(src) {
  if (!src || typeof src !== 'string') return src;
  if (src.includes('images.unsplash.com')) {
    let high = src;
    if (high.includes('w=')) {
      high = high.replace(/w=\d+/, 'w=1800');
    } else {
      high += '&w=1800';
    }
    if (high.includes('q=')) {
      high = high.replace(/q=\d+/, 'q=95');
    } else {
      high += '&q=95';
    }
    if (high.includes('fm=webp')) {
      high = high.replace('fm=webp', 'auto=format');
    }
    return high;
  }
  return src;
}

export default function OurStorySection() {
  const { config } = useSiteConfig();
  const { ourStory, theme } = config;
  const [isPlaying, setIsPlaying] = useState(false);

  if (!ourStory) return null;

  const defaultImg = defaultConfig.ourStory?.image || '/images/our-story.png';
  const storyImgSrc = ourStory.image ? svgToDataUrl(ourStory.image) : defaultImg;
  const highResStoryImg = getHighClarityImage(storyImgSrc);
  const isUnsplash = typeof storyImgSrc === 'string' && storyImgSrc.includes('images.unsplash.com');
  const storySrcSet = isUnsplash
    ? [
        `${highResStoryImg.replace(/w=\d+/, 'w=800').replace(/q=\d+/, 'q=90')} 800w`,
        `${highResStoryImg.replace(/w=\d+/, 'w=1200').replace(/q=\d+/, 'q=92')} 1200w`,
        `${highResStoryImg.replace(/w=\d+/, 'w=1800').replace(/q=\d+/, 'q=95')} 1800w`,
        `${highResStoryImg.replace(/w=\d+/, 'w=2400').replace(/q=\d+/, 'q=95')} 2400w`,
      ].join(', ')
    : undefined;

  const hasVideo = Boolean(ourStory.video);
  const isVideoMode = ourStory.mediaType === 'video' || (hasVideo && ourStory.mediaType !== 'image');
  const isYouTubeOrVimeo = hasVideo && (
    ourStory.video.includes('youtube.com') ||
    ourStory.video.includes('youtu.be') ||
    ourStory.video.includes('vimeo.com')
  );
  const embedUrl = isYouTubeOrVimeo ? getYouTubeEmbedUrl(ourStory.video) : '';
  const hasMedia = isVideoMode ? hasVideo || Boolean(highResStoryImg) : Boolean(highResStoryImg);

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
                    src={highResStoryImg}
                    srcSet={storySrcSet}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    alt={ourStory.title || 'Our Story'}
                    className="our-story-img"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    width="600"
                    height="400"
                    onError={(e) => {
                      if (defaultImg && e.currentTarget.src !== defaultImg) {
                        e.currentTarget.src = defaultImg;
                      }
                    }}
                  />
                  <div className="our-story-play-overlay">
                    <svg width="50" height="50" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="30" cy="30" r="30" fill="#EF1C1C" />
                      <path d="M40 30L24 40V20L40 30Z" fill="white" />
                    </svg>
                  </div>
                </div>
              )
            ) : highResStoryImg ? (
              <div className="our-story-image-wrapper">
                <img
                  src={highResStoryImg}
                  srcSet={storySrcSet}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  alt={ourStory.title || 'Our Story'}
                  className="our-story-img"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  width="600"
                  height="400"
                  onError={(e) => {
                    if (defaultImg && e.currentTarget.src !== defaultImg) {
                      e.currentTarget.src = defaultImg;
                    }
                  }}
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Right Column: Content matching uploaded design */}
        <div className="our-story-text-col">
          <h2 className="our-story-heading">
            {ourStory.title}
          </h2>
          <p className="our-story-description">
            {mainParagraphText}
          </p>

          <div className="our-story-founder">
            <h4 className="our-story-founder-name">{founderName}</h4>
            <p className="our-story-founder-title">{founderTitle}</p>
          </div>

          <Link to="/our-story" className="our-story-btn">
            Read our Story
          </Link>
        </div>

      </div>
    </section>
  );
}
