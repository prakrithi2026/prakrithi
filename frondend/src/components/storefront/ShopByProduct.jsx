import { useState, useRef, useCallback, useEffect } from 'react';
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
  const [canScroll, setCanScroll] = useState(false);
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

  const getCardStep = useCallback(() => {
    if (!scrollRef.current) return 233;
    const firstCard = scrollRef.current.querySelector('.product-card');
    if (!firstCard) return 233;
    const cardWidth = firstCard.offsetWidth;
    const row = scrollRef.current.querySelector('.products-row');
    let gap = 20;
    if (row && typeof window !== 'undefined' && window.getComputedStyle) {
      const rowGap = parseFloat(window.getComputedStyle(row).gap);
      if (!isNaN(rowGap) && rowGap > 0) gap = rowGap;
    }
    return Math.max(1, cardWidth + gap);
  }, []);

  // Check whether the products container can scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScrollable = () => {
      if (filteredProducts.length === 0) {
        setCanScroll(false);
        setScrollRatio(0);
        return;
      }
      const maxScroll = el.scrollWidth - el.clientWidth;
      const scrollable = maxScroll > 1;
      setCanScroll(scrollable);
      if (!scrollable) {
        setScrollRatio(0);
      } else {
        const step = getCardStep();
        const cardsScrolled = el.scrollLeft / step;
        const ratio = Math.min(1, Math.max(0, cardsScrolled / 10));
        setScrollRatio(ratio);
      }
    };

    checkScrollable();

    const ro = new ResizeObserver(checkScrollable);
    ro.observe(el);
    window.addEventListener('resize', checkScrollable);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', checkScrollable);
    };
  }, [filteredProducts, getCardStep]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) {
      setScrollRatio(0);
      return;
    }
    const step = getCardStep();
    const cardsScrolled = el.scrollLeft / step;
    const ratio = Math.min(1, Math.max(0, cardsScrolled / 10));
    setScrollRatio(ratio);
  }, [getCardStep]);

  const handleFilterClick = (filterId) => {
    setActiveFilter(filterId);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
    setScrollRatio(0);
  };

  const handleTrackPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (!canScroll || filteredProducts.length === 0 || !scrollRef.current || !trackRef.current) return;

    const el = scrollRef.current;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) return;

    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;

    isDraggingTrackRef.current = true;
    if (trackRef.current) {
      trackRef.current.classList.add('is-dragging');
    }

    const step = getCardStep();

    const applyPointerPosition = (clientX) => {
      const curRect = trackRef.current ? trackRef.current.getBoundingClientRect() : rect;
      if (curRect.width <= 0) return;
      const clickFraction = Math.max(0, Math.min(1, (clientX - curRect.left) / curRect.width));
      const minRatio = INITIAL_FILL_PERCENT / 100;

      let targetCards = 0;
      if (clickFraction > minRatio) {
        const fractionInRemaining = (clickFraction - minRatio) / (1 - minRatio);
        targetCards = fractionInRemaining * 10;
      }

      const targetScroll = Math.max(0, Math.min(maxScroll, targetCards * step));
      el.scrollLeft = targetScroll;
      const cardsScrolled = targetScroll / step;
      setScrollRatio(Math.min(1, Math.max(0, cardsScrolled / 10)));
    };

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    applyPointerPosition(clientX);

    const handlePointerMove = (moveEvent) => {
      if (!isDraggingTrackRef.current || !trackRef.current || !scrollRef.current) return;
      if (moveEvent.cancelable) {
        moveEvent.preventDefault();
      }
      const curX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      applyPointerPosition(curX);
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
    if (!canScroll || filteredProducts.length === 0 || !scrollRef.current) return;

    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    if (maxScroll <= 1) return;

    isDraggingCardsRef.current = true;
    cardHasMovedRef.current = false;
    cardStartXRef.current = e.clientX;
    cardStartScrollRef.current = scrollRef.current.scrollLeft;
    scrollRef.current.classList.add('is-dragging');

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

  const fillWidth = canScroll && filteredProducts.length > 0
    ? INITIAL_FILL_PERCENT + scrollRatio * (100 - INITIAL_FILL_PERCENT)
    : (filteredProducts.length > 0 ? INITIAL_FILL_PERCENT : 0);

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
          className={`products-scroll-wrapper ${canScroll ? 'can-scroll' : 'no-scroll'}`}
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={handleCardsMouseDown}
          onClickCapture={handleCardsClickCapture}
        >
          <div className="products-row">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="no-products-msg" style={{ padding: '24px 0', color: '#666' }}>
                No products available in this category.
              </div>
            )}
          </div>
        </div>

        {/* Progress + View All */}
        <div className="progress-viewall-row">
          <div
            className={`scroll-progress ${canScroll ? 'can-scroll' : 'no-scroll'}`}
            ref={trackRef}
            onMouseDown={handleTrackPointerDown}
            onTouchStart={handleTrackPointerDown}
            role="progressbar"
            aria-valuenow={Math.round(fillWidth)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={canScroll ? 0 : -1}
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
