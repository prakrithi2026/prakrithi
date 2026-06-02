import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import API_BASE_URL from '../utils/api';
import './PaymentPage.css';

const formatPrice = (price) => {
  const num = parseFloat(price) || 0;
  return num % 1 === 0 ? num.toLocaleString('en-IN') : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function PaymentPage() {
  const { cart, cartTotal, markCartAsOrdered, clearCart, removeSelectedFromCart } = useCart();
  const { user } = useAuth();
  const selectedItems = cart.filter(item => item.selected !== false);
  const { config } = useSiteConfig();
  const { theme } = config;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [orderStatus, setOrderStatus] = useState(null); // 'submitting', 'success', 'error'

  useEffect(() => {
    if (selectedItems.length === 0 && orderStatus !== 'success') {
      navigate('/shop');
    }
  }, [selectedItems.length, navigate, orderStatus]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setOrderStatus('submitting');

    const orderData = {
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      shipping_address: formData.address,
      payment_method: paymentMethod,
      total_amount: cartTotal.toFixed(2),
      status: 'pending',
      items: selectedItems.map(item => ({
        product: item.id,
        quantity: item.quantity,
        price: parseFloat(item.salePrice || item.price).toFixed(2)
      }))
    };

    try {
      const response = await fetch(`${API_BASE_URL}/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await response.json();

      if (response.ok) {
        if (paymentMethod === 'upi' || paymentMethod === 'credit_card') {
          // Load Razorpay script
          const isLoaded = await loadRazorpayScript();
          if (!isLoaded) {
            alert('Failed to load Razorpay. Please check your internet connection.');
            setOrderStatus('error');
            return;
          }

          if (data.razorpay_key && data.razorpay_key.startsWith('rzp_test_dummy')) {
            // Simulate demo payment
            if(window.confirm('Demo Mode: Click OK to simulate a successful payment.')) {
               const verifyRes = await fetch(`${API_BASE_URL}/orders/verify_payment/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: 'pay_dummy_123',
                  razorpay_order_id: data.razorpay_order_id,
                  razorpay_signature: 'demo_signature',
                  order_id: data.order.id
                })
              });

              if (verifyRes.ok) {
                setOrderStatus('success');
                markCartAsOrdered();
                setTimeout(() => {
                  removeSelectedFromCart();
                  navigate('/profile');
                }, 3000);
              } else {
                setOrderStatus('error');
              }
            } else {
               setOrderStatus('error');
            }
            return;
          }

          // Open Razorpay Popup
          const options = {
            key: data.razorpay_key,
            amount: data.amount,
            currency: 'INR',
            name: config.siteName || 'Your Store Name',
            description: 'Order Payment',
            order_id: data.razorpay_order_id,
            handler: async function (res) {
              // Verify Payment
              const verifyRes = await fetch(`${API_BASE_URL}/orders/verify_payment/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: res.razorpay_payment_id,
                  razorpay_order_id: res.razorpay_order_id,
                  razorpay_signature: res.razorpay_signature,
                  order_id: data.order.id
                })
              });

              if (verifyRes.ok) {
                setOrderStatus('success');
                markCartAsOrdered();
                setTimeout(() => {
                  removeSelectedFromCart();
                  navigate('/profile');
                }, 3000);
              } else {
                setOrderStatus('error');
              }
            },
            prefill: {
              name: formData.name,
              email: formData.email,
              contact: formData.phone
            },
            theme: {
              color: theme.primaryColor
            }
          };

          const rzpWindow = new window.Razorpay(options);
          rzpWindow.on('payment.failed', function (res) {
            alert('Payment Failed! Reason: ' + res.error.description);
            setOrderStatus('error');
          });
          rzpWindow.open();

        } else {
          // COD Flow
          setOrderStatus('success');
          markCartAsOrdered();
          setTimeout(() => {
            removeSelectedFromCart();
            navigate('/profile'); // Redirect to profile
          }, 3000);
        }
      } else {
        setOrderStatus('error');
      }
    } catch (error) {
      console.error(error);
      setOrderStatus('error');
    }
  };

  if (orderStatus === 'success') {
    return (
      <div className="payment-page-container">
        <div className="payment-success-card">
          <div className="payment-success-icon">✅</div>
          <h1>Payment Successful!</h1>
          <p>Your order has been placed successfully.</p>
          <p className="redirect-note">Redirecting you to your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page-container">
      <div className="payment-header">
        <h1>Secure Checkout</h1>
        <p>Complete your purchase by providing your shipping and payment details.</p>
      </div>

      <div className="payment-content">
        <div className="payment-form-section">
          <form id="payment-checkout-form" onSubmit={handleCheckout}>
            <div className="form-group-section">
              <h2>Shipping Details</h2>
              <div className="form-grid">
                <input required type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="payment-input" />
                <input required type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="payment-input" readOnly={!!user?.email} style={user?.email ? { backgroundColor: '#f5f5f5', color: '#666' } : {}} />
              </div>
              <input required type="tel" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="payment-input full-width" />
              <textarea required placeholder="Full Delivery Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={3} className="payment-input full-width" />
            </div>

            <div className="form-group-section">
              <h2>Payment Method</h2>
              <div className="payment-method-options">
                <label className={`payment-method-card ${paymentMethod === 'credit_card' ? 'selected' : ''}`} style={paymentMethod === 'credit_card' ? {borderColor: theme.primaryColor} : {}}>
                  <input type="radio" name="payment_method" value="credit_card" checked={paymentMethod === 'credit_card'} onChange={() => setPaymentMethod('credit_card')} />
                  <div className="method-details">
                    <span className="method-icon">💳</span>
                    <span className="method-name">Credit/Debit Card</span>
                  </div>
                </label>
                
                <label className={`payment-method-card ${paymentMethod === 'upi' ? 'selected' : ''}`} style={paymentMethod === 'upi' ? {borderColor: theme.primaryColor} : {}}>
                  <input type="radio" name="payment_method" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                  <div className="method-details">
                    <span className="method-icon">📱</span>
                    <span className="method-name">UPI / Wallet</span>
                  </div>
                </label>

                <label className={`payment-method-card ${paymentMethod === 'cod' ? 'selected' : ''}`} style={paymentMethod === 'cod' ? {borderColor: theme.primaryColor} : {}}>
                  <input type="radio" name="payment_method" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <div className="method-details">
                    <span className="method-icon">🚚</span>
                    <span className="method-name">Cash on Delivery</span>
                  </div>
                </label>
              </div>

              {/* Note: Actual Credit Card / UPI inputs will be securely handled by the Razorpay popup. */}
              {paymentMethod === 'credit_card' && (
                <div className="credit-card-details">
                  <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0' }}>You will be redirected to Razorpay's secure checkout window to enter your card details.</p>
                </div>
              )}
              {paymentMethod === 'upi' && (
                <div className="upi-details">
                  <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0' }}>You will be redirected to Razorpay's secure checkout window to complete your UPI payment.</p>
                </div>
              )}
            </div>

            {orderStatus === 'error' && <p className="payment-error">⚠️ Error processing payment. Please try again.</p>}
            
            <button
              type="submit"
              className="pay-now-btn"
              style={{ backgroundColor: theme.primaryColor }}
              disabled={orderStatus === 'submitting'}
            >
              {orderStatus === 'submitting' ? 'Processing...' : `Pay ₹${formatPrice(cartTotal)}`}
            </button>
          </form>
        </div>

        <div className="payment-summary-section">
          <h2>Order Summary</h2>
          <div className="summary-items">
            {selectedItems.map((item) => (
              <div key={item.id} className="summary-item">
                <div className="summary-item-info">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="summary-item-img" />
                  ) : (
                    <div className="summary-item-img placeholder">🌿</div>
                  )}
                  <div className="summary-item-text">
                    <h4>{item.name}</h4>
                    <p>Qty: {item.quantity}</p>
                  </div>
                </div>
                <div className="summary-item-price">
                  ₹{formatPrice((item.salePrice || item.price) * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{formatPrice(cartTotal)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>₹{formatPrice(cartTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
