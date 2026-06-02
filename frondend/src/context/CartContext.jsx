import { createContext, useContext, useState, useMemo, useEffect } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'prakrithi_cart';

// Always compare IDs as strings to handle API (number) vs localStorage (string) mismatch
const sameId = (a, b) => String(a) === String(b);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persist cart to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Storage quota exceeded or private mode — fail silently
    }
  }, [cart]);

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => sameId(item.id, product.id));
      if (existing) {
        return prev.map(item =>
          sameId(item.id, product.id)
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { ...product, quantity: qty, selected: true }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => !sameId(item.id, productId)));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        sameId(item.id, productId) ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const markCartAsOrdered = () => {
    setCart(prev => prev.map(item => item.selected !== false ? { ...item, ordered: true } : item));
  };

  const toggleItemSelection = (productId) => {
    setCart(prev => prev.map(item =>
      sameId(item.id, productId) ? { ...item, selected: item.selected === false ? true : false } : item
    ));
  };

  const toggleAllSelection = (selectAll) => {
    setCart(prev => prev.map(item => ({ ...item, selected: selectAll })));
  };

  const removeSelectedFromCart = () => {
    setCart(prev => prev.filter(item => item.selected === false));
  };

  const toggleCart = () => setIsCartOpen(prev => !prev);

  const cartTotal = useMemo(() => {
    return cart.filter(item => item.selected !== false).reduce((total, item) => {
      const price = parseFloat(item.salePrice || item.price) || 0;
      return total + price * item.quantity;
    }, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      removeSelectedFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      isCartOpen,
      setIsCartOpen,
      toggleCart,
      toggleItemSelection,
      toggleAllSelection,
      markCartAsOrdered,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
