import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface WishlistItem {
  id: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category?: string;
  handle?: string;
  variantId?: string;
  availableForSale?: boolean;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: number | string) => void;
  toggleItem: (item: WishlistItem) => void;
  isInWishlist: (id: number | string) => boolean;
  clearWishlist: () => void;
  totalItems: number;
}

const STORAGE_KEY = 'mr-brown-wishlist';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const loadFromStorage = (): WishlistItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (items: WishlistItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota exceeded – silently ignore */ }
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<WishlistItem[]>(loadFromStorage);

  useEffect(() => {
    saveToStorage(items);
  }, [items]);

  const addItem = useCallback((item: WishlistItem) => {
    setItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: number | string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const toggleItem = useCallback((item: WishlistItem) => {
    setItems(prev => {
      const exists = prev.some(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      return [...prev, item];
    });
  }, []);

  const isInWishlist = useCallback((id: number | string) => {
    return items.some(i => i.id === id);
  }, [items]);

  const clearWishlist = useCallback(() => setItems([]), []);

  return (
    <WishlistContext.Provider value={{
      items,
      addItem,
      removeItem,
      toggleItem,
      isInWishlist,
      clearWishlist,
      totalItems: items.length,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
