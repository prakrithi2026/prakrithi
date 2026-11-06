import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import defaultConfig from '../data/defaultConfig';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import CartModal from '../components/storefront/CartModal';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import './CategoriesPage.css';

export default function CategoriesPage() {
  const { config } = useSiteConfig();
  const theme = config.theme || {};
  const sectionConfig = config.shopByCategory || config.shopByConcern || {};

  const pageTitle = sectionConfig.title || 'Shop by Category';

  useEffect(() => {
    document.title = `${pageTitle} — ${config.navbar?.brandName || 'Prakrithi Naturals'}`;
  }, [pageTitle, config.navbar?.brandName]);

  const rawCategories = useMemo(() => {
    if (Array.isArray(sectionConfig.categories) && sectionConfig.categories.length > 0) {
      return sectionConfig.categories;
    }
    if (Array.isArray(config.shopByCategory?.categories) && config.shopByCategory.categories.length > 0) {
      return config.shopByCategory.categories;
    }
    if (Array.isArray(config.shopByConcern?.categories) && config.shopByConcern.categories.length > 0) {
      return config.shopByConcern.categories;
    }
    return defaultConfig.shopByCategory?.categories || [];
  }, [sectionConfig.categories, config.shopByCategory?.categories, config.shopByConcern?.categories]);

  const categories = useMemo(() => {
    return rawCategories
      .filter(
        (c) =>
          c &&
          c.image &&
          String(c.image).trim() !== '' &&
          (c.label || c.title || c.name) &&
          String(c.label || c.title || c.name).trim() !== ''
      )
      .map((c, i) => ({
        id: c.id || `category-${i}`,
        label: String(c.label || c.title || c.name).trim(),
        image: String(c.image).trim(),
        category: c.category || c.id,
        link: c.link || (c.category ? `/shop?category=${c.category}` : '/shop'),
      }));
  }, [rawCategories]);

  const themeStyle = {
    '--primary': theme.primaryColor || '#00433D',
    '--accent': theme.accentColor || '#C5F1A9',
    fontFamily: theme.fontFamily || "'Jost', sans-serif",
  };

  return (
    <div className="categories-page storefront" style={themeStyle}>
      <AnnouncementBar />
      <Navbar />

      <main className="categories-main">
        {/* Breadcrumb */}
        <div className="categories-breadcrumb">
          <Link to="/">Home</Link> <span>/</span>
          <span>Categories</span>
        </div>

        {/* Header */}
        <div className="categories-header">
          <div className="categories-header-title-block">
            <h1 className="categories-heading">{pageTitle}</h1>
            <p className="categories-count">
              Showing <strong>{categories.length}</strong> {categories.length === 1 ? 'category' : 'categories'}
            </p>
          </div>
          <Link to="/shop" className="categories-all-products-link">
            View All Products →
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="categories-body">
          {categories.length === 0 ? (
            <div className="categories-no-results">
              <div className="categories-no-results__icon">🌿</div>
              <h3>No categories found</h3>
              <p>Explore all available products in our store</p>
              <Link
                to="/shop"
                className="categories-reset-btn"
                style={{ backgroundColor: theme.primaryColor || '#00433D', color: '#fff' }}
              >
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="categories-grid">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={cat.link}
                  className="category-page-card"
                  aria-label={cat.label}
                >
                  <div className="category-page-card__image-box">
                    <img
                      src={cat.image}
                      alt={cat.label}
                      className="category-page-card__image"
                      loading="lazy"
                    />
                  </div>
                  <div className="category-page-card__overlay">
                    <h3 className="category-page-card__title">{cat.label}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <CartModal />
    </div>
  );
}
