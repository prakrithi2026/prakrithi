import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { config } = useSiteConfig();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { isLoggedIn } = useAuth();
  const { theme } = config;
  const navigate = useNavigate();
  const location = useLocation();

  const requireAuth = (action) => {
    if (!isLoggedIn) {
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirect}`);
      return false;
    }
    return true;
  };

  return (
    <div className="product-card">
      {/* Badge */}
      {product.badge && (
        <span
          className="card-badge"
          style={{
            backgroundColor: product.badgeColor || '#00472A',
            color: product.badgeTextColor || '#fff',
          }}
        >
          {product.badge}
        </span>
      )}

      {/* Wishlist */}
      <button
        className={`card-wish-btn ${isWishlisted(product.id) ? 'active' : ''}`}
        onClick={(e) => { e.stopPropagation(); if (requireAuth()) toggleWishlist(product); }}
        aria-label="Wishlist"
      >
        {isWishlisted(product.id) ? '❤️' : '🤍'}
      </button>

      {/* Image */}
      <Link to={`/product/${product.id}`} className="card-image-link">
        <div className="card-image">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="card-image__placeholder">
              <span className="card-image__emoji">
                {product.category === 'spices' ? '🌿' : product.category === 'snacks' ? '🍌' : product.category === 'honey' ? '🍯' : '🌾'}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="card-body">
        <div className="card-top">
          <Link to={`/product/${product.id}`} className="product-name-link">
            <h5 className="product-name">{product.name}</h5>
          </Link>
          <p className="product-desc">{product.description}</p>

          {/* Rating */}
          <div className="rating">
            <span className="rating-star">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="#00472A">
                <path d="M6 0l1.76 3.56L12 4.12 8.88 7.08l.74 4.32L6 9.28 2.38 11.4l.74-4.32L0 4.12l4.24-.56z"/>
              </svg>
            </span>
            <span className="rating-score">{product.rating}</span>
            <span className="rating-heart">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5.52727 16L4.14545 13.5619L1.52727 12.9524L1.78182 10.1333L0 8L1.78182 5.86667L1.52727 3.04762L4.14545 2.4381L5.52727 0L8 1.10476L10.4727 0L11.8545 2.4381L14.4727 3.04762L14.2182 5.86667L16 8L14.2182 10.1333L14.4727 12.9524L11.8545 13.5619L10.4727 16L8 14.8952L5.52727 16ZM7.23636 10.7048L11.3455 6.4L10.3273 5.29524L7.23636 8.53333L5.67273 6.93333L4.65455 8L7.23636 10.7048Z" fill="#F41E3E"/>
              </svg>
            </span>
            <span className="rating-count">({product.reviews})</span>
          </div>
        </div>

        {/* Bottom Section Pushed Down */}
        <div className="card-bottom">
          {/* Price */}
          <div className="price-row">
            From - <span className="price-amount">₹{parseFloat(product.salePrice || product.price).toLocaleString('en-IN')}</span>
            {product.salePrice && (
              <span className="price-original">₹{parseFloat(product.price).toLocaleString('en-IN')}</span>
            )}
          </div>

          {/* Add to Cart */}
          <button
            className="btn-add-cart"
            style={{ backgroundColor: theme.primaryColor }}
            onClick={() => { if (requireAuth()) addToCart(product); }}
          >
            Add to cart
          </button>

          {/* Coupon Note */}
          <div className="coupon-container">
            {product.couponNote && (
              <p className="coupon-note">{product.couponNote}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
