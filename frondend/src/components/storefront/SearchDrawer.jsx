import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import './SearchDrawer.css';

const formatPrice = (price) => {
  const num = parseFloat(price) || 0;
  return num % 1 === 0
    ? num.toLocaleString('en-IN')
    : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function SearchDrawer({ isOpen, onClose }) {
  const { config } = useSiteConfig();
  const { products = [], theme = {} } = config;
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);

  // Popular search suggestions
  const popularSearches = [
    'Best Sellers',
    'Kerala Spices',
    'Snacks',
    'Honey',
    'Tea & Coffee',
    'Cardamom',
    'Black Pepper'
  ];

  // Lock body scroll and auto-focus when drawer opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter products based on query
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults = trimmedQuery
    ? products.filter((p) => {
        const nameMatch = p.name?.toLowerCase().includes(trimmedQuery);
        const descMatch = p.description?.toLowerCase().includes(trimmedQuery);
        const catMatch = p.category?.toLowerCase().includes(trimmedQuery);
        const tagMatch = Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(trimmedQuery));
        return nameMatch || descMatch || catMatch || tagMatch;
      })
    : [];

  // Featured / popular products for empty state
  const trendingProducts = products.slice(0, 4);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trimmedQuery) {
      navigate(`/shop?q=${encodeURIComponent(trimmedQuery)}`);
      onClose();
    }
  };

  const handlePopularClick = (term) => {
    navigate(`/shop?q=${encodeURIComponent(term)}`);
    onClose();
  };

  return (
    <div
      className="search-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search drawer"
    >
      <div className="search-drawer-panel">
        {/* ── Top Search Input Header (Matches reference image) ── */}
        <form onSubmit={handleSubmit} className="search-drawer-header">
          <div className="search-drawer-icon-wrap" aria-hidden="true">
            <svg
              className="search-drawer-search-icon"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 20L16.2 16.2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="search"
            className="search-drawer-input"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />

          {searchQuery && (
            <button
              type="button"
              className="search-drawer-clear-btn"
              onClick={() => {
                setSearchQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search input"
            >
              &times;
            </button>
          )}

          <button
            type="button"
            className="search-drawer-close-btn"
            onClick={onClose}
            aria-label="Close search"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </form>

        {/* ── Drawer Body ── */}
        <div className="search-drawer-body">
          {/* STATE 1: Empty search - show popular searches & trending items */}
          {!trimmedQuery && (
            <div className="search-drawer-empty-state">
              <div className="search-drawer-section">
                <h4 className="search-drawer-section-title">Popular Searches</h4>
                <div className="search-drawer-tags">
                  {popularSearches.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      className="search-drawer-tag-pill"
                      onClick={() => handlePopularClick(term)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {trendingProducts.length > 0 && (
                <div className="search-drawer-section">
                  <h4 className="search-drawer-section-title">Trending Products</h4>
                  <div className="search-drawer-trending-list">
                    {trendingProducts.map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        className="search-drawer-product-row"
                        onClick={onClose}
                      >
                        <div className="search-drawer-product-thumb">
                          {p.image ? (
                            <img src={p.image} alt={p.name} loading="lazy" />
                          ) : (
                            <span className="search-drawer-emoji-fallback">🌿</span>
                          )}
                        </div>
                        <div className="search-drawer-product-info">
                          <p className="search-drawer-product-name">{p.name}</p>
                          <div className="search-drawer-product-price">
                            <span className="current-price">₹{formatPrice(p.salePrice || p.price)}</span>
                            {p.salePrice && (
                              <span className="original-price">₹{formatPrice(p.price)}</span>
                            )}
                          </div>
                        </div>
                        <svg className="search-drawer-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE 2: Typing with results */}
          {trimmedQuery && searchResults.length > 0 && (
            <div className="search-drawer-results-wrap">
              <div className="search-drawer-results-count">
                <span>Products ({searchResults.length})</span>
              </div>
              <div className="search-drawer-results-list">
                {searchResults.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="search-drawer-product-row"
                    onClick={onClose}
                  >
                    <div className="search-drawer-product-thumb">
                      {p.image ? (
                        <img src={p.image} alt={p.name} loading="lazy" />
                      ) : (
                        <span className="search-drawer-emoji-fallback">🌿</span>
                      )}
                    </div>
                    <div className="search-drawer-product-info">
                      {p.category && (
                        <span className="search-drawer-product-cat">{p.category}</span>
                      )}
                      <p className="search-drawer-product-name">{p.name}</p>
                      <div className="search-drawer-product-price">
                        <span className="current-price">₹{formatPrice(p.salePrice || p.price)}</span>
                        {p.salePrice && (
                          <span className="original-price">₹{formatPrice(p.price)}</span>
                        )}
                      </div>
                    </div>
                    <svg className="search-drawer-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* STATE 3: Typing with NO results */}
          {trimmedQuery && searchResults.length === 0 && (
            <div className="search-drawer-no-results">
              <div className="search-drawer-no-results-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </div>
              <h5>No results found for "{searchQuery}"</h5>
              <p>Check the spelling or try searching for another term like spices, honey, or tea.</p>
              <div className="search-drawer-tags" style={{ justifyContent: 'center', marginTop: '16px' }}>
                {popularSearches.slice(0, 4).map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    className="search-drawer-tag-pill"
                    onClick={() => handlePopularClick(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Link: See all results ── */}
        {trimmedQuery && searchResults.length > 0 && (
          <div className="search-drawer-footer">
            <button
              type="button"
              className="search-drawer-view-all-btn"
              onClick={() => {
                navigate(`/shop?q=${encodeURIComponent(trimmedQuery)}`);
                onClose();
              }}
            >
              View all results for "{searchQuery}"
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
