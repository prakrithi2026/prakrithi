import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import CartModal from '../components/storefront/CartModal';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import './ShopPage.css';

const SORT_OPTIONS = [
  { value: 'default', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'New Arrivals' },
];

const ALL_TAGS = [
  { id: 'all', label: 'All' },
  { id: 'on-sale', label: 'On Sale 🔥' },
  { id: 'new-arrival', label: 'New Arrivals ✨' },
  { id: 'best-seller', label: 'Best Sellers 🏆' },
];

export default function ShopPage() {
  const { config } = useSiteConfig();
  const products = Array.isArray(config.products) ? config.products : [];
  const rawCategories = Array.isArray(config.categories) ? config.categories : [];
  const theme = config.theme || {};
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL params
  const tagParam      = searchParams.get('tag')      || '';
  const categoryParam = searchParams.get('category') || '';

  const [activeCategory, setActiveCategory] = useState(categoryParam || 'all');
  const [activeTag,      setActiveTag]      = useState(tagParam      || 'all');
  const [sortBy,         setSortBy]         = useState('default');

  useEffect(() => {
    document.title = 'Shop All Products — Prakrithi Naturals';
  }, []);

  // Sync URL params → state whenever the URL changes (e.g. navbar link clicked)
  useEffect(() => {
    setActiveCategory(categoryParam || 'all');
    setActiveTag(tagParam || 'all');
  }, [tagParam, categoryParam]);

  // Normalized list of categories with 'All Categories' first
  const categoryList = useMemo(() => {
    const filteredCats = rawCategories.filter(c => (c.id || c.category_id) !== 'all');
    return [{ id: 'all', label: 'All Categories' }, ...filteredCats];
  }, [rawCategories]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);
    if (activeTag      !== 'all') list = list.filter(p => p.tags?.includes(activeTag));

    switch (sortBy) {
      case 'price-asc':  return [...list].sort((a, b) => parseFloat(a.salePrice || a.price) - parseFloat(b.salePrice || b.price));
      case 'price-desc': return [...list].sort((a, b) => parseFloat(b.salePrice || b.price) - parseFloat(a.salePrice || a.price));
      case 'rating':     return [...list].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
      case 'newest':     return [...list.filter(p => p.tags?.includes('new-arrival')), ...list.filter(p => !p.tags?.includes('new-arrival'))];
      default:           return list;
    }
  }, [products, activeCategory, activeTag, sortBy]);

  // Helpers that keep URL params in sync
  const buildParams = (overrides = {}) => {
    const base = { category: activeCategory, tag: activeTag };
    const merged = { ...base, ...overrides };
    const out = {};
    if (merged.category && merged.category !== 'all') out.category = merged.category;
    if (merged.tag      && merged.tag      !== 'all') out.tag      = merged.tag;
    return out;
  };

  const handleCategoryChange = cat => { setActiveCategory(cat); setSearchParams(buildParams({ category: cat })); };
  const handleTagChange      = tag => { setActiveTag(tag);      setSearchParams(buildParams({ tag })); };
  const handleSortChange     = s   => { setSortBy(s); };
  const handleClear          = ()  => { setActiveCategory('all'); setActiveTag('all'); setSortBy('default'); setSearchParams({}); };

  // Dynamic heading based on active filter
  const tagLabels = { 'on-sale': 'Sale Items 🔥', 'new-arrival': 'New Arrivals ✨', 'best-seller': 'Best Sellers 🏆' };
  const catObj = rawCategories?.find(c => (c.id || c.category_id) === activeCategory);
  const activeCatLabel = catObj?.label || (activeCategory !== 'all' ? activeCategory : null);

  const pageHeading =
    activeTag !== 'all'      ? tagLabels[activeTag] || 'Products' :
    activeCategory !== 'all' ? activeCatLabel :
    'All Products';

  const themeStyle = {
    '--primary': theme.primaryColor || '#00472A',
    '--accent':  theme.accentColor  || '#BDD681',
    fontFamily:  theme.fontFamily   || "'Jost', sans-serif",
  };

  return (
    <div className="shop-page storefront" style={themeStyle}>
      <AnnouncementBar />
      <Navbar />

      <main className="shop-main">
        {/* Breadcrumb */}
        <div className="shop-breadcrumb">
          <Link to="/">Home</Link> <span>/</span>
          <Link to="/shop">Shop</Link>
          {(activeTag !== 'all' || activeCategory !== 'all') && (
            <><span>/</span><span>{pageHeading}</span></>
          )}
        </div>

        {/* Header: Title & Count on Left, Controls on Right */}
        <div className="shop-header">
          <div className="shop-header-title-block">
            <h1 className="shop-heading">{pageHeading}</h1>
            <p className="shop-count">
              Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'product' : 'products'}
            </p>
          </div>

          {/* Right Side Controls: Category, Filter, Sort, Clear Filter */}
          <div className="shop-header-controls">
            {/* Category Dropdown */}
            <select
              id="shop-category-select"
              className="shop-select-btn"
              value={activeCategory}
              onChange={e => handleCategoryChange(e.target.value)}
              aria-label="Category"
            >
              <option value="all">Category</option>
              {categoryList.filter(c => (c.id || c.category_id) !== 'all').map(cat => {
                const catId = cat.id || cat.category_id;
                return (
                  <option key={catId} value={catId}>
                    {cat.label}
                  </option>
                );
              })}
            </select>

            {/* Filter Dropdown */}
            <select
              id="shop-tag-select"
              className="shop-select-btn"
              value={activeTag}
              onChange={e => handleTagChange(e.target.value)}
              aria-label="Filter"
            >
              <option value="all">Filter</option>
              {ALL_TAGS.filter(t => t.id !== 'all').map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.label}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              id="shop-sort-select"
              className="shop-select-btn"
              value={sortBy}
              onChange={e => handleSortChange(e.target.value)}
              aria-label="Sort"
            >
              <option value="default">Sort</option>
              {SORT_OPTIONS.filter(o => o.value !== 'default').map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* Clear Filter Option */}
            <button
              type="button"
              className="shop-clear-btn"
              onClick={handleClear}
              title="Clear all filters"
            >
              Clear Filter
            </button>
          </div>
        </div>

        {/* Product Grid Area (Full Width) */}
        <div className="shop-body">
          <section className="shop-grid-area">
            {filtered.length === 0 ? (
              <div className="shop-no-results">
                <div className="shop-no-results__icon">🔍</div>
                <h3>No products found</h3>
                <p>Try adjusting your category or filter options</p>
                <button
                  className="shop-reset-btn"
                  onClick={handleClear}
                  style={{ backgroundColor: theme.primaryColor || '#00472A', color: '#fff', borderColor: theme.primaryColor || '#00472A' }}
                >
                  Clear Filter
                </button>
              </div>
            ) : (
              <div className="shop-grid">
                {filtered.map(product => (
                  <div key={product.id} className="shop-card">
                    {product.badge && (
                      <span className="shop-card__badge" style={{ backgroundColor: product.badgeColor || theme.primaryColor || '#00472A', color: product.badgeTextColor || '#fff' }}>
                        {product.badge}
                      </span>
                    )}
                    <button
                      className={`shop-card__wish ${isWishlisted(product.id) ? 'active' : ''}`}
                      onClick={() => toggleWishlist(product)}
                      aria-label="Toggle wishlist"
                    >
                      {isWishlisted(product.id) ? '❤️' : '🤍'}
                    </button>
                    <Link to={`/product/${product.id}`} className="shop-card__image-link">
                      <div className="shop-card__img-wrap">
                        {product.image ? (
                          <img src={product.image} alt={product.name} loading="lazy" />
                        ) : (
                          <div className="shop-card__img-placeholder">🌿</div>
                        )}
                      </div>
                    </Link>
                    <div className="shop-card__body">
                      <Link to={`/product/${product.id}`} className="shop-card__name">{product.name}</Link>
                      <p className="shop-card__desc">{product.description}</p>
                      <div className="shop-card__rating">
                        <span>{'★'.repeat(Math.round(product.rating || 5))}</span>
                        <span className="shop-card__rating-score">{product.rating}</span>
                        <span className="shop-card__reviews">({product.reviews})</span>
                      </div>
                      <div className="shop-card__bottom">
                        <div className="shop-card__price">
                          ₹{parseFloat(product.salePrice || product.price).toLocaleString('en-IN')}
                          {product.salePrice && <span className="shop-card__old-price">₹{parseFloat(product.price).toLocaleString('en-IN')}</span>}
                        </div>
                        <button
                          className="shop-card__add"
                          style={{ backgroundColor: theme.primaryColor || '#00472A' }}
                          onClick={() => addToCart(product)}
                        >
                          + Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
      <CartModal />
    </div>
  );
}
