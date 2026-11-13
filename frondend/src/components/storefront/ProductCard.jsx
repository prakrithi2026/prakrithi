import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import ProductLikeIcon from './ProductLikeIcon';
import { OrangeStarFilled } from './StarIcon';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const timerRef = useRef(null);

  const rawImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images.filter(Boolean)
    : (product.image ? [product.image] : []);

  const hasMultipleImages = rawImages.length > 1;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (!hasMultipleImages) return;
    setActiveImgIndex(1); // Immediately switch to the next image

    if (rawImages.length > 2) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setActiveImgIndex((prev) => (prev + 1) % rawImages.length);
      }, 1600);
    }
  };

  const handleMouseLeave = () => {
    if (!hasMultipleImages) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveImgIndex(0); // Return to primary cover image
  };

  const requireAuth = () => {
    if (!isLoggedIn) {
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirect}`);
      return false;
    }
    return true;
  };

  const currentDisplayImage = rawImages[activeImgIndex] || rawImages[0] || '';

  return (
    <div className="product-card">
      {/* Badge */}
      {product.badge && (
        <span
          className="card-badge"
          style={{
            backgroundColor: (product.badgeColor && product.badgeColor !== '#C5F1A9') ? product.badgeColor : '#004E38',
            color: (product.badgeTextColor && product.badgeTextColor !== '#004E38') ? product.badgeTextColor : '#fff',
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
        <ProductLikeIcon isLiked={isWishlisted(product.id)} />
      </button>

      {/* Image */}
      <Link to={`/product/${product.id}`} className="card-image-link">
        <div
          className="card-image"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {currentDisplayImage ? (
            <img
              src={currentDisplayImage}
              alt={product.name}
              loading="lazy"
              decoding="async"
              width="300"
              height="300"
            />
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
              <OrangeStarFilled size={14} />
            </span>
            <span className="rating-score">{product.rating}</span>
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
