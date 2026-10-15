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
import { fetchReviews, deleteReviewById, isOwnReview } from '../utils/reviewsApi';
import './ProductPage.css';

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
                Customer Reviews ({totalReviewCount})
              </h2>
              <p className="product-reviews-sec__sub">
                Real feedback from customers who tried {product.name}
              </p>
            </div>
            <Link to={`/write-review?product=${product.id}`} className="product-write-review-btn">
              ✍️ Write a Review
            </Link>
          </div>

          {productReviews.length === 0 ? (
            <div className="product-reviews-empty">
              <p>No written reviews for this product yet. Be the first to share your experience!</p>
              <Link
                to={`/write-review?product=${product.id}`}
                className="product-write-review-btn product-write-review-btn--empty"
              >
                ✍️ Write a Review
              </Link>
            </div>
          ) : (
            <div className="product-reviews-list">
              {productReviews.map((rev) => {
                const stars = Math.max(1, Math.min(5, Number(rev.rating) || 5));
                const canDelete = isOwnReview(rev, user);
                return (
                  <div key={rev.id} className="product-review-item">
                    <div className="product-review-item__top">
                      <div>
                        <span className="product-review-item__author">{rev.customer_name}</span>
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

