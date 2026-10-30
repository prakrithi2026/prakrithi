import { useState, useRef, useEffect, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import ProductLikeIcon from './ProductLikeIcon';
import './ProductImageGallery.css';

/**
 * ProductImageGallery:
 * Interactive, touch-swipeable and mouse-draggable multi-image gallery
 * for the storefront product details page.
 */
export default function ProductImageGallery({
  product,
  images = [],
  badge,
  badgeColor,
  badgeTextColor,
  discount = 0,
  isWishlisted = false,
  onWishlistClick,
  primaryColor = '#00433D'
}) {
  // Normalize images array
  const rawList = Array.isArray(images) && images.length > 0 
    ? images.filter(Boolean) 
    : (product?.image ? [product.image] : []);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [dragStartX, setDragStartX] = useState(null);
  const [dragCurrentX, setDragCurrentX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const total = rawList.length;

  // Reset index if product changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [product?.id]);

  const goToNext = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    }
  };

  // ── Touch Events (Mobile Swiping) ──
  const handleTouchStart = (e) => {
    if (total <= 1) return;
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null || total <= 1) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;

    // If horizontal motion is greater than vertical, prevent page scroll jitter
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null || total <= 1) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX;
    const swipeThreshold = 35; // Minimum px to trigger a swipe

    if (diffX < -swipeThreshold) {
      goToNext();
    } else if (diffX > swipeThreshold) {
      goToPrev();
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  // ── Mouse Drag Events (Desktop Swiping) ──
  const handleMouseDown = (e) => {
    if (total <= 1) return;
    // Don't drag if clicking buttons or overlays
    if (e.target.closest('button')) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragCurrentX(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || total <= 1) return;
    setDragCurrentX(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging || total <= 1) return;
    if (dragStartX !== null && dragCurrentX !== null) {
      const diffX = dragCurrentX - dragStartX;
      const swipeThreshold = 40;
      if (diffX < -swipeThreshold) {
        goToNext();
      } else if (diffX > swipeThreshold) {
        goToPrev();
      }
    }
    setIsDragging(false);
    setDragStartX(null);
    setDragCurrentX(null);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  if (total === 0) {
    return (
      <div className="product-gallery">
        <div className="product-gallery__main product-gallery__placeholder">
          <span className="product-gallery__placeholder-icon">🌿</span>
        </div>
      </div>
    );
  }

  // Calculate live drag delta offset for real-time swipe visual feedback
  const liveDelta = isDragging && dragStartX !== null && dragCurrentX !== null
    ? dragCurrentX - dragStartX
    : 0;

  return (
    <div
      className="product-gallery"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Product image gallery with swipe support"
    >
      {/* ── Main Image Viewport ── */}
      <div
        ref={containerRef}
        className={`product-gallery__main ${isDragging ? 'is-dragging' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Badges and Wishlist Floating Overlay */}
        <div className="product-gallery__overlay">
          <div className="product-gallery__badges">
            {badge && (
              <span
                className="product-badge"
                style={{
                  backgroundColor: badgeColor || primaryColor,
                  color: badgeTextColor || '#ffffff'
                }}
              >
                {badge}
              </span>
            )}
            {discount > 0 && (
              <span className="product-discount-badge">-{discount}% OFF</span>
            )}
          </div>

          {onWishlistClick && (
            <button
              type="button"
              className={`product-wish-btn ${isWishlisted ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onWishlistClick();
              }}
              aria-label="Toggle wishlist"
            >
              <ProductLikeIcon isLiked={isWishlisted} size={36} />
            </button>
          )}
        </div>

        {/* Sliding Strip */}
        <div
          className="product-gallery__slider"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${liveDelta}px))`,
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
          {rawList.map((imgSrc, i) => (
            <div key={`${i}-${imgSrc.substring(0, 30)}`} className="product-gallery__slide">
              <img
                src={imgSrc}
                alt={`${product?.name || 'Product'} - image ${i + 1}`}
                className="product-gallery__img"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows (shown if > 1 image) */}
        {total > 1 && (
          <>
            <button
              type="button"
              className="product-gallery__arrow product-gallery__arrow--left"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              aria-label="Previous image"
            >
              <FiChevronLeft size={22} />
            </button>

            <button
              type="button"
              className="product-gallery__arrow product-gallery__arrow--right"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next image"
            >
              <FiChevronRight size={22} />
            </button>

            {/* Counter pill */}
            <div className="product-gallery__counter">
              <FiImage size={12} style={{ marginRight: '4px' }} />
              {currentIndex + 1} / {total}
            </div>

            {/* Pagination Dots */}
            <div className="product-gallery__dots">
              {rawList.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`product-gallery__dot ${i === currentIndex ? 'active' : ''}`}
                  onMouseEnter={() => setCurrentIndex(i)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(i);
                  }}
                  aria-label={`Jump to image ${i + 1}`}
                />
              ))}
            </div>

            {/* Swipe hint for mobile / desktop */}
            <div className="product-gallery__swipe-hint">
              <span>Swipe to view more</span>
            </div>
          </>
        )}
      </div>

      {/* ── Thumbnails Strip (shown if > 1 image) ── */}
      {total > 1 && (
        <div className="product-gallery__thumbnails" role="tablist">
          {rawList.map((imgSrc, i) => (
            <button
              key={`thumb-${i}`}
              type="button"
              className={`product-gallery__thumb ${i === currentIndex ? 'active' : ''}`}
              onMouseEnter={() => setCurrentIndex(i)}
              onClick={() => setCurrentIndex(i)}
              aria-label={`View photo ${i + 1}`}
              role="tab"
              aria-selected={i === currentIndex}
            >
              <img src={imgSrc} alt="" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
