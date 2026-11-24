import { createContext, useContext, useState, useMemo, useEffect } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'prakrithi_cart';

// Always compare IDs as strings to handle API (number) vs localStorage (string) mismatch
const sameId = (a, b) => String(a) === String(b);

// Compare items considering both product ID and selected variant
const sameItem = (a, b) =>
  sameId(a.id, b.id) &&
  String(a.selectedVariant || '') === String(b.selectedVariant || '');

const matchesKeyOrId = (item, idOrKey, variant = undefined) => {
  if (variant !== undefined) {
    return sameId(item.id, idOrKey) && String(item.selectedVariant || '') === String(variant || '');
  }
  if (item.cartItemId && String(item.cartItemId) === String(idOrKey)) {
    return true;
  }
  return sameId(item.id, idOrKey);
};

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

  const addToCart = (product, qty = 1, openDrawer = true) => {
    const variantLabel = typeof product.selectedVariant === 'object'
      ? (product.selectedVariant?.label || product.selectedVariant?.weight || '')
      : (product.selectedVariant || '');
    
    const cartItemId = `${product.id}__${variantLabel || 'def'}`;
    const productToAdd = {
      ...product,
      selectedVariant: variantLabel || null,
      cartItemId,
    };

    setCart(prev => {
      const existing = prev.find(item => sameItem(item, productToAdd));
      if (existing) {
        return prev.map(item =>
          sameItem(item, productToAdd)
            ? { ...item, quantity: item.quantity + qty, selected: true }
            : item
        );
      }
      return [...prev, { ...productToAdd, quantity: qty, selected: true }];
    });
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const buyNow = (product, qty = 1, variant = null) => {
    const variantLabel = typeof variant === 'object'
      ? (variant?.label || variant?.weight || '')
      : (variant || (typeof product.selectedVariant === 'object' ? (product.selectedVariant?.label || product.selectedVariant?.weight || '') : (product.selectedVariant || '')));
    
    const cartItemId = `${product.id}__${variantLabel || 'def'}`;
    const itemToAdd = {
      ...product,
      selectedVariant: variantLabel || null,
      cartItemId,
    };

    setCart(prev => {
      const existing = prev.find(item => sameItem(item, itemToAdd));
      if (existing) {
        return prev.map(item =>
          sameItem(item, itemToAdd)
            ? { ...item, quantity: item.quantity + qty, selected: true }
            : { ...item, selected: false }
        );
      }
      return [
        ...prev.map(item => ({ ...item, selected: false })),
        { ...itemToAdd, quantity: qty, selected: true }
      ];
    });
    setIsCartOpen(false);
  };

  const removeFromCart = (productId, variant = undefined) => {
    setCart(prev => prev.filter(item => !matchesKeyOrId(item, productId, variant)));
  };

  const updateQuantity = (productId, quantity, variant = undefined) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        matchesKeyOrId(item, productId, variant) ? { ...item, quantity } : item
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

  const toggleItemSelection = (productId, variant = undefined) => {
    setCart(prev => prev.map(item =>
      matchesKeyOrId(item, productId, variant)
        ? { ...item, selected: item.selected === false ? true : false }
        : item
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
      buyNow,
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
