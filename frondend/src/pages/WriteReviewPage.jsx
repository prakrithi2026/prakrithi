import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import CartModal from '../components/storefront/CartModal';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import { fetchReviews, createReview, deleteReviewById, isOwnReview } from '../utils/reviewsApi';
import './WriteReviewPage.css';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent!',
};

export default function WriteReviewPage() {
  const { config } = useSiteConfig();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedProductId = searchParams.get('product') || '';

  const theme = config.theme || {};
  const products = Array.isArray(config.products) ? config.products : [];

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [filterRating, setFilterRating] = useState('all');

  const [form, setForm] = useState({
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    product: preselectedProductId,
    rating: 5,
    title: '',
    comment: '',
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleDeleteOwnReview = async (reviewId) => {
    await deleteReviewById(reviewId);
    setReviews((prev) => prev.filter((r) => String(r.id) !== String(reviewId)));
    setDeleteConfirmId(null);
  };

  useEffect(() => {
    document.title = 'Write a Review — Prakrithi Naturals';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user.name || '',
        customer_email: prev.customer_email || user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (preselectedProductId) {
      setForm((prev) => ({ ...prev, product: preselectedProductId }));
    }
  }, [preselectedProductId]);

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const data = await fetchReviews();
      setReviews(data);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();

    const handleSync = () => loadReviews();
    window.addEventListener('prakrithi-reviews-updated', handleSync);
    let ch = null;
    if (typeof BroadcastChannel !== 'undefined') {
      ch = new BroadcastChannel('prakrithi-reviews-sync');
      ch.onmessage = () => loadReviews();
    }
    return () => {
      window.removeEventListener('prakrithi-reviews-updated', handleSync);
      ch?.close();
    };
  }, [loadReviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!form.comment.trim()) {
      setErrorMsg('Please write your review comment.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const selectedProd = products.find((p) => String(p.id) === String(form.product));
      const created = await createReview({
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        product: form.product ? Number(form.product) : null,
        product_name: selectedProd ? selectedProd.name : null,
        rating: form.rating,
        title: form.title,
        comment: form.comment,
      });
      setReviews((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      setSubmitted(true);
      setForm((prev) => ({
        ...prev,
        rating: 5,
        title: '',
        comment: '',
      }));
    } catch {
      setErrorMsg('Something went wrong while submitting your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStarDisplay = hoverRating || form.rating;

  const filteredReviews =
    filterRating === 'all'
      ? reviews
      : reviews.filter((r) => Number(r.rating) === Number(filterRating));

  const themeStyle = {
    '--primary': theme.primaryColor || '#00433D',
    '--accent': theme.accentColor || '#A0D075',
    fontFamily: theme.fontFamily,
  };

  return (
    <div className="write-review-page storefront" style={themeStyle}>
      <AnnouncementBar />
      <Navbar />

      <main className="wr-main">
        {/* Breadcrumb */}
        <div className="wr-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Customer Reviews</span>
        </div>

        <div className="wr-layout">
          {/* Left / Top: Write a Review Form */}
          <section className="wr-form-card">
            <h2 className="wr-card-title">✍️ Write a Review</h2>
            <p className="wr-card-sub">
              Rate your experience and leave a review below.
            </p>

            {submitted ? (
              <div className="wr-success-box">
                <div className="wr-success-box__icon">🎉</div>
                <h3>Thank You for Your Review!</h3>
                <p>
                  Your review has been submitted and is now visible in our customer reviews below.
                </p>
                <div className="wr-success-box__actions">
                  <button
                    type="button"
                    className="wr-submit-btn"
                    onClick={() => setSubmitted(false)}
                  >
                    Write Another Review
                  </button>
                  {preselectedProductId ? (
                    <Link to={`/product/${preselectedProductId}#product-reviews`} className="wr-secondary-btn">
                      Back to Product
                    </Link>
                  ) : (
                    <Link to="/shop" className="wr-secondary-btn">
                      Continue Shopping
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <form className="wr-form" onSubmit={handleSubmit}>
                {errorMsg && <div className="wr-error-alert">{errorMsg}</div>}

                {/* Star Rating Picker */}
                <div className="wr-field">
                  <label className="wr-label">Your Overall Rating *</label>
                  <div className="wr-star-picker">
                    <div
                      className="wr-star-picker__stars"
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`wr-star-btn ${star <= activeStarDisplay ? 'active' : ''}`}
                          onMouseEnter={() => setHoverRating(star)}
                          onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
                          aria-label={`Rate ${star} out of 5 stars`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <span className="wr-star-picker__label">
                      {RATING_LABELS[activeStarDisplay] || 'Excellent!'} ({activeStarDisplay}/5)
                    </span>
                  </div>
                </div>

                {/* Name & Email */}
                <div className="wr-row">
                  <div className="wr-field">
                    <label htmlFor="wr-name" className="wr-label">Your Name *</label>
                    <input
                      id="wr-name"
                      name="customer_name"
                      type="text"
                      className="wr-input"
                      placeholder="Enter your full name"
                      value={form.customer_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="wr-field">
                    <label htmlFor="wr-email" className="wr-label">Email Address (optional)</label>
                    <input
                      id="wr-email"
                      name="customer_email"
                      type="email"
                      className="wr-input"
                      placeholder="your@email.com"
                      value={form.customer_email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Product Selection & Title */}
                <div className="wr-row">
                  <div className="wr-field">
                    <label htmlFor="wr-product" className="wr-label">Product Reviewed (optional)</label>
                    <select
                      id="wr-product"
                      name="product"
                      className="wr-select"
                      value={form.product}
                      onChange={handleChange}
                    >
                      <option value="">General Store Experience</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="wr-field">
                    <label htmlFor="wr-title" className="wr-label">Review Headline (optional)</label>
                    <input
                      id="wr-title"
                      name="title"
                      type="text"
                      className="wr-input"
                      placeholder="e.g., Pure, fresh & authentic!"
                      value={form.title}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Review Comment */}
                <div className="wr-field">
                  <label htmlFor="wr-comment" className="wr-label">Your Review *</label>
                  <textarea
                    id="wr-comment"
                    name="comment"
                    className="wr-textarea"
                    rows={5}
                    placeholder="Tell us what you loved about the product, quality, packaging, or delivery..."
                    value={form.comment}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="wr-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Review…' : '✨ Submit Review'}
                </button>
              </form>
            )}
          </section>

          {/* Right / Bottom: Customer Reviews List */}
          <section className="wr-reviews-section">
            <div className="wr-reviews-header">
              <div>
                <h2 className="wr-card-title">
                  Customer Reviews ({reviews.length})
                </h2>
                <p className="wr-card-sub">
                  Verified reviews and responses from our team
                </p>
              </div>

              <div className="wr-filter-pills">
                {['all', 5, 4, 3, 2, 1].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`wr-filter-pill ${String(filterRating) === String(f) ? 'active' : ''}`}
                    onClick={() => setFilterRating(f)}
                  >
                    {f === 'all' ? 'All' : `${f} ★`}
                  </button>
                ))}
              </div>
            </div>

            {loadingReviews ? (
              <div className="wr-empty-state">
                <p>Loading customer reviews…</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="wr-empty-state">
                <div className="wr-empty-state__icon">💬</div>
                <h3>
                  {filterRating === 'all'
                    ? 'Be the First to Write a Review!'
                    : `No ${filterRating}-star reviews yet`}
                </h3>
                <p>
                  {filterRating === 'all'
                    ? 'Share your thoughts using the form to help other customers.'
                    : 'Try selecting another rating filter above.'}
                </p>
              </div>
            ) : (
              <div className="wr-reviews-list">
                {filteredReviews.map((rev) => {
                  const initials = (rev.customer_name || 'Customer')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const productObj = products.find(
                    (p) => String(p.id) === String(rev.product)
                  );
                  const productLabel = productObj?.name || rev.product_name;
                  const canDeleteOwn = isOwnReview(rev, user);
                  const isConfirming = deleteConfirmId === rev.id;

                  return (
                    <article key={rev.id} className="wr-review-card">
                      <div className="wr-review-card__top">
                        <div className="wr-review-card__author">
                          <div className="wr-review-card__avatar">{initials}</div>
                          <div>
                            <div className="wr-review-card__name">
                              {rev.customer_name}
                              <span className="wr-verified-badge">✓ Verified Reviewer</span>
                              {canDeleteOwn && (
                                <span className="wr-own-badge">Your Review</span>
                              )}
                            </div>
                            <div className="wr-review-card__date">
                              {rev.created_at
                                ? new Date(rev.created_at).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Just now'}
                            </div>
                          </div>
                        </div>

                        <div className="wr-review-card__top-right">
                          <div className="wr-review-card__stars" aria-label={`${rev.rating} out of 5 stars`}>
                            {'★'.repeat(Math.max(1, Math.min(5, Number(rev.rating) || 5)))}
                            <span className="wr-review-card__stars-empty">
                              {'★'.repeat(5 - Math.max(1, Math.min(5, Number(rev.rating) || 5)))}
                            </span>
                          </div>

                          {canDeleteOwn && (
                            isConfirming ? (
                              <div className="wr-own-delete-confirm">
                                <span>Delete?</span>
                                <button
                                  type="button"
                                  className="wr-own-delete-yes"
                                  onClick={() => handleDeleteOwnReview(rev.id)}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  className="wr-own-delete-no"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="wr-own-delete-btn"
                                onClick={() => setDeleteConfirmId(rev.id)}
                                title="Delete your review"
                              >
                                🗑️ Delete
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {productLabel && (
                        <div className="wr-review-card__product-tag">
                          🌿 Product:{' '}
                          {rev.product ? (
                            <Link to={`/product/${rev.product}`}>{productLabel}</Link>
                          ) : (
                            <span>{productLabel}</span>
                          )}
                        </div>
                      )}

                      {rev.title && (
                        <h4 className="wr-review-card__title">{rev.title}</h4>
                      )}

                      <p className="wr-review-card__comment">{rev.comment}</p>

                      {/* Admin Reply Display */}
                      {rev.admin_reply && (
                        <div className="wr-admin-reply">
                          <div className="wr-admin-reply__header">
                            <span className="wr-admin-reply__badge">
                              🌿 Response from Prakrithi Naturals Admin
                            </span>
                            {rev.replied_at && (
                              <span className="wr-admin-reply__date">
                                {new Date(rev.replied_at).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="wr-admin-reply__text">{rev.admin_reply}</p>
                        </div>
                      )}
                    </article>
                  );
                })}
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
