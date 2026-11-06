import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiStar,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiSearch,
  FiChevronUp,
  FiChevronDown,
  FiCheckCircle,
  FiAward,
  FiEye,
  FiUser
} from 'react-icons/fi';
import { fetchReviews } from '../../utils/reviewsApi';
import { DEFAULT_CUSTOMER_REVIEWS } from '../storefront/ReviewSection';
import './HomeReviewsSelector.css';

/**
 * Normalizes a review object from either fetchReviews (API/localStorage)
 * or DEFAULT_CUSTOMER_REVIEWS into a unified structure.
 */
function normalizeReview(r, idx = 0) {
  if (!r) return null;
  const id = String(r.id ?? `review-${idx}`);
  const name = (r.name || r.customer_name || 'Customer').trim();
  const title = (r.title || 'Exceptional Quality!').trim();
  const text = (r.text || r.comment || '').trim();
  const rating = Number(r.rating) || 5;
  const avatar = r.avatar || r.media_url || '';
  const productName = r.product_name || '';
  const location = r.location || (productName ? `Verified Buyer · ${productName}` : 'Verified Buyer');
  const verified = r.verified !== false;
  const createdAt = r.created_at || null;

  return {
    id,
    name,
    title,
    text,
    rating,
    avatar,
    location,
    product_name: productName,
    verified,
    created_at: createdAt
  };
}

export default function HomeReviewsSelector({
  title = '',
  onUpdateTitle,
  selectedReviews = [],
  onUpdateSelectedReviews
}) {
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState('all'); // 'all' | '5' | '4' | 'selected'
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // ── Load reviews from API and combine with default reviews ──
  const loadReviewsData = useCallback(async () => {
    setLoading(true);
    try {
      const apiReviews = await fetchReviews();
      const rawApiList = Array.isArray(apiReviews) ? apiReviews : [];

      // Combine API reviews and initial default customer reviews without duplicates
      const seenIds = new Set();
      const seenKeys = new Set();
      const combined = [];

      // First add API reviews
      rawApiList.forEach((r, i) => {
        const norm = normalizeReview(r, i);
        if (!norm) return;
        const key = `${norm.name.toLowerCase()}-${norm.title.toLowerCase()}`;
        if (!seenIds.has(norm.id) && !seenKeys.has(key)) {
          seenIds.add(norm.id);
          seenKeys.add(key);
          combined.push(norm);
        }
      });

      // Then add DEFAULT_CUSTOMER_REVIEWS (seed testimonials)
      DEFAULT_CUSTOMER_REVIEWS.forEach((r, i) => {
        const norm = normalizeReview(r, `default-${i}`);
        if (!norm) return;
        const key = `${norm.name.toLowerCase()}-${norm.title.toLowerCase()}`;
        if (!seenIds.has(norm.id) && !seenKeys.has(key)) {
          seenIds.add(norm.id);
          seenKeys.add(key);
          combined.push(norm);
        }
      });

      // Sort reviews: highest rating (5★) first, then by date / content length
      combined.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return (b.text?.length || 0) - (a.text?.length || 0);
      });

      setAllReviews(combined);
    } catch (err) {
      console.error('Error fetching reviews for selector:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviewsData();
  }, [loadReviewsData]);

  // Map of currently selected review IDs
  const selectedMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(selectedReviews)) {
      selectedReviews.forEach((r, idx) => {
        if (r && r.id !== undefined && r.id !== null) {
          map.set(String(r.id), idx);
        }
      });
    }
    return map;
  }, [selectedReviews]);

  const selectedCount = selectedMap.size;

  const showTemporaryFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // ── Auto-Select Most Rated (Top 5★) Reviews ──
  const handleAutoSelectMostRated = () => {
    // Pick the top 5-star reviews from available reviews, up to 6 reviews
    const fiveStarReviews = allReviews.filter((r) => r.rating >= 5);
    const pool = fiveStarReviews.length > 0 ? fiveStarReviews : [...allReviews].sort((a, b) => b.rating - a.rating);
    const topPicks = pool.slice(0, 6);

    onUpdateSelectedReviews(topPicks);
    showTemporaryFeedback(`✓ Auto-selected ${topPicks.length} top 5-star reviews for Home Page!`);
  };

  // ── Select All 5-Star Reviews ──
  const handleSelectAllFiveStar = () => {
    const fiveStar = allReviews.filter((r) => r.rating >= 5);
    if (fiveStar.length === 0) {
      showTemporaryFeedback('No 5-star reviews found to select.');
      return;
    }
    onUpdateSelectedReviews(fiveStar);
    showTemporaryFeedback(`✓ Selected all ${fiveStar.length} 5-star reviews for Home Page!`);
  };

  // ── Clear Selection (Reverts to Defaults on Home) ──
  const handleClearSelection = () => {
    onUpdateSelectedReviews([]);
    showTemporaryFeedback('Selection cleared. Home page will display default reviews.');
  };

  // ── Toggle individual review ──
  const handleToggleReview = (review) => {
    const reviewId = String(review.id);
    const isCurrentlySelected = selectedMap.has(reviewId);

    let nextList = Array.isArray(selectedReviews) ? [...selectedReviews] : [];

    if (isCurrentlySelected) {
      nextList = nextList.filter((r) => String(r.id) !== reviewId);
    } else {
      nextList.push(review);
    }

    onUpdateSelectedReviews(nextList);
  };

  // ── Move Selected Review Up/Down in Order ──
  const handleMoveReview = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedReviews.length) return;

    const copy = [...selectedReviews];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    onUpdateSelectedReviews(copy);
  };

  // ── Remove from Selected list ──
  const handleRemoveSelected = (reviewId) => {
    const nextList = (selectedReviews || []).filter((r) => String(r.id) !== String(reviewId));
    onUpdateSelectedReviews(nextList);
  };

  // ── Filter & Search Logic ──
  const filteredReviews = useMemo(() => {
    return allReviews.filter((r) => {
      // Rating filter
      if (filterRating === '5' && r.rating < 5) return false;
      if (filterRating === '4' && (r.rating < 4 || r.rating >= 5)) return false;
      if (filterRating === 'selected' && !selectedMap.has(String(r.id))) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.name?.toLowerCase().includes(q);
        const matchesTitle = r.title?.toLowerCase().includes(q);
        const matchesText = r.text?.toLowerCase().includes(q);
        const matchesProduct = r.product_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesTitle && !matchesText && !matchesProduct) {
          return false;
        }
      }

      return true;
    });
  }, [allReviews, filterRating, searchQuery, selectedMap]);

  const count5Star = allReviews.filter((r) => r.rating >= 5).length;
  const count4Star = allReviews.filter((r) => r.rating >= 4 && r.rating < 5).length;

  return (
    <div className="home-reviews-selector">
      {/* ── Header ── */}
      <div className="hrs-header">
        <h4 className="hrs-title">
          <FiAward className="hrs-icon" /> Select Reviews for Home Page Carousel
        </h4>
        <p className="hrs-subtitle">
          Choose which customer reviews appear in the rating section on the Home page.
          Cards automatically alternate dark and light green styling.
        </p>
      </div>

      {/* ── Section Heading Field (Positioned directly below subtitle as requested) ── */}
      <div className="hrs-heading-field">
        <label className="hrs-heading-label">Section Heading</label>
        <input
          className="hrs-heading-input"
          type="text"
          placeholder="Rated 4.9/5 By 1,000+ Happy Customers"
          value={title || ''}
          onChange={(e) => onUpdateTitle?.(e.target.value)}
        />
        <small className="hrs-heading-hint">
          Leave blank for default: &quot;Rated 4.9/5 By 1,000+ Happy Customers&quot;
        </small>
      </div>

      {/* ── Quick Action Buttons Bar ── */}
      <div className="hrs-quick-actions">
        <button
          type="button"
          className="hrs-btn hrs-btn--primary"
          onClick={handleAutoSelectMostRated}
          title="Automatically selects the highest rated 5-star reviews"
        >
          <FiStar className="hrs-btn-icon" /> Auto-Select Top 5★ Reviews
        </button>

        <button
          type="button"
          className="hrs-btn hrs-btn--outline"
          onClick={handleSelectAllFiveStar}
          title="Select all 5-star reviews in the system"
        >
          <FiCheck className="hrs-btn-icon" /> Select All 5★ ({count5Star})
        </button>

        {selectedCount > 0 && (
          <button
            type="button"
            className="hrs-btn hrs-btn--subtle"
            onClick={handleClearSelection}
            title="Reset to default reviews"
          >
            <FiX className="hrs-btn-icon" /> Clear Selection
          </button>
        )}

        <button
          type="button"
          className="hrs-btn hrs-btn--icon"
          onClick={loadReviewsData}
          title="Refresh reviews from server"
          disabled={loading}
        >
          <FiRefreshCw className={loading ? 'hrs-spin' : ''} />
        </button>
      </div>

      {/* Temporary feedback banner */}
      {feedbackMsg && (
        <div className="hrs-feedback-banner">
          <FiCheckCircle size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ── Active Carousel Order Strip (When reviews are selected) ── */}
      {selectedReviews && selectedReviews.length > 0 && (
        <div className="hrs-active-strip">
          <div className="hrs-active-strip-header">
            <span className="hrs-active-strip-title">
              <FiCheckCircle className="hrs-check-icon" />
              <strong>{selectedReviews.length} Reviews Selected</strong> for Home Page Carousel
            </span>
            <small className="hrs-active-strip-hint">
              Drag or use arrows to change carousel display sequence (Card #1 is Dark, Card #2 is Light, etc.)
            </small>
          </div>

          <div className="hrs-selected-cards-list">
            {selectedReviews.map((r, idx) => {
              const isDark = idx % 2 === 0;
              return (
                <div
                  key={r.id || idx}
                  className={`hrs-selected-chip ${isDark ? 'hrs-selected-chip--dark' : 'hrs-selected-chip--light'}`}
                >
                  <span className="hrs-selected-chip-badge">#{idx + 1}</span>
                  <div className="hrs-selected-chip-info">
                    <span className="hrs-selected-chip-name">{r.name || 'Customer'}</span>
                    <span className="hrs-selected-chip-rating">★ {r.rating || 5}</span>
                  </div>
                  <div className="hrs-selected-chip-actions">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveReview(idx, -1)}
                      className="hrs-chip-btn"
                      title="Move Earlier"
                    >
                      <FiChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === selectedReviews.length - 1}
                      onClick={() => handleMoveReview(idx, 1)}
                      className="hrs-chip-btn"
                      title="Move Later"
                    >
                      <FiChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSelected(r.id)}
                      className="hrs-chip-btn hrs-chip-btn--danger"
                      title="Remove from Home Page"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div className="hrs-filters-bar">
        <div className="hrs-search-box">
          <FiSearch className="hrs-search-icon" />
          <input
            type="text"
            className="hrs-search-input"
            placeholder="Search by customer name, review title, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="hrs-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        <div className="hrs-tabs">
          <button
            type="button"
            className={`hrs-tab-btn ${filterRating === 'all' ? 'hrs-tab-btn--active' : ''}`}
            onClick={() => setFilterRating('all')}
          >
            All ({allReviews.length})
          </button>
          <button
            type="button"
            className={`hrs-tab-btn ${filterRating === '5' ? 'hrs-tab-btn--active' : ''}`}
            onClick={() => setFilterRating('5')}
          >
            ⭐ 5 Stars ({count5Star})
          </button>
          {count4Star > 0 && (
            <button
              type="button"
              className={`hrs-tab-btn ${filterRating === '4' ? 'hrs-tab-btn--active' : ''}`}
              onClick={() => setFilterRating('4')}
            >
              ⭐ 4 Stars ({count4Star})
            </button>
          )}
          <button
            type="button"
            className={`hrs-tab-btn ${filterRating === 'selected' ? 'hrs-tab-btn--active' : ''}`}
            onClick={() => setFilterRating('selected')}
          >
            ✓ Selected ({selectedCount})
          </button>
        </div>
      </div>

      {/* ── Reviews Grid / List ── */}
      {loading ? (
        <div className="hrs-loading-box">
          <FiRefreshCw className="hrs-spin" size={24} />
          <span>Loading customer reviews...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="hrs-empty-box">
          <p>No customer reviews matched your search or filter.</p>
          {(searchQuery || filterRating !== 'all') && (
            <button
              type="button"
              className="hrs-btn hrs-btn--outline"
              onClick={() => {
                setSearchQuery('');
                setFilterRating('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="hrs-reviews-grid">
          {filteredReviews.map((review) => {
            const isSelected = selectedMap.has(String(review.id));
            const selectedOrder = isSelected ? selectedMap.get(String(review.id)) + 1 : null;

            return (
              <div
                key={review.id}
                className={`hrs-review-card ${isSelected ? 'hrs-review-card--selected' : ''}`}
                onClick={() => handleToggleReview(review)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleToggleReview(review);
                  }
                }}
              >
                {/* Top card bar */}
                <div className="hrs-card-top">
                  <div className="hrs-card-checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by card onClick
                      className="hrs-card-checkbox"
                      aria-label={`Select ${review.name}'s review`}
                    />
                    <span className="hrs-card-select-label">
                      {isSelected ? (
                        <strong className="hrs-text-success">
                          ✓ On Home (#{selectedOrder})
                        </strong>
                      ) : (
                        'Click to Select'
                      )}
                    </span>
                  </div>

                  {/* Rating Stars */}
                  <div className="hrs-rating-pill">
                    <span className="hrs-stars">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          size={13}
                          fill={i < review.rating ? '#eab308' : '#e2e8f0'}
                          stroke={i < review.rating ? '#ca8a04' : '#cbd5e1'}
                        />
                      ))}
                    </span>
                    <span className="hrs-rating-num">{review.rating}.0</span>
                  </div>
                </div>

                {/* Review Title */}
                <h5 className="hrs-card-title">{review.title}</h5>

                {/* Review Text */}
                <p className="hrs-card-text">{review.text}</p>

                {/* Customer Info Footer */}
                <div className="hrs-card-footer">
                  <div className="hrs-customer-avatar">
                    {review.avatar ? (
                      <img src={review.avatar} alt={review.name} loading="lazy" />
                    ) : (
                      <div className="hrs-avatar-letter">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="hrs-customer-details">
                    <div className="hrs-customer-name-row">
                      <span className="hrs-customer-name">{review.name}</span>
                      {review.verified && (
                        <span className="hrs-verified-badge" title="Verified Customer">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    {review.product_name && (
                      <span className="hrs-product-name">{review.product_name}</span>
                    )}
                    {review.location && !review.product_name && (
                      <span className="hrs-location">{review.location}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
