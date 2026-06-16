import { useState, useEffect, useCallback } from 'react';
import {
  getOrCreateCart,
  addToShopifyCart,
  addLinesToShopifyCart,
  updateCartLine,
  removeFromShopifyCart,
  updateCartBuyerIdentity,
  redirectToCheckout,
} from '@/shopify/cart';
import { isShopifyConfigured } from '@/shopify/config';
import { getMinimumOrderStatus, formatMinimumOrderMessage } from '@/config/commerce';
import { useAuth } from '@/app/context/AuthContext';
import type { ShopifyCart } from '@/shopify/types';

/**
 * Hook para gestionar el carrito de Shopify
 */

const resolveCustomerAccessToken = (accessToken?: string | null): string | undefined => {
  if (!accessToken || accessToken === 'demo-token') return undefined;
  return accessToken;
};

// Llama al backend de mayoreo. Devuelve la URL de pago (invoiceUrl) si el
// cliente tiene precios de mayoreo, o null para usar el checkout normal.
const tryWholesaleCheckout = async (
  cart: ShopifyCart,
  customerAccessToken: string,
): Promise<string | null> => {
  try {
    const lines = (cart.lines?.edges ?? []).map((edge) => ({
      merchandiseId: edge.node.merchandise.id,
      quantity: edge.node.quantity,
    }));
    if (lines.length === 0) return null;

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerAccessToken, lines }),
    });
    if (!res.ok) return null;

    const data = await res.json();
    return data?.wholesale && data?.invoiceUrl ? (data.invoiceUrl as string) : null;
  } catch {
    return null;
  }
};

export const useShopifyCart = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerAccessToken = resolveCustomerAccessToken(user?.accessToken);

  const syncBuyerIdentity = useCallback(async (cartId: string, accessToken?: string) => {
    if (!accessToken) return null;
    return updateCartBuyerIdentity(cartId, accessToken);
  }, []);

  // Inicializar o recuperar el carrito
  useEffect(() => {
    const initCart = async () => {
      if (!isShopifyConfigured()) {
        console.warn('Shopify no está configurado. El carrito no funcionará con Shopify.');
        return;
      }

      setLoading(true);
      const existingCart = await getOrCreateCart(customerAccessToken);
      setCart(existingCart);
      setLoading(false);
    };

    initCart();
  }, []);

  // Vincular carrito cuando el cliente inicia sesión o restaura sesión
  useEffect(() => {
    if (!isShopifyConfigured() || !cart?.id || !customerAccessToken) return;

    let cancelled = false;

    const linkCartToCustomer = async () => {
      const linkedCart = await syncBuyerIdentity(cart.id, customerAccessToken);
      if (!cancelled && linkedCart) {
        setCart(linkedCart);
      }
    };

    linkCartToCustomer();

    return () => {
      cancelled = true;
    };
  }, [cart?.id, customerAccessToken, syncBuyerIdentity]);

  // Agregar producto al carrito
  const addItem = async (variantId: string, quantity: number = 1) => {
    if (!isShopifyConfigured()) {
      console.warn('Shopify no configurado');
      return;
    }

    let currentCart = cart;

    if (!currentCart) {
      currentCart = await getOrCreateCart(customerAccessToken);
      if (!currentCart) {
        setError('No se pudo crear el carrito');
        return;
      }
      setCart(currentCart);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedCart = await addToShopifyCart(currentCart.id, variantId, quantity);
      if (updatedCart) {
        setCart(updatedCart);
      } else {
        setError('No se pudo agregar el producto');
      }
    } catch (err) {
      console.error('Error adding item to cart:', err);
      setError('Error al agregar producto');
    } finally {
      setLoading(false);
    }
  };

  const addItems = async (items: Array<{ variantId: string; quantity: number }>) => {
    if (!isShopifyConfigured() || items.length === 0) {
      return false;
    }

    let currentCart = cart;

    if (!currentCart) {
      currentCart = await getOrCreateCart(customerAccessToken);
      if (!currentCart) {
        setError('No se pudo crear el carrito');
        return false;
      }
      setCart(currentCart);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedCart = await addLinesToShopifyCart(
        currentCart.id,
        items.map((item) => ({
          merchandiseId: item.variantId,
          quantity: item.quantity,
        })),
      );

      if (updatedCart) {
        setCart(updatedCart);
        return true;
      }

      setError('No se pudieron agregar los productos');
      return false;
    } catch (err) {
      console.error('Error adding items to cart:', err);
      setError('Error al agregar productos');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cantidad de un item
  const updateItem = async (lineId: string, quantity: number) => {
    if (!isShopifyConfigured() || !cart) return;

    setLoading(true);
    setError(null);

    try {
      const updatedCart = await updateCartLine(cart.id, lineId, quantity);
      if (updatedCart) {
        setCart(updatedCart);
      } else {
        setError('No se pudo actualizar el producto');
      }
    } catch (err) {
      console.error('Error updating cart item:', err);
      setError('Error al actualizar producto');
    } finally {
      setLoading(false);
    }
  };

  // Remover item del carrito
  const removeItem = async (lineId: string) => {
    if (!isShopifyConfigured() || !cart) return;

    setLoading(true);
    setError(null);

    try {
      const updatedCart = await removeFromShopifyCart(cart.id, [lineId]);
      if (updatedCart) {
        setCart(updatedCart);
      } else {
        setError('No se pudo remover el producto');
      }
    } catch (err) {
      console.error('Error removing item from cart:', err);
      setError('Error al remover producto');
    } finally {
      setLoading(false);
    }
  };

  // Vaciar carrito (remover todas las líneas)
  const removeAllItems = async (lineIds: string[]) => {
    if (!isShopifyConfigured() || !cart || lineIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const updatedCart = await removeFromShopifyCart(cart.id, lineIds);
      if (updatedCart) {
        setCart(updatedCart);
      } else {
        setError('No se pudo vaciar el carrito');
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Error al vaciar carrito');
    } finally {
      setLoading(false);
    }
  };

  // Ir al checkout (vincula identidad del cliente antes de redirigir)
  const goToCheckout = async (): Promise<boolean> => {
    if (!cart?.checkoutUrl) {
      setError('No hay URL de checkout disponible');
      return false;
    }

    const status = getMinimumOrderStatus(getSubtotal());
    if (!status.meetsMinimum) {
      setError(formatMinimumOrderMessage(status));
      return false;
    }

    setError(null);
    setLoading(true);

    try {
      // Si el cliente está logueado, intentamos el flujo de mayoreo: el backend
      // calcula los precios de mayoreo (SAMI) y crea un Draft Order con los
      // descuentos. Si el cliente no tiene grupo de mayoreo, se usa el checkout
      // normal de Shopify.
      if (customerAccessToken) {
        const wholesaleUrl = await tryWholesaleCheckout(cart, customerAccessToken);
        if (wholesaleUrl) {
          window.location.href = wholesaleUrl;
          return true;
        }
      }

      let checkoutUrl = cart.checkoutUrl;

      if (customerAccessToken) {
        const linkedCart = await syncBuyerIdentity(cart.id, customerAccessToken);
        if (linkedCart) {
          setCart(linkedCart);
          checkoutUrl = linkedCart.checkoutUrl;
        } else {
          setError('No se pudo vincular tu cuenta al checkout. Intenta de nuevo.');
          return false;
        }
      }

      redirectToCheckout(checkoutUrl);
      return true;
    } finally {
      setLoading(false);
    }
  };

  // Obtener total de items
  const getTotalItems = (): number => {
    return cart?.totalQuantity || 0;
  };

  // Obtener subtotal
  const getSubtotal = (): number => {
    if (!cart?.cost?.subtotalAmount) return 0;
    return parseFloat(cart.cost.subtotalAmount.amount);
  };

  // Obtener total
  const getTotal = (): number => {
    if (!cart?.cost?.totalAmount) return 0;
    return parseFloat(cart.cost.totalAmount.amount);
  };

  return {
    cart,
    loading,
    error,
    addItem,
    addItems,
    updateItem,
    removeItem,
    removeAllItems,
    goToCheckout,
    getTotalItems,
    getSubtotal,
    getTotal,
    isConfigured: isShopifyConfigured()
  };
};
