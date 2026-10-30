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
  5: 'Excellent',
};

// Orange Filled Star SVG (#ff9800 matches reference images)
const OrangeStarFilled = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#ff9800"
    stroke="#ff9800"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`review-orange-star filled ${className}`}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Orange Outlined Star SVG (matches reference image unfilled rows)
const OrangeStarOutline = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ff9800"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`review-orange-star outline ${className}`}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Orange Half / Partial Star (clean outline base with 50% filled overlay)
const OrangeStarHalf = ({ size = 16, className = '', percent = 50 }) => (
  <span
    className={`review-orange-star half ${className}`}
    style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: `${size}px`,
      height: `${size}px`,
      lineHeight: 1,
      flexShrink: 0,
    }}
    aria-hidden="true"
  >
    <OrangeStarOutline size={size} />
    <span
      className="star-half-clip"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${percent}%`,
        height: '100%',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <OrangeStarFilled size={size} />
    </span>
  </span>
);

// Formats date as MM/DD/YYYY to match reference image (e.g. 06/26/2026)
const formatReviewDate = (dateStr) => {
  if (!dateStr) return '06/26/2026';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '06/26/2026';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

// Seed/catalog reviews to populate reviews up to total review count
const MOCK_REVIEWS_CATALOG = [
  {
    id: 'mock-1',
    customer_name: 'Rohan Sharma',
    rating: 5,
    created_at: '2026-06-26T10:00:00Z',
    comment: "It's good for days when lunch gets delayed. Doesn't feel like you ate a dessert, but it calms the hunger.",
  },
  {
    id: 'mock-2',
    customer_name: 'Rohan Sharma',
    rating: 5,
    created_at: '2026-06-26T10:00:00Z',
    comment: "It's good for days when lunch gets delayed. Doesn't feel like you ate a dessert, but it calms the hunger.",
  },
  {
    id: 'mock-3',
    customer_name: 'Rohan Sharma',
    rating: 5,
    created_at: '2026-06-26T10:00:00Z',
    comment: "It's good for days when lunch gets delayed. Doesn't feel like you ate a dessert, but it calms the hunger.",
  },
  {
    id: 'mock-4',
    customer_name: 'Priya Nair',
    rating: 5,
    created_at: '2026-06-25T14:30:00Z',
    comment: "Pure, authentic and incredibly fresh. The fragrance fills the room the moment you open it.",
  },
  {
    id: 'mock-5',
    customer_name: 'Anand Kumar',
    rating: 5,
    created_at: '2026-06-24T11:20:00Z',
    comment: "Unmatched quality compared to store-bought products. 100% natural and freshly packaged.",
  },
  {
    id: 'mock-6',
    customer_name: 'Meera S.',
    rating: 4,
    created_at: '2026-06-23T16:45:00Z',
    comment: "Really loved the flavor and natural fragrance. Great packaging and swift delivery.",
  },
  {
    id: 'mock-7',
    customer_name: 'Rajesh Patel',
    rating: 5,
    created_at: '2026-06-22T08:15:00Z',
    comment: "Direct farm freshness you can feel immediately. High essential oil retention and great taste.",
  },
  {
    id: 'mock-8',
    customer_name: 'Kavita R.',
    rating: 5,
    created_at: '2026-06-21T17:10:00Z',
    comment: "Prakrithi Naturals never fails to deliver top tier organic goods. Highly recommend to everyone.",
  },
  {
    id: 'mock-9',
    customer_name: 'Arjun Verma',
    rating: 5,
    created_at: '2026-06-20T09:30:00Z',
    comment: "Superb quality, thoroughly impressed by the freshness and purity. Will be reordering regularly.",
  },
  {
    id: 'mock-10',
    customer_name: 'Sneha Reddy',
    rating: 4,
    created_at: '2026-06-19T13:40:00Z',
    comment: "Very authentic and natural. Delivery was fast and packaging preserved the freshness perfectly.",
  },
  {
    id: 'mock-11',
    customer_name: 'Deepak Joshi',
    rating: 5,
    created_at: '2026-06-18T15:25:00Z',
    comment: "Clean, natural and superior taste. You can genuinely taste the difference in quality.",
  },
  {
    id: 'mock-12',
    customer_name: 'Dr. Suresh Pillai',
    rating: 5,
    created_at: '2026-06-17T11:00:00Z',
    comment: "Genuine organic sourcing. The potency and purity are evident right from first use.",
  },
  {
    id: 'mock-13',
    customer_name: 'Pooja Iyer',
    rating: 5,
    created_at: '2026-06-16T18:15:00Z',
    comment: "Very high quality product. Beautiful aroma and 100% natural feeling.",
  },
  {
    id: 'mock-14',
    customer_name: 'Vikram Menon',
    rating: 5,
    created_at: '2026-06-15T12:00:00Z',
    comment: "Excellent grade and very fresh. Worth every rupee for true organic produce.",
  },
  {
    id: 'mock-15',
    customer_name: 'Anita Desai',
    rating: 4,
    created_at: '2026-06-14T14:45:00Z',
    comment: "Great experience ordering from Prakrithi Naturals. Fast shipment and pristine condition.",
  },
  {
    id: 'mock-16',
    customer_name: 'Siddharth Rao',
    rating: 5,
    created_at: '2026-06-13T10:30:00Z',
    comment: "Outstanding freshness and aroma. Far exceeds typical market quality.",
  },
  {
    id: 'mock-17',
    customer_name: 'Bhavna Shah',
    rating: 5,
    created_at: '2026-06-12T16:20:00Z',
    comment: "Authentic, clean and packed with utmost care. A regular customer now!",
  },
  {
    id: 'mock-18',
    customer_name: 'Gaurav Sen',
    rating: 5,
    created_at: '2026-06-11T09:10:00Z',
    comment: "Pure and potent natural goodness. Highly satisfied with my purchase.",
  },
  {
    id: 'mock-19',
    customer_name: 'Divya Nair',
    rating: 4,
    created_at: '2026-06-10T11:50:00Z',
    comment: "Rich natural fragrance and prompt delivery. Definitely ordering again.",
  },
  {
    id: 'mock-20',
    customer_name: 'Karthik Balan',
    rating: 5,
    created_at: '2026-06-09T14:15:00Z',
    comment: "Top notch quality from Kerala. Very happy with the freshness.",
  },
  {
    id: 'mock-21',
    customer_name: 'Sunita Agarwal',
    rating: 5,
    created_at: '2026-06-08T17:00:00Z',
    comment: "The quality is simply unmatched. Very fresh and fragrant.",
  },
  {
    id: 'mock-22',
    customer_name: 'Manoj Tiwari',
    rating: 4,
    created_at: '2026-06-07T13:30:00Z',
    comment: "Delivered on time and well preserved. Authentic organic flavor.",
  },
  {
    id: 'mock-23',
    customer_name: 'Shalini Gupta',
    rating: 5,
    created_at: '2026-06-06T10:45:00Z',
    comment: "Wonderful aroma and pure natural taste. Highly recommended.",
  },
  {
    id: 'mock-24',
    customer_name: 'Rahul Varma',
    rating: 5,
    created_at: '2026-06-05T15:20:00Z',
    comment: "Exceptional quality. Will definitely buy more in my next order.",
  },
];

// Calculate review breakdown matching reference image proportions
function getReviewBreakdown(catalogReviews, catalogRating, actualReviews = []) {
  const catCount = Number(catalogReviews) || 0;
  const catRating = parseFloat(catalogRating) || 4.9;

  const actualTally = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  actualReviews.forEach((r) => {
    const s = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
    actualTally[s] = (actualTally[s] || 0) + 1;
  });

  let baseTally = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (catCount > 0) {
    if (catRating >= 4.85) {
      // For 4.9 rating: 87% (124), 11% (15), 2% (3) on 142 reviews
      const c5 = Math.round(catCount * 0.87);
      const c4 = Math.round(catCount * 0.11);
      const c3 = Math.max(0, catCount - c5 - c4);
      baseTally = { 5: c5, 4: c4, 3: c3, 2: 0, 1: 0 };
    } else if (catRating >= 4.7) {
      const c5 = Math.round(catCount * 0.78);
      const c4 = Math.round(catCount * 0.16);
      const c3 = Math.round(catCount * 0.04);
      const c2 = Math.max(0, catCount - c5 - c4 - c3);
      baseTally = { 5: c5, 4: c4, 3: c3, 2: c2, 1: 0 };
    } else if (catRating >= 4.5) {
      const c5 = Math.round(catCount * 0.68);
      const c4 = Math.round(catCount * 0.22);
      const c3 = Math.round(catCount * 0.06);
      const c2 = Math.round(catCount * 0.03);
      const c1 = Math.max(0, catCount - c5 - c4 - c3 - c2);
      baseTally = { 5: c5, 4: c4, 3: c3, 2: c2, 1: c1 };
    } else if (catRating >= 4.0) {
      const c5 = Math.round(catCount * 0.50);
      const c4 = Math.round(catCount * 0.26);
      const c3 = Math.round(catCount * 0.14);
      const c2 = Math.round(catCount * 0.06);
      const c1 = Math.max(0, catCount - c5 - c4 - c3 - c2);
      baseTally = { 5: c5, 4: c4, 3: c3, 2: c2, 1: c1 };
    } else {
      const c5 = Math.round(catCount * 0.35);
      const c4 = Math.round(catCount * 0.25);
      const c3 = Math.round(catCount * 0.20);
      const c2 = Math.round(catCount * 0.12);
      const c1 = Math.max(0, catCount - c5 - c4 - c3 - c2);
      baseTally = { 5: c5, 4: c4, 3: c3, 2: c2, 1: c1 };
    }
  }

  const totalReviews = catCount + actualReviews.length;
  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = (baseTally[stars] || 0) + (actualTally[stars] || 0);
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return {
      stars,
      count,
      percentage,
    };
  });

  return { totalReviews, breakdown };
}

const StarRating = ({ rating = 0, max = 5, size = 16 }) => {
  const numRating = parseFloat(rating) || 0;
  return (
    <span className="star-rating" aria-hidden="true">
      {Array.from({ length: max }).map((_, i) => {
        const diff = numRating - i;
        if (diff >= 0.8) {
          // Fully filled star
          return <OrangeStarFilled key={i} size={size} />;
        } else if (diff >= 0.2) {
          // Half-filled star for fractional ratings (e.g. 4.5 rating -> 50% half fill, NOT full fill)
          return <OrangeStarHalf key={i} size={size} percent={50} />;
        } else {
          // Empty outline star
          return <OrangeStarOutline key={i} size={size} />;
        }
      })}
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
  const [sortOrder, setSortOrder] = useState('recent');
  const [selectedStarFilter, setSelectedStarFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const breakdownData = getReviewBreakdown(
    product?.reviews,
    product?.rating,
    productReviews
  );
  const totalReviewCount = breakdownData.totalReviews;

  const neededMockCount = Math.max(0, (Number(product?.reviews) || 24) - productReviews.length);
  const supplementedReviews = [
    ...productReviews,
    ...MOCK_REVIEWS_CATALOG.slice(0, neededMockCount),
  ];

  const sortedReviews = [...supplementedReviews].sort((a, b) => {
    if (sortOrder === 'highest') {
      return (Number(b.rating) || 5) - (Number(a.rating) || 5);
    }
    if (sortOrder === 'lowest') {
      return (Number(a.rating) || 5) - (Number(b.rating) || 5);
    }
    if (sortOrder === 'oldest') {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const filteredReviews = selectedStarFilter
    ? sortedReviews.filter(
        (r) => Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5))) === selectedStarFilter
      )
    : sortedReviews;

  const REVIEWS_PER_PAGE = 3;
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );
  const maxVisiblePages = Math.min(6, totalPages);
  const visiblePages = Array.from({ length: maxVisiblePages }, (_, i) => i + 1);

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
          {/* Header Row: Title & Write a Review CTA */}
          <div className="cr-header-top">
            <h2 className="cr-title">Customer Reviews</h2>
            <button
              type="button"
              className="product-write-review-btn"
              onClick={() => {
                setShowReviewForm((prev) => !prev);
                setReviewErrorMsg('');
              }}
            >
              {showReviewForm ? 'Cancel Review' : 'Write a Review'}
            </button>
          </div>

          {/* Reference Image Style Customer Reviews Summary */}
          <div className={`cr-summary-container ${showReviewForm ? 'cr-summary-container--form-open' : ''}`}>
            {/* Left Column: Stars & Based on X reviews */}
            <div className="cr-summary-left">
              <div className="cr-summary-stars" aria-label={`${product?.rating || 5} out of 5 stars rating`}>
                <StarRating rating={parseFloat(product?.rating) || 5} size={24} />
              </div>
              <div className="cr-summary-based">
                Based on {breakdownData.totalReviews} {breakdownData.totalReviews === 1 ? 'review' : 'reviews'}
              </div>
            </div>

            {/* When form is closed, show vertical divider and 5 breakdown bars */}
            {!showReviewForm && (
              <>
                <div className="cr-summary-divider" aria-hidden="true" />

                <div className="cr-summary-right">
                  <div className="cr-breakdown-list">
                    {breakdownData.breakdown.map((item) => {
                      const isSelected = selectedStarFilter === item.stars;
                      return (
                        <button
                          key={item.stars}
                          type="button"
                          className={`cr-breakdown-row ${isSelected ? 'active' : ''}`}
                          onClick={() =>
                            setSelectedStarFilter((prev) => (prev === item.stars ? null : item.stars))
                          }
                          title={`Filter by ${item.stars} stars (${item.count} reviews)`}
                        >
                          <div className="cr-row-stars" aria-label={`${item.stars} out of 5 stars`}>
                            {Array.from({ length: 5 }).map((_, idx) =>
                              idx < item.stars ? (
                                <OrangeStarFilled key={idx} size={15} />
                              ) : (
                                <OrangeStarOutline key={idx} size={15} />
                              )
                            )}
                          </div>
                          <div className="cr-bar-track">
                            <div
                              className="cr-bar-fill"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="cr-bar-percent">{item.percentage}%</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Horizontal Divider Line */}
          <hr className="cr-horizontal-divider" />

          {/* Active Star Rating Filter Notice */}
          {selectedStarFilter && (
            <div className="cr-filter-notice">
              <span>
                Filtering by <strong>{selectedStarFilter}-star</strong> reviews ({breakdownData.breakdown.find(b => b.stars === selectedStarFilter)?.count || 0})
              </span>
              <button
                type="button"
                className="cr-filter-clear-btn"
                onClick={() => setSelectedStarFilter(null)}
              >
                ✕ Clear Filter
              </button>
            </div>
          )}

          {/* Success Banner */}
          {reviewSuccessMsg && (
            <div className="product-review-success-alert">
              {reviewSuccessMsg}
            </div>
          )}

          {/* Inline Write a Review Form */}
          {showReviewForm && (
            <div className="product-review-form-section">
              <h3 className="product-review-form-title">
                Write a Review for {product.name}
              </h3>
              <form onSubmit={handleReviewSubmit} className="product-review-form">
                {reviewErrorMsg && (
                  <div className="product-review-error-alert">{reviewErrorMsg}</div>
                )}

                {/* Overall Rating */}
                <div className="product-review-form__field">
                  <label className="product-review-form__label">Overall Rating</label>
                  <div className="product-review-star-picker">
                    <div
                      className="product-review-star-picker__stars"
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeRating = hoverRating || reviewForm.rating;
                        const isFilled = star <= activeRating;
                        return (
                          <button
                            key={star}
                            type="button"
                            className="product-review-star-btn"
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                            aria-label={`Rate ${star} star`}
                          >
                            {isFilled ? (
                              <OrangeStarFilled size={24} />
                            ) : (
                              <OrangeStarOutline size={24} />
                            )}
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
                    <label className="product-review-form__label" htmlFor="prf-name">Your Name</label>
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
                    <label className="product-review-form__label" htmlFor="prf-email">Email Address(Optional)</label>
                    <input
                      id="prf-email"
                      name="customer_email"
                      type="email"
                      className="product-review-form__input"
                      placeholder="your@gmail.com"
                      value={reviewForm.customer_email}
                      onChange={handleReviewFormChange}
                    />
                  </div>
                </div>

                <div className="product-review-form__field">
                  <label className="product-review-form__label" htmlFor="prf-title">Review Headline (Optional)</label>
                  <input
                    id="prf-title"
                    name="title"
                    type="text"
                    className="product-review-form__input"
                    placeholder="e.g. Pure,authentic & highly recommended!"
                    value={reviewForm.title}
                    onChange={handleReviewFormChange}
                  />
                </div>

                <div className="product-review-form__field">
                  <label className="product-review-form__label" htmlFor="prf-comment">Your Review</label>
                  <textarea
                    id="prf-comment"
                    name="comment"
                    rows={4}
                    className="product-review-form__textarea"
                    placeholder="Text"
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
                    {submittingReview ? 'Submitting…' : 'Submit Review'}
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

          {/* Horizontal Divider Line above reviews list if form is open */}
          {showReviewForm && <hr className="cr-horizontal-divider" />}

          {/* Customer Reviews List */}
          {filteredReviews.length > 0 && (
            <div className="cr-reviews-list-wrap">
              {paginatedReviews.map((rev, idx) => {
                const stars = Math.max(1, Math.min(5, Number(rev.rating) || 5));
                const canDelete = isOwnReview(rev, user);
                const firstLetter = (rev.customer_name || 'R').trim().charAt(0).toUpperCase();

                return (
                  <div key={rev.id || idx} className="cr-review-row">
                    {/* Left: Avatar Circle */}
                    <div className="cr-review-avatar">
                      {firstLetter}
                    </div>

                    {/* Right: Review Details */}
                    <div className="cr-review-body">
                      <div className="cr-review-stars-date">
                        <div className="cr-review-stars" aria-label={`${stars} out of 5 stars`}>
                          {Array.from({ length: 5 }).map((_, sIdx) =>
                            sIdx < stars ? (
                              <OrangeStarFilled key={sIdx} size={15} />
                            ) : (
                              <OrangeStarOutline key={sIdx} size={15} />
                            )
                          )}
                        </div>
                        <span className="cr-review-date">
                          {formatReviewDate(rev.created_at)}
                        </span>
                        {canDelete && (
                          <button
                            type="button"
                            className="cr-review-delete-btn"
                            onClick={() => handleDeleteOwnReview(rev.id)}
                            title="Delete your review"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      <div className="cr-review-author">
                        {rev.customer_name}
                        {canDelete && <span className="cr-review-own-badge">Your Review</span>}
                      </div>

                      <p className="cr-review-comment">{rev.comment}</p>

                      {rev.admin_reply && (
                        <div className="cr-review-reply">
                          <div className="cr-review-reply-head">
                            🌿 Response from Prakrithi Naturals Admin
                          </div>
                          <p className="cr-review-reply-text">{rev.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination: 1 2 3 4 5 6 > */}
              {totalPages > 1 && (
                <div className="cr-pagination">
                  {visiblePages.map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`cr-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                      aria-label={`Page ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  {currentPage < totalPages && (
                    <button
                      type="button"
                      className="cr-page-btn cr-page-next"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      aria-label="Next page"
                    >
                      &gt;
                    </button>
                  )}
                </div>
              )}
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

