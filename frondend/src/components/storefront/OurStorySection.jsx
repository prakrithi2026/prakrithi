import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import defaultConfig from '../../data/defaultConfig';
import { isSvg, svgToDataUrl } from '../../utils/imageOptimizer';
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

function normalizeVideoUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function OurStorySection() {
  const { config } = useSiteConfig();
  const { ourStory, theme } = config;
  const [isPlaying, setIsPlaying] = useState(false);

  if (!ourStory) return null;

  const defaultImg = defaultConfig.ourStory?.image || '/images/our-story.png';
  const hasExplicitImage = ourStory.image !== undefined && ourStory.image !== null;
  const rawImg = hasExplicitImage ? ourStory.image : defaultImg;
  const storyImgSrc = rawImg ? (isSvg(rawImg) ? svgToDataUrl(rawImg) : rawImg) : '';
  const highResStoryImg = storyImgSrc ? getHighClarityImage(storyImgSrc) : '';
  const isUnsplash = typeof storyImgSrc === 'string' && storyImgSrc.includes('images.unsplash.com');
  const storySrcSet = isUnsplash && highResStoryImg
    ? [
        `${highResStoryImg.replace(/w=\d+/, 'w=800').replace(/q=\d+/, 'q=90')} 800w`,
        `${highResStoryImg.replace(/w=\d+/, 'w=1200').replace(/q=\d+/, 'q=92')} 1200w`,
        `${highResStoryImg.replace(/w=\d+/, 'w=1800').replace(/q=\d+/, 'q=95')} 1800w`,
        `${highResStoryImg.replace(/w=\d+/, 'w=2400').replace(/q=\d+/, 'q=95')} 2400w`,
      ].join(', ')
    : undefined;

  const rawVideoLink = ourStory.video ? ourStory.video.trim() : '';
  const hasVideoLink = Boolean(rawVideoLink);
  const isDirectUploadedVideo = rawVideoLink.startsWith('data:video') || rawVideoLink.startsWith('blob:');
  const videoUrl = normalizeVideoUrl(rawVideoLink);
  const isExternalVideo = /^https?:\/\//i.test(videoUrl) || videoUrl.startsWith('//');
  const hasMedia = hasVideoLink || Boolean(highResStoryImg);

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
            {isDirectUploadedVideo && isPlaying ? (
              <div className="our-story-video-wrapper">
                <video
                  src={rawVideoLink}
                  controls
                  autoPlay
                  playsInline
                  className="our-story-video"
                >
                  Your browser does not support HTML5 video.
                </video>
              </div>
            ) : isDirectUploadedVideo ? (
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
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="56" height="56" rx="28" fill="#FF1818"/>
                    <path d="M22 38.7633L40.0937 28.3817L22 18V38.7633Z" fill="white"/>
                  </svg>
                </div>
              </div>
            ) : hasVideoLink && isExternalVideo ? (
              /* When video link is added, clicking the video button / image goes to the video link */
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="our-story-image-wrapper our-story-image-wrapper--clickable"
                aria-label="Watch story video"
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
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="56" height="56" rx="28" fill="#FF1818"/>
                    <path d="M22 38.7633L40.0937 28.3817L22 18V38.7633Z" fill="white"/>
                  </svg>
                </div>
              </a>
            ) : highResStoryImg ? (
              <Link
                to={hasVideoLink ? videoUrl : '/our-story'}
                className="our-story-image-wrapper our-story-image-wrapper--clickable"
                aria-label="Read our Story"
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
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="56" height="56" rx="28" fill="#FF1818"/>
                    <path d="M22 38.7633L40.0937 28.3817L22 18V38.7633Z" fill="white"/>
                  </svg>
                </div>
              </Link>
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
            {mainParagraphText && !mainParagraphText.trim().endsWith('.') ? '.' : ''}{' '}
            <Link to="/our-story" className="our-story-link">
              Read our Story
            </Link>
          </p>

          <div className="our-story-founder">
            <h4 className="our-story-founder-name">{founderName}</h4>
            <p className="our-story-founder-title">{founderTitle}</p>
          </div>
        </div>

      </div>
    </section>
  );
}
