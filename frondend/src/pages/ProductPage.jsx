import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import CartModal from '../components/storefront/CartModal';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import ProductCard from '../components/storefront/ProductCard';
import ProductLikeIcon from '../components/storefront/ProductLikeIcon';
import { fetchReviews, createReview, deleteReviewById, isOwnReview } from '../utils/reviewsApi';
import './ProductPage.css';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent!',
};

const StarRating = ({ rating = 0, max = 5 }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="star-rating">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < full ? 'star full' : i === full && half ? 'star half' : 'star empty'}>★</span>
      ))}
    </span>
  );
};

export default function ProductPage() {
  const { id } = useParams();
  const { config } = useSiteConfig();
  const products = Array.isArray(config.products) ? config.products : [];
  const theme = config.theme || {};
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addedFlash, setAddedFlash] = useState(false);
  const [productReviews, setProductReviews] = useState([]);
  const reviewsRef = useRef(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    title: '',
    comment: '',
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setReviewForm((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user.name || '',
        customer_email: prev.customer_email || user.email || '',
      }));
    }
  }, [user]);

  const scrollToReviews = (e) => {
    if (e) e.preventDefault();
    if (reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const el = document.getElementById('product-reviews');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const product = products.find(p => String(p.id) === String(id));
  const related = products
    .filter(p => p.category === product?.category && p.id !== product?.id)
    .slice(0, 4);

  const loadProductReviews = useCallback(async () => {
    if (!id) return;
    const data = await fetchReviews(id);
    setProductReviews(Array.isArray(data) ? data : []);
  }, [id]);

  const handleDeleteOwnReview = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return;
    await deleteReviewById(reviewId);
    setProductReviews((prev) => prev.filter((r) => String(r.id) !== String(reviewId)));
  };

  const handleReviewFormChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
    if (reviewErrorMsg) setReviewErrorMsg('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.customer_name.trim()) {
      setReviewErrorMsg('Please enter your name.');
      return;
    }
    if (!reviewForm.comment.trim()) {
      setReviewErrorMsg('Please write your review comment.');
      return;
    }

    setSubmittingReview(true);
    setReviewErrorMsg('');
    try {
      const created = await createReview({
        customer_name: reviewForm.customer_name,
        customer_email: reviewForm.customer_email,
        product: product.id,
        product_name: product.name,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
      });

      setProductReviews((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      setReviewSuccessMsg(`✓ Thank you! Your review for ${product.name} has been published below.`);
      setReviewForm((prev) => ({
        ...prev,
        rating: 5,
        title: '',
        comment: '',
      }));
      setShowReviewForm(false);
      setTimeout(() => {
        setReviewSuccessMsg('');
      }, 6000);
    } catch {
      setReviewErrorMsg('Something went wrong while submitting your review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    loadProductReviews();
    const handleSync = () => loadProductReviews();
    window.addEventListener('prakrithi-reviews-updated', handleSync);
    return () => window.removeEventListener('prakrithi-reviews-updated', handleSync);
  }, [loadProductReviews]);

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (product) {
      document.title = `${product.name} — Prakrithi Naturals`;
      if (product.variants?.length > 0) setSelectedVariant(product.variants[0]);
    }
  }, [id, product]);

  useEffect(() => {
    if (location.hash === '#reviews' || location.hash === '#product-reviews') {
      setTimeout(() => {
        scrollToReviews();
      }, 120);
    }
  }, [location.hash]);

  if (!product) {
    return (
      <div className="product-page storefront">
        <AnnouncementBar />
        <Navbar />
        <div className="product-not-found">
          <div className="product-not-found__icon">😕</div>
          <h2>Product Not Found</h2>
          <p>This product doesn't exist or may have been removed.</p>
          <Link to="/shop" className="pnf-btn">Browse All Products →</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const displayPrice = parseFloat(product.salePrice || product.price);
  const originalPrice = parseFloat(product.price);
  const discount = product.salePrice
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      const redirect = encodeURIComponent(location.pathname);
      navigate(`/login?redirect=${redirect}`);
      return;
    }
    for (let i = 0; i < quantity; i++) addToCart(product);
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
  };

  const handleWishlist = () => {
    if (!isLoggedIn) {
      const redirect = encodeURIComponent(location.pathname);
      navigate(`/login?redirect=${redirect}`);
      return;
    }
    toggleWishlist(product);
  };

  const themeStyle = {
    '--primary': theme.primaryColor,
    '--accent': theme.accentColor,
    fontFamily: theme.fontFamily,
  };

  const totalReviewCount = (Number(product.reviews) || 0) + productReviews.length;

  return (
    <div className="product-page storefront" style={themeStyle}>
      <AnnouncementBar />
      <Navbar />

      <main className="product-main">
        {/* Breadcrumb */}
        <div className="product-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Shop</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        {/* Product Hero */}
        <div className="product-hero">
          {/* Image */}
          <div className="product-image-section">
            <div className="product-image-main">
              {product.badge && (
                <span className="product-badge" style={{ backgroundColor: product.badgeColor || theme.primaryColor, color: product.badgeTextColor || '#fff' }}>
                  {product.badge}
                </span>
              )}
              {discount > 0 && (
                <span className="product-discount-badge">-{discount}% OFF</span>
              )}
              <button
                className={`product-wish-btn ${isWishlisted(product.id) ? 'active' : ''}`}
                onClick={handleWishlist}
                aria-label="Wishlist"
              >
                <ProductLikeIcon isLiked={isWishlisted(product.id)} size={36} />
              </button>
              {product.image ? (
                <img src={product.image} alt={product.name} className="product-img" />
              ) : (
                <div className="product-img-placeholder">🌿</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="product-info">
            <p className="product-category-label">{product.category?.replace(/-/g, ' ')}</p>
            <h1 className="product-title">{product.name}</h1>

            {/* Rating */}
            <div className="product-rating-row">
              <button
                type="button"
                className="product-rating-clickable"
                onClick={scrollToReviews}
                title="Click to view customer reviews"
                aria-label={`Rated ${product.rating} out of 5 stars from ${totalReviewCount} reviews. Click to see reviews.`}
              >
                <StarRating rating={parseFloat(product.rating) || 0} />
                <span className="product-rating-score">{product.rating}</span>
                <span className="product-rating-count">({totalReviewCount} reviews)</span>
              </button>
            </div>

            {/* Price */}
            <div className="product-price-block">
              <span className="product-price-current">₹{displayPrice.toLocaleString('en-IN')}</span>
              {product.salePrice && (
                <>
                  <span className="product-price-original">₹{originalPrice.toLocaleString('en-IN')}</span>
                  <span className="product-price-save">Save ₹{(originalPrice - displayPrice).toLocaleString('en-IN')}</span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="product-description">{product.description}</p>
            )}

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="product-variants">
                <label className="product-variants__label">Size / Variant</label>
                <div className="product-variants__options">
                  {product.variants.map((v, i) => (
                    <button
                      key={i}
                      className={`product-variant-btn ${selectedVariant === v ? 'active' : ''}`}
                      style={selectedVariant === v ? { borderColor: theme.primaryColor, backgroundColor: theme.primaryColor, color: '#fff' } : { borderColor: '#ddd' }}
                      onClick={() => setSelectedVariant(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="product-actions">
              <div className="product-qty">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>
              <button
                className="product-add-btn"
                style={addedFlash ? { opacity: 0.92 } : {}}
                onClick={handleAddToCart}
              >
                {addedFlash ? '✓ Added to Cart!' : `Add ${quantity > 1 ? `${quantity} × ` : ''}to Cart`}
              </button>
            </div>

            {/* Coupon note */}
            {product.couponNote && (
              <div className="product-coupon">{product.couponNote}</div>
            )}

            {/* Trust badges */}
            <div className="product-trust">
              <div className="trust-item">🌿 <span>100% Natural</span></div>
              <div className="trust-item">🚚 <span>Free shipping above ₹999</span></div>
              <div className="trust-item">✅ <span>Quality Inspected</span></div>
              <div className="trust-item">↩️ <span>Easy Returns</span></div>
            </div>
          </div>
        </div>

        {/* Product Customer Reviews Section */}
        <section className="product-reviews-sec" id="product-reviews" ref={reviewsRef}>
          <div className="product-reviews-sec__header">
            <div>
              <h2 className="product-related__title" style={{ marginBottom: '4px' }}>
                Customer Reviews{productReviews.length > 0 ? ` (${productReviews.length})` : ''}
              </h2>
              <p className="product-reviews-sec__sub">
                Real feedback from customers who tried {product.name}
              </p>
            </div>
            <button
              type="button"
              className="product-write-review-btn"
              onClick={() => {
                setShowReviewForm((prev) => !prev);
                setReviewErrorMsg('');
              }}
            >
              <span className="product-write-review-btn__text">
                {showReviewForm ? '✕ Close Form' : 'Write a Review'}
              </span>
              {!showReviewForm && (
                <span className="product-write-review-btn__arrow" aria-hidden="true">→</span>
              )}
            </button>
          </div>

          {/* Success Banner */}
          {reviewSuccessMsg && (
            <div className="product-review-success-alert">
              {reviewSuccessMsg}
            </div>
          )}

          {/* Inline Write a Review Form */}
          {showReviewForm && (
            <div className="product-review-form-card">
              <h3 className="product-review-form-title">
                ✍️ Write a Review for {product.name}
              </h3>
              <form onSubmit={handleReviewSubmit} className="product-review-form">
                {reviewErrorMsg && (
                  <div className="product-review-error-alert">{reviewErrorMsg}</div>
                )}

                {/* Star rating picker */}
                <div className="product-review-form__field">
                  <label className="product-review-form__label">Overall Rating *</label>
                  <div className="product-review-star-picker">
                    <div
                      className="product-review-star-picker__stars"
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeRating = hoverRating || reviewForm.rating;
                        return (
                          <button
                            key={star}
                            type="button"
                            className={`product-review-star-btn ${star <= activeRating ? 'active' : ''}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                            aria-label={`Rate ${star} star`}
                          >
                            ★
                          </button>
                        );
                      })}
                    </div>
                    <span className="product-review-star-picker__label">
                      {RATING_LABELS[hoverRating || reviewForm.rating]} ({hoverRating || reviewForm.rating}/5)
                    </span>
                  </div>
                </div>

                <div className="product-review-form__row">
                  <div className="product-review-form__field">
                    <label className="product-review-form__label" htmlFor="prf-name">Your Name *</label>
                    <input
                      id="prf-name"
                      name="customer_name"
                      type="text"
                      className="product-review-form__input"
                      placeholder="Enter your full name"
                      value={reviewForm.customer_name}
                      onChange={handleReviewFormChange}
                      required
                    />
                  </div>

                  <div className="product-review-form__field">
                    <label className="product-review-form__label" htmlFor="prf-email">Email Address (optional)</label>
                    <input
                      id="prf-email"
                      name="customer_email"
                      type="email"
                      className="product-review-form__input"
                      placeholder="your@email.com"
                      value={reviewForm.customer_email}
                      onChange={handleReviewFormChange}
                    />
                  </div>
                </div>

                <div className="product-review-form__field">
                  <label className="product-review-form__label" htmlFor="prf-title">Review Headline (optional)</label>
                  <input
                    id="prf-title"
                    name="title"
                    type="text"
                    className="product-review-form__input"
                    placeholder="e.g. Pure, authentic & highly recommended!"
                    value={reviewForm.title}
                    onChange={handleReviewFormChange}
                  />
                </div>

                <div className="product-review-form__field">
                  <label className="product-review-form__label" htmlFor="prf-comment">Your Review *</label>
                  <textarea
                    id="prf-comment"
                    name="comment"
                    rows={4}
                    className="product-review-form__textarea"
                    placeholder={`Tell other customers what you loved about ${product.name}...`}
                    value={reviewForm.comment}
                    onChange={handleReviewFormChange}
                    required
                  />
                </div>

                <div className="product-review-form__actions">
                  <button
                    type="submit"
                    className="product-review-form__submit"
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Submitting…' : '✨ Submit Review'}
                  </button>
                  <button
                    type="button"
                    className="product-review-form__cancel"
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewErrorMsg('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews list */}
          {productReviews.length > 0 && (
            <div className="product-reviews-list">
              {productReviews.map((rev) => {
                const stars = Math.max(1, Math.min(5, Number(rev.rating) || 5));
                const canDelete = isOwnReview(rev, user);
                return (
                  <div key={rev.id} className="product-review-item">
                    <div className="product-review-item__top">
                      <div>
                        <span className="product-review-item__author">{rev.customer_name}</span>
                        {canDelete && <span className="product-review-item__own-badge">Your Review</span>}
                        <span className="product-review-item__date">
                          {rev.created_at
                            ? new Date(rev.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>
                      <div className="product-review-item__actions">
                        <span className="product-review-item__stars">
                          {'★'.repeat(stars)}
                        </span>
                        {canDelete && (
                          <button
                            type="button"
                            className="product-review-item__delete"
                            onClick={() => handleDeleteOwnReview(rev.id)}
                            title="Delete your review"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                    {rev.title && <h4 className="product-review-item__title">{rev.title}</h4>}
                    <p className="product-review-item__comment">{rev.comment}</p>
                    {rev.admin_reply && (
                      <div className="product-review-item__reply">
                        <div className="product-review-item__reply-head">
                          🌿 Response from Prakrithi Naturals Admin
                        </div>
                        <p className="product-review-item__reply-text">{rev.admin_reply}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="product-related">
            <h2 className="product-related__title">You May Also Like</h2>
            <div className="product-related__grid">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>

      <Footer />
      <CartModal />
    </div>
  );
}

