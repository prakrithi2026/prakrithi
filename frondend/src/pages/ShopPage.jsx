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

export default function ShopPage() {
  const { config } = useSiteConfig();
  const { products, categories, theme } = config;
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read all URL params
  const queryParam    = searchParams.get('q')        || '';
  const tagParam      = searchParams.get('tag')      || '';
  const categoryParam = searchParams.get('category') || '';

  const [search,         setSearch]         = useState(queryParam);
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'all');
  const [activeTag,      setActiveTag]      = useState(tagParam      || 'all');
  const [sortBy,         setSortBy]         = useState('default');

  useEffect(() => {
    document.title = 'Shop All Products — Prakrithi Naturals';
  }, []);

  // Sync URL params → state whenever the URL changes (e.g. navbar link clicked)
  useEffect(() => {
    setSearch(queryParam);
    setActiveCategory(categoryParam || 'all');
    setActiveTag(tagParam || 'all');
  }, [queryParam, tagParam, categoryParam]);

  const allTags = [
    { id: 'all',         label: 'All' },
    { id: 'on-sale',     label: 'On Sale 🔥' },
    { id: 'new-arrival', label: 'New Arrivals ✨' },
    { id: 'best-seller', label: 'Best Sellers 🏆' },
  ];

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);
    if (activeTag      !== 'all') list = list.filter(p => p.tags?.includes(activeTag));

    switch (sortBy) {
      case 'price-asc':  return [...list].sort((a, b) => parseFloat(a.salePrice || a.price) - parseFloat(b.salePrice || b.price));
      case 'price-desc': return [...list].sort((a, b) => parseFloat(b.salePrice || b.price) - parseFloat(a.salePrice || a.price));
      case 'rating':     return [...list].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
      case 'newest':     return [...list.filter(p => p.tags?.includes('new-arrival')), ...list.filter(p => !p.tags?.includes('new-arrival'))];
      default:           return list;
    }
  }, [products, search, activeCategory, activeTag, sortBy]);

  // Helpers that keep ALL params in sync
  const buildParams = (overrides = {}) => {
    const base = { q: search, category: activeCategory, tag: activeTag };
    const merged = { ...base, ...overrides };
    const out = {};
    if (merged.q       && merged.q       !== '')    out.q        = merged.q;
    if (merged.category && merged.category !== 'all') out.category = merged.category;
    if (merged.tag      && merged.tag      !== 'all') out.tag      = merged.tag;
    return out;
  };

  const handleSearchChange   = v   => { setSearch(v);   setSearchParams(buildParams({ q: v })); };
  const handleCategoryChange = cat => { setActiveCategory(cat); setSearchParams(buildParams({ category: cat })); };
  const handleTagChange      = tag => { setActiveTag(tag);      setSearchParams(buildParams({ tag })); };
  const handleClear = () => { setActiveCategory('all'); setActiveTag('all'); setSearch(''); setSortBy('default'); setSearchParams({}); };

  // Dynamic heading based on active filter
  const tagLabels = { 'on-sale': 'Sale Items 🔥', 'new-arrival': 'New Arrivals ✨', 'best-seller': 'Best Sellers 🏆' };
  const catObj = categories?.find(c => c.id === activeCategory || c.category_id === activeCategory);
  const pageHeading =
    search          ? `Results for "${search}"` :
    activeTag !== 'all'      ? tagLabels[activeTag] || 'Products' :
    activeCategory !== 'all' ? catObj?.label || activeCategory :
    'All Products';

  const themeStyle = {
    '--primary': theme.primaryColor,
    '--accent':  theme.accentColor,
    fontFamily:  theme.fontFamily,
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
          {(activeTag !== 'all' || activeCategory !== 'all' || search) && (
            <><span>/</span><span>{pageHeading}</span></>
          )}
        </div>

        {/* Header */}
        <div className="shop-header">
          <div>
            <h1 className="shop-heading">{pageHeading}</h1>
            <p className="shop-count">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
          </div>
          <div className="shop-controls">
            <div className="shop-search-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="search"
                className="shop-search"
                placeholder="Search products..."
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
              />
            </div>
            <select className="shop-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="shop-body">
          {/* Sidebar Filters */}
          <aside className="shop-sidebar">
            <div className="shop-filter-group">
              <h4>Category</h4>
              <button
                className={`shop-filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
                style={activeCategory === 'all' ? { backgroundColor: theme.primaryColor, color: '#fff', borderColor: theme.primaryColor } : { borderColor: theme.primaryColor, color: theme.primaryColor }}
                onClick={() => handleCategoryChange('all')}
              >All Categories</button>
              {categories.map(cat => (
                <button
                  key={cat.id || cat.category_id}
                  className={`shop-filter-btn ${activeCategory === (cat.id || cat.category_id) ? 'active' : ''}`}
                  style={activeCategory === (cat.id || cat.category_id) ? { backgroundColor: theme.primaryColor, color: '#fff', borderColor: theme.primaryColor } : { borderColor: theme.primaryColor, color: theme.primaryColor }}
                  onClick={() => handleCategoryChange(cat.id || cat.category_id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="shop-filter-group">
              <h4>Filter by Tag</h4>
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  className={`shop-filter-btn ${activeTag === tag.id ? 'active' : ''}`}
                  style={activeTag === tag.id ? { backgroundColor: theme.primaryColor, color: '#fff', borderColor: theme.primaryColor } : { borderColor: theme.primaryColor, color: theme.primaryColor }}
                  onClick={() => handleTagChange(tag.id)}
                >
                  {tag.label}
                </button>
              ))}
            </div>
            <button className="shop-reset-btn" onClick={handleClear}>
              Clear All Filters
            </button>
          </aside>

          {/* Product Grid */}
          <section className="shop-grid-area">
            {filtered.length === 0 ? (
              <div className="shop-no-results">
                <div className="shop-no-results__icon">🔍</div>
                <h3>No products found</h3>
                <p>Try adjusting your search or filters</p>
                <button className="shop-reset-btn" onClick={handleClear}>Clear Filters</button>
              </div>
            ) : (
              <div className="shop-grid">
                {filtered.map(product => (
                  <div key={product.id} className="shop-card">
                    {product.badge && (
                      <span className="shop-card__badge" style={{ backgroundColor: product.badgeColor || theme.primaryColor, color: product.badgeTextColor || '#fff' }}>
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
                          <img src={product.image} alt={product.name} />
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
                          style={{ backgroundColor: theme.primaryColor }}
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
