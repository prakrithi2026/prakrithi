import { useEffect } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import CartModal from '../components/storefront/CartModal';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import './OurStoryPage.css';

export default function OurStoryPage() {
  const { config } = useSiteConfig();
  const { ourStory, theme } = config;

  useEffect(() => {
    document.title = `Our Story - ${config.navbar?.brandName || 'Prakrithi'}`;
    window.scrollTo(0, 0);
  }, [config.navbar?.brandName]);

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
            {ourStory?.image && (
              <img src={ourStory.image} alt="Our Story" className="our-story-hero-image" />
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
