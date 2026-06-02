import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import { useSiteConfig } from '../context/SiteConfigContext';
import API_BASE_URL from '../utils/api';
import './OrdersPage.css';

const STATUS_COLORS = {
  pending: { bg: '#fff8e1', color: '#f57f17', label: '⏳ Pending' },
  processing: { bg: '#e3f2fd', color: '#1565c0', label: '⚙️ Processing' },
  shipped: { bg: '#e8f5e9', color: '#2e7d32', label: '🚚 Shipped' },
  delivered: { bg: '#e8f5e9', color: '#1b5e20', label: '✅ Delivered' },
  cancelled: { bg: '#fce4ec', color: '#b71c1c', label: '❌ Cancelled' },
};

export default function OrdersPage() {
  const { config } = useSiteConfig();
  const { theme } = config;
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Track My Orders — Prakrithi Naturals';
  }, []);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setOrders(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/track/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setOrders(data);
    } catch {
      setError('Failed to fetch orders. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const themeStyle = { '--primary': theme.primaryColor, '--accent': theme.accentColor, fontFamily: theme.fontFamily };

  return (
    <div className="orders-page storefront" style={themeStyle}>
      <AnnouncementBar />
      <Navbar />
      <main className="orders-main">
        <div className="orders-breadcrumb">
          <Link to="/">Home</Link> <span>/</span> <span>Track Order</span>
        </div>

        <div className="orders-container">
          <div className="orders-search-card">
            <div className="orders-search-icon">📦</div>
            <h1 className="orders-title">Track Your Orders</h1>
            <p className="orders-subtitle">Enter the email address you used during checkout to see your order history and status.</p>

            <form className="orders-form" onSubmit={handleTrack}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="orders-email-input"
              />
              <button
                type="submit"
                className="orders-track-btn"
                style={{ backgroundColor: theme.primaryColor }}
                disabled={loading}
              >
                {loading ? '⏳ Searching...' : 'Track Orders →'}
              </button>
            </form>
          </div>

          {error && (
            <div className="orders-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {orders !== null && (
            <div className="orders-results">
              {orders.length === 0 ? (
                <div className="orders-empty">
                  <div className="orders-empty__icon">🔍</div>
                  <h3>No orders found</h3>
                  <p>No orders were placed with this email address.</p>
                  <Link to="/shop" className="orders-shop-link" style={{ backgroundColor: theme.primaryColor }}>
                    Start Shopping →
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="orders-results__title">{orders.length} Order{orders.length !== 1 ? 's' : ''} Found</h2>
                  {orders.map(order => {
                    const statusInfo = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                    return (
                      <div key={order.id} className="order-card">
                        <div className="order-card__header">
                          <div className="order-card__meta">
                            <span className="order-card__id">Order #{order.id}</span>
                            <span className="order-card__date">
                              {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <span
                            className="order-card__status"
                            style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                          >
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="order-card__body">
                          <div className="order-card__info">
                            <p><strong>Customer:</strong> {order.customer_name}</p>
                            <p><strong>Phone:</strong> {order.customer_phone}</p>
                            <p><strong>Address:</strong> {order.shipping_address}</p>
                          </div>

                          {order.items && order.items.length > 0 && (
                            <div className="order-card__items">
                              <p className="order-card__items-title">Items Ordered</p>
                              {order.items.map((item, i) => {
                                const matchedProduct = config.products.find(p => String(p.id) === String(item.product));
                                const productName = matchedProduct ? matchedProduct.name : `Product #${item.product}`;
                                return (
                                  <div key={i} className="order-item">
                                    <span className="order-item__qty">×{item.quantity}</span>
                                    <span className="order-item__name" title={productName}>{productName}</span>
                                    <span className="order-item__price">₹{parseFloat(item.price).toLocaleString('en-IN')}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="order-card__total">
                            <span>Total Paid</span>
                            <span>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Status tracker */}
                        <div className="order-tracker">
                          {['pending', 'processing', 'shipped', 'delivered'].map((step, i) => {
                            const steps = ['pending', 'processing', 'shipped', 'delivered'];
                            const currentIdx = steps.indexOf(order.status);
                            const isDone = i <= currentIdx;
                            const labels = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];
                            return (
                              <div key={step} className={`order-tracker__step ${isDone ? 'done' : ''}`} style={isDone ? { '--step-color': theme.primaryColor } : {}}>
                                <div className="order-tracker__dot" style={isDone ? { backgroundColor: theme.primaryColor } : {}} />
                                <span>{labels[i]}</span>
                                {i < 3 && <div className={`order-tracker__line ${isDone && i < currentIdx ? 'done' : ''}`} style={isDone && i < currentIdx ? { backgroundColor: theme.primaryColor } : {}} />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
