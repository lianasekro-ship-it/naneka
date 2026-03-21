import { createContext, useContext, useState, useCallback } from 'react';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items,      setItems]      = useState([]);   // [{product, qty}]
  const [drawerOpen, setDrawerOpen] = useState(false);

  const add = useCallback((product, qty = 1) => {
    setItems(prev => {
      const found = prev.find(i => i.product.id === product.id);
      if (found) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product, qty }];
    });
  }, []);

  const remove = useCallback((id) => {
    setItems(prev => prev.filter(i => i.product.id !== id));
  }, []);

  const updateQty = useCallback((id, qty) => {
    if (qty <= 0) { setItems(prev => prev.filter(i => i.product.id !== id)); return; }
    setItems(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.product.price * i.qty, 0);

  return (
    <CartCtx.Provider value={{ items, add, remove, updateQty, clear, count, total, drawerOpen, setDrawerOpen }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
