import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import CartModal from '../components/storefront/CartModal';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import API_BASE_URL from '../utils/api';
import './ProfilePage.css';

/* ─── Order Status badge config ─── */
const STATUS_INFO = {
  pending:    { bg: '#fff8e1', color: '#f57f17', label: '⏳ Pending' },
  processing: { bg: '#e3f2fd', color: '#1565c0', label: '⚙️ Processing' },
  shipped:    { bg: '#e8f5e9', color: '#2e7d32', label: '🚚 Shipped' },
  delivered:  { bg: '#e8f5e9', color: '#1b5e20', label: '✅ Delivered' },
  cancelled:  { bg: '#fce4ec', color: '#b71c1c', label: '❌ Cancelled' },
};

const ORDER_STEPS  = ['pending', 'processing', 'shipped', 'delivered'];
const STEP_LABELS  = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];

/* ─── Wishlist Tab ─── */
function WishlistTab({ primaryColor }) {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="profile-empty">
        <div className="profile-empty__icon">🤍</div>
        <h3>Your wishlist is empty</h3>
        <p>Browse our products and tap the heart to save your favourites.</p>
        <Link to="/shop" className="profile-cta-btn" style={{ backgroundColor: primaryColor }}>
          Browse Products →
        </Link>
      </div>
    );
  }

  return (
    <div className="wishlist-grid">
      {wishlist.map(product => {
        const price = parseFloat(product.salePrice || product.price);
        const original = parseFloat(product.price);
        const discount = product.salePrice
          ? Math.round(((original - price) / original) * 100)
          : 0;

        return (
          <div key={product.id} className="wish-card">
            {/* Remove button */}
            <button
              className="wish-card__remove"
              onClick={() => toggleWishlist(product)}
              aria-label="Remove from wishlist"
              title="Remove from wishlist"
            >
              ❤️
            </button>

            {/* Discount badge */}
            {discount > 0 && (
              <span className="wish-card__discount">-{discount}%</span>
            )}

            {/* Image */}
            <Link to={`/product/${product.id}`} className="wish-card__img-link">
              <div className="wish-card__img-wrap">
                {product.image
                  ? <img src={product.image} alt={product.name} />
                  : <div className="wish-card__img-placeholder">🌿</div>
                }
              </div>
            </Link>

            <div className="wish-card__body">
              <Link to={`/product/${product.id}`} className="wish-card__name">{product.name}</Link>
              {product.description && (
                <p className="wish-card__desc">{product.description}</p>
              )}

              {/* Rating */}
              {product.rating && (
                <div className="wish-card__rating">
                  <span className="wish-card__stars">{'★'.repeat(Math.round(product.rating))}</span>
                  <span className="wish-card__rating-val">{product.rating}</span>
                  {product.reviews && <span className="wish-card__reviews">({product.reviews})</span>}
                </div>
              )}

              <div className="wish-card__price-row">
                <span className="wish-card__price">₹{price.toLocaleString('en-IN')}</span>
                {product.salePrice && (
                  <span className="wish-card__original">₹{original.toLocaleString('en-IN')}</span>
                )}
              </div>

              <div className="wish-card__actions">
                <button
                  className="wish-card__add-btn"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => addToCart(product)}
                >
                  🛒 Add to Cart
                </button>
                <Link to={`/product/${product.id}`} className="wish-card__view-btn">
                  View →
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Order Tracking Tab ─── */
function OrdersTab({ primaryColor }) {
  const { user } = useAuth();
  const [orders,  setOrders]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/track/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        if (!res.ok) throw new Error();
        setOrders(await res.json());
      } catch {
        setError('Failed to fetch orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      } else {
        alert("Failed to cancel order. Please contact support.");
      }
    } catch (err) {
      console.error(err);
      alert("Error cancelling order. Please try again later.");
    }
  };

  return (
    <div className="orders-tab">
      <div className="orders-search-card" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="orders-search-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
        <h2 className="orders-search-title">Your Order History</h2>
        <p className="orders-search-sub" style={{ marginBottom: 0 }}>Viewing orders for <strong>{user?.email}</strong></p>
      </div>

      {error && <div className="orders-error">⚠️ {error}</div>}

      {orders !== null && (
        <div className="orders-results">
          {orders.length === 0 ? (
            <div className="profile-empty">
              <div className="profile-empty__icon">🔍</div>
              <h3>No orders found</h3>
              <p>No orders placed with this email address.</p>
              <Link to="/shop" className="profile-cta-btn" style={{ backgroundColor: primaryColor }}>
                Start Shopping →
              </Link>
            </div>
          ) : (
            <>
              <h3 className="orders-results-title">{orders.length} Order{orders.length !== 1 ? 's' : ''} Found</h3>
              {orders.map(order => {
                const info = STATUS_INFO[order.status] || STATUS_INFO.pending;
                const stepIdx = ORDER_STEPS.indexOf(order.status);
                return (
                  <div key={order.id} className="order-card">
                    <div className="order-card__header">
                      <div className="order-card__meta">
                        <span className="order-card__id">Order #{order.id}</span>
                        <span className="order-card__date">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <span className="order-card__status" style={{ backgroundColor: info.bg, color: info.color }}>
                        {info.label}
                      </span>
                    </div>

                    <div className="order-card__body">
                      <div className="order-card__info">
                        <p><strong>Name:</strong> {order.customer_name}</p>
                        <p><strong>Phone:</strong> {order.customer_phone}</p>
                        <p><strong>Address:</strong> {order.shipping_address}</p>
                      </div>

                      {order.items?.length > 0 && (
                        <div className="order-card__items">
                          <p className="order-items-label">Items</p>
                          {order.items.map((item, i) => (
                            <div key={i} className="order-item">
                              <span className="order-item__qty">×{item.quantity}</span>
                              <span className="order-item__name">Product #{item.product}</span>
                              <span className="order-item__price">₹{parseFloat(item.price).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="order-card__total">
                        <span>Total Paid</span>
                        <span>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
                      </div>
                      
                      {/* Cancel Order Option */}
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                           <button 
                             onClick={() => handleCancelOrder(order.id)}
                             style={{ backgroundColor: '#fff', color: '#dc2626', border: '1px solid #dc2626', padding: '6px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms ease' }}
                             onMouseOver={(e) => { e.target.style.backgroundColor = '#fef2f2'; }}
                             onMouseOut={(e) => { e.target.style.backgroundColor = '#fff'; }}
                           >
                             Cancel Order
                           </button>
                        </div>
                      )}
                    </div>

                    {/* Progress tracker */}
                    {order.status !== 'cancelled' && (
                      <div className="order-tracker">
                        {ORDER_STEPS.map((step, i) => {
                          const done = i <= stepIdx;
                          return (
                            <div key={step} className={`order-tracker__step ${done ? 'done' : ''}`}>
                              <div
                                className="order-tracker__dot"
                                style={done ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                              />
                              <span>{STEP_LABELS[i]}</span>
                              {i < ORDER_STEPS.length - 1 && (
                                <div
                                  className="order-tracker__line"
                                  style={done && i < stepIdx ? { backgroundColor: primaryColor } : {}}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Profile Page ─── */
const TABS = [
  { id: 'wishlist', label: '❤️ Wishlist',    icon: '❤️' },
  { id: 'orders',   label: '📦 My Orders',   icon: '📦' },
];

export default function ProfilePage() {
  const { config } = useSiteConfig();
  const { theme } = config;
  const { wishlistCount } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'wishlist');

  useEffect(() => {
    document.title = 'My Profile — Prakrithi Naturals';
  }, []);

  // Sync tab from URL
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && (t === 'wishlist' || t === 'orders')) setActiveTab(t);
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const themeStyle = {
    '--primary': theme.primaryColor,
    '--accent':  theme.accentColor,
    fontFamily:  theme.fontFamily,
  };

  return (
    <div className="profile-page storefront" style={themeStyle}>
      <AnnouncementBar />
      <Navbar />

      <main className="profile-main">
        {/* Breadcrumb */}
        <div className="profile-breadcrumb">
          <Link to="/">Home</Link> <span>/</span> <span>My Profile</span>
        </div>

        {/* Page title */}
        <div className="profile-hero">
          <div className="profile-avatar">👤</div>
          <div>
            <h1 className="profile-title">My Profile</h1>
            <p className="profile-subtitle">Manage your wishlist and track your orders</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
              style={activeTab === tab.id ? { borderColor: theme.primaryColor, color: theme.primaryColor } : {}}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
              {tab.id === 'wishlist' && wishlistCount > 0 && (
                <span className="profile-tab-badge" style={{ backgroundColor: theme.primaryColor }}>
                  {wishlistCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="profile-content">
          {activeTab === 'wishlist' && <WishlistTab primaryColor={theme.primaryColor} />}
          {activeTab === 'orders'   && <OrdersTab   primaryColor={theme.primaryColor} />}
        </div>
      </main>

      <Footer />
      <CartModal />
    </div>
  );
}
