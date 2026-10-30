import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiMessageSquare,
  FiCheck,
  FiEdit2,
  FiX,
  FiSend,
} from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import {
  fetchReviews,
  replyToReview,
  deleteReviewById,
} from '../../utils/reviewsApi';
import './ReviewManager.css';

const POLL_INTERVAL_MS = 30_000;

export default function ReviewManager() {
  const { config } = useSiteConfig();
  const products = Array.isArray(config.products) ? config.products : [];

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'replied'
  const [ratingFilter, setRatingFilter] = useState('all');

  // Reply state: which review ID is currently being replied to / edited
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [savingReplyId, setSavingReplyId] = useState(null);
  const [savedFlashId, setSavedFlashId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const pollTimerRef = useRef(null);

  const loadReviews = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('ReviewManager fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews(false);
    pollTimerRef.current = setInterval(() => loadReviews(true), POLL_INTERVAL_MS);

    const handleSync = () => loadReviews(true);
    window.addEventListener('prakrithi-reviews-updated', handleSync);
    let ch = null;
    if (typeof BroadcastChannel !== 'undefined') {
      ch = new BroadcastChannel('prakrithi-reviews-sync');
      ch.onmessage = () => loadReviews(true);
    }

    return () => {
      clearInterval(pollTimerRef.current);
      window.removeEventListener('prakrithi-reviews-updated', handleSync);
      ch?.close();
    };
  }, [loadReviews]);

  const openReplyBox = (review) => {
    setActiveReplyId(review.id);
    setReplyDraft(review.admin_reply || '');
  };

  const cancelReply = () => {
    setActiveReplyId(null);
    setReplyDraft('');
  };

  const handleSaveReply = async (reviewId) => {
    setSavingReplyId(reviewId);
    try {
      const updated = await replyToReview(reviewId, replyDraft);
      setReviews((prev) =>
        prev.map((r) => (String(r.id) === String(reviewId) ? { ...r, ...updated } : r))
      );
      setActiveReplyId(null);
      setReplyDraft('');
      setSavedFlashId(reviewId);
      setTimeout(() => setSavedFlashId(null), 2500);
    } catch (err) {
      alert('Failed to save reply. Please try again.');
      console.error(err);
    } finally {
      setSavingReplyId(null);
    }
  };

  const handleClearReply = async (reviewId) => {
    setSavingReplyId(reviewId);
    try {
      const updated = await replyToReview(reviewId, '');
      setReviews((prev) =>
        prev.map((r) => (String(r.id) === String(reviewId) ? { ...r, ...updated } : r))
      );
      if (activeReplyId === reviewId) {
        setActiveReplyId(null);
        setReplyDraft('');
      }
    } catch (err) {
      alert('Failed to remove reply.');
      console.error(err);
    } finally {
      setSavingReplyId(null);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReviewById(reviewId);
      setReviews((prev) => prev.filter((r) => String(r.id) !== String(reviewId)));
      setDeleteConfirmId(null);
    } catch (err) {
      alert('Failed to delete review.');
      console.error(err);
    }
  };

  // Filtered reviews
  const q = searchQuery.trim().toLowerCase();
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      !q ||
      (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
      (r.customer_email && r.customer_email.toLowerCase().includes(q)) ||
      (r.product_name && r.product_name.toLowerCase().includes(q)) ||
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.comment && r.comment.toLowerCase().includes(q)) ||
      (r.admin_reply && r.admin_reply.toLowerCase().includes(q));

    const hasReply = Boolean(r.admin_reply && r.admin_reply.trim());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'replied' && hasReply) ||
      (statusFilter === 'pending' && !hasReply);

    const matchesRating =
      ratingFilter === 'all' || Number(r.rating) === Number(ratingFilter);

    return matchesSearch && matchesStatus && matchesRating;
  });

  // Stats
  const totalCount = reviews.length;
  const repliedCount = reviews.filter((r) => r.admin_reply && r.admin_reply.trim()).length;
  const pendingCount = totalCount - repliedCount;
  const avgRating =
    totalCount > 0
      ? (
          reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / totalCount
        ).toFixed(1)
      : '0.0';

  return (
    <div>
      <div className="dash-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {/* ── Header ── */}
        <div className="rm-header">
          <div className="rm-header__left">
            <h2>⭐ Customer Reviews</h2>
            <p>View customer reviews, post official admin replies, or delete inappropriate reviews.</p>
          </div>

          <div className="rm-header__actions">
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => loadReviews(false)}
              disabled={loading}
            >
              <FiRefreshCw size={15} className={loading ? 'rm-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="rm-stats">
          <div className="rm-stat">
            <div className="rm-stat__value">{totalCount}</div>
            <div className="rm-stat__label">Total Reviews</div>
          </div>
          <div className="rm-stat">
            <div className="rm-stat__value" style={{ color: '#f59e0b' }}>
              {avgRating} ★
            </div>
            <div className="rm-stat__label">Avg Rating</div>
          </div>
          <div className="rm-stat">
            <div className="rm-stat__value" style={{ color: '#d97706' }}>
              {pendingCount}
            </div>
            <div className="rm-stat__label">Awaiting Reply</div>
          </div>
          <div className="rm-stat">
            <div className="rm-stat__value" style={{ color: '#059669' }}>
              {repliedCount}
            </div>
            <div className="rm-stat__label">Replied</div>
          </div>
        </div>

        {/* ── Search & Filters ── */}
        <div className="rm-filters">
          <div className="rm-search-wrap">
            <FiSearch size={15} />
            <input
              className="rm-search-input"
              placeholder="Search by customer name, email, product, or review text…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="rm-filter-controls">
            <select
              className="rm-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status ({totalCount})</option>
              <option value="pending">Needs Reply ({pendingCount})</option>
              <option value="replied">Replied ({repliedCount})</option>
            </select>

            <select
              className="rm-filter-select"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars (★★★★★)</option>
              <option value="4">4 Stars (★★★★)</option>
              <option value="3">3 Stars (★★★)</option>
              <option value="2">2 Stars (★★)</option>
              <option value="1">1 Star (★)</option>
            </select>
          </div>
        </div>

        {/* ── Reviews List ── */}
        <div className="rm-list">
          {loading ? (
            <div className="rm-loading">
              <div className="rm-loading__dot" />
              <div className="rm-loading__dot" />
              <div className="rm-loading__dot" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="rm-empty">
              <div className="rm-empty__icon">💬</div>
              <div className="rm-empty__text">
                {searchQuery || statusFilter !== 'all' || ratingFilter !== 'all'
                  ? 'No reviews match your current filters.'
                  : 'No customer reviews have been submitted yet.'}
              </div>
            </div>
          ) : (
            filteredReviews.map((review) => {
              const hasReply = Boolean(review.admin_reply && review.admin_reply.trim());
              const isEditingReply = activeReplyId === review.id;
              const isSaving = savingReplyId === review.id;
              const isConfirmingDelete = deleteConfirmId === review.id;
              const starsCount = Math.max(1, Math.min(5, Number(review.rating) || 5));

              const matchedProduct = products.find(
                (p) => String(p.id) === String(review.product)
              );
              const productName = matchedProduct?.name || review.product_name || 'General Store Review';

              return (
                <div key={review.id} className="rm-card">
                  {/* Card Header */}
                  <div className="rm-card__header">
                    <div className="rm-card__header-left">
                      <span className="rm-card__author">{review.customer_name}</span>
                      {review.customer_email && (
                        <span className="rm-card__email">({review.customer_email})</span>
                      )}
                      <span
                        className={`rm-status-badge ${
                          hasReply ? 'rm-status-badge--replied' : 'rm-status-badge--pending'
                        }`}
                      >
                        {hasReply ? '✓ Replied' : '⏳ Needs Reply'}
                      </span>
                      {savedFlashId === review.id && (
                        <span className="rm-saved-pill">
                          <FiCheck size={12} /> Reply Saved
                        </span>
                      )}
                    </div>

                    <div className="rm-card__header-right">
                      <span className="rm-card__stars" title={`${starsCount} out of 5 stars`}>
                        {'★'.repeat(starsCount)}
                        <span className="rm-card__stars-empty">
                          {'★'.repeat(5 - starsCount)}
                        </span>
                      </span>
                      <span className="rm-card__date">
                        {review.created_at
                          ? new Date(review.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="rm-card__body">
                    <div className="rm-card__product-badge">
                      🌿 {productName}
                    </div>

                    {review.title && (
                      <h4 className="rm-card__title">{review.title}</h4>
                    )}

                    <p className="rm-card__comment">{review.comment}</p>

                    {/* Attached Media (Photo or Video) */}
                    {review.media_url && (
                      <div className="rm-card__media">
                        {review.media_type === 'video' || (typeof review.media_url === 'string' && (review.media_url.includes('data:video') || review.media_url.endsWith('.mp4') || review.media_url.endsWith('.webm') || review.media_url.endsWith('.mov'))) ? (
                          <div className="rm-video-container">
                            <span className="rm-media-badge">🎥 Video Attached</span>
                            <video src={review.media_url} controls className="rm-video-preview" />
                          </div>
                        ) : (
                          <div className="rm-image-container">
                            <span className="rm-media-badge">📷 Photo Attached</span>
                            <img
                              src={review.media_url}
                              alt="Customer attachment"
                              className="rm-image-preview"
                              onClick={() => window.open(review.media_url, '_blank')}
                              title="Click to view full image in new tab"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Existing Admin Reply */}
                    {hasReply && !isEditingReply && (
                      <div className="rm-reply-display">
                        <div className="rm-reply-display__header">
                          <span className="rm-reply-display__label">
                            🌿 Your Admin Reply
                          </span>
                          {review.replied_at && (
                            <span className="rm-reply-display__date">
                              Replied on{' '}
                              {new Date(review.replied_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="rm-reply-display__text">{review.admin_reply}</p>
                      </div>
                    )}

                    {/* Reply Editor Box */}
                    {isEditingReply && (
                      <div className="rm-reply-editor">
                        <label className="rm-reply-editor__label">
                          {hasReply ? 'Edit Admin Reply' : `Reply to ${review.customer_name}`}
                        </label>
                        <textarea
                          className="rm-reply-editor__textarea"
                          rows={3}
                          placeholder="Write your official response to this customer review…"
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          autoFocus
                        />
                        <div className="rm-reply-editor__actions">
                          <button
                            type="button"
                            className="rm-btn rm-btn--primary"
                            onClick={() => handleSaveReply(review.id)}
                            disabled={isSaving || !replyDraft.trim()}
                          >
                            <FiSend size={13} />
                            {isSaving ? 'Saving…' : 'Send Reply'}
                          </button>

                          {hasReply && (
                            <button
                              type="button"
                              className="rm-btn rm-btn--danger-outline"
                              onClick={() => handleClearReply(review.id)}
                              disabled={isSaving}
                            >
                              Remove Reply
                            </button>
                          )}

                          <button
                            type="button"
                            className="rm-btn rm-btn--ghost"
                            onClick={cancelReply}
                            disabled={isSaving}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="rm-card__actions">
                    {!isEditingReply && (
                      <button
                        type="button"
                        className="rm-action-btn rm-action-btn--reply"
                        onClick={() => openReplyBox(review)}
                      >
                        {hasReply ? (
                          <>
                            <FiEdit2 size={13} /> Edit Reply
                          </>
                        ) : (
                          <>
                            <FiMessageSquare size={13} /> Reply
                          </>
                        )}
                      </button>
                    )}

                    {isConfirmingDelete ? (
                      <div className="rm-delete-confirm">
                        <span>Delete this review?</span>
                        <button
                          type="button"
                          className="rm-action-btn rm-action-btn--delete-yes"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          <FiCheck size={13} /> Yes, Delete
                        </button>
                        <button
                          type="button"
                          className="rm-action-btn rm-action-btn--cancel"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          <FiX size={13} /> Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="rm-action-btn rm-action-btn--delete"
                        onClick={() => setDeleteConfirmId(review.id)}
                      >
                        <FiTrash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
