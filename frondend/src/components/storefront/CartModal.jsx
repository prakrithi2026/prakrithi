import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { useAuth } from '../../context/AuthContext';
import './CartModal.css';

const formatPrice = (price) => {
  const num = parseFloat(price) || 0;
  return num % 1 === 0 ? num.toLocaleString('en-IN') : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function CartModal() {
  const { cart, isCartOpen, toggleCart, updateQuantity, removeFromCart, cartTotal, toggleItemSelection, toggleAllSelection, clearCart } = useCart();
  const { config } = useSiteConfig();
  const { theme } = config;
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    toggleCart();
    if (!isLoggedIn) {
      navigate('/login?redirect=%2Fpayment');
      return;
    }
    navigate('/payment');
  };

  return (
    <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) toggleCart(); }}>
      <div className="cart-modal">
        <div className="cart-header">
          <h2>Your Cart {cart.length > 0 && <span className="cart-header-count">({cart.length})</span>}</h2>
          <button className="close-cart" onClick={toggleCart} aria-label="Close cart">&times;</button>
        </div>

        {cart.length > 0 && (
          <div className="cart-bulk-actions">
            <label className="select-all-label">
              <input
                type="checkbox"
                checked={cart.length > 0 && cart.every(item => item.selected !== false)}
                onChange={(e) => toggleAllSelection(e.target.checked)}
              />
              Select All
            </label>
            <button className="delete-all-btn" onClick={() => { if(window.confirm('Are you sure you want to remove all items from your cart?')) clearCart(); }}>Delete All</button>
          </div>
        )}

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart__icon">🛒</div>
              <p>Your cart is empty</p>
              <span>Add some products to get started</span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className={`cart-item ${item.selected === false ? 'unselected' : ''}`}>
                <input
                  type="checkbox"
                  className="cart-item-checkbox"
                  checked={item.selected !== false}
                  onChange={() => toggleItemSelection(item.id)}
                />
                {item.image ? (
                  <img src={item.image} alt={item.name} className="cart-item-image" />
                ) : (
                  <div className="cart-item-image cart-item-image--placeholder">
                    🌿
                  </div>
                )}
                <div className="cart-item-details">
                  <h4 className="cart-item-title">{item.name}</h4>
                  {item.ordered && (
                    <div style={{ color: theme.primaryColor, fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>
                      ✓ You ordered this product
                    </div>
                  )}
                  <div className="cart-item-price">
                    ₹{formatPrice(item.salePrice || item.price)}
                    {item.salePrice && <span className="cart-item-original">₹{formatPrice(item.price)}</span>}
                  </div>
                  <div className="cart-item-actions">
                    <div className="qty-controls">
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Subtotal ({cart.filter(i => i.selected !== false).reduce((n, i) => n + i.quantity, 0)} items)</span>
                <span>₹{formatPrice(cartTotal)}</span>
              </div>
              <div className="cart-summary-row cart-summary-row--total">
                <span>Total</span>
                <span>₹{formatPrice(cartTotal)}</span>
              </div>
              <p className="cart-shipping-note">🚚 Free shipping on orders above ₹999</p>
            </div>

            <div className="cart-footer-actions">
              <button
                className="checkout-btn checkout-btn--secondary"
                onClick={toggleCart}
              >
                Continue Shopping
              </button>
              <button
                className="checkout-btn"
                style={{ backgroundColor: cart.filter(i => i.selected !== false).length > 0 ? theme.primaryColor : '#ccc', color: '#fff' }}
                onClick={handleCheckoutClick}
                disabled={cart.filter(i => i.selected !== false).length === 0}
              >
                Checkout →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
