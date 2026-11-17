import { useState, useEffect, useMemo } from 'react';
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

const GreenTicketIcon = ({ size = 20, color = '#004E38' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="checkout-offer-ticket-icon"
    aria-hidden="true"
  >
    <path
      d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"
      fill="#ecfdf5"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <line x1="12" y1="6" x2="12" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="11" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="16" x2="12" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function PaymentPage() {
  const { cart, cartTotal, markCartAsOrdered, clearCart, removeSelectedFromCart } = useCart();
  const { user } = useAuth();
  const selectedItems = cart.filter(item => item.selected !== false);
  const { config } = useSiteConfig();
  const { theme } = config;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [orderStatus, setOrderStatus] = useState(null); // 'submitting', 'success', 'error'
  const [checkoutErrorMsg, setCheckoutErrorMsg] = useState('');

  // ── Offer / Coupon Code States ──
  const [offerCodeInput, setOfferCodeInput] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [offerValidating, setOfferValidating] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [offerSuccess, setOfferSuccess] = useState('');
  const [availableOffers, setAvailableOffers] = useState([]);
  const [showOffersDrawer, setShowOffersDrawer] = useState(false);

  useEffect(() => {
    if (selectedItems.length === 0 && orderStatus !== 'success') {
      navigate('/shop');
    }
  }, [selectedItems.length, navigate, orderStatus]);

  // Fetch available offer cards whenever customer email is set/updated
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const emailParam = formData.email ? `?email=${encodeURIComponent(formData.email.trim())}` : '';
        const res = await fetch(`${API_BASE_URL}/offers/active/${emailParam}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableOffers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load active offers', err);
      }
    };
    fetchOffers();
  }, [formData.email]);

  // Dynamically calculate discount amount based on active offer and cart items
  const discountAmount = useMemo(() => {
    if (!appliedOffer) return 0;
    const pct = parseFloat(appliedOffer.discount_percentage) || 0;
    const targetIds = (appliedOffer.product_ids && appliedOffer.product_ids.length > 0)
      ? appliedOffer.product_ids.map(String)
      : (appliedOffer.product_id ? [String(appliedOffer.product_id)] : []);

    if (targetIds.length > 0) {
      // Product specific discount: only applies to matching products
      const matchingItems = selectedItems.filter(i => targetIds.includes(String(i.id)));
      if (matchingItems.length === 0) return 0;
      const productTotal = matchingItems.reduce((sum, item) => {
        const price = parseFloat(item.salePrice || item.price) || 0;
        return sum + price * item.quantity;
      }, 0);
      return Math.round(productTotal * (pct / 100.0) * 100) / 100;
    }
    // Storewide discount: applies to entire cart subtotal
    return Math.round(cartTotal * (pct / 100.0) * 100) / 100;
  }, [appliedOffer, selectedItems, cartTotal]);

  const finalTotal = Math.max(0, cartTotal - discountAmount);

  // Apply offer code handler
  const handleApplyOffer = async (codeToApply) => {
    const code = (codeToApply || offerCodeInput).trim().toUpperCase();
    if (!code) {
      setOfferError('Please enter an offer code.');
      setOfferSuccess('');
      return;
    }

    if (!formData.email.trim()) {
      setOfferError('Please enter your email address in Shipping Details first.');
      setOfferSuccess('');
      return;
    }

    setOfferValidating(true);
    setOfferError('');
    setOfferSuccess('');

    try {
      const payload = {
        code,
        email: formData.email.trim(),
        items: selectedItems.map(item => ({
          product: item.id,
          price: parseFloat(item.salePrice || item.price),
          quantity: item.quantity
        })),
        subtotal: cartTotal
      };

      const res = await fetch(`${API_BASE_URL}/offers/validate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data.message || 'Invalid offer code.');
      }

      setAppliedOffer(data);
      setOfferCodeInput(data.code);
      setOfferSuccess(data.message || `Offer code ${data.code} applied! ${data.discount_percentage}% discount.`);
      setOfferError('');
    } catch (err) {
      setOfferError(err.message || 'Could not apply offer code.');
      setOfferSuccess('');
    } finally {
      setOfferValidating(false);
    }
  };

  const handleRemoveOffer = () => {
    setAppliedOffer(null);
    setOfferCodeInput('');
    setOfferError('');
    setOfferSuccess('');
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const recordOfferUsed = () => {
    if (appliedOffer?.code) {
      try {
        const raw = localStorage.getItem('prakrithi_used_codes');
        const list = raw ? JSON.parse(raw) : [];
        const codeUpper = appliedOffer.code.trim().toUpperCase();
        if (!list.includes(codeUpper)) {
          localStorage.setItem('prakrithi_used_codes', JSON.stringify([...list, codeUpper]));
        }
      } catch {}
    }
    if (formData.email) {
      try {
        localStorage.setItem('prakrithi_last_email', formData.email.trim());
      } catch {}
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setOrderStatus('submitting');
    setCheckoutErrorMsg('');

    const orderData = {
      customer_name: formData.name,
      customer_email: formData.email.trim(),
      customer_phone: formData.phone,
      shipping_address: formData.address,
      payment_method: paymentMethod,
      total_amount: finalTotal.toFixed(2),
      offer_code: appliedOffer ? appliedOffer.code : null,
      discount_amount: discountAmount.toFixed(2),
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
            setCheckoutErrorMsg('Failed to load payment gateway.');
            return;
          }

          if (data.razorpay_key && data.razorpay_key.startsWith('rzp_test_dummy')) {
            // Simulate demo payment
            if (window.confirm(`Demo Mode: Click OK to simulate a successful payment of ₹${finalTotal.toFixed(2)}.`)) {
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
                recordOfferUsed();
                setOrderStatus('success');
                markCartAsOrdered();
                setTimeout(() => {
                  removeSelectedFromCart();
                  navigate('/profile');
                }, 3000);
              } else {
                setOrderStatus('error');
                setCheckoutErrorMsg('Payment verification failed.');
              }
            } else {
              setOrderStatus('error');
              setCheckoutErrorMsg('Payment cancelled.');
            }
            return;
          }

          // Open Razorpay Popup
          const options = {
            key: data.razorpay_key,
            amount: data.amount,
            currency: 'INR',
            name: config.siteName || 'Prakrithi Naturals',
            description: appliedOffer ? `Order Payment (${appliedOffer.code} applied)` : 'Order Payment',
            order_id: data.razorpay_order_id,
            handler: async function (res) {
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
                recordOfferUsed();
                setOrderStatus('success');
                markCartAsOrdered();
                setTimeout(() => {
                  removeSelectedFromCart();
                  navigate('/profile');
                }, 3000);
              } else {
                setOrderStatus('error');
                setCheckoutErrorMsg('Payment verification failed.');
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
            setCheckoutErrorMsg(res.error.description || 'Payment Failed.');
          });
          rzpWindow.open();

        } else {
          // COD Flow
          recordOfferUsed();
          setOrderStatus('success');
          markCartAsOrdered();
          setTimeout(() => {
            removeSelectedFromCart();
            navigate('/profile'); // Redirect to profile
          }, 3000);
        }
      } else {
        const errorDetail = data.detail || (Array.isArray(data.items) ? data.items[0] : null) || 'Error processing payment. Please try again.';
        setCheckoutErrorMsg(errorDetail);
        setOrderStatus('error');
      }
    } catch (error) {
      console.error(error);
      setCheckoutErrorMsg('Network error. Please try again.');
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
          {appliedOffer && (
            <p className="payment-success-offer-note" style={{ color: '#059669', fontWeight: 600 }}>
              🎉 Offer code <strong>{appliedOffer.code}</strong> redeemed successfully (-₹{formatPrice(discountAmount)})!
            </p>
          )}
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

      <form id="payment-checkout-form" onSubmit={handleCheckout} className="payment-form-wrapper">
        {/* 1. Shipping Details */}
        <div className="payment-card payment-shipping-card">
          <div className="form-group-section">
            <h2>Shipping Details</h2>
            <div className="form-grid">
              <input
                required
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="payment-input"
              />
              <input
                required
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="payment-input"
                readOnly={!!user?.email}
                style={user?.email ? { backgroundColor: '#f5f5f5', color: '#666' } : {}}
              />
            </div>
            <input
              required
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="payment-input full-width"
            />
            <textarea
              required
              placeholder="Full Delivery Address"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="payment-input full-width"
            />
          </div>
        </div>

        {/* 2. Have an Offer Code? (directly after shipping details) */}
        <div className="payment-card payment-offer-card">
          <div className="checkout-offer-box">
            <label className="checkout-offer-label">
              <GreenTicketIcon size={20} color={theme.primaryColor || '#004E38'} />
              <span>Have an Offer Code?</span>
            </label>

            {!appliedOffer ? (
              <div className="checkout-offer-input-row">
                <input
                  type="text"
                  className="checkout-offer-input"
                  placeholder="ENTER CODE (E.G. SAVE20)"
                  value={offerCodeInput}
                  onChange={(e) => setOfferCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyOffer(); } }}
                />
                <button
                  type="button"
                  className="checkout-offer-apply-btn"
                  onClick={() => handleApplyOffer()}
                  disabled={offerValidating || !offerCodeInput.trim()}
                  style={{ backgroundColor: theme.primaryColor || '#004E38' }}
                >
                  {offerValidating ? 'Checking...' : 'Apply'}
                </button>
              </div>
            ) : (
              <div className="checkout-applied-offer-card">
                <div className="checkout-applied-info">
                  <div className="checkout-applied-tag">
                    <span>✓</span> <strong>{appliedOffer.code}</strong>
                  </div>
                  <div className="checkout-applied-desc">
                    {appliedOffer.discount_percentage}% OFF applied • You save ₹{formatPrice(discountAmount)}
                  </div>
                </div>
                <button
                  type="button"
                  className="checkout-remove-offer-btn"
                  onClick={handleRemoveOffer}
                  title="Remove offer code"
                >
                  &times;
                </button>
              </div>
            )}

            {offerError && <p className="checkout-offer-msg checkout-offer-msg--error">{offerError}</p>}
            {offerSuccess && !offerError && <p className="checkout-offer-msg checkout-offer-msg--success">{offerSuccess}</p>}
          </div>
        </div>

        {/* 3. Payment Method & Cost Summary */}
        <div className="payment-card payment-method-card-box">
          <div className="form-group-section">
            <h2>Payment Method</h2>
            <div className="payment-method-options">
              <label
                className={`payment-method-card ${paymentMethod === 'credit_card' ? 'selected' : ''}`}
                style={paymentMethod === 'credit_card' ? { borderColor: theme.primaryColor || '#004E38' } : {}}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="credit_card"
                  checked={paymentMethod === 'credit_card'}
                  onChange={() => setPaymentMethod('credit_card')}
                />
                <div className="method-details">
                  <span className="method-icon">💳</span>
                  <span className="method-name">Credit/Debit Card</span>
                </div>
              </label>

              <label
                className={`payment-method-card ${paymentMethod === 'upi' ? 'selected' : ''}`}
                style={paymentMethod === 'upi' ? { borderColor: theme.primaryColor || '#004E38' } : {}}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                />
                <div className="method-details">
                  <span className="method-icon">📱</span>
                  <span className="method-name">UPI / Wallet</span>
                </div>
              </label>

              <label
                className={`payment-method-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                style={paymentMethod === 'cod' ? { borderColor: theme.primaryColor || '#004E38' } : {}}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <div className="method-details">
                  <span className="method-icon">🚚</span>
                  <span className="method-name">Cash on Delivery</span>
                </div>
              </label>
            </div>

            {paymentMethod === 'credit_card' && (
              <div className="credit-card-details">
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0' }}>
                  You will be redirected to Razorpay's secure checkout window to enter your card details.
                </p>
              </div>
            )}
            {paymentMethod === 'upi' && (
              <div className="upi-details">
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0' }}>
                  You will be redirected to Razorpay's secure checkout window to complete your UPI payment.
                </p>
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div className="summary-totals checkout-cost-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{formatPrice(cartTotal)}</span>
            </div>

            {appliedOffer && discountAmount > 0 && (
              <div className="summary-row offer-discount-row">
                <span>
                  Offer Discount ({appliedOffer.code} - {appliedOffer.discount_percentage}%)
                  {appliedOffer.product_id && <small className="offer-scope-note"> (Applicable product)</small>}
                </span>
                <span className="discount-amount-val">-₹{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>

            <div className="summary-row total-row">
              <span>Total Payable</span>
              <span>₹{formatPrice(finalTotal)}</span>
            </div>
          </div>

          {orderStatus === 'error' && (
            <p className="payment-error">⚠️ {checkoutErrorMsg || 'Error processing payment. Please try again.'}</p>
          )}

          <button
            type="submit"
            className="pay-now-btn"
            style={{ backgroundColor: theme.primaryColor || '#004E38' }}
            disabled={orderStatus === 'submitting'}
          >
            {orderStatus === 'submitting' ? 'Processing...' : `Pay ₹${formatPrice(finalTotal)}`}
          </button>

          <p className="checkout-terms-notice">
            By placing your order, you agree to our{' '}
            <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>
            {' '}and{' '}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
          </p>
        </div>
      </form>
    </div>
  );
}
