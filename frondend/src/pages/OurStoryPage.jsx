import { useEffect, useState } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import defaultConfig from '../data/defaultConfig';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import CartModal from '../components/storefront/CartModal';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import { getYouTubeEmbedUrl } from '../utils/imageOptimizer';
import './OurStoryPage.css';

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

export default function OurStoryPage() {
  const { config } = useSiteConfig();
  const { ourStory, theme } = config;
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    document.title = `Our Story - ${config.navbar?.brandName || 'Prakrithi'}`;
    window.scrollTo(0, 0);
  }, [config.navbar?.brandName]);

  const defaultImg = defaultConfig.ourStory?.image || '/images/our-story.png';
  const storyImgSrc = ourStory?.image || defaultImg;
  const rawVideoLink = ourStory?.video ? ourStory.video.trim() : '';
  const hasVideoLink = Boolean(rawVideoLink);
  const isDirectUploadedVideo = rawVideoLink.startsWith('data:video') || rawVideoLink.startsWith('blob:');
  const videoUrl = normalizeVideoUrl(rawVideoLink);
  const isExternalVideo = /^https?:\/\//i.test(videoUrl) || videoUrl.startsWith('//');

  const themeStyle = {
    '--primary': theme.primaryColor,
    '--bg': theme.backgroundColor,
    '--text': theme.textColor,
    '--heading': theme.headingColor,
    fontFamily: theme.fontFamily,
  };

  return (
    <div className="storefront" style={themeStyle}>
      <AnnouncementBar />
      <Navbar />

      <main className="our-story-page">
        <div className="our-story-header" style={{ backgroundColor: theme.secondaryColor || '#F5F5DC' }}>
          <div className="storefront-container">
            <h1 style={{ color: theme.headingColor }}>{ourStory?.title || 'Our Story'}</h1>
            {ourStory?.subtitle && <p className="our-story-header-subtitle" style={{ color: theme.primaryColor }}>{ourStory.subtitle}</p>}
          </div>
        </div>

        <div className="storefront-container">
          <div className="our-story-page-content">
            {isDirectUploadedVideo && isPlaying ? (
              <div className="our-story-hero-video-wrapper">
                <video
                  src={rawVideoLink}
                  controls
                  autoPlay
                  playsInline
                  className="our-story-hero-video"
                >
                  Your browser does not support HTML5 video.
                </video>
              </div>
            ) : isDirectUploadedVideo ? (
              <div
                className="our-story-hero-media"
                onClick={() => setIsPlaying(true)}
                role="button"
                tabIndex={0}
                aria-label="Play video"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsPlaying(true); }}
              >
                <img 
                  src={storyImgSrc} 
                  alt={ourStory?.title || 'Our Story'} 
                  className="our-story-hero-image"
                  loading="eager"
                  onError={(e) => {
                    if (defaultImg && e.currentTarget.src !== defaultImg) {
                      e.currentTarget.src = defaultImg;
                    }
                  }}
                />
                <div className="our-story-hero-play-overlay">
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="56" height="56" rx="28" fill="#FF1818"/>
                    <path d="M22 38.7633L40.0937 28.3817L22 18V38.7633Z" fill="white"/>
                  </svg>
                </div>
              </div>
            ) : hasVideoLink && isExternalVideo ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="our-story-hero-media"
                aria-label="Watch story video"
              >
                <img 
                  src={storyImgSrc} 
                  alt={ourStory?.title || 'Our Story'} 
                  className="our-story-hero-image"
                  loading="eager"
                  onError={(e) => {
                    if (defaultImg && e.currentTarget.src !== defaultImg) {
                      e.currentTarget.src = defaultImg;
                    }
                  }}
                />
                <div className="our-story-hero-play-overlay">
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="56" height="56" rx="28" fill="#FF1818"/>
                    <path d="M22 38.7633L40.0937 28.3817L22 18V38.7633Z" fill="white"/>
                  </svg>
                </div>
              </a>
            ) : (
              <div className="our-story-hero-media">
                <img 
                  src={storyImgSrc} 
                  alt={ourStory?.title || 'Our Story'} 
                  className="our-story-hero-image"
                  loading="eager"
                  onError={(e) => {
                    if (defaultImg && e.currentTarget.src !== defaultImg) {
                      e.currentTarget.src = defaultImg;
                    }
                  }}
                />
                <div className="our-story-hero-play-overlay">
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="56" height="56" rx="28" fill="#FF1818"/>
                    <path d="M22 38.7633L40.0937 28.3817L22 18V38.7633Z" fill="white"/>
                  </svg>
                </div>
              </div>
            )}
            
            <div className="our-story-full-text" style={{ color: theme.textColor }}>
              {ourStory?.content.split('\n').map((para, i) => {
                if (para.startsWith('## ')) {
                  return <h3 key={i} style={{ color: theme.headingColor }}>{para.replace('## ', '')}</h3>;
                }
                return para.trim() ? <p key={i}>{para}</p> : <div key={i} style={{ height: '24px' }} />;
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <CartModal />
    </div>
  );
}
