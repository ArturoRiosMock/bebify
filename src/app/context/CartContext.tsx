import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useShopifyCart } from '@/shopify/hooks/useShopifyCart';
import { isShopifyConfigured } from '@/shopify/config';
import { cantidadLabelFromOptions } from '@/shopify/products';

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
  /** Opción de variante Cantidad (Shopify), ej. "1 Botella" */
  cantidadLabel?: string;
  vendor?: string;
  tags?: string[];
  /** Graduación alcohólica (NOM-142-SSA1/SCFI-2014) */
  abvLabel?: string;
  /** Contenido neto / capacidad (NOM-142-SSA1/SCFI-2014) */
  volumeLabel?: string;
  /** Tipo de bebida (NOM-142-SSA1/SCFI-2014) */
  beverageType?: string;
  /** País / región de origen (NOM-142-SSA1/SCFI-2014) */
  origin?: string;
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
  importSharedCart?: (lines: Array<{ variantId: string; quantity: number }>) => Promise<boolean>;
  updateAttributes?: (attributes: Array<{ key: string; value: string }>) => Promise<boolean>;
  isShopifyCart: boolean;
  cartLoading: boolean;
  cartError: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function mapShopifyCartToItems(cart: { lines: { edges: Array<{ node: { id: string; quantity: number; merchandise: { product: { title: string }; image: { url: string } | null; price: { amount: string }; selectedOptions?: Array<{ name: string; value: string }> } } }> }; } | null): CartItem[] {
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
    cantidadLabel: cantidadLabelFromOptions(node.merchandise.selectedOptions),
  }));
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [localCartItems, setLocalCartItems] = useState<CartItem[]>([]);
  const shopify = useShopifyCart();

  const isShopify = isShopifyConfigured() && shopify.isConfigured;

  const cartItems: CartItem[] = useMemo(() => {
    if (isShopify && shopify.cart) {
      return mapShopifyCartToItems(shopify.cart);
    }
    return localCartItems;
  }, [isShopify, shopify.cart, localCartItems]);

  const addToCart = (product: Product, quantity: number = 1) => {
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

  const getTotalPrice = (): number => {
    if (isShopify) return shopify.getSubtotal();
    return localCartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = (): number => {
    if (isShopify) return shopify.getTotalItems();
    return localCartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    goToCheckout: isShopify ? shopify.goToCheckout : undefined,
    importSharedCart: isShopify ? shopify.importSharedCart : undefined,
    updateAttributes: isShopify ? shopify.updateAttributes : undefined,
    isShopifyCart: isShopify,
    cartLoading: shopify.loading,
    cartError: shopify.error,
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
