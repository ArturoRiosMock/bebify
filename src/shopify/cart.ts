import {
  shopifyClient,
  GET_CART,
  CREATE_CART,
  ADD_TO_CART,
  UPDATE_CART_LINES,
  REMOVE_FROM_CART,
  CART_BUYER_IDENTITY_UPDATE,
} from './queries';
import type { ShopifyCart } from './types';

/**
 * Servicio para gestionar el carrito de Shopify
 */

const buildCartInput = (customerAccessToken?: string | null) => {
  const input: { lines: []; buyerIdentity?: { customerAccessToken: string } } = { lines: [] };

  if (customerAccessToken) {
    input.buyerIdentity = { customerAccessToken };
  }

  return input;
};

// Crear un nuevo carrito
export const createCart = async (customerAccessToken?: string | null): Promise<ShopifyCart | null> => {
  try {
    const data: any = await shopifyClient.request(CREATE_CART, {
      input: buildCartInput(customerAccessToken),
    });

    if (data.cartCreate.userErrors.length > 0) {
      console.error('Error creating cart:', data.cartCreate.userErrors);
      return null;
    }

    return data.cartCreate.cart;
  } catch (error) {
    console.error('Error creating cart:', error);
    return null;
  }
};

// Vincular carrito con el cliente autenticado (precarga email y direcciones en checkout)
export const updateCartBuyerIdentity = async (
  cartId: string,
  customerAccessToken: string,
): Promise<ShopifyCart | null> => {
  try {
    const data: any = await shopifyClient.request(CART_BUYER_IDENTITY_UPDATE, {
      cartId,
      buyerIdentity: { customerAccessToken },
    });

    if (data.cartBuyerIdentityUpdate.userErrors.length > 0) {
      console.error('Error updating cart buyer identity:', data.cartBuyerIdentityUpdate.userErrors);
      return null;
    }

    return data.cartBuyerIdentityUpdate.cart;
  } catch (error) {
    console.error('Error updating cart buyer identity:', error);
    return null;
  }
};

// Agregar item al carrito
export const addToShopifyCart = async (
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<ShopifyCart | null> => {
  return addLinesToShopifyCart(cartId, [{ merchandiseId: variantId, quantity }]);
};

export const addLinesToShopifyCart = async (
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>,
): Promise<ShopifyCart | null> => {
  if (lines.length === 0) {
    return null;
  }

  try {
    const data: any = await shopifyClient.request(ADD_TO_CART, {
      cartId,
      lines: lines.map((line) => ({
        merchandiseId: line.merchandiseId,
        quantity: line.quantity,
      })),
    });

    if (data.cartLinesAdd.userErrors.length > 0) {
      console.error('Error adding to cart:', data.cartLinesAdd.userErrors);
      return null;
    }

    return data.cartLinesAdd.cart;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return null;
  }
};

// Actualizar cantidad de un item en el carrito
export const updateCartLine = async (
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart | null> => {
  try {
    const data: any = await shopifyClient.request(UPDATE_CART_LINES, {
      cartId,
      lines: [
        {
          id: lineId,
          quantity
        }
      ]
    });

    if (data.cartLinesUpdate.userErrors.length > 0) {
      console.error('Error updating cart:', data.cartLinesUpdate.userErrors);
      return null;
    }

    return data.cartLinesUpdate.cart;
  } catch (error) {
    console.error('Error updating cart:', error);
    return null;
  }
};

// Remover item del carrito
export const removeFromShopifyCart = async (
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart | null> => {
  try {
    const data: any = await shopifyClient.request(REMOVE_FROM_CART, {
      cartId,
      lineIds
    });

    if (data.cartLinesRemove.userErrors.length > 0) {
      console.error('Error removing from cart:', data.cartLinesRemove.userErrors);
      return null;
    }

    return data.cartLinesRemove.cart;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return null;
  }
};

// Obtener carrito por ID
export const getCart = async (cartId: string): Promise<ShopifyCart | null> => {
  try {
    const data: any = await shopifyClient.request(GET_CART, { id: cartId });
    return data.cart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
};

// Obtener o crear un carrito, vinculando al cliente si hay sesión activa
export const getOrCreateCart = async (customerAccessToken?: string | null): Promise<ShopifyCart | null> => {
  const existingCartId = localStorage.getItem('shopifyCartId');

  if (existingCartId) {
    const fullCart = await getCart(existingCartId);
    if (fullCart) {
      if (customerAccessToken) {
        const linkedCart = await updateCartBuyerIdentity(existingCartId, customerAccessToken);
        return linkedCart ?? fullCart;
      }
      return fullCart;
    }
    localStorage.removeItem('shopifyCartId');
  }

  const newCart = await createCart(customerAccessToken);
  if (newCart) {
    localStorage.setItem('shopifyCartId', newCart.id);
  }
  return newCart;
};

// Limpiar el carrito del localStorage
export const clearCart = (): void => {
  localStorage.removeItem('shopifyCartId');
};

// Redirigir al checkout de Shopify.
// El checkoutUrl devuelto por la API puede usar un dominio que apunta a
// Vercel (ej. bebify.mx) en lugar de a Shopify, lo que provoca una página
// en blanco. Se valida y se reemplaza el host por uno de Shopify para
// garantizar que siempre lleve al checkout real.
const SHOPIFY_CHECKOUT_HOSTS = ['bebify.store', 'www.bebify.store', 'mr-brown-mayoreo.myshopify.com'];

export const redirectToCheckout = (checkoutUrl: string): void => {
  try {
    const parsed = new URL(checkoutUrl);
    const fallbackHost =
      import.meta.env.VITE_SHOPIFY_CHECKOUT_DOMAIN ||
      'bebify.store';

    if (!SHOPIFY_CHECKOUT_HOSTS.includes(parsed.hostname)) {
      parsed.hostname = fallbackHost;
    }

    window.location.href = parsed.toString();
  } catch {
    window.location.href = checkoutUrl;
  }
};
