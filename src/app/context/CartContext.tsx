import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { useShopifyCart } from '@/shopify/hooks/useShopifyCart';
import { useWholesalePrices } from '@/shopify/hooks/useWholesalePrices';
import { isShopifyConfigured } from '@/shopify/config';
import { resolvePackLabel } from '@/shopify/packLabel';
import { useAuth } from '@/app/context/AuthContext';
import {
  computeCartWholesaleSummary,
  type WholesalePriceMap,
} from '@/app/utils/cartWholesalePricing';
import {
  getMinimumOrderStatus,
  MIN_ORDER_LABEL,
  type MinimumOrderStatus,
} from '@/config/commerce';
import { isProductInStock } from '@/app/utils/productStock';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  variantId?: string;
  originalPrice?: number;
  handle?: string;
  /** Tamaño del empaque (ej. "12 Botellas") */
  packLabel?: string;
  /** Disponible para venta según Shopify */
  inStock?: boolean;
}

export interface CartItem extends Omit<Product, 'id'> {
  id: number | string;
  quantity: number;
  /** Id de la línea en el carrito de Shopify (para update/remove) */
  lineId?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  goToCheckout?: () => Promise<boolean>;
  reorderItems?: (items: Array<{ variantId: string; quantity: number }>) => Promise<boolean>;
  isShopifyCart: boolean;
  cartLoading: boolean;
  cartError: string | null;
  minimumOrderStatus: MinimumOrderStatus;
  minimumOrderLabel: string;
  wholesalePrices: WholesalePriceMap;
  wholesalePricesLoading: boolean;
  hasWholesalePrices: boolean;
  retailSubtotal: number;
  wholesaleSavings: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function mapShopifyCartToItems(cart: { lines: { edges: Array<{ node: { id: string; quantity: number; merchandise: { id?: string; title: string; product: { title: string }; image: { url: string } | null; price: { amount: string } } } }> }; } | null): CartItem[] {
  if (!cart?.lines?.edges) return [];
  return cart.lines.edges.map(({ node }) => ({
    id: node.id,
    name: node.merchandise.product.title,
    price: parseFloat(node.merchandise.price.amount),
    image: node.merchandise.image?.url ?? '',
    category: '',
    description: '',
    quantity: node.quantity,
    lineId: node.id,
    variantId: node.merchandise.id,
    packLabel: resolvePackLabel({ title: node.merchandise.title }),
  }));
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [localCartItems, setLocalCartItems] = useState<CartItem[]>([]);
  const { user, isAuthenticated } = useAuth();
  const shopify = useShopifyCart();

  const isShopify = isShopifyConfigured() && shopify.isConfigured;

  const cartItems: CartItem[] = useMemo(() => {
    if (isShopify && shopify.cart) {
      return mapShopifyCartToItems(shopify.cart);
    }
    return localCartItems;
  }, [isShopify, shopify.cart, localCartItems]);

  const variantIds = useMemo(
    () => cartItems.map((item) => item.variantId).filter(Boolean) as string[],
    [cartItems],
  );

  const {
    prices: wholesalePrices,
    hasWholesale: hasWholesalePrices,
    loading: wholesalePricesLoading,
  } = useWholesalePrices(isAuthenticated ? user?.accessToken : undefined, variantIds);

  const pricingSummary = useMemo(
    () => computeCartWholesaleSummary(cartItems, wholesalePrices),
    [cartItems, wholesalePrices],
  );

  const addToCart = (product: Product, quantity: number = 1) => {
    if (!isProductInStock(product)) {
      return;
    }

    window.dispatchEvent(new CustomEvent('cart:item-added', {
      detail: { name: product.name, image: product.image, price: product.price }
    }));

    if (isShopify && product.variantId) {
      shopify.addItem(product.variantId, quantity);
      return;
    }
    setLocalCartItems(prev => {
      const existing = prev.find(item => item.id === product.id && !item.lineId);
      if (existing) {
        return prev.map(item =>
          item.id === product.id && !item.lineId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (id: number | string) => {
    if (isShopify && typeof id === 'string') {
      shopify.removeItem(id);
      return;
    }
    setLocalCartItems(prev => prev.filter(item => item.id !== id && item.lineId !== id));
  };

  const updateQuantity = (id: number | string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    if (isShopify && typeof id === 'string') {
      shopify.updateItem(id, quantity);
      return;
    }
    setLocalCartItems(prev =>
      prev.map(item =>
        (item.lineId ? item.lineId === id : item.id === id) ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    if (isShopify && shopify.cart?.lines?.edges?.length) {
      const lineIds = shopify.cart.lines.edges.map(({ node }) => node.id);
      shopify.removeAllItems(lineIds);
      return;
    }
    setLocalCartItems([]);
  };

  const getTotalPrice = (): number => pricingSummary.effectiveSubtotal;

  const getTotalItems = (): number => {
    if (isShopify) return shopify.getTotalItems();
    return localCartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const cartSubtotal = pricingSummary.effectiveSubtotal;

  const minimumOrderStatus = useMemo(
    () => getMinimumOrderStatus(cartSubtotal),
    [cartSubtotal],
  );

  const handleGoToCheckout = useCallback(async (): Promise<boolean> => {
    if (!minimumOrderStatus.meetsMinimum) {
      return false;
    }

    if (isShopify) {
      return shopify.goToCheckout();
    }

    return true;
  }, [isShopify, minimumOrderStatus.meetsMinimum, shopify]);

  const handleReorderItems = useCallback(
    async (items: Array<{ variantId: string; quantity: number }>): Promise<boolean> => {
      if (!isShopify) {
        return false;
      }

      return shopify.addItems(items);
    },
    [isShopify, shopify],
  );

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    goToCheckout: isShopify ? handleGoToCheckout : undefined,
    reorderItems: isShopify ? handleReorderItems : undefined,
    isShopifyCart: isShopify,
    cartLoading: shopify.loading,
    cartError: shopify.error,
    minimumOrderStatus,
    minimumOrderLabel: MIN_ORDER_LABEL,
    wholesalePrices,
    wholesalePricesLoading,
    hasWholesalePrices,
    retailSubtotal: pricingSummary.retailSubtotal,
    wholesaleSavings: pricingSummary.savings,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
