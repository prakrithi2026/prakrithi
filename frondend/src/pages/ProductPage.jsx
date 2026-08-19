import { useEffect, useState } from 'react';
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
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addedFlash, setAddedFlash] = useState(false);

  const product = products.find(p => String(p.id) === String(id));
  const related = products
    .filter(p => p.category === product?.category && p.id !== product?.id)
    .slice(0, 4);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} — Prakrithi Naturals`;
      if (product.variants?.length > 0) setSelectedVariant(product.variants[0]);
    }
  }, [product]);

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
              >
                {isWishlisted(product.id) ? '❤️' : '🤍'}
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
              <StarRating rating={parseFloat(product.rating) || 0} />
              <span className="product-rating-score">{product.rating}</span>
              <span className="product-rating-count">({product.reviews} reviews)</span>
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
                style={{ backgroundColor: addedFlash ? '#27ae60' : theme.primaryColor }}
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
