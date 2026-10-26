import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { useSiteConfig } from '../context/SiteConfigContext';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import Navbar from '../components/storefront/Navbar';
import HeroSection from '../components/storefront/HeroSection';
import ShopByProduct from '../components/storefront/ShopByProduct';
import DeliverySection from '../components/storefront/DeliverySection';
import ShopByCategory from '../components/storefront/ShopByCategory';
import PressSection from '../components/storefront/PressSection';
import ReviewSection from '../components/storefront/ReviewSection';
import OurStorySection from '../components/storefront/OurStorySection';
import Footer from '../components/storefront/Footer';
import CartModal from '../components/storefront/CartModal';
import CustomSection from '../components/storefront/CustomSection';

const coreSectionComponents = {
  shopByCategory: ShopByCategory,
  shopByProduct: ShopByProduct,
  delivery: DeliverySection,
  press: PressSection,
  reviews: ReviewSection,
  ourStory: OurStorySection,
};

export default function HomePage() {
  const { config, isLoading } = useSiteConfig();
  const sections = Array.isArray(config.sections) ? config.sections : [];
  const theme = config.theme || {};
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get('mode') === 'preview';

  useEffect(() => {
    document.title = `${config.navbar?.brandName || 'Prakrithi'} — 100% Natural Products`;
  }, [config.navbar?.brandName]);

  // Apply theme CSS variables dynamically
  const themeStyle = {
    '--primary': theme.primaryColor,
    '--brand-green': theme.primaryColor,
    '--dark-green': theme.primaryColor,
    '--accent': theme.accentColor,
    '--bg': theme.backgroundColor,
    '--text': theme.textColor,
    '--heading': theme.headingColor,
    fontFamily: theme.fontFamily,
  };

  // Sort sections by order, deduplicate core sections, and render enabled ones
  const renderedCoreSections = new Set();
  const sortedSections = [...sections]
    .filter((s) => s && s.enabled)
    .sort((a, b) => a.order - b.order)
    .filter((s) => {
      const canonicalId = s.id === 'shopByConcern' ? 'shopByCategory' : s.id;
      if (coreSectionComponents[canonicalId]) {
        if (renderedCoreSections.has(canonicalId)) {
          return false;
        }
        renderedCoreSections.add(canonicalId);
      }
      return true;
    });

  return (
    <div className="storefront" style={themeStyle}>
      <AnnouncementBar />
      <Navbar />
      <HeroSection />

      {sortedSections.map((section) => {
        const canonicalId = section.id === 'shopByConcern' ? 'shopByCategory' : section.id;
        // Core section
        const CoreComponent = coreSectionComponents[canonicalId];
        if (CoreComponent) return <CoreComponent key={canonicalId} />;

        // Custom section (banner, textBlock, cta, etc.)
        return <CustomSection key={section.id} sectionData={section} />;
      })}

      <Footer />
      <CartModal />

      {/* Floating WhatsApp button */}
      {!isPreviewMode && (
        <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="whatsapp-float-link">
          <FaWhatsapp size={28} />
        </a>
      )}
    </div>
  );
}
