import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrCreateCart, getCart, addToShopifyCart, updateCartLine, removeFromShopifyCart, redirectToCheckout, createCartWithLines } from '@/shopify/cart';
import { updateCartAttributes } from '@/shopify/mutations/cartAttributes';
import { isShopifyConfigured } from '@/shopify/config';
import type { ShopifyCart } from '@/shopify/types';

/**
 * Hook para gestionar el carrito de Shopify
 */

export const useShopifyCart = () => {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cartRef = useRef<ShopifyCart | null>(null);
  const opQueue = useRef(Promise.resolve());
  const pendingOps = useRef(0);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  /** Serializa mutaciones para evitar que refreshCart pise un addItem en vuelo. */
  const runCartOp = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const run = async () => {
      pendingOps.current += 1;
      setLoading(true);
      try {
        return await fn();
      } finally {
        pendingOps.current -= 1;
        if (pendingOps.current === 0) {
          setLoading(false);
        }
      }
    };
    const next = opQueue.current.then(run, run);
    opQueue.current = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }, []);

  const resolveCartId = (): string | null =>
    cartRef.current?.id ?? localStorage.getItem('shopifyCartId');

  const ensureCartId = async (): Promise<string | null> => {
    const existing = resolveCartId();
    if (existing) return existing;

    const created = await getOrCreateCart();
    if (created) {
      setCart(created);
      cartRef.current = created;
    }
    return created?.id ?? null;
  };

  const refreshCartInternal = async (): Promise<ShopifyCart | null> => {
    if (!isShopifyConfigured()) return null;

    const storedId = resolveCartId();
    if (storedId) {
      let fresh = await getCart(storedId);
      if (!fresh) {
        fresh = await getCart(storedId);
      }
      if (fresh) {
        setCart(fresh);
        setError(null);
        return fresh;
      }
      if (cartRef.current?.totalQuantity) {
        return cartRef.current;
      }
      localStorage.removeItem('shopifyCartId');
    }

    const created = await getOrCreateCart();
    setCart(created);
    return created;
  };

  const refreshCart = useCallback(
    () => runCartOp(refreshCartInternal),
    [runCartOp]
  );

  useEffect(() => {
    if (!isShopifyConfigured()) {
      console.warn('Shopify no está configurado. El carrito no funcionará con Shopify.');
      return;
    }
    void runCartOp(refreshCartInternal);
  }, [runCartOp]);

  useEffect(() => {
    if (!isShopifyConfigured()) return;

    const onPageShow = () => {
      void refreshCart();
    };

    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [refreshCart]);

  const addItem = async (variantId: string, quantity: number = 1) => {
    if (!isShopifyConfigured()) {
      console.warn('Shopify no configurado');
      return;
    }

    setError(null);
    await runCartOp(async () => {
      const cartId = await ensureCartId();
      if (!cartId) {
        setError('No se pudo crear el carrito');
        return;
      }

      const updatedCart = await addToShopifyCart(cartId, variantId, quantity);
      if (updatedCart) {
        setCart(updatedCart);
        setError(null);
      } else {
        setError('No se pudo agregar el producto');
      }
    });
  };

  const updateItem = async (lineId: string, quantity: number) => {
    if (!isShopifyConfigured()) return;

    const cartId = resolveCartId();
    if (!cartId) return;

    setError(null);
    await runCartOp(async () => {
      const updatedCart = await updateCartLine(cartId, lineId, quantity);
      if (updatedCart) {
        setCart(updatedCart);
      } else {
        setError('No se pudo actualizar el producto');
      }
    });
  };

  const removeItem = async (lineId: string) => {
    if (!isShopifyConfigured()) return;

    const cartId = resolveCartId();
    if (!cartId) return;

    setError(null);
    await runCartOp(async () => {
      const updatedCart = await removeFromShopifyCart(cartId, [lineId]);
      if (updatedCart) {
        setCart(updatedCart);
      } else {
        setError('No se pudo remover el producto');
      }
    });
  };

  const removeAllItems = async (lineIds: string[]) => {
    if (!isShopifyConfigured() || lineIds.length === 0) return;

    const cartId = resolveCartId();
    if (!cartId) return;

    setError(null);
    await runCartOp(async () => {
      const updatedCart = await removeFromShopifyCart(cartId, lineIds);
      if (updatedCart) {
        setCart(updatedCart);
      } else {
        setError('No se pudo vaciar el carrito');
      }
    });
  };

  const updateAttributes = async (
    attributes: Array<{ key: string; value: string }>
  ): Promise<boolean> => {
    const cartId = resolveCartId();
    if (!cartId) return false;

    setError(null);
    return runCartOp(async () => {
      const success = await updateCartAttributes(cartId, attributes);
      if (!success) {
        setError('No se pudieron guardar los datos del evento');
        return false;
      }
      return true;
    });
  };

  const importSharedCart = useCallback(
    async (lines: Array<{ variantId: string; quantity: number }>): Promise<boolean> => {
      if (!isShopifyConfigured() || lines.length === 0) return false;

      setError(null);
      return runCartOp(async () => {
        const storefrontLines = lines.map((line) => ({
          merchandiseId: line.variantId,
          quantity: line.quantity,
        }));

        const newCart = await createCartWithLines(storefrontLines);
        if (!newCart) {
          setError('No se pudo importar el carrito compartido');
          return false;
        }

        localStorage.setItem('shopifyCartId', newCart.id);
        setCart(newCart);
        setError(null);
        return true;
      }).catch(() => false);
    },
    [runCartOp],
  );

  const goToCheckout = async (): Promise<boolean> => {
    setError(null);
    return runCartOp(async () => {
      const freshCart = await refreshCartInternal();

      if (!freshCart?.totalQuantity) {
        setError('Tu carrito está vacío');
        return false;
      }

      if (!freshCart.checkoutUrl) {
        setError('No hay URL de checkout disponible');
        return false;
      }

      redirectToCheckout(freshCart.checkoutUrl);
      return true;
    }).catch((err) => {
      console.error('Error going to checkout:', err);
      setError('Error al ir al checkout. Intenta de nuevo.');
      return false;
    });
  };

  const getTotalItems = (): number => cart?.totalQuantity || 0;

  const getSubtotal = (): number => {
    if (!cart?.cost?.subtotalAmount) return 0;
    return parseFloat(cart.cost.subtotalAmount.amount);
  };

  const getTotal = (): number => {
    if (!cart?.cost?.totalAmount) return 0;
    return parseFloat(cart.cost.totalAmount.amount);
  };

  return {
    cart,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    removeAllItems,
    updateAttributes,
    goToCheckout,
    importSharedCart,
    refreshCart,
    getTotalItems,
    getSubtotal,
    getTotal,
    isConfigured: isShopifyConfigured(),
  };
};
