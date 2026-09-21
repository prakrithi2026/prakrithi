import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import ProductCard from './ProductCard';
import './ShopByProduct.css';

const INITIAL_FILL_PERCENT = 25;

export default function ShopByProduct() {
  const { config } = useSiteConfig();
  const products = Array.isArray(config.products) ? config.products : [];
  const theme = config.theme || {};
  const [activeFilter, setActiveFilter] = useState('all');
  const [scrollRatio, setScrollRatio] = useState(0);
  const scrollRef = useRef(null);
  const trackRef = useRef(null);

  const isDraggingTrackRef = useRef(false);
  const isDraggingCardsRef = useRef(false);
  const cardStartXRef = useRef(0);
  const cardStartScrollRef = useRef(0);
  const cardHasMovedRef = useRef(false);

  const baseProducts = products.filter((p) => !p.tags?.includes('concern'));
  const displayProducts = baseProducts.length > 0 ? baseProducts : products;

  const allFilters = [
    { id: 'all', label: 'All' },
    { id: 'on-sale', label: 'On Sale!' },
    { id: 'new-arrival', label: 'New Arrivals' },
    { id: 'best-seller', label: 'Best Seller' },
  ];

  const availableFilters = allFilters.filter(
    (f) => f.id === 'all' || displayProducts.some((p) => p.tags && p.tags.includes(f.id))
  );

  const filteredProducts =
    activeFilter === 'all'
      ? displayProducts
      : displayProducts.filter((p) => p.tags && p.tags.includes(activeFilter));

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const ratio = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    setScrollRatio(Math.max(0, Math.min(1, ratio)));
  }, []);

  const handleFilterClick = (filterId) => {
    setActiveFilter(filterId);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
    setScrollRatio(0);
  };

  const updateScrollFromPointer = useCallback((clientX) => {
    if (!trackRef.current || !scrollRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;

    const clickFraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const minRatio = INITIAL_FILL_PERCENT / 100;

    let targetRatio = 0;
    if (clickFraction > minRatio) {
      targetRatio = (clickFraction - minRatio) / (1 - minRatio);
    }
    targetRatio = Math.max(0, Math.min(1, targetRatio));

    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    if (maxScroll > 0) {
      scrollRef.current.scrollLeft = targetRatio * maxScroll;
    }
    setScrollRatio(targetRatio);
  }, []);

  const handleTrackPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    isDraggingTrackRef.current = true;
    if (trackRef.current) {
      trackRef.current.classList.add('is-dragging');
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    updateScrollFromPointer(clientX);

    const handlePointerMove = (moveEvent) => {
      if (!isDraggingTrackRef.current) return;
      if (moveEvent.cancelable) {
        moveEvent.preventDefault();
      }
      const curX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      updateScrollFromPointer(curX);
    };

    const handlePointerUp = () => {
      isDraggingTrackRef.current = false;
      if (trackRef.current) {
        trackRef.current.classList.remove('is-dragging');
      }
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchcancel', handlePointerUp);
  };

  const handleCardsMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button')) return;

    isDraggingCardsRef.current = true;
    cardHasMovedRef.current = false;
    cardStartXRef.current = e.clientX;
    cardStartScrollRef.current = scrollRef.current ? scrollRef.current.scrollLeft : 0;
    if (scrollRef.current) {
      scrollRef.current.classList.add('is-dragging');
    }

    const onCardsMouseMove = (moveEvent) => {
      if (!isDraggingCardsRef.current || !scrollRef.current) return;
      const deltaX = moveEvent.clientX - cardStartXRef.current;
      if (Math.abs(deltaX) > 5) {
        cardHasMovedRef.current = true;
      }
      scrollRef.current.scrollLeft = cardStartScrollRef.current - deltaX;
    };

    const onCardsMouseUp = () => {
      isDraggingCardsRef.current = false;
      if (scrollRef.current) {
        scrollRef.current.classList.remove('is-dragging');
      }
      window.removeEventListener('mousemove', onCardsMouseMove);
      window.removeEventListener('mouseup', onCardsMouseUp);
    };

    window.addEventListener('mousemove', onCardsMouseMove);
    window.addEventListener('mouseup', onCardsMouseUp);
  };

  const handleCardsClickCapture = (e) => {
    if (cardHasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      cardHasMovedRef.current = false;
    }
  };

  const fillWidth = INITIAL_FILL_PERCENT + scrollRatio * (100 - INITIAL_FILL_PERCENT);

  return (
    <section className="shop-section">
      <div className="section-container">
        <h2 className="section-title">Shop by Product</h2>

        {availableFilters.length > 1 && (
          <div className="filter-tabs">
            {availableFilters.map((f) => (
              <button
                key={f.id}
                className={`filter-btn ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => handleFilterClick(f.id)}
                style={
                  activeFilter === f.id
                    ? { backgroundColor: theme.primaryColor, color: '#fff', borderColor: theme.primaryColor }
                    : { borderColor: theme.primaryColor, color: theme.primaryColor }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div
          className="products-scroll-wrapper"
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={handleCardsMouseDown}
          onClickCapture={handleCardsClickCapture}
        >
          <div className="products-row">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Progress + View All */}
        <div className="progress-viewall-row">
          <div
            className="scroll-progress"
            ref={trackRef}
            onMouseDown={handleTrackPointerDown}
            onTouchStart={handleTrackPointerDown}
            role="progressbar"
            aria-valuenow={Math.round(fillWidth)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
          >
            <div
              className="scroll-progress-bar"
              style={{
                width: `${fillWidth}%`,
                backgroundColor: theme.primaryColor || '#00472A',
              }}
            />
          </div>
          <div className="view-all-row" style={{ borderColor: theme.primaryColor }}>
            <Link to="/shop" className="btn-view-all" style={{ color: theme.primaryColor }}>
              View All →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
